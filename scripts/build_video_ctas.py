#!/usr/bin/env python3
"""Build src/config/videoCtas.ts: utm_campaign slug -> CTA type.

Joins two sources:
  1. The UTM Tags Tracker (data/youtube-utm-tags.csv) — the existing
     mapping of each YouTube video to the utm_campaign slug on its
     description link (?utm_source=youtube&utm_campaign=<slug>).
     Source of truth: "Effective Ecommerce - Big Sheet" → tab
     "UTM Tags Tracker". Refresh with File → Download → CSV.
  2. The CTA sheet (travis-ctas.xlsx) — what each video's
     description-link CTA promises. Each video gets ONE CTA type
     ("archetype"), see src/config/ctaArchetypes.ts.

Usage:
    python3 scripts/build_video_ctas.py ~/Downloads/travis-ctas.xlsx [data/youtube-utm-tags.csv]

Re-run whenever either sheet changes, review the diff, and commit. To
force one slug into a different type, add it to
src/config/videoCtaOverrides.ts instead.

The CTA sheet must have an "Every CTA" tab with at least: video_id,
title, date, destination, lead_magnet, framing, text, link_wording.
Standard library only (no openpyxl needed).
"""

from __future__ import annotations

import collections
import csv
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "config" / "videoCtas.ts"
DEFAULT_UTM_CSV = ROOT / "data" / "youtube-utm-tags.csv"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

# CTA destinations that send people into this funnel. Anything else
# (affiliate tools, discount codes, other videos, products) is ignored.
FUNNEL_DESTINATIONS = {
    "free call / book a call",
    "program / coaching page",
    "free course",
    "free training",
    "work with us / apply",
    "webinar",
}


def _cell_value(c: ET.Element, shared: list[str]) -> str:
    t = c.get("t")
    v = c.find(NS + "v")
    if t == "s" and v is not None:
        return shared[int(v.text)]
    if t == "inlineStr":
        return "".join(x.text or "" for x in c.iter(NS + "t"))
    return v.text if v is not None and v.text is not None else ""


def read_sheet(path: Path, sheet_name: str) -> list[dict[str, str]]:
    z = zipfile.ZipFile(path)
    shared: list[str] = []
    if "xl/sharedStrings.xml" in z.namelist():
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        shared = ["".join(t.text or "" for t in si.iter(NS + "t")) for si in root.findall(NS + "si")]

    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rel_target = {r.get("Id"): r.get("Target") for r in rels}
    target = None
    for s in wb.find(NS + "sheets"):
        if s.get("name") == sheet_name:
            target = rel_target[s.get(REL_NS + "id")]
    if target is None:
        sys.exit(f'Sheet "{sheet_name}" not found in {path}')
    target = target.lstrip("/")
    if not target.startswith("xl/"):
        target = "xl/" + target

    rows: list[dict[str, str]] = []
    for row in ET.fromstring(z.read(target)).iter(NS + "row"):
        cells = {re.match(r"[A-Z]+", c.get("r")).group(): _cell_value(c, shared) for c in row.findall(NS + "c")}
        rows.append(cells)
    header = rows[0]
    return [{header[k]: r.get(k, "") for k in header} for r in rows[1:]]


def is_end_screen(cta: dict[str, str]) -> bool:
    """CTAs that point at an on-screen video ("click this video right
    here") never reach the funnel, so they don't count."""
    w = (cta["link_wording"] + " " + cta["text"]).lower()
    points_at_video = re.search(r"(this|that) video|click (on )?(right )?here|right here", w)
    mentions_link = re.search(r"down below|description|link below", w)
    return bool(points_at_video) and not mentions_link


def classify(ctas: list[dict[str, str]]) -> str:
    text = " ".join((c["lead_magnet"] + " " + c["framing"] + " " + c["text"]).lower() for c in ctas)
    dests = {c["destination"] for c in ctas}
    if "free call / book a call" in dests or re.search(r"free (strategy |coaching |consult\w* |one-on-one )?call", text):
        if re.search(r"\b(game ?plan|roadmap|90[- ]day|6[- ]month|six[- ]month|180[- ]day|custom\w* plan|plan (to|for|on)|template)", text):
            return "call_plan"
        if re.search(r"invest|partner", text):
            return "apply"
        return "call"
    if "work with us / apply" in dests:
        return "apply"
    if "program / coaching page" in dests:
        return "program"
    # Free course / free training / webinar promises: the default
    # "SIGN UP TO WATCH NOW" copy already matches a "watch" promise.
    return "default"


# Topic-based types win over pitch-based ones: these viewers came for a
# different business model, so the funnel acknowledges it. Hosting /
# WordPress keywords match TITLES only ("emaillishostinger" is an Amazon
# sales video); dropshipping / affiliate also match the slug, so older
# videos with no CTA data still get the right type.
DROPSHIP_RE = re.compile(r"drop ?ship", re.I)
AFFILIATE_SLUG_RE = re.compile(r"affiliate|amzassociates|amazonassociates", re.I)
AFFILIATE_TITLE_RE = re.compile(
    r"affiliate|associates|web ?hosting|\bhosting\b|wordpress|woocommerce|godaddy|"
    r"hostinger|bluehost|\bwix\b|website builder|wordpress blog",
    re.I,
)
AFFILIATE_SLUG_TOOLS_RE = re.compile(r"hosting|wordpress|woocom|godaddy|bluehost|webhost", re.I)


