"""Real seed data that tests and eval cases assert against.

These ids come from the development tenants. Anything that runs against a live stack
must use ids that actually exist, so keeping them in one place stops the eval set
drifting back to invented fixtures (the old SEED_COMPANY was a non-existent tenant).

The corpus is deliberately repetitive: the seed was generated from a handful of bug
templates ("crashes after clicking Save", "filters reset after pagination", ...) across
many page names. That repetition is useful. It means semantic search always has several
near neighbours, so "is this the same bug?" is a real judgement rather than a lookup,
which is exactly the behaviour the honesty axis is meant to probe.
"""

# Tenants seeded for development.
ABC_COMPANY = "CMP-GI9050AUR8"  # 69 bugs
DEMO_COMPANY = "CMP-3X18WIFQKO"  # 30 bugs

# Projects.
ABC_TEST2 = "PRJ-QIIY8H9KDZ"
ABC_NEW_WEBSITE = "PRJ-GE5SE6XP27"
ABC_TEST = "PRJ-CJCPYSIX28"
ABC_DEMO = "PRJ-9B8E1AR7M7"
DEMO_WEBSITE_REDESIGN = "PRJ-AJS3T6FOTM"
DEMO_MOBILE_APP = "PRJ-Q7EK63JA23"
DEMO_API_INTEGRATION = "PRJ-KFTZBDJSKG"

PROJECT_NAMES = {
    ABC_TEST2: "Test2",
    ABC_NEW_WEBSITE: "New Website",
    ABC_TEST: "Test",
    ABC_DEMO: "Demo",
    DEMO_WEBSITE_REDESIGN: "Website Redesign",
    DEMO_MOBILE_APP: "Mobile App",
    DEMO_API_INTEGRATION: "API Integration",
}

# --- ABC bugs used as ground truth by eval cases --------------------------------
# Unique, hand-written bugs (best anchors for a strong-match case).
TITLE_NOT_ALIGNED = "B-5389442298"  # "The title is not aligned to the navbar" (Test2)
PROJECT_NUMBER_WRONG = "B-2532968490"  # "Project number is showing incorrect" (New Website)
NOTIFICATION_TESTING = "B-9739634217"  # "Notification testing" (Demo project)

# Template families. Each exists on several pages, so a paraphrase may legitimately
# resolve to any member: eval cases assert "one of these", not the exact one.
SEARCH_FILTERS_RESET = "B-2472755067"  # Search (Test2)
MOBILE_SAVE_CRASH = "B-5918235077"  # Mobile View (Test2)
MOBILE_LAYOUT = "B-8580110575"  # Mobile View (Test)
NOTIFICATIONS_CRASH = "B-3464386513"  # Notifications (Demo)
NOTIFICATIONS_UNSAVED = "B-4139092720"  # Notifications (Test2)
NOTIFICATIONS_STALE = "B-3322441518"  # Notifications (Test2)
TIME_TRACKING_CRASH = "B-6109642459"  # Time Tracking (Test)
BUG_DETAIL_CRASH = "B-0818918140"  # Bug Detail (Test2)
BUG_DETAIL_EMPTY = "B-9672943251"  # Bug Detail (Demo)
AUDIT_LOG_CRASH = "B-4057011463"  # Audit Log (Test2)
SETTINGS_CRASH = "B-3696616927"  # Settings (New Website)
CSV_30S = "B-7956974562"  # CSV Export (New Website)
CSV_NOTIFY = "B-8536316171"  # CSV Export (New Website)
CSV_FILTERS_RESET = "B-7073734358"  # CSV Export (Test)
KANBAN_30S = "B-6786697658"  # Kanban Board (Demo)
PROJECT_LIST_STALE = "B-0271084198"  # Project List (Test)
PROJECT_LIST_DUPLICATE = "B-9224599857"  # Project List (New Website)
DASHBOARD_WRONG_DATE = "B-0688034478"  # Dashboard (Test)
EMAIL_500 = "B-4281429449"  # Email Invitations (Test)
LOGIN_STALE = "B-0097757430"  # Login (Test)

# --- Demo bugs (cross-tenant checks) --------------------------------------------
DEMO_DASHBOARD_CRASH = "B-1146434553"
DEMO_MOBILE_UNSAVED = "B-0671375796"
DEMO_SETTINGS_FILTERS = "B-5694128953"
DEMO_ROLE_CRASH = "B-6060627456"

# Pages that share the "crashes after clicking Save" template in ABC.
CRASH_TEMPLATE_IDS = (
    MOBILE_SAVE_CRASH,
    NOTIFICATIONS_CRASH,
    TIME_TRACKING_CRASH,
    BUG_DETAIL_CRASH,
    AUDIT_LOG_CRASH,
    SETTINGS_CRASH,
)

# Pages that share the "filters reset after pagination" template in ABC.
FILTERS_TEMPLATE_IDS = (
    SEARCH_FILTERS_RESET,
    CSV_FILTERS_RESET,
    "B-9604474971",  # Mobile View
    "B-1559348664",  # Audit Log
    "B-0940473562",  # Bug Detail
)

# Pages that share the "takes more than 30 seconds to load" template in ABC.
SLOW_TEMPLATE_IDS = (
    CSV_30S,
    KANBAN_30S,
    "B-6318309746",  # Email Invitations
    "B-3613130963",  # Login
    "B-2818039925",  # Bug Detail
)
