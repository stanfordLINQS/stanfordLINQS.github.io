"""Download people photos from a public Google Drive folder into images/people/."""

import json
import re
import sys
import urllib.request
from pathlib import Path

FOLDER_ID = "1VAgTZjrq1Y2v8UJJbfNmH-1V90fSix_k"
SHEET_ID = "1_n6ESAo7j0tObCSQFPY_j0RkML58iE9ZlLDdSDOCNWk"
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "images" / "people"

# Drive filename stems that don't match the sheet slug automatically.
STEM_ALIASES = {
    "yizhi_luo": "yizhi-luo-royce",
}

PHOTO_EXTS = ("png", "jpg", "jpeg", "webp")


def fetch(url: str) -> str:
    with urllib.request.urlopen(url) as res:
        return res.read().decode("utf-8", errors="ignore")


def slugify(name: str) -> str:
    s = name.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def compact(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def sheet_slugs() -> dict[str, str]:
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&gid=0"
    text = fetch(url)
    text = re.sub(r"^[^(]*\(", "", text).rstrip(");")
    data = json.loads(text)
    slugs: dict[str, str] = {}
    for row in data["table"]["rows"][1:]:
        cells = row["c"]
        if not cells or len(cells) < 2 or not cells[1] or not cells[1].get("v"):
            continue
        name = str(cells[1]["v"]).strip()
        if name.lower() in ("name", "full name"):
            continue
        slugs[slugify(name)] = name
    return slugs


def discover_drive_files(html: str) -> dict[str, str]:
    """Return {drive_stem: file_id} for every image in the folder."""
    files: dict[str, str] = {}
    for label in re.findall(
        r"aria-label=\"([^\"]+\.(?:png|jpg|jpeg|webp)) Image\"",
        html,
        re.I,
    ):
        fname = label.strip()
        stem = Path(fname).stem.lower()
        idx = html.find(fname)
        snippet = html[max(0, idx - 800): idx + 100]
        m = re.search(r"([0-9a-zA-Z_-]{20,})-0-16'", snippet)
        if m:
            files[stem] = m.group(1)
    return files


def match_slug(stem: str, slugs: dict[str, str]) -> str | None:
    if stem in STEM_ALIASES:
        alias = STEM_ALIASES[stem]
        if alias in slugs:
            return alias

    hyphen = stem.replace("_", "-")
    if hyphen in slugs:
        return hyphen

    stem_compact = compact(stem)
    for slug in slugs:
        if compact(slug) == stem_compact:
            return slug

    return None


def download_file(file_id: str) -> bytes:
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    with urllib.request.urlopen(url) as res:
        return res.read()


def ext_for_bytes(data: bytes) -> str:
    if data[:3] == b"\xff\xd8\xff":
        return "jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return "jpg"


def main() -> int:
    folder_id = sys.argv[1] if len(sys.argv) > 1 else FOLDER_ID
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Fetching folder {folder_id}...")
    html = fetch(f"https://drive.google.com/drive/folders/{folder_id}")
    drive_files = discover_drive_files(html)
    slugs = sheet_slugs()
    print(f"Found {len(drive_files)} photos in Drive, {len(slugs)} people in sheet")

    active_slugs: set[str] = set()
    matched = 0
    for stem, file_id in sorted(drive_files.items()):
        slug = match_slug(stem, slugs)
        if not slug:
            print(f"warning: no sheet match for drive file stem '{stem}' — skipped")
            continue

        active_slugs.add(slug)
        matched += 1
        print(f"Downloading {slug} ({stem})...")
        data = download_file(file_id)
        ext = ext_for_bytes(data)
        dest = OUT_DIR / f"{slug}.{ext}"

        for old_ext in PHOTO_EXTS:
            old = OUT_DIR / f"{slug}.{old_ext}"
            if old != dest and old.exists():
                old.unlink()

        tmp = OUT_DIR / f"{slug}.download"
        tmp.write_bytes(data)
        if dest.exists():
            dest.unlink()
        tmp.replace(dest)
        print(f"  -> {dest.name} ({len(data):,} bytes)")

    removed = 0
    for path in OUT_DIR.iterdir():
        if not path.is_file() or path.suffix.lower() not in PHOTO_EXTS:
            continue
        slug = path.stem
        if slug in slugs and slug not in active_slugs:
            print(f"Removing {path.name} (no longer in Drive)")
            path.unlink()
            removed += 1

    print(f"Downloaded {matched} photos, removed {removed} stale local photos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
