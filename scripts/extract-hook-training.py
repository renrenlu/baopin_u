#!/usr/bin/env python3
"""Extract one hook-training PDF into website-ready JSON and original images."""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

try:
    import fitz
except ImportError as exc:  # pragma: no cover - local setup error
    raise SystemExit("缺少 PyMuPDF（fitz），请使用 U哥PDF工作流的 .venv/bin/python") from exc

try:
    from PIL import Image
except ImportError:  # pragma: no cover - fallback keeps source bytes
    Image = None


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKC", value.replace("\x00", ""))
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"(?<=[\u3400-\u9fff])\s+(?=[\u3400-\u9fff])", "", value)
    return value.strip()


def issue_date_from_name(filename: str) -> str:
    match = re.search(r"(20\d{2})[-_.]?(\d{2})[-_.]?(\d{2})", filename)
    if not match:
        raise ValueError(f"文件名中没有日期：{filename}")
    return "-".join(match.groups())


def parse_counts(text: str) -> tuple[int, int, int]:
    total_match = re.search(r"共\s*(\d+)\s*题", text)
    mode_one_match = re.search(r"方式一\s*(\d+)\s*题", text)
    mode_two_match = re.search(r"方式二\s*(\d+)\s*题", text)
    if not total_match:
        raise ValueError("无法识别题目总数")
    total = int(total_match.group(1))
    mode_one = int(mode_one_match.group(1)) if mode_one_match else total
    mode_two = int(mode_two_match.group(1)) if mode_two_match else total - mode_one
    if mode_one + mode_two != total:
        raise ValueError(f"题型数量与总数不一致：{mode_one}+{mode_two}!={total}")
    return total, mode_one, mode_two


def parse_answers(text: str) -> dict[int, dict[str, Any]]:
    header = re.compile(
        r"第\s*(\d+)\s*题答案[（(]方式([一二])[）)][:：]\s*"
        r"(.*?)(?=第\s*\d+\s*题答案[（(]方式[一二][）)][:：]|$)"
    )
    work = re.compile(
        r"【(高赞|低赞)】\s*博主[:：]\s*(.*?)\s*档位[:：]\s*(?:高赞|低赞)\s*"
        r"标题[:：]\s*(.*?)\s*点赞[:：]\s*([^\s]+)\s*"
        r"发布时间[:：]\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)"
    )
    answers: dict[int, dict[str, Any]] = {}
    for match in header.finditer(text):
        number = int(match.group(1))
        mode = match.group(2)
        block = match.group(3).strip()
        answer_label = block.split("【", 1)[0].strip()
        works = [
            {
                "level": item.group(1),
                "blogger": item.group(2).strip(),
                "title": item.group(3).strip(),
                "likes": item.group(4).strip(),
                "published": item.group(5).strip(),
            }
            for item in work.finditer(block)
        ]
        answers[number] = {
            "mode": mode,
            "answerLabel": answer_label,
            "works": works,
        }
    return answers


def question_images(document: fitz.Document, answer_page: int) -> list[tuple[int, int]]:
    placements: list[tuple[int, int, float, float]] = []
    for page_index in range(answer_page):
        page = document[page_index]
        for image in page.get_images(full=True):
            xref = image[0]
            rects = page.get_image_rects(xref)
            if not rects:
                continue
            rect = rects[0]
            if rect.width * rect.height < 5_000:
                continue
            placements.append((page_index, xref, rect.y0, rect.x0))
    placements.sort(key=lambda item: (item[0], item[2], item[3]))
    return [(page_index, xref) for page_index, xref, _, _ in placements]


def write_image(document: fitz.Document, xref: int, destination_base: Path) -> str:
    extracted = document.extract_image(xref)
    if Image is not None:
        destination = destination_base.with_suffix(".webp")
        destination.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(io.BytesIO(extracted["image"])) as image:
            image.save(destination, format="WEBP", lossless=True, method=6)
        return destination.name
    extension = extracted.get("ext", "png").lower()
    extension = "jpg" if extension in {"jpeg", "jpe"} else extension
    destination = destination_base.with_suffix(f".{extension}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(extracted["image"])
    return destination.name


def extract(pdf: Path, output_dir: Path | None, public_prefix: str) -> dict[str, Any]:
    document = fitz.open(pdf)
    pages = [normalize(page.get_text("text")) for page in document]
    combined = normalize("\n".join(pages))
    total, mode_one, mode_two = parse_counts(pages[0] if pages else combined)
    answers = parse_answers(combined)
    if len(answers) != total:
        raise ValueError(f"只识别到 {len(answers)} / {total} 题答案")

    answer_page = next(
        (
            index
            for index, page_text in enumerate(pages)
            if re.search(r"第\s*1\s*题答案[（(]方式[一二][）)]", page_text)
        ),
        -1,
    )
    if answer_page < 0:
        raise ValueError("无法定位答案页")

    image_refs = question_images(document, answer_page)
    expected_images = mode_one * 2 + mode_two
    if len(image_refs) != expected_images:
        raise ValueError(f"题目图片数量异常：识别到 {len(image_refs)}，应为 {expected_images}")

    date = issue_date_from_name(pdf.name)
    cursor = 0
    questions = []
    for number in range(1, total + 1):
        answer = answers[number]
        compare = number <= mode_one
        if compare:
            specs = [("left", "左图"), ("right", "右图")]
            correct_match = re.search(r"(左|右)图", answer["answerLabel"])
            if not correct_match:
                raise ValueError(f"第 {number} 题无法识别左右答案")
            correct = "left" if correct_match.group(1) == "左" else "right"
        else:
            specs = [("work", "待判断作品")]
            correct = "high" if "高赞" in answer["answerLabel"] else "low"

        images = []
        for choice, label in specs:
            _, xref = image_refs[cursor]
            cursor += 1
            base_name = (
                f"q{number:02d}-{choice}"
                if compare
                else f"q{number:02d}"
            )
            if output_dir:
                filename = write_image(document, xref, output_dir / base_name)
                src = f"{public_prefix.rstrip('/')}/{filename}"
            else:
                image_info = document.extract_image(xref)
                extension = "webp" if Image is not None else image_info.get("ext", "png").lower()
                extension = "jpg" if extension in {"jpeg", "jpe"} else extension
                src = f"{public_prefix.rstrip('/')}/{base_name}.{extension}"
            images.append({"choice": choice, "label": label, "src": src})

        questions.append(
            {
                "id": number,
                "mode": "compare" if compare else "judge",
                "prompt": "哪一张是高赞作品？" if compare else "这张作品是高赞还是低赞？",
                "images": images,
                "correct": correct,
                "answerLabel": answer["answerLabel"],
                "works": answer["works"],
            }
        )

    return {
        "date": date,
        "title": "看一眼，判断哪条更容易高赞",
        "description": (
            f"{total} 道高低赞辨别题：先凭作品画面与开头做判断，"
            "再展开 PDF 给出的答案、作者和数据。"
        ),
        "pdf": f"/hooks/钩子训练-{date}.pdf",
        "questions": questions,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--public-prefix", required=True)
    args = parser.parse_args()
    try:
        issue = extract(args.pdf.expanduser(), args.output_dir, args.public_prefix)
    except Exception as exc:
        print(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False))
        return 1
    print(json.dumps({"status": "ok", "issue": issue}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
