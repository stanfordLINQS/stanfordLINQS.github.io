"""Search Stanford SearchWorks for PhD alumni theses."""
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request

PHDS = [
    ("Oguz Tolga Celik", 2026),
    ("Jason Herrmann", 2026),
    ("Kevin Multani", 2026),
    ("Felix Mayor", 2026),
    ("Rachel Gruenke-Freudenstein", 2025),
    ("Taha Rajabzadeh", 2025),
    ("Hubert Stokowski", 2023),
    ("Agnetta Cleland", 2023),
    ("Nathan Lee", 2023),
    ("Okan Atalar", 2022),
    ("Wentao Jiang", 2022),
    ("Alex Wollack", 2022),
    ("Zhaoyou Wang", 2022),
    ("Timothy McKenna", 2021),
    ("Christopher Sarabalis", 2021),
    ("Rishi Patel", 2020),
    ("Jeremy Witmer", 2020),
    ("Patricio Arrangoiz-Arriola", 2019),
]

UA = "Mozilla/5.0"


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def find_purl(record_id: str) -> str:
    for suffix in (".json", ""):
        try:
            data = fetch_json(f"https://searchworks.stanford.edu/view/{record_id}{suffix}")
        except Exception:
            continue
        text = json.dumps(data)
        match = re.search(r"https://purl\.stanford\.edu/[a-z0-9]+", text)
        if match:
            return match.group(0)
    return f"https://searchworks.stanford.edu/view/{record_id}"


def search_thesis(name: str) -> tuple[str, str, str] | None:
    query = urllib.parse.quote(name)
    url = (
        "https://searchworks.stanford.edu/catalog.json"
        f"?q={query}&search_field=search_author&per_page=10"
        "&f[genre_ssim][]=Thesis/Dissertation"
    )
    docs = fetch_json(url).get("response", {}).get("docs", [])
    if not docs:
        return None

    name_parts = [part.lower() for part in name.replace("-", " ").split() if len(part) > 2]
    chosen = None
    for doc in docs:
        authors = " ".join(doc.get("author_person_display") or []).lower()
        if all(part in authors for part in name_parts[-2:]):
            chosen = doc
            break
    if not chosen:
        chosen = docs[0]

    record_id = str(chosen.get("id", ""))
    title = str(chosen.get("title_display") or "")
    year = str(chosen.get("pub_year_ss") or "")
    return title, year, find_purl(record_id)


def main() -> int:
    for name, expected_year in PHDS:
        try:
            result = search_thesis(name)
        except Exception as exc:
            print(f"ERR | {name} ({expected_year}) | {exc}")
            time.sleep(0.4)
            continue

        if not result:
            print(f"-- | {name} ({expected_year}) | NOT FOUND")
        else:
            title, year, link = result
            print(f"OK | {name} ({expected_year}) | {year} | {title} | {link}")
        time.sleep(0.4)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
