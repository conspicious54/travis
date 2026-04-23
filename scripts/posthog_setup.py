#!/usr/bin/env python3
"""
Creates the Confirmation Page Health dashboard + supporting cohorts and
insights in PostHog. Idempotent: rerunning reuses items with the same name
rather than duplicating.

Usage:
    PH_KEY=phx_... python3 scripts/posthog_setup.py

The PostHog Personal API key is read only from the environment. It is
never written to disk by this script.
"""

import json
import os
import sys
import urllib.parse
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
    """Follow pagination and collect every result."""
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


# ───────────────────── cohorts ────────────────────────────────────

COHORTS_PATH = f"/api/projects/{PROJECT_ID}/cohorts/"


def cohort_did(event, negation=False, days=30, props=None):
    f = {
        "key": event,
        "type": "behavioral",
        "value": "performed_event",
        "event_type": "events",
        "time_value": days,
        "time_interval": "day",
        "negation": negation,
    }
    if props:
        f["event_filters"] = props
    return f


def prop_equals(key, value):
    return {"key": key, "value": value, "operator": "exact", "type": "event"}


def build_cohort(name, description, filters):
    return {
        "name": name,
        "description": description,
        "is_static": False,
        "filters": {
            "properties": {
                "type": "AND",
                "values": filters,
            }
        },
    }


print("— cohorts —")
cohort_booked_setter_no_confirm = upsert(
    COHORTS_PATH,
    build_cohort(
        "Booked setter call — didn't confirm (30d)",
        "Fired booking_completed with booking_type=setter in the last 30 days "
        "but never clicked either setter_confirm_text_clicked or setter_confirm_whatsapp_clicked.",
        [
            cohort_did("booking_completed", props=[prop_equals("booking_type", "setter")]),
            cohort_did("setter_confirm_text_clicked", negation=True),
            cohort_did("setter_confirm_whatsapp_clicked", negation=True),
        ],
    ),
)

cohort_booked_closer_no_confirm = upsert(
    COHORTS_PATH,
    build_cohort(
        "Booked closer call — didn't confirm (30d)",
        "Fired booking_completed with booking_type=closer in the last 30 days "
        "but never clicked closer_confirm_text_clicked or closer_confirm_whatsapp_clicked.",
        [
            cohort_did("booking_completed", props=[prop_equals("booking_type", "closer")]),
            cohort_did("closer_confirm_text_clicked", negation=True),
            cohort_did("closer_confirm_whatsapp_clicked", negation=True),
        ],
    ),
)

cohort_faq_no_confirm = upsert(
    COHORTS_PATH,
    build_cohort(
        "FAQ expanded — didn't confirm (30d)",
        "People who expanded the confirmation-page FAQ but never clicked a confirm button. "
        "High-intent-but-hesitant — good target for follow-up messaging.",
        [
            cohort_did("confirmation_faq_expanded"),
            cohort_did("closer_confirm_text_clicked", negation=True),
            cohort_did("closer_confirm_whatsapp_clicked", negation=True),
            cohort_did("setter_confirm_text_clicked", negation=True),
            cohort_did("setter_confirm_whatsapp_clicked", negation=True),
        ],
    ),
)

# ───────────────────── insights ──────────────────────────────────

INSIGHTS_PATH = f"/api/projects/{PROJECT_ID}/insights/"
DASHBOARDS_PATH = f"/api/projects/{PROJECT_ID}/dashboards/"


def event_node(event, props=None):
    n = {"kind": "EventsNode", "event": event, "name": event, "math": "total"}
    if props:
        n["properties"] = props
    return n


def trends_query(series, date_from="-30d", interval="day", breakdown=None, display="ActionsLineGraph"):
    q = {
        "kind": "TrendsQuery",
        "series": series,
        "dateRange": {"date_from": date_from},
        "interval": interval,
        "trendsFilter": {"display": display},
    }
    if breakdown:
        q["breakdownFilter"] = {"breakdown_type": "event", "breakdown": breakdown}
    return q


def funnels_query(series, date_from="-30d", window_days=7):
    return {
        "kind": "FunnelsQuery",
        "series": series,
        "dateRange": {"date_from": date_from},
        "funnelsFilter": {
            "funnelVizType": "steps",
            "funnelWindowInterval": window_days,
            "funnelWindowIntervalUnit": "day",
            "funnelOrderType": "ordered",
        },
    }


def build_insight(name, description, source_query, dashboards=None):
    body = {
        "name": name,
        "description": description,
        "query": {
            "kind": "InsightVizNode",
            "source": source_query,
        },
    }
    if dashboards:
        body["dashboards"] = dashboards
    return body


# Create dashboard first so we can attach insights directly
print("— dashboard —")
dashboard = upsert(
    DASHBOARDS_PATH,
    {
        "name": "Confirmation Page Health",
        "description": "How the setter + closer confirmation pages are performing. "
        "Watch the confirm-click rate, calendar-add rate, and FAQ engagement. "
        "Slice by booking_type, page_type, region, and coach_first_name.",
        "pinned": True,
    },
)
DASH_ID = dashboard["id"]


print("— insights —")
setter_funnel = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Setter funnel — booking → confirmation → confirm-click",
        "Drop-off on the setter flow from booking through clicking Confirm via Text/WhatsApp.",
        funnels_query(
            [
                event_node("booking_completed", [prop_equals("booking_type", "setter")]),
                event_node("confirmation_page_viewed", [prop_equals("page_type", "setter")]),
                event_node("setter_confirm_text_clicked"),
            ]
        ),
        dashboards=[DASH_ID],
    ),
)

