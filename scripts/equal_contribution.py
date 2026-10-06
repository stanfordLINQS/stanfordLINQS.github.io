"""Find co-first ("contributed equally") authors in an arXiv paper's LaTeX source.

Handles the conventions used across the lab's papers:
  * REVTeX:   \\author{Name}\\thanks{These authors contributed equally}
  * Springer: \\author[1]{\\fnm{Kevin} \\sur{Multani}} ... \\equalcont{These authors ...}
  * Markers:  \\author{Name\\textsuperscript{1,\\dag}} ... $^\\dagger$These authors ...
              (including markers hidden in macros, e.g. \\newcommand{\\eq}{\\textsuperscript{\\dag}})
  * Optica:   \\author{A\\authormark{1,\\textdagger}, B\\authormark{1,\\textdagger}} ...
              \\authormark{\\textdagger} These authors ...
  * Macros:   \author{Devin Dean\equalcontrib} (a command named for equal contribution)
  * Prose:    "T.X. and N.O. contributed equally to this work."

Returns author names as written in the source (LaTeX stripped); the caller maps
them onto its own author list.
"""

from __future__ import annotations

import gzip
import io
import re
import tarfile

NOTE = re.compile(
    r"contribut\w*\s+equally|equal(?:ly)?\s+contribut\w*|equal\s+contribution|co-?first\s+author",
    re.IGNORECASE,
)
# Commands whose argument is a per-author note in the templates above.
NOTE_COMMANDS = ("thanks", "equalcont", "altaffiliation", "footnote")

MARKERS = {
    "dag": "†", "dagger": "†", "textdagger": "†", "†": "†",
    "ddag": "‡", "ddagger": "‡", "textdaggerdbl": "‡", "‡": "‡",
    "*": "*", "ast": "*", "star": "*", "textasteriskcentered": "*",
    "#": "#", "sharp": "#", "S": "§", "§": "§", "P": "¶", "¶": "¶",
}


def source_texts(blob: bytes) -> list[str]:
    """LaTeX files from an arXiv e-print (tarball, gzipped single file, or plain)."""
    try:
        with tarfile.open(fileobj=io.BytesIO(blob)) as tar:
            return [
                tar.extractfile(m).read().decode("utf-8", errors="replace")
                for m in tar.getmembers()
                if m.isfile() and m.name.lower().endswith(".tex")
            ]
    except (tarfile.TarError, EOFError, OSError):
        pass
    try:
        blob = gzip.decompress(blob)
    except (OSError, EOFError):
        pass
    text = blob.decode("utf-8", errors="replace")
    return [text] if "\\begin{document}" in text or "\\author" in text else []


def strip_comments(text: str) -> str:
    return re.sub(r"(?<!\\)%.*", "", text)


