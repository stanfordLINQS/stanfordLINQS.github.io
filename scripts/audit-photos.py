"""Compare Drive folder, local images/people, and spreadsheet slugs."""

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PEOPLE_DIR = ROOT / "images" / "people"
FOLDER_ID = "1VAgTZjrq1Y2v8UJJbfNmH-1V90fSix_k"
SHEET_ID = "1_n6ESAo7j0tObCSQFPY_j0RkML58iE9ZlLDdSDOCNWk"


def slugify(name: str) -> str:
    s = name.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def stem_to_slug(stem: str) -> str:
    return stem.replace("_", "-").lower()


def fetch(url: str) -> str:
    with urllib.request.urlopen(url) as res:
        return res.read().decode("utf-8", errors="ignore")


def drive_files(html: str) -> dict[str, str]:
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
            files[stem] = fname
    return files


def sheet_names() -> list[tuple[str, str]]:
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&gid=0"
    text = fetch(url)
    text = re.sub(r"^[^(]*\(", "", text).rstrip(");")
    data = json.loads(text)
    out = []
    for row in data["table"]["rows"][1:]:
        cells = row["c"]
        if not cells or len(cells) < 2 or not cells[1] or not cells[1].get("v"):
            continue
        name = str(cells[1]["v"]).strip()
        if name.lower() in ("name", "full name"):
            continue
        out.append((name, slugify(name)))
    return out


def local_slugs() -> set[str]:
    slugs = set()
    for p in PEOPLE_DIR.iterdir():
        if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
            slugs.add(p.stem)
    return slugs


def main() -> None:
    html = fetch(f"https://drive.google.com/drive/folders/{FOLDER_ID}")
    drive = drive_files(html)
    names = sheet_names()
    local = local_slugs()

    print("=== Drive photos not downloaded locally ===")
    for stem, fname in sorted(drive.items()):
        slug = stem_to_slug(stem)
        if slug not in local:
            print(f"  {fname} -> expected slug: {slug}")

    print("\n=== People without a local photo ===")
    for name, slug in names:
        if slug not in local:
            drive_match = next(
                (f for s, f in drive.items() if stem_to_slug(s) == slug or s.replace("_", "") == slug.replace("-", "")),
                None,
            )
            extra = f" (drive: {drive_match})" if drive_match else ""
            print(f"  {slug} <- {name}{extra}")

    print("\n=== Local photos with no sheet match ===")
    sheet_slugs = {s for _, s in names}
    for slug in sorted(local):
        if slug not in sheet_slugs:
            print(f"  {slug}")


if __name__ == "__main__":
    main()
