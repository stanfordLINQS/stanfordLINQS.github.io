#!/usr/bin/env python3
"""Regenerate assets/js/publications-data.js from Amir Safavi-Naeini's Google Scholar profile.

Usage:
    python scripts/update-publications.py            # fetch, enrich, write
    python scripts/update-publications.py --dry-run  # print what would change

Google Scholar is the source of truth for which papers appear. Each Scholar entry
is kept only if it is a journal article (verified against Crossref), an arXiv
preprint that has not been published yet, or a US patent (pending applications
only when no granted patent has the same title). Conference abstracts,
proceedings, corrections, and cover-art entries are dropped. Crossref and arXiv
supply full author lists, DOIs, volume/pages, and arXiv IDs; Scholar's detail
pages supply full patent inventor lists.

Hand fixes go in scripts/publications-overrides.json. Crossref lookups are
cached in scripts/publications-cache.json so weekly runs only query new entries.

Google Scholar blocks automated access intermittently. On any fetch failure, or
if the result looks truncated, the script exits non-zero without writing.
"""

from __future__ import annotations

import argparse
import difflib
import html
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

SCHOLAR_USER = "QviK0DEAAAAJ"
FIRST_YEAR = 2014
ARXIV_AUTHOR = "Safavi-Naeini"
CROSSREF_MAILTO = "linqs-website@stanford.edu"

ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "assets/js/publications-data.js"
CACHE = ROOT / "scripts/publications-cache.json"
OVERRIDES = ROOT / "scripts/publications-overrides.json"

BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/129.0 Safari/537.36"
)
API_UA = f"LINQS-website/1.0 (mailto:{CROSSREF_MAILTO})"

TITLE_MATCH = 0.9
# Titles often change a little between preprint and publication.
PREPRINT_MATCH = 0.82

SKIP_TITLE = re.compile(
    r"^(author|publisher)\s+correction|^correction\b|^erratum|^retraction"
    r"|publisher[’']s\s+note|\berratum\b"
    r"|^(inside\s+)?(front|back)\s+cover|^cover\s+picture|^frontispiece"
    r"|\([^()]*\b\d{1,2}/\d{4}\)\s*$"  # "... (Advanced Optical Materials 8/2026)"
    r"|\(vol\.? \d+, pg\.? \d+, \d{4}\)\s*$",  # erratum: "... (vol 58, pg 2235, 2019)"
    re.IGNORECASE,
)
PATENT_VENUE = re.compile(r"^(US Patent(?: App\.)?)\s+([\d,/]+)")
CONFERENCE_JOURNAL = re.compile(r"web of conferences|proceedings|conference series", re.IGNORECASE)
ARXIV_VENUE = re.compile(r"arXiv:(\d{4}\.\d{4,5}|[a-z\-]+/\d{7})", re.IGNORECASE)


# --------------------------------------------------------------------------- fetch


def get(url: str, ua: str, retries: int = 3) -> bytes:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": ua})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except Exception:  # noqa: BLE001
            if attempt == retries - 1:
                raise
            time.sleep(5 * (attempt + 1))
    raise AssertionError("unreachable")


def fetch_scholar() -> list[dict]:
    rows: list[dict] = []
    for start in range(0, 3000, 100):
        params = {
            "hl": "en",
            "user": SCHOLAR_USER,
            "view_op": "list_works",
            "sortby": "pubdate",
            "cstart": str(start),
            "pagesize": "100",
        }
        page = get(
            "https://scholar.google.com/citations?" + urllib.parse.urlencode(params),
            BROWSER_UA,
        ).decode("utf-8", errors="replace")
        if start == 0 and "gsc_a_tr" not in page:
            raise RuntimeError("Scholar returned no publication rows (likely a CAPTCHA page)")
        page_rows = re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', page, flags=re.DOTALL)
        for row in page_rows:
            link = re.search(r'citation_for_view=([^"&]+)[^"]*" class="gsc_a_at">(.*?)</a>', row, re.DOTALL)
            if not link:
                continue
            gray = re.findall(r'<div class="gs_gray">(.*?)</div>', row, re.DOTALL)
            year = re.search(r'gsc_a_h gsc_a_hc gs_ibl">(\d*)<', row)
            rows.append(
                {
                    "id": html.unescape(link.group(1)),
                    "title": clean(link.group(2)),
                    "venue": clean(gray[1]) if len(gray) > 1 else "",
                    "year": int(year.group(1)) if year and year.group(1) else None,
                }
            )
        if len(page_rows) < 100:
            break
        time.sleep(3)
    return rows


