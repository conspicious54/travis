#!/usr/bin/env python3
"""
Creates the "Funnel Health" dashboard + insights in PostHog.

Idempotent: rerunning reuses items with the same name rather than
duplicating. Maps directly to the dashboard columns requested:
TRAFFIC IN, LEADS IN %, Qualified / DQ Fast Track / DQ PPF %,
VSL Watch Seconds, Application Page %, App Scoring Breakdown,
Full Q / SQ / DQ App %, Calls Booked (Q/SQ/Total).

Usage:
    PH_KEY=phx_... python3 scripts/posthog_funnel_dashboard.py
"""

import json
import os
import sys
import urllib.error
import urllib.request

HOST = "https://us.posthog.com"
PROJECT_ID = 375981
KEY = os.environ.get("PH_KEY")
if not KEY:
    sys.exit("PH_KEY env var is required")

HEADERS = {
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
}


def _req(method, path, body=None):
    url = f"{HOST}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {path} failed: {e.code} {e.read().decode()}")
    return json.loads(raw) if raw else {}


def list_all(path):
    results = []
    next_url = f"{HOST}{path}"
    while next_url:
        req = urllib.request.Request(next_url, headers=HEADERS, method="GET")
        with urllib.request.urlopen(req) as resp:
            page = json.loads(resp.read().decode())
        results.extend(page.get("results", []))
        next_url = page.get("next")
    return results


def find_by_name(path, name):
    for item in list_all(path):
        if item.get("name") == name:
            return item
    return None


def upsert(path, body):
    existing = find_by_name(path, body["name"])
    if existing:
        updated = _req("PATCH", f"{path.rstrip('/')}/{existing['id']}/", body)
        print(f"  updated: {body['name']} (id={existing['id']})")
        return updated
    created = _req("POST", path, body)
    print(f"  created: {body['name']} (id={created['id']})")
    return created


INSIGHTS_PATH = f"/api/projects/{PROJECT_ID}/insights/"
DASHBOARDS_PATH = f"/api/projects/{PROJECT_ID}/dashboards/"


def event_node(event, name=None, math="total", props=None):
    n = {"kind": "EventsNode", "event": event, "name": name or event, "math": math}
    if props:
        n["properties"] = props
    return n


def prop(key, value, operator="exact", type_="event"):
    return {"key": key, "value": value, "operator": operator, "type": type_}


def trends(series, date_from="-30d", display="ActionsLineGraph", breakdown=None, breakdown_type="event"):
    q = {
        "kind": "TrendsQuery",
        "series": series,
        "dateRange": {"date_from": date_from},
        "interval": "day",
        "trendsFilter": {"display": display},
    }
    if breakdown:
        q["breakdownFilter"] = {"breakdown_type": breakdown_type, "breakdown": breakdown}
    return q


def viz_insight(name, description, query, dashboards=None, favorited=False):
    body = {
        "name": name,
        "description": description,
        "favorited": favorited,
        "query": {"kind": "InsightVizNode", "source": query},
    }
    if dashboards:
        body["dashboards"] = dashboards
    return body


def hogql_insight(name, description, sql, dashboards=None, favorited=False):
    """HogQL insight renders as a table."""
    body = {
        "name": name,
        "description": description,
        "favorited": favorited,
        "query": {
            "kind": "DataTableNode",
            "source": {"kind": "HogQLQuery", "query": sql},
            "full": True,
            "showPropertyFilter": False,
            "showEventFilter": False,
            "showSearch": False,
        },
    }
    if dashboards:
        body["dashboards"] = dashboards
    return body


# ───────────────────── dashboard ──────────────────────────────────

print("— dashboard —")
dashboard = upsert(
    DASHBOARDS_PATH,
    {
        "name": "Funnel Health",
        "description": (
            "Top-of-funnel to booked-call. Columns: TRAFFIC IN, LEADS IN %, "
            "Qualified / DQ Fast Track / DQ PPF %, VSL Watch Seconds, "
            "Application Page %, App Scoring Breakdown, Full-Q / SQ / DQ Application %, "
            "Calls Booked (Q level, SQ level, Total). All derived from PostHog events "
            "— no Typeform or OnceHub pull required."
        ),
        "pinned": True,
    },
)
DASH_ID = dashboard["id"]


# ───────────────────── insights ───────────────────────────────────