def topic_type(slug: str, title: str) -> str | None:
    if DROPSHIP_RE.search(title) or DROPSHIP_RE.search(slug):
        return "dropshipping"
    if AFFILIATE_TITLE_RE.search(title) or AFFILIATE_SLUG_RE.search(slug):
        return "affiliate"
    if not title and AFFILIATE_SLUG_TOOLS_RE.search(slug):
        return "affiliate"
    return None


def ts_comment(s: str) -> str:
    return s.replace("*/", "* /").replace("\n", " ").strip()


def video_id(url: str) -> str | None:
    m = re.search(r"(?:youtu\.be/|v=|shorts/|live/)([A-Za-z0-9_-]{11})", url or "")
    return m.group(1) if m else None


def normalize_slug(tag: str) -> str:
    """Match how the browser reads it: the sheet stores the raw tail of
    the URL ("bestwaytosell2026&ref=kam"), but URLSearchParams stops
    utm_campaign at the first '&'. Lowercase + trim like normalizeUtm."""
    return tag.split("&", 1)[0].strip().lower()


def main() -> None:
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    ctas = read_sheet(Path(sys.argv[1]).expanduser(), "Every CTA")
    utm_csv = Path(sys.argv[2]).expanduser() if len(sys.argv) == 3 else DEFAULT_UTM_CSV

    # Video → type, from the CTA sheet.
    videos: dict[str, dict[str, str]] = {}
    funnel_ctas: dict[str, list[dict[str, str]]] = collections.defaultdict(list)
    for c in ctas:
        vid = c["video_id"].strip()
        if not vid:
            continue
        videos.setdefault(vid, {"title": c["title"], "date": c["date"]})
        if c["destination"] in FUNNEL_DESTINATIONS and not is_end_screen(c):
            funnel_ctas[vid].append(c)
    video_type = {vid: classify(funnel_ctas.get(vid, [])) for vid in videos}

    # Slug → videos, from the UTM Tags Tracker.
    slug_videos: dict[str, list[str]] = collections.defaultdict(list)
    slug_dates: dict[str, str] = {}
    with open(utm_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if (row.get("Channel") or "").strip() != "Travis Marziani":
                continue  # FBA Scalers links go to /scalers, not this funnel
            slug = normalize_slug(row.get("Tags") or "")
            vid = video_id(row.get("Video") or "")
            if slug and vid and vid not in slug_videos[slug]:
                slug_videos[slug].append(vid)
                pd = (row.get("Post Date") or "").strip()
                if re.match(r"\d{4}-\d{2}-\d{2}$", pd):
                    slug_dates.setdefault(slug, pd)

    # A slug reused across several videos takes the type of the newest
    # one we have CTA data for (that's the link people click today).
    entries = []
    unmapped = 0
    for slug, vids in slug_videos.items():
        known = sorted((videos[v]["date"], v) for v in vids if v in videos)
        if known:
            date, vid = known[-1]
            title = videos[vid]["title"]
            arch = topic_type(slug, title) or video_type[vid]
        else:
            # No CTA data (older video): only the topic types apply.
            arch = topic_type(slug, "")
            if not arch:
                unmapped += 1
                continue
            date, vid, title = slug_dates.get(slug, ""), vids[-1], "(no CTA data)"
        entries.append((date, slug, arch, vid, title))
    entries.sort(reverse=True)
    counts = collections.Counter(e[2] for e in entries)
    no_slug = sorted(
        (videos[v]["date"], v, video_type[v]) for v in videos
        if not any(v in vs for vs in slug_videos.values())
    )

    lines = [
        "/* ───── GENERATED FILE — do not edit by hand ─────────────────────",
        "   Built by scripts/build_video_ctas.py from the UTM Tags Tracker",
        "   (data/youtube-utm-tags.csv) + the Travis CTA sheet.",
        "   Maps each YouTube utm_campaign slug to the CTA type its video",
        "   pitches. To change one slug, add it to",
        "   src/config/videoCtaOverrides.ts instead of editing this file.",
        "",
        "   Counts: " + ", ".join(f"{k} {counts[k]}" for k in sorted(counts)),
        "──────────────────────────────────────────────────────────────── */",
        "",
        "import type { CtaArchetype } from './ctaArchetypes';",
        "",
        "/** [utm_campaign slug (lowercased), CTA type, YouTube video id] */",
        "export const VIDEO_CTAS: ReadonlyArray<readonly [slug: string, archetype: CtaArchetype, videoId: string]> = [",
    ]
    for date, slug, arch, vid, title in entries:
        lines.append(f"  ['{slug}', '{arch}', '{vid}'], // {date} · {ts_comment(title)}")
    lines += ["];", ""]
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {len(entries)} slugs to {OUT.relative_to(ROOT)}")
    for k in sorted(counts):
        print(f"  {k:10} {counts[k]}")
    print(f"Slugs with no CTA data and no topic match (stay default): {unmapped}")
    if no_slug:
        print(f"CTA-sheet videos with NO slug in the UTM sheet ({len(no_slug)}) — add them to the tracker:")
        for d, v, t in no_slug:
            print(f"  {d}  {v}  {t}")


if __name__ == "__main__":
    main()
