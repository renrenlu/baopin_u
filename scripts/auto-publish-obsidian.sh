#!/bin/bash

set -euo pipefail

export PATH="/Users/mt/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

if /usr/bin/nc -z 127.0.0.1 1082 >/dev/null 2>&1; then
  export HTTP_PROXY="http://127.0.0.1:1082"
  export HTTPS_PROXY="$HTTP_PROXY"
fi

GIT_BIN="/Users/mt/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git"
GIT_AUTH_ARGS=(
  -c credential.helper=
  -c credential.helper=manager
  -c http.version=HTTP/1.1
  -c http.postBuffer=524288000
)
PUBLISH_ROOT="/Users/mt/Library/Application Support/U哥PDF网站发布"
BASE_REPO="$PUBLISH_ROOT/repository"
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
  for command_name in node npm shasum; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
      printf '缺少命令：%s\n' "$command_name" >&2
      failed=1
    fi
  done
  if [ ! -x "$GIT_BIN" ]; then
    printf '缺少独立 Git：%s\n' "$GIT_BIN" >&2
    failed=1
  fi
  for required_path in \
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
    "$GIT_BIN" -C "$BASE_REPO" worktree remove --force "$RUN_DIR" >/dev/null 2>&1 || true
  fi
  rmdir "$LOCK_DIR" >/dev/null 2>&1 || true
}

prepare_repository() {
  local lock_hash
  local installed_hash=""

  mkdir -p "$PUBLISH_ROOT"
  if [ ! -d "$BASE_REPO/.git" ]; then
    "$GIT_BIN" "${GIT_AUTH_ARGS[@]}" clone --branch main --single-branch https://github.com/renrenlu/baopin_u.git "$BASE_REPO"
  fi

  "$GIT_BIN" -C "$BASE_REPO" "${GIT_AUTH_ARGS[@]}" fetch origin main
  "$GIT_BIN" -C "$BASE_REPO" checkout --detach origin/main

  lock_hash="$(shasum -a 256 "$BASE_REPO/package-lock.json" | awk '{print $1}')"
  if [ -f "$BASE_REPO/.package-lock.sha256" ]; then
    installed_hash="$(sed -n '1p' "$BASE_REPO/.package-lock.sha256")"
  fi
  if [ ! -d "$BASE_REPO/node_modules" ] || [ "$installed_hash" != "$lock_hash" ]; then
    log "首次准备网站构建环境"
    (cd "$BASE_REPO" && npm ci)
    printf '%s\n' "$lock_hash" >"$BASE_REPO/.package-lock.sha256"
  fi
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

prepare_repository
RUN_DIR="$(mktemp -d /private/tmp/baopin-auto-publish.XXXXXX)"
"$GIT_BIN" -C "$BASE_REPO" worktree add --detach "$RUN_DIR" origin/main
ln -s "$BASE_REPO/node_modules" "$RUN_DIR/node_modules"

cd "$RUN_DIR"
BASE_COMMIT="$("$GIT_BIN" rev-parse origin/main)"
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
"$GIT_BIN" diff --check

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
    "$GIT_BIN" add -- "$path_to_stage"
  fi
done

if "$GIT_BIN" diff --cached --quiet; then
  log "同步结果没有可提交的变化，结束"
  exit 0
fi

"$GIT_BIN" "${GIT_AUTH_ARGS[@]}" fetch origin main
if [ "$("$GIT_BIN" rev-parse origin/main)" != "$BASE_COMMIT" ]; then
  log "远端 main 在构建期间发生变化，本次不推送；10:00/16:00 的兜底任务会重新处理"
  exit 1
fi

"$GIT_BIN" commit -m "Auto-publish Obsidian content $(date '+%Y-%m-%d %H:%M')"
"$GIT_BIN" "${GIT_AUTH_ARGS[@]}" push origin HEAD:main
log "网站源文件已推送，GitHub Pages 正在自动部署"