print("— insights —")

# 1) Main summary table — all metrics by day in one HogQL query
upsert(
    INSIGHTS_PATH,
    hogql_insight(
        "Daily funnel summary — all columns",
        (
            "Day-by-day breakdown of every dashboard column. One row per day. "
            "Columns match the sheet layout: traffic → leads → router outcomes → "
            "application funnel → score buckets → bookings by level."
        ),
        """
SELECT
  toDate(timestamp) AS day,

  countDistinctIf(person_id, event = '$pageview') AS traffic_in,
  countIf(event = 'newform_submitted') AS leads,
  countDistinctIf(person_id, event = 'newform_submitted') AS leads_unique,

  -- Qualified = target-country leads (bypass router, go direct to /nextstep)
  --            + non-target leads that defaulted to qualified via geoip-fail fallback
  countIf(event = 'newform_submitted' AND properties.audience = 'target') +
    countIf(event = 'router_decision' AND properties.outcome = 'qualified') AS qualified,
  countIf(event = 'router_decision' AND properties.outcome = 'fasttrack') AS dq_fasttrack,
  countIf(event = 'router_decision' AND properties.outcome = 'formula')   AS dq_ppf,
  -- Also surface the lead-to-router drop for non-target: submitted but never reached router
  countIf(event = 'newform_submitted' AND properties.audience = 'non_target') -
    countIf(event = 'router_decision') AS nontarget_bounced_before_router,

  countIf(event = 'applynow_page_viewed') AS app_page_views,
  countIf(event = 'applynow_typeform_started') AS app_started,
  countIf(event = 'applynow_typeform_completed') AS app_completed,

  countIf(event = 'lead_score_captured' AND toFloat(properties.lead_score) >= 11) AS app_full_q,
  countIf(event = 'lead_score_captured' AND toFloat(properties.lead_score) BETWEEN 5 AND 10) AS app_sq,
  countIf(event = 'lead_score_captured' AND toFloat(properties.lead_score) <= 4)  AS app_dq,

  countIf(event = 'booking_completed') AS books_total,
  countIf(event = 'booking_completed' AND toFloat(properties.lead_score) >= 11) AS books_q,
  countIf(event = 'booking_completed' AND toFloat(properties.lead_score) BETWEEN 5 AND 10) AS books_sq
FROM events
WHERE timestamp > now() - interval 30 day
GROUP BY day
ORDER BY day DESC
        """.strip(),
        dashboards=[DASH_ID],
        favorited=True,
    ),
)

# 2) Traffic in — unique daily visitors (line chart)
upsert(
    INSIGHTS_PATH,
    viz_insight(
        "Traffic in — unique daily visitors",
        "Distinct persons firing any $pageview, by day. Dashboard column: TRAFFIC IN.",
        trends([event_node("$pageview", "Unique visitors", math="dau")]),
        dashboards=[DASH_ID],
    ),
)

# 3) Leads in — newform_submitted trend
upsert(
    INSIGHTS_PATH,
    viz_insight(
        "Leads in — form submissions",
        "newform_submitted events per day. Dashboard column: LEADS IN %.",
        trends([event_node("newform_submitted", "Form submits")]),
        dashboards=[DASH_ID],
    ),
)

# 4a) Lead outcomes — complete picture (target vs non-target DQ)
upsert(
    INSIGHTS_PATH,
    hogql_insight(
        "Lead outcomes — Qualified / DQ Fast Track / DQ PPF (complete)",
        "Full per-day lead segmentation. 'Qualified' = target-country leads "
        "(bypass /router, direct to /nextstep) + non-target leads that geoip-"
        "defaulted to qualified. DQ Fast Track / DQ PPF only ever come from "
        "non-target /router decisions.",
        """
SELECT
  toDate(timestamp) AS day,
  countIf(event = 'newform_submitted' AND properties.audience = 'target') +
    countIf(event = 'router_decision' AND properties.outcome = 'qualified') AS qualified,
  countIf(event = 'router_decision' AND properties.outcome = 'fasttrack') AS dq_fasttrack,
  countIf(event = 'router_decision' AND properties.outcome = 'formula')   AS dq_ppf,
  countIf(event = 'newform_submitted' AND properties.audience = 'non_target') -
    countIf(event = 'router_decision') AS nontarget_bounced_before_router
FROM events
WHERE event IN ('newform_submitted', 'router_decision')
  AND timestamp > now() - interval 30 day
GROUP BY day
ORDER BY day DESC
        """.strip(),
        dashboards=[DASH_ID],
    ),
)

