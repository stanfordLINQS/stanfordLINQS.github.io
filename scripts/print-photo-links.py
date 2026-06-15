#!/usr/bin/env python3
"""Print Google Drive photo links for pasting into the people spreadsheet.

The People page reads a "Photo" column from the sheet (see people-data.js).
Each cell can be:
  - A full Drive link: https://drive.google.com/file/d/FILE_ID/view
  - Just the file ID
  - A local filename under images/people/ (fallback if no Drive link)

Share each photo (or the whole folder) as "Anyone with the link" → Viewer.
Replacing the image file in Drive keeps the same link, so the site updates
without a git push.

Usage:
  python scripts/print-photo-links.py
  python scripts/print-photo-links.py YOUR_DRIVE_FOLDER_ID
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

FOLDER_ID = "1VAgTZjrq1Y2v8UJJbfNmH-1V90fSix_k"
SHEET_ID = "1_n6ESAo7j0tObCSQFPY_j0RkML58iE9ZlLDdSDOCNWk"

STEM_ALIASES = {
    "yizhi_luo": "yizhi-luo-royce",
}


def fetch(url: str) -> str:
    with urllib.request.urlopen(url) as res:
        return res.read().decode("utf-8", errors="ignore")


def slugify(name: str) -> str:
    s = name.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def compact(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def sheet_people() -> list[tuple[str, str]]:
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&gid=0"
    text = fetch(url)
    text = re.sub(r"^[^(]*\(", "", text).rstrip(");")
    data = json.loads(text)
    people: list[tuple[str, str]] = []
    current_section = ""
    for row in data["table"]["rows"][1:]:
        cells = row["c"] or []
        values = []
        for cell in cells:
            if not cell:
                values.append("")
            elif cell.get("f"):
                values.append(str(cell["f"]).lstrip("=").strip('"'))
            else:
                values.append(str(cell.get("v") or "").strip())
        if not any(values):
            continue
        section_cell = values[0] if len(values) > 0 else ""
        name = values[1] if len(values) > 1 else ""
        if name.lower() in ("name", "full name"):
            continue
        if section_cell and re.search(
            r"investigator|researchers?|students?|administration|administrative|alumni|affiliated",
            section_cell,
            re.I,
        ):
            current_section = section_cell
            if not name:
                continue
        if name and current_section:
            people.append((name, slugify(name)))
    return people


def discover_drive_files(html: str) -> dict[str, str]:
    files: dict[str, str] = {}
    for label in re.findall(
        r'aria-label="([^"]+\.(?:png|jpg|jpeg|webp)) Image"',
        html,
        re.I,
    ):
        fname = label.strip()
        stem = Path(fname).stem.lower()
        idx = html.find(fname)
        snippet = html[max(0, idx - 800) : idx + 100]
        m = re.search(r"([0-9a-zA-Z_-]{20,})-0-16", snippet)
        if m:
            files[stem] = m.group(1)
    return files


def match_slug(stem: str, slugs: set[str]) -> str | None:
    if stem in STEM_ALIASES and STEM_ALIASES[stem] in slugs:
        return STEM_ALIASES[stem]
    hyphen = stem.replace("_", "-")
    if hyphen in slugs:
        return hyphen
    stem_compact = compact(stem)
    for slug in slugs:
        if compact(slug) == stem_compact:
            return slug
    return None


def drive_view_url(file_id: str) -> str:
    return f"https://drive.google.com/file/d/{file_id}/view"


def main() -> int:
    folder_id = sys.argv[1] if len(sys.argv) > 1 else FOLDER_ID
    print(f"Drive folder: https://drive.google.com/drive/folders/{folder_id}")
    print(f"Spreadsheet:  https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit\n")

    html = fetch(f"https://drive.google.com/drive/folders/{folder_id}")
    drive_files = discover_drive_files(html)
    people = sheet_people()
    slugs = {slug for _, slug in people}

    by_slug: dict[str, str] = {}
    for stem, file_id in drive_files.items():
        slug = match_slug(stem, slugs)
        if slug:
            by_slug[slug] = drive_view_url(file_id)

    print("Add a column header: Photo")
    print("Paste the link from the Photo URL column into each person's row.\n")
    print(f"{'Name':<32} {'Photo URL'}")
    print("-" * 100)
    matched = 0
    for name, slug in people:
        url = by_slug.get(slug, "")
        if url:
            matched += 1
        else:
            url = "(no Drive file matched — check filename or add link manually)"
        print(f"{name:<32} {url}")

    print(f"\nMatched {matched}/{len(people)} people to Drive files.")
    print(
        "\nTip: name Drive files like the sheet slug, e.g. amir-safavi-naeini.jpg"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
