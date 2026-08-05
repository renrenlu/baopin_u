#!/bin/bash

set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

PROJECT_ROOT="/Users/mt/Documents/网站制作"
STATE_FILE="/Users/mt/Library/Application Support/U哥PDF工作流/.state/processed.json"
LOG_DIR="/Users/mt/Library/Application Support/U哥PDF工作流/logs"
LOG_FILE="$LOG_DIR/website-publish.log"
LOCK_DIR="/private/tmp/baopin-auto-publish.lock"
RUN_DIR=""
WAIT_SECONDS="${BAOPIN_PUBLISH_WAIT_SECONDS:-150}"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

check_prerequisites() {
  local failed=0
  for command_name in git node npm; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
      printf '缺少命令：%s\n' "$command_name" >&2
      failed=1
    fi
  done
  for required_path in \
    "$PROJECT_ROOT/.git" \
    "$PROJECT_ROOT/node_modules" \
    "$PROJECT_ROOT/scripts/sync-obsidian-issues.mjs" \
    "$STATE_FILE"; do
    if [ ! -e "$required_path" ]; then
      printf '缺少路径：%s\n' "$required_path" >&2
      failed=1
    fi
  done
  return "$failed"
}

cleanup() {
  if [ -n "$RUN_DIR" ] && [ -d "$RUN_DIR" ]; then
    git -C "$PROJECT_ROOT" worktree remove --force "$RUN_DIR" >/dev/null 2>&1 || true
  fi
  rmdir "$LOCK_DIR" >/dev/null 2>&1 || true
}

if [ "${1:-}" = "--check" ]; then
  check_prerequisites
  printf '自动发布环境正常\n'
  exit 0
fi

mkdir -p "$LOG_DIR"
exec >>"$LOG_FILE" 2>&1

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  log "已有发布任务运行，本次事件交给正在运行的任务合并处理"
  exit 0
fi
trap cleanup EXIT INT TERM

if [ "${1:-}" = "--now" ]; then
  WAIT_SECONDS=0
fi

check_prerequisites
log "检测到 Obsidian 已完成新的 PDF 整理，等待 ${WAIT_SECONDS} 秒后同步网站"
if [ "$WAIT_SECONDS" -gt 0 ]; then
  sleep "$WAIT_SECONDS"
fi

git -C "$PROJECT_ROOT" fetch baopin main
RUN_DIR="$(mktemp -d /private/tmp/baopin-auto-publish.XXXXXX)"
git -C "$PROJECT_ROOT" worktree add --detach "$RUN_DIR" baopin/main
ln -s "$PROJECT_ROOT/node_modules" "$RUN_DIR/node_modules"

cd "$RUN_DIR"
BASE_COMMIT="$(git rev-parse baopin/main)"
SYNC_OUTPUT="$(BAOPIN_MIN_FILE_AGE_MS=120000 npm run sync:obsidian 2>&1)"
printf '%s\n' "$SYNC_OUTPUT"

if ! printf '%s\n' "$SYNC_OUTPUT" | grep -q '"status": "updated"'; then
  log "Obsidian 没有尚未发布的新内容，结束"
  exit 0
fi

log "发现新内容，开始构建并检查网站"
GITHUB_PAGES=true \
GITHUB_REPOSITORY=renrenlu/baopin_u \
NEXT_PUBLIC_BASE_PATH=/baopin_u \
NEXT_PUBLIC_SITE_URL=https://renrenlu.github.io/baopin_u \
./node_modules/.bin/next build --webpack
./node_modules/.bin/tsc --noEmit --incremental false --pretty false
git diff --check

for path_to_stage in \
  app/page.tsx \
  'app/issues/[date]/page.tsx' \
  content/issues \
  content/galleries \
  data/galleries.json \
  data/hook-training.json \
  public/galleries \
  public/hooks \
  public/pdfs; do
  if [ -e "$path_to_stage" ]; then
    git add -- "$path_to_stage"
  fi
done

if git diff --cached --quiet; then
  log "同步结果没有可提交的变化，结束"
  exit 0
fi

git fetch baopin main
if [ "$(git rev-parse baopin/main)" != "$BASE_COMMIT" ]; then
  log "远端 main 在构建期间发生变化，本次不推送；10:00/16:00 的兜底任务会重新处理"
  exit 1
fi

git commit -m "Auto-publish Obsidian content $(date '+%Y-%m-%d %H:%M')"
git push baopin HEAD:main
log "网站源文件已推送，GitHub Pages 正在自动部署"