def fetch_patent(scholar_id: str) -> dict:
    params = {
        "view_op": "view_citation",
        "hl": "en",
        "user": SCHOLAR_USER,
        "citation_for_view": scholar_id,
    }
    page = get(
        "https://scholar.google.com/citations?" + urllib.parse.urlencode(params),
        BROWSER_UA,
    ).decode("utf-8", errors="replace")
    fields = {
        clean(k): clean(v)
        for k, v in re.findall(
            r'<div class="gsc_oci_field">(.*?)</div><div class="gsc_oci_value"[^>]*>(.*?)</div>', page, re.DOTALL
        )
    }
    if "Inventors" not in fields:
        raise RuntimeError(f"Scholar patent page {scholar_id} has no inventors (likely a CAPTCHA page)")
    link = re.search(r'class="gsc_oci_title_link" href="([^"]+)"', page)
    return {
        "inventors": [n.strip() for n in fields["Inventors"].split(",") if n.strip()],
        "url": html.unescape(link.group(1)) if link else "",
    }


def fetch_arxiv() -> list[dict]:
    query = urllib.parse.urlencode(
        {"search_query": f'au:"{ARXIV_AUTHOR}"', "max_results": "2000", "sortBy": "submittedDate"}
    )
    root = ET.fromstring(get("https://export.arxiv.org/api/query?" + query, API_UA))
    ns = {"a": "http://www.w3.org/2005/Atom", "x": "http://arxiv.org/schemas/atom"}
    papers = []
    for entry in root.findall("a:entry", ns):
        abs_id = entry.findtext("a:id", "", ns).rsplit("/abs/", 1)[-1]
        papers.append(
            {
                "arxiv": re.sub(r"v\d+$", "", abs_id),
                "title": clean(entry.findtext("a:title", "", ns)),
                "authors": [clean(a.findtext("a:name", "", ns)) for a in entry.findall("a:author", ns)],
                "doi": (entry.findtext("x:doi", "", ns) or "").strip().lower(),
                "year": int(entry.findtext("a:published", "0", ns)[:4]),
            }
        )
    if not papers:
        raise RuntimeError("arXiv returned no papers")
    return papers


CROSSREF_FIELDS = (
    "DOI,title,type,author,container-title,volume,issue,page,article-number"
)


def crossref_search(text: str, field: str = "bibliographic", author: str | None = ARXIV_AUTHOR) -> list[dict]:
    params = {
        f"query.{field}": text,
        "rows": "5",
        "select": CROSSREF_FIELDS,
        "mailto": CROSSREF_MAILTO,
    }
    if author:
        params["query.author"] = author
    query = urllib.parse.urlencode(params)
    data = json.loads(get("https://api.crossref.org/works?" + query, API_UA))
    return data["message"]["items"]


def crossref_doi(doi: str) -> dict | None:
    try:
        data = json.loads(get("https://api.crossref.org/works/" + urllib.parse.quote(doi), API_UA))
    except Exception:  # noqa: BLE001
        return None
    return data["message"]


# ------------------------------------------------------------------------- helpers


def clean(text: str) -> str:
    # Scholar draws math in titles as inline SVG; keep its text label.
    text = re.sub(r'<svg[^>]*aria-label="([^"]*)".*?</svg>', r"\1", text or "", flags=re.DOTALL)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def norm(title: str) -> str:
    title = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", title.lower())


