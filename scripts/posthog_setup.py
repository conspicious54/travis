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


def trends_query(series, date_from="-30d", interval="day", breakdown=None, display="ActionsLineGraph", breakdown_type="event"):
    q = {
        "kind": "TrendsQuery",
        "series": series,
        "dateRange": {"date_from": date_from},
        "interval": interval,
        "trendsFilter": {"display": display},
    }
    if breakdown:
        q["breakdownFilter"] = {"breakdown_type": breakdown_type, "breakdown": breakdown}
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

# ─── insights that depend on the HubSpot → PostHog loop ─────────
# These stay empty until the hubspot-to-posthog Netlify scheduled
# function starts firing events (setter_call_showed, closer_call_showed,
# closer_enrolled, sale_closed, etc.).

setter_showup_funnel = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Setter funnel with show-up (confirm → showed)",
        "Did the confirm-click people actually show up to the setter call? "
        "Compares SMS/WhatsApp confirm clicks against the HubSpot "
        "'S2C Call Completed' stage transition.",
        funnels_query(
            [
                event_node("setter_confirm_text_clicked"),
                event_node("setter_call_showed"),
            ],
            window_days=14,
        ),
        dashboards=[DASH_ID],
    ),
)

closer_showup_funnel = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Closer funnel with show-up (confirm → showed → enrolled → won)",
        "Full closer flow: confirm click → show up → enrolled → sale. Each "
        "drop-off is a lever. Biggest gap is usually confirm→show.",
        funnels_query(
            [
                event_node("closer_confirm_text_clicked"),
                event_node("closer_call_showed"),
                event_node("closer_enrolled"),
                event_node("sale_closed"),
            ],
            window_days=60,
        ),
        dashboards=[DASH_ID],
    ),
)

faq_to_close_funnel = upsert(
    INSIGHTS_PATH,
    build_insight(
        "FAQ expanders who close",
        "Of people who expanded the FAQ on the confirmation page, what % "
        "eventually close? Tells you whether the FAQ converts skeptics or "
        "just entertains them.",
        funnels_query(
            [
                event_node("confirmation_faq_expanded"),
                event_node("sale_closed"),
            ],
            window_days=60,
        ),
        dashboards=[DASH_ID],
    ),
)

revenue_by_coach = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Revenue by coach (sale_closed sum by coach_first_name)",
        "Sum of deal amount on sale_closed, broken down by the "
        "coach_first_name Person property set at confirm time. Only includes "
        "people who clicked a confirm button so we know which coach won them.",
        {
            "kind": "TrendsQuery",
            "series": [
                {
                    "kind": "EventsNode",
                    "event": "sale_closed",
                    "name": "sale_closed",
                    "math": "sum",
                    "math_property": "amount",
                }
            ],
            "dateRange": {"date_from": "-90d"},
            "interval": "week",
            "breakdownFilter": {
                "breakdown_type": "person",
                "breakdown": "coach_first_name",
            },
            "trendsFilter": {"display": "ActionsBarValue"},
        },
        dashboards=[DASH_ID],
    ),
)

showup_by_confirm = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Show-up rate split by confirmed_via",
        "Do people who confirmed via WhatsApp show up more than people who "
        "confirmed via SMS, or vice versa? Person property confirmed_via is "
        "set on the confirm click.",
        trends_query(
            [event_node("closer_call_showed")],
            breakdown="confirmed_via",
            breakdown_type="person",
        ),
        dashboards=[DASH_ID],
    ),
)

# ─── platform breakdown (mobile vs desktop completion) ─────────

confirm_by_platform = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Confirm clicks by platform (iOS / Android / desktop)",
        "Is confirmation completion different on mobile vs. desktop? If desktop "
        "dominates, people on phones are getting stuck somewhere — likely the "
        "tap-to-message handoff.",
        trends_query(
            [
                event_node("closer_confirm_text_clicked"),
                event_node("closer_confirm_whatsapp_clicked"),
                event_node("setter_confirm_text_clicked"),
                event_node("setter_confirm_whatsapp_clicked"),
            ],
            breakdown="platform",
            display="ActionsBarValue",
        ),
        dashboards=[DASH_ID],
    ),
)

confirmation_view_by_platform = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Confirmation-page views by device",
        "Split confirmation_page_viewed by $device_type (PostHog auto-captures "
        "this). Denominator for the platform-level confirm rate.",
        trends_query(
            [event_node("confirmation_page_viewed")],
            breakdown="$device_type",
        ),
        dashboards=[DASH_ID],
    ),
)

# ─── exit popup effectiveness ──────────────────────────────────

exit_popup_funnel = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Exit popup → confirm click",
        "Of people who saw the exit popup, how many tapped confirm from "
        "inside the popup? Measures whether the inline SMS/WhatsApp buttons "
        "actually rescue the drop-off.",
        funnels_query(
            [
                event_node("exit_popup_shown"),
                event_node("exit_popup_confirm_clicked"),
            ],
            window_days=1,
        ),
        dashboards=[DASH_ID],
    ),
)

exit_popup_source = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Exit popup triggers by source",
        "mouseleave = desktop, visibilitychange = tab hide, "
        "scroll_back_to_top = mobile 'seen enough, leaving'. Tells you which "
        "trigger is actually firing on mobile vs desktop.",
        trends_query(
            [event_node("exit_popup_shown")],
            breakdown="source",
        ),
        dashboards=[DASH_ID],
    ),
)

# ─── confirm → show-up split by platform ───────────────────────

timezone_sync_health = upsert(
    INSIGHTS_PATH,
    build_insight(
        "HubSpot timezone sync — success vs failure",
        "Tracks contact_timezone_synced vs contact_timezone_sync_failed. "
        "If failed > 0 and the reason is hubspot_error or token_not_set, "
        "the Private App needs the crm.objects.contacts.write scope.",
        trends_query(
            [
                event_node("contact_timezone_synced"),
                event_node("contact_timezone_sync_failed"),
            ],
            breakdown="source",
        ),
        dashboards=[DASH_ID],
    ),
)

sticky_bar_clicks = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Mobile sticky bar — confirms rescued",
        "Counts mobile_sticky_bar_clicked by channel + faq_location. "
        "If this number is >0, the sticky bar is rescuing confirms that "
        "the inline banner buttons missed.",
        trends_query(
            [event_node("mobile_sticky_bar_clicked")],
            breakdown="channel",
        ),
        dashboards=[DASH_ID],
    ),
)

showup_by_platform = upsert(
    INSIGHTS_PATH,
    build_insight(
        "Show-up rate split by last_platform",
        "Person property last_platform is set on the confirm click. This "
        "shows whether mobile confirmers show up at a different rate than "
        "desktop confirmers — answers the 'is the drop-off on mobile?' "
        "question once HubSpot data flows in.",
        trends_query(
            [event_node("closer_call_showed")],
            breakdown="last_platform",
            breakdown_type="person",
        ),
        dashboards=[DASH_ID],
    ),
)

print()
print("Done.")
print(f"Dashboard: {HOST}/project/{PROJECT_ID}/dashboard/{DASH_ID}")