# 4b) Router outcomes — non-target traffic only (legacy breakdown)
upsert(
    INSIGHTS_PATH,
    viz_insight(
        "Router outcomes — non-target only (via /router)",
        "router_decision broken down by outcome. ONLY captures non-target "
        "visitors who pass through /router. Target-country leads skip /router "
        "entirely and are counted in the Lead outcomes insight above.",
        trends(
            [event_node("router_decision", "Routing decisions")],
            breakdown="outcome",
            display="ActionsBar",
        ),
        dashboards=[DASH_ID],
    ),
)

# 5) VSL watch funnel — start → 45s → 60s → 120s → ... → end
upsert(
    INSIGHTS_PATH,
    hogql_insight(
        "VSL watch funnel — start → milestones",
        "Each column = unique visitors who hit that stage of the VSL. "
        "'started' = fired nextstep_video_started (play button pressed or autoplay). "
        "45s is the opener (closing-pitch bridge). Every subsequent column shows "
        "retention from the start. Last 7 days.",
        """
SELECT
  countDistinctIf(person_id, event = 'nextstep_video_started') AS started,
  countDistinctIf(person_id, event = 'nextstep_video_milestone' AND toFloat(properties.seconds) >= 45)  AS m_45s,
  countDistinctIf(person_id, event = 'nextstep_video_milestone' AND toFloat(properties.seconds) >= 60)  AS m_60s,
  countDistinctIf(person_id, event = 'nextstep_video_milestone' AND toFloat(properties.seconds) >= 120) AS m_120s,
  countDistinctIf(person_id, event = 'nextstep_video_milestone' AND toFloat(properties.seconds) >= 180) AS m_180s,
  countDistinctIf(person_id, event = 'nextstep_video_milestone' AND toFloat(properties.seconds) >= 240) AS m_240s,
  countDistinctIf(person_id, event = 'nextstep_video_milestone' AND toFloat(properties.seconds) >= 300) AS m_300s,
  countDistinctIf(person_id, event = 'nextstep_video_milestone' AND toFloat(properties.seconds) >= 600) AS m_10m,
  countDistinctIf(person_id, event = 'nextstep_video_milestone' AND toFloat(properties.seconds) >= 900) AS m_15m,
  countDistinctIf(person_id, event = 'nextstep_video_milestone' AND toFloat(properties.seconds) >= 1500) AS m_25m,
  countDistinctIf(person_id, event = 'nextstep_green_cta_clicked')                                      AS cta_clicked
FROM events
WHERE timestamp > now() - interval 7 day
  AND event IN ('nextstep_video_started','nextstep_video_milestone','nextstep_green_cta_clicked')
        """.strip(),
        dashboards=[DASH_ID],
    ),
)

# 5b) Daily VSL start count (lets you see start-rate drop-off separately)
upsert(
    INSIGHTS_PATH,
    viz_insight(
        "VSL starts per day",
        "nextstep_video_started events per day. Compare to /nextstep pageviews "
        "to see what fraction of visitors actually press play.",
        trends([event_node("nextstep_video_started", "VSL starts")]),
        dashboards=[DASH_ID],
    ),
)

# 6) Application page funnel: page view → form start → form complete
upsert(
    INSIGHTS_PATH,
    hogql_insight(
        "Application funnel — views → started → completed",
        "Daily counts for the application page. Dashboard column: Application Page %.",
        """
SELECT
  toDate(timestamp) AS day,
  countIf(event = 'applynow_page_viewed') AS page_views,
  countIf(event = 'applynow_typeform_started') AS form_started,
  countIf(event = 'applynow_typeform_completed') AS form_completed,
  round(form_started / nullif(page_views, 0) * 100, 1) AS start_rate_pct,
  round(form_completed / nullif(page_views, 0) * 100, 1) AS complete_rate_pct
FROM events
WHERE event LIKE 'applynow_%'
  AND timestamp > now() - interval 30 day
GROUP BY day
ORDER BY day DESC
        """.strip(),
        dashboards=[DASH_ID],
    ),
)