def similar(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def initials(given: str) -> str:
    out = []
    for word in given.replace(".", ". ").split():
        parts = [p for p in word.split("-") if p]
        if parts:
            out.append("".join(p[0].upper() + "." for p in parts))
    return "".join(out)


def tidy_family(family: str) -> str:
    return family.title() if family.isupper() and len(family) > 2 else family


def crossref_authors(item: dict) -> str:
    names = []
    for a in item.get("author", []):
        if a.get("family"):
            given = initials(a.get("given", ""))
            names.append(f"{given} {tidy_family(a['family'])}".strip())
        elif a.get("name"):
            names.append(a["name"])
    return ", ".join(names)


NAME_PARTICLES = {"van", "von", "de", "der", "den", "del", "della", "da", "di", "du", "le", "la", "op", "ten", "ter"}


def full_name_authors(names: list[str]) -> str:
    out = []
    for name in names:
        parts = name.split()
        split = len(parts) - 1
        while split > 1 and parts[split - 1].lower() in NAME_PARTICLES:
            split -= 1  # "Raphaël Van Laer" -> family "Van Laer"
        family = " ".join(tidy_family(p) for p in parts[split:])
        out.append(f"{initials(' '.join(parts[:split]))} {family}".strip() if parts else name)
    return ", ".join(out)


def journal_entry(item: dict, year: int) -> dict:
    entry = {
        "year": year,
        "authors": crossref_authors(item),
        "title": clean((item.get("title") or [""])[0]),
        "journal": clean((item.get("container-title") or [""])[0]),
    }
    if item.get("volume"):
        entry["volume"] = item["volume"]
    if item.get("issue"):
        entry["issue"] = item["issue"]
    pages = item.get("page") or item.get("article-number")
    if pages:
        entry["pages"] = pages.replace("-", "–")
    entry["yearLabel"] = year
    entry["doi"] = item["DOI"].lower()
    return entry


def is_journal_article(item: dict | None) -> bool:
    return bool(
        item
        and item.get("type") == "journal-article"
        and item.get("container-title")
        and not CONFERENCE_JOURNAL.search(item["container-title"][0])
        and "supplement" not in (item.get("issue") or "").lower()  # meeting-abstract supplements
        and not SKIP_TITLE.search(clean((item.get("title") or [""])[0]))
    )


# --------------------------------------------------------------------------- build


def matches_venue(item: dict, venue: str) -> bool:
    """True if Scholar's venue string ("Nature 520 (7548), 522-525, 2015") cites this item."""
    journal = clean((item.get("container-title") or [""])[0])
    first_page = re.split(r"[-–]", item.get("page") or item.get("article-number") or "")[0]
    return bool(
        item.get("volume")
        and first_page
        and similar(journal, re.split(r"\s\d", venue)[0]) >= 0.8
        and re.search(rf"(^|\D){re.escape(item['volume'])}(\D|$)", venue)
        and re.search(rf"(^|\D){re.escape(first_page)}(\D|$)", venue)
    )


def resolve_crossref(row: dict, cache: dict) -> dict | None:
    key = f"{norm(row['title'])}|{norm(row['venue'])}"
    if key not in cache:
        cache[key] = None
        # The author-weighted search misses big multi-author papers, so fall back to a
        # title-only search, then to title + venue for entries whose Scholar title is garbled.
        for items in (
            lambda: crossref_search(row["title"]),
            lambda: crossref_search(row["title"], field="title", author=None),
            lambda: crossref_search(f"{row['title']} {row['venue']}", author=None),
        ):
            for item in items():
                title = (item.get("title") or [""])[0]
                if is_journal_article(item) and (
                    similar(row["title"], title) >= TITLE_MATCH or matches_venue(item, row["venue"])
                ):
                    cache[key] = item
                    break
            time.sleep(0.2)
            if cache[key]:
                break
    # Re-check cached hits so tightened filters apply to old entries too.
    return cache[key] if is_journal_article(cache[key]) else None


def build(scholar: list[dict], arxiv: list[dict], cache: dict, overrides: dict) -> tuple[list[dict], list[str]]:
    excluded = {norm(t) for t in overrides.get("exclude", [])}
    arxiv_by_id = {p["arxiv"]: p for p in arxiv}
    arxiv_by_doi = {p["doi"]: p for p in arxiv if p["doi"]}

    journals: dict[str, dict] = {}  # doi -> entry
    preprints: dict[str, dict] = {}  # arxiv id -> entry
    patents: list[dict] = []
    applications: list[dict] = []
    dropped: list[str] = []

    for rank, row in enumerate(scholar):
        if not row["year"] or row["year"] < FIRST_YEAR:
            continue
        if norm(row["title"]) in excluded or SKIP_TITLE.search(row["title"]):
            dropped.append(f"skip     {row['title']}")
            continue

        patent = PATENT_VENUE.match(row["venue"])
        if patent:
            key = f"patent|{row['id']}"
            if key not in cache:
                cache[key] = fetch_patent(row["id"])
                time.sleep(3)
            kind, number = patent.group(1), patent.group(2).strip(",")
            entry = {
                "year": row["year"],
                "authors": full_name_authors(cache[key]["inventors"]),
                "title": row["title"],
                "journal": kind,
                "patent": number,
                "url": cache[key]["url"],
                "yearLabel": row["year"],
                "_rank": rank,
            }
            (applications if kind.endswith("App.") else patents).append(entry)
            continue

        arxiv_id = ARXIV_VENUE.search(row["venue"])
        if arxiv_id:
            paper = arxiv_by_id.get(arxiv_id.group(1))
            if not paper:
                dropped.append(f"no-arxiv {row['title']} ({arxiv_id.group(1)})")
                continue
            # A preprint whose arXiv record points at the published DOI becomes that article.
            item = cache_doi(paper["doi"], cache) if paper["doi"] else None
            if is_journal_article(item):
                journals.setdefault(item["DOI"].lower(), {**journal_entry(item, row["year"]), "_rank": rank})
            else:
                preprints.setdefault(
                    paper["arxiv"],
                    {
                        "year": row["year"],
                        "authors": full_name_authors(paper["authors"]),
                        "title": paper["title"],
                        "journal": "arXiv",
                        "arxiv": paper["arxiv"],
                        "yearLabel": row["year"],
                        "_rank": rank,
                    },
                )
            continue

        item = resolve_crossref(row, cache)
        if item:
            journals.setdefault(item["DOI"].lower(), {**journal_entry(item, row["year"]), "_rank": rank})
        else:
            dropped.append(f"not-jrnl {row['title']} [{row['venue']}]")

    # Attach arXiv links to journal articles, and drop preprints that were published.
    for doi, entry in journals.items():
        paper = arxiv_by_doi.get(doi) or best_arxiv_match(entry, arxiv)
        if paper:
            entry["arxiv"] = paper["arxiv"]
            if paper["arxiv"] in preprints:
                dropped.append(f"merged   {preprints.pop(paper['arxiv'])['title']}")
    for arxiv_id, pre in list(preprints.items()):
        if any(similar(pre["title"], j["title"]) >= PREPRINT_MATCH and same_first_author(pre, j) for j in journals.values()):
            dropped.append(f"merged   {preprints.pop(arxiv_id)['title']}")

    # Like preprints, applications show only until a patent with that title is granted,
    # and repeat filings (continuations) of the same application show once (newest).
    for app in applications:
        if any(similar(app["title"], p["title"]) >= TITLE_MATCH for p in patents):
            dropped.append(f"granted  {app['title']}")
        elif any(norm(app["title"]) == norm(p["title"]) for p in patents if p["journal"] == app["journal"]):
            dropped.append(f"repeat   {app['title']}")
        else:
            patents.append(app)

    entries = list(journals.values()) + list(preprints.values()) + patents
    apply_edits(entries, overrides.get("edit", {}))
    # Scholar lists newest first; keep that order within each year.
    entries.sort(key=lambda e: (-int(e["year"]), e.pop("_rank")))
    return entries, dropped


def cache_doi(doi: str, cache: dict) -> dict | None:
    key = f"doi|{doi}"
    if key not in cache:
        cache[key] = crossref_doi(doi)
        time.sleep(0.2)
    return cache[key]


def first_family(authors: str) -> str:
    first = authors.split(",")[0].strip()
    return norm(first.split()[-1]) if first else ""


def same_first_author(a: dict, b: dict) -> bool:
    return first_family(a["authors"]) == first_family(b["authors"])


def best_arxiv_match(entry: dict, arxiv: list[dict]) -> dict | None:
    best, best_score = None, PREPRINT_MATCH
    for paper in arxiv:
        if abs(paper["year"] - int(entry["year"])) > 3:
            continue
        score = similar(entry["title"], paper["title"])
        if score >= best_score and first_family(entry["authors"]) == first_family(full_name_authors(paper["authors"])):
            best, best_score = paper, score
    return best


def apply_edits(entries: list[dict], edits: dict) -> None:
    by_title = {norm(e["title"]): e for e in entries}
    for title, fields in edits.items():
        entry = by_title.get(norm(title))
        if entry is None:
            print(f"warning: override for unknown title: {title}", file=sys.stderr)
            continue
        entry.update(fields)


# --------------------------------------------------------------------------- write

HEADER = """/**
 * Lab publications, generated from Google Scholar (Amir Safavi-Naeini, user={user})
 * by scripts/update-publications.py. Do not edit by hand: put fixes in
 * scripts/publications-overrides.json and rerun the script.
 */
window.PUBLICATIONS = """


def render(entries: list[dict]) -> str:
    return HEADER.format(user=SCHOLAR_USER) + json.dumps(entries, indent=2, ensure_ascii=False) + ";\n"


def previous_count() -> int:
    if not DATA_JS.exists():
        return 0
    return len(re.findall(r'^\s*"?title"?:', DATA_JS.read_text(), flags=re.MULTILINE))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="Print the result without writing files")
    parser.add_argument("--verbose", action="store_true", help="List every dropped Scholar entry")
    args = parser.parse_args()

    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    overrides = json.loads(OVERRIDES.read_text()) if OVERRIDES.exists() else {}

    try:
        scholar = fetch_scholar()
        arxiv = fetch_arxiv()
        entries, dropped = build(scholar, arxiv, cache, overrides)
    except Exception as exc:  # noqa: BLE001
        print(f"Update failed, leaving publications unchanged: {exc}", file=sys.stderr)
        return 1

    before = previous_count()
    print(f"Scholar rows: {len(scholar)}; published: {len(entries)} (was {before}); dropped: {len(dropped)}")
    if args.verbose:
        print("\n".join(sorted(dropped)))
    if before >= 50 and len(entries) < 0.8 * before:
        print("Result is much smaller than the current list; refusing to overwrite.", file=sys.stderr)
        return 1

    if args.dry_run:
        print(render(entries))
        return 0
    DATA_JS.write_text(render(entries))
    CACHE.write_text(json.dumps(cache, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