def braced(text: str, start: int) -> tuple[str, int]:
    """Contents of the {...} group opening at text[start], and the index after it."""
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{" and text[i - 1] != "\\":
            depth += 1
        elif text[i] == "}" and text[i - 1] != "\\":
            depth -= 1
            if depth == 0:
                return text[start + 1 : i], i + 1
    return text[start + 1 :], len(text)


def macros(text: str) -> dict[str, str]:
    """Zero-argument macro definitions, for markers hidden in custom commands."""
    defs = {}
    for m in re.finditer(r"\\(?:re)?newcommand\*?\s*\{?\\(\w+)\}?\s*(?:\[0\])?\s*(?=\{)", text):
        defs[m.group(1)] = braced(text, m.end())[0]
    for m in re.finditer(r"\\def\\(\w+)\s*(?=\{)", text):
        defs[m.group(1)] = braced(text, m.end())[0]
    return defs


def expand(text: str, defs: dict[str, str]) -> str:
    for _ in range(3):
        text = re.sub(r"\\(\w+)", lambda m: defs.get(m.group(1), m.group(0)), text)
    return text


def marker_set(text: str) -> set[str]:
    """Normalized footnote markers (†, *, ...) appearing in superscripts of an author entry."""
    groups = re.findall(
        r"\\textsuperscript\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}"
        r"|\\authormark\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}"
        r"|\^\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}"
        r"|\^\s*(\\[A-Za-z]+|.)"
        r"|^\s*\[([^\]]*)\]",  # \author[1,*]{...}: the option is kept at the start of "raw"
        text,
    )
    out = set()
    for group in groups:
        for part in "".join(group).split(","):
            out |= normalize_marker(part)
    # Digits are affiliations in superscripts; only \footnotemark[N] numbers are footnote markers.
    out |= {f"fn{n.strip()}" for n in re.findall(r"\\footnotemark\s*\[(\d+)\]", text)}
    out |= {MARKERS[c] for c in "†‡§¶" if c in text}
    return out


def normalize_marker(token: str) -> set[str]:
    token = token.strip().strip("${}").strip()
    found = set()
    for cmd in re.findall(r"\\([A-Za-z]+)", token):
        if cmd in MARKERS:
            found.add(MARKERS[cmd])
    for ch in re.sub(r"\\[A-Za-z]+", "", token):
        if ch in MARKERS:
            found.add(MARKERS[ch])
    return found


def clean_name(text: str) -> str:
    text = re.sub(r"\\fnm\s*\{([^{}]*)\}\s*\\sur\s*\{([^{}]*)\}", r"\1 \2", text)
    text = re.sub(
        r"\\(?:textsuperscript|authormark|thanks|footnote|email|orcidlink|orcid|inst|equalcont|affil|affiliation)"
        r"\s*\*?\s*(\[[^\]]*\])?\s*\{(?:[^{}]|\{[^{}]*\})*\}",
        "",
        text,
    )
    text = re.sub(r"\$[^$]*\$", "", text)
    text = re.sub(r"\\footnotemark(\[[^\]]*\])?", "", text)
    text = re.sub(r"\\[`'^\"~=.]\s*", "", text)  # accents: \'e -> e
    text = re.sub(r"\\[uvHtcdbk](?![A-Za-z])\s*", "", text)  # accents: \v{c} -> c
    text = re.sub(r"\\[A-Za-z]+\*?", " ", text)
    text = text.replace("\\ ", " ").replace("~", " ").replace("{", "").replace("}", "")
    text = re.sub(r"[†‡§¶*#]", "", text)
    return re.sub(r"\s+", " ", text).strip(" ,;")


def split_names(arg: str) -> list[str]:
    """Split one \\author{...} argument that may hold several authors (Optica style)."""
    depth, parts, cur = 0, [], ""
    i = 0
    while i < len(arg):
        ch = arg[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
        if depth == 0 and (ch == "," or arg.startswith("\\and", i) or re.match(r"\s+and\s", arg[i:])):
            parts.append(cur)
            cur = ""
            i += 4 if arg.startswith("\\and", i) or arg[i] != "," else 1
            continue
        cur += ch
        i += 1
    parts.append(cur)
    return [p for p in parts if clean_name(p)]


def authors_in(text: str) -> list[dict]:
    """Author entries: {raw, name, tail} where tail is the text up to the next \\author."""
    entries = []
    starts = list(re.finditer(r"\\author\s*\*?\s*(\[[^\]]*\])?\s*(?=\{)", text))
    for n, m in enumerate(starts):
        arg, end = braced(text, m.end())
        stop = starts[n + 1].start() if n + 1 < len(starts) else len(text)
        tail = text[end : min(stop, end + 800)]
        tail = re.split(r"\\(?:affiliation|address|begin\{abstract\}|maketitle|date|title)\b", tail)[0]
        option = m.group(1) or ""
        names = split_names(arg)
        for k, raw in enumerate(names):
            entries.append(
                {
                    "raw": option + raw,
                    "name": clean_name(raw),
                    # A trailing \thanks/\equalcont belongs to the last name in the group.
                    "tail": tail if k == len(names) - 1 else "",
                }
            )
    return entries


def note_commands(tail: str) -> list[str]:
    out = []
    for m in re.finditer(r"\\(" + "|".join(NOTE_COMMANDS) + r")\s*(?=\{)", tail):
        out.append(braced(tail, m.end())[0])
    return out


def initials_of(name: str) -> set[str]:
    """'Emily J. Davis' -> {'EJD', 'ED'}; 'Amir H. Safavi-Naeini' -> {'AHSN', 'ASN'}."""
    words = name.split()
    if not words:
        return set()
    letters = lambda ws: "".join(p[0] for w in ws for p in re.split(r"[\-.]+", w) if p and p[0].isalpha()).upper()
    return {letters(words), letters(words[:1]) + letters(words[-1:])}


def equal_contributors(texts: list[str]) -> list[str]:
    text = strip_comments("\n".join(texts))
    authors = authors_in(text)
    if len(authors) < 2:
        return []

    defs = macros(text)

    # 1. A note attached directly to an author (\thanks{...}, \equalcont{...}), possibly via a macro.
    flagged = [a for a in authors if any(NOTE.search(n) for n in note_commands(expand(a["tail"], defs)))]
    if len(flagged) >= 2:
        return unique(a["name"] for a in flagged)

    # 2. A marker macro named for equal contribution (\equalcontrib on each author), with or
    #    without a matching note.
    named = [a for a in authors if re.search(r"\\(?:equal|eqcontr|eqauth|cofirst)\w*", a["raw"] + a["tail"], re.IGNORECASE)]
    if len(named) >= 2:
        return unique(a["name"] for a in named)

    # 3. A marked footnote ("$^\dagger$These authors contributed equally") + matching author markers.
    for note in NOTE.finditer(text):
        before = text[max(0, note.start() - 120) : note.start()]
        before = re.split(r"\\\\|\n\s*\n|\.\s", before)[-1]
        # Drop the note's lead-in ("These authors ...") so the marker is at the end.
        before = re.sub(r"(?:\s*\b(?:these|the|two|three|four|both|all|first|authors?)\b)*\s*$", "", before, flags=re.IGNORECASE)
        for marker in marker_set(expand(before, defs)) or normalize_marker(before[-3:]):
            hits = [a for a in authors if marker in marker_set(expand(a["raw"], defs))]
            if len(hits) >= 2:
                return unique(a["name"] for a in hits)

    # 4. Prose with initials: "T.X. and N.O. contributed equally".
    for m in re.finditer(
        r"((?:[A-Z][a-z]?\.(?:\s?-?[A-Z][a-z]?\.)*\s*(?:,\s*|,?\s+and\s+))+[A-Z][a-z]?\.(?:\s?-?[A-Z][a-z]?\.)*)"
        r"\s+(?:have\s+)?contributed\s+equally",
        text,
    ):
        wanted = [re.sub(r"[^A-Z]", "", p) for p in re.split(r",\s*|\s+and\s+", m.group(1)) if p.strip()]
        hits = []
        for w in wanted:
            match = [a for a in authors if w in initials_of(a["name"])]
            if len(match) != 1:
                break
            hits.append(match[0])
        else:
            if len(hits) >= 2:
                return unique(a["name"] for a in hits)
    return []


def unique(names) -> list[str]:
    return list(dict.fromkeys(names))