# 7) Application scoring breakdown — distribution of scores
upsert(
    INSIGHTS_PATH,
    hogql_insight(
        "Application scoring breakdown",
        "Distribution of Typeform scores across all applicants (last 30d). "
        "Score 11+ is Full Qualified, 5-10 is Semi Qualified, 0-4 is DQ.",
        """
SELECT
  toInt(properties.lead_score) AS score,
  count() AS applicants,
  countDistinct(person_id) AS unique_people
FROM events
WHERE event = 'lead_score_captured'
  AND timestamp > now() - interval 30 day
  AND properties.lead_score IS NOT NULL
GROUP BY score
ORDER BY score DESC
        """.strip(),
        dashboards=[DASH_ID],
    ),
)

# 8) Full Q / SQ / DQ application rate per day
upsert(
    INSIGHTS_PATH,
    hogql_insight(
        "Application level breakdown — Full Q / SQ / DQ %",
        "Daily split of applications into score buckets. Dashboard columns: "
        "Full Qualified %, Semi Qualified %, DQed Application %.",
        """
WITH apps AS (
  SELECT
    toDate(timestamp) AS day,
    toFloat(properties.lead_score) AS score
  FROM events
  WHERE event = 'lead_score_captured'
    AND timestamp > now() - interval 30 day
    AND properties.lead_score IS NOT NULL
)
SELECT
  day,
  count() AS total_applicants,
  countIf(score >= 11) AS full_q,
  countIf(score BETWEEN 5 AND 10) AS semi_q,
  countIf(score <= 4)  AS dq,
  round(countIf(score >= 11) / nullif(count(), 0) * 100, 1) AS full_q_pct,
  round(countIf(score BETWEEN 5 AND 10) / nullif(count(), 0) * 100, 1) AS semi_q_pct,
  round(countIf(score <= 4)  / nullif(count(), 0) * 100, 1) AS dq_pct
FROM apps
GROUP BY day
ORDER BY day DESC
        """.strip(),
        dashboards=[DASH_ID],
    ),
)

# 9) Bookings total — line chart
upsert(
    INSIGHTS_PATH,
    viz_insight(
        "Calls booked — total per day",
        "booking_completed events per day. Dashboard column: Calls Booked (Total).",
        trends([event_node("booking_completed", "Bookings", math="total")]),
        dashboards=[DASH_ID],
    ),
)

# 10) Bookings by score level
upsert(
    INSIGHTS_PATH,
    hogql_insight(
        "Bookings by level — Q / SQ / unscored",
        "Daily booking counts split by lead_score bucket. "
        "'unscored' = bookings before lead-score wiring went live (should trend to zero).",
        """
SELECT
  toDate(timestamp) AS day,
  countIf(toFloat(properties.lead_score) >= 11) AS books_q,
  countIf(toFloat(properties.lead_score) BETWEEN 5 AND 10) AS books_sq,
  countIf(toFloat(properties.lead_score) <= 4)  AS books_dq,
  countIf(properties.lead_score IS NULL)       AS books_unscored,
  count() AS books_total
FROM events
WHERE event = 'booking_completed'
  AND timestamp > now() - interval 30 day
GROUP BY day
ORDER BY day DESC
        """.strip(),
        dashboards=[DASH_ID],
    ),
)

# 11) Shortlink traffic — UTM-tagged funnel redirects
upsert(
    INSIGHTS_PATH,
    hogql_insight(
        "Legacy shortlink traffic — utm_medium=funnel-redirect",
        "Which Travis-era shortlinks are driving traffic to the new funnel. "
        "Populated as inbound YouTube / email / bookmark traffic cycles through "
        "the UTM-tagged 301 redirects. Zero now; non-zero as traffic rotates in.",
        """
SELECT
  properties.utm_source AS shortlink,
  countDistinct(person_id) AS unique_visitors,
  count() AS pageviews,
  min(timestamp) AS first_seen,
  max(timestamp) AS latest_seen
FROM events
WHERE event = '$pageview'
  AND properties.utm_medium = 'funnel-redirect'
  AND timestamp > now() - interval 7 day
GROUP BY shortlink
ORDER BY pageviews DESC
        """.strip(),
        dashboards=[DASH_ID],
    ),
)

print()
print(f"Dashboard URL: {HOST}/project/{PROJECT_ID}/dashboard/{DASH_ID}")
