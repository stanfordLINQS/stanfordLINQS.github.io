#!/usr/bin/env python3
"""List publications from Amir Safavi-Naeini's Google Scholar profile.

Usage:
    python scripts/fetch-scholar-publications.py
    python scripts/fetch-scholar-publications.py --year 2026

Google Scholar blocks automated access intermittently. When that happens,
copy entries manually into assets/js/publications-data.js.
"""

from __future__ import annotations

import argparse
import re
import sys
import urllib.parse
import urllib.request

SCHOLAR_USER = "QviK0DEAAAAJ"


def fetch_publications(year: int | None = None) -> list[dict[str, str]]:
    params = {
        "hl": "en",
        "user": SCHOLAR_USER,
        "view_op": "list_works",
        "sortby": "pubdate",
        "cstart": "0",
        "pagesize": "100",
    }
    url = "https://scholar.google.com/citations?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        html = resp.read().decode("utf-8", errors="replace")

    rows = re.findall(
        r'<tr class="gsc_a_tr">(.*?)</tr>',
        html,
        flags=re.DOTALL,
    )
    publications: list[dict[str, str]] = []
    for row in rows:
        title = _first(r'class="gsc_a_at"[^>]*>([^<]+)</a>', row)
        authors = _first(r'class="gs_gray">([^<]+)</div>', row)
        venue = _first(r'class="gs_gray">[^<]+</div>\s*<div class="gs_gray">([^<]+)</div>', row)
        if not title:
            continue
        pub_year = _extract_year(venue)
        if year is not None and pub_year != year:
            continue
        publications.append(
            {
                "title": _unescape(title),
                "authors": _unescape(authors or ""),
                "venue": _unescape(venue or ""),
                "year": str(pub_year) if pub_year else "",
            }
        )
    return publications


def _first(pattern: str, text: str) -> str | None:
    match = re.search(pattern, text, flags=re.DOTALL)
    return match.group(1).strip() if match else None


def _extract_year(venue: str | None) -> int | None:
    if not venue:
        return None
    match = re.search(r"\b(19|20)\d{2}\b", venue)
    return int(match.group(0)) if match else None


def _unescape(text: str) -> str:
    return (
        text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&#39;", "'")
        .replace("&quot;", '"')
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--year", type=int, help="Only show publications from this year")
    args = parser.parse_args()

    try:
        pubs = fetch_publications(args.year)
    except Exception as exc:  # noqa: BLE001
        print(f"Could not fetch Google Scholar: {exc}", file=sys.stderr)
        print(
            f"Open https://scholar.google.com/citations?user={SCHOLAR_USER}&view_op=list_works&sortby=pubdate",
            file=sys.stderr,
        )
        return 1

    if not pubs:
        label = f" for {args.year}" if args.year else ""
        print(f"No publications found{label}.")
        return 0

    for i, pub in enumerate(pubs, 1):
        print(f"{i}. {pub['title']}")
        print(f"   Authors: {pub['authors']}")
        print(f"   Venue:   {pub['venue']}")
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