closer_funnel = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Closer funnel — booking → confirmation → confirm-click → calendar",
        "Drop-off on the closer flow from the HubSpot booking through confirm + calendar add.",
        funnels_query(
            [
                event_node("booking_completed", [prop_equals("booking_type", "closer")]),
                event_node("confirmation_page_viewed", [prop_equals("page_type", "closer")]),
                event_node("closer_confirm_text_clicked"),
                event_node("calendar_added"),
            ]
        ),
        dashboards=[DASH_ID],
    ),
)

confirm_trend = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Confirm clicks per day (all channels)",
        "Daily count of confirm-via-text + confirm-via-whatsapp clicks. Watch for drops.",
        trends_query(
            [
                event_node("closer_confirm_text_clicked"),
                event_node("closer_confirm_whatsapp_clicked"),
                event_node("setter_confirm_text_clicked"),
                event_node("setter_confirm_whatsapp_clicked"),
            ]
        ),
        dashboards=[DASH_ID],
    ),
)

calendar_trend = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Calendar adds by provider",
        "Which calendar flavor closers are using. High Google + Apple = healthy. "
        "Spike in 'Other (.ics file)' = something's off with the direct integrations.",
        trends_query([event_node("calendar_added")], breakdown="provider"),
        dashboards=[DASH_ID],
    ),
)

faq_trend = upsert(
    INSIGHTS_PATH,
    build_insight(
        "FAQ expand rate",
        "How often visitors open the Frequently Asked Questions accordion at the bottom of the confirmation page.",
        trends_query([event_node("confirmation_faq_expanded")], breakdown="faq_location"),
        dashboards=[DASH_ID],
    ),
)

confirm_by_coach = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Closer confirms per coach",
        "Per-coach split of closer confirm clicks — tells you which coach's flow converts best.",
        trends_query(
            [
                event_node("closer_confirm_text_clicked"),
                event_node("closer_confirm_whatsapp_clicked"),
            ],
            breakdown="coach_first_name",
            display="ActionsBarValue",
        ),
        dashboards=[DASH_ID],
    ),
)

scroll_depth = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Scroll depth distribution",
        "How far down the confirmation pages people actually scroll. A large gap "
        "between 50% and 75% means the lower sections aren't getting seen.",
        trends_query(
            [event_node("scroll_depth_reached")],
            breakdown="depth_pct",
            display="ActionsBarValue",
        ),
        dashboards=[DASH_ID],
    ),
)

dwell_trend = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Median dwell time on confirmation pages",
        "Median seconds_on_page from the dwell heartbeat, by page. A falling "
        "median means people are bouncing earlier.",
        {
            "kind": "TrendsQuery",
            "series": [
                {
                    "kind": "EventsNode",
                    "event": "dwell_heartbeat",
                    "name": "dwell_heartbeat",
                    "math": "median",
                    "math_property": "seconds_on_page",
                }
            ],
            "dateRange": {"date_from": "-30d"},
            "interval": "day",
            "breakdownFilter": {"breakdown_type": "event", "breakdown": "faq_location"},
            "trendsFilter": {"display": "ActionsLineGraph"},
        },
        dashboards=[DASH_ID],
    ),
)

app_switch = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Confirm click → app switch rate (did they actually send?)",
        "Proxy funnel: confirm click → tab blurs within 15s. If the switch step "
        "drops a lot, people are clicking the button but not actually sending.",
        funnels_query(
            [
                event_node("closer_confirm_text_clicked"),
                event_node("confirm_app_switched"),
            ],
            window_days=1,
        ),
        dashboards=[DASH_ID],
    ),
)

faq_video_trend = upsert(
    INSIGHTS_PATH,
    build_insight(
        "FAQ video intent by objection",
        "Which of the 6 objection videos get the most click-intent. Rank tells "
        "you which hesitations matter most to the people making it to the FAQ.",
        trends_query(
            [event_node("breakout_video_played")],
            breakdown="video_key",
            display="ActionsBarValue",
        ),
        dashboards=[DASH_ID],
    ),
)

faq_engagement_funnel = upsert(
    INSIGHTS_PATH,
    build_insight(
        "FAQ funnel — visible → expand → video click",
        "Drop-off through the FAQ. Visible = section scrolled into view, "
        "Expand = they clicked the accordion, Video = they clicked a video tile.",
        funnels_query(
            [
                event_node("confirmation_faq_visible"),
                event_node("confirmation_faq_expanded"),
                event_node("breakout_video_played"),
            ]
        ),
        dashboards=[DASH_ID],
    ),
)

sprout_completion = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Sproutvideo start vs complete",
        "If Sproutvideo's player actually emits postMessage events, this shows "
        "start-vs-complete for the FAQ videos. Will be empty if the player "
        "isn't firing events — that's a signal to switch embed approach.",
        trends_query(
            [
                event_node("sproutvideo_started"),
                event_node("sproutvideo_completed"),
            ]
        ),
        dashboards=[DASH_ID],
    ),
)

phone_copy = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Phone-number copy events",
        "People copying the displayed regional phone number. Good signal that "
        "they're saving it to contacts manually (desktop) or for a manual text.",
        trends_query(
            [event_node("phone_number_copied")],
            breakdown="region",
        ),
        dashboards=[DASH_ID],
    ),
)

print()
print("Done.")
print(f"Dashboard: {HOST}/project/{PROJECT_ID}/dashboard/{DASH_ID}")
