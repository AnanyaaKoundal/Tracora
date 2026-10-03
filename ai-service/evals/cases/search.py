"""Search and exact-id cases.

Both categories ask "does a real record exist for this?". They differ in mechanism: a
free-text symptom must go through semantic search, where several near neighbours are
always present; an id must go through the deterministic lookup. A system that is only
good at one of them is half a feature.
"""

from tests.fixtures.seed import (
    BUG_DETAIL_CRASH,
    CRASH_TEMPLATE_IDS,
    CSV_30S,
    DASHBOARD_WRONG_DATE,
    EMAIL_500,
    FILTERS_TEMPLATE_IDS,
    MOBILE_SAVE_CRASH,
    NOTIFICATIONS_CRASH,
    NOTIFICATIONS_UNSAVED,
    PROJECT_LIST_DUPLICATE,
    SEARCH_FILTERS_RESET,
    SLOW_TEMPLATE_IDS,
    TITLE_NOT_ALIGNED,
)

CASES = [
    {
        "id": "search_title_navbar",
        "category": "search",
        "message": "the page title doesn't line up with the navigation bar at the top",
        "expect": {
            "expect_tool": "find_similar_bugs",
            "expect_any_ids": [TITLE_NOT_ALIGNED],
            "clarify": False,
        },
        "why": "A distinctive symptom that maps to one hand-written bug. Retrieval must surface it.",
    },
    {
        "id": "search_filters_pagination",
        "category": "search",
        "message": "my selected filters get cleared when I move to the second page of results",
        "expect": {
            "expect_tool": "find_similar_bugs",
            "expect_any_ids": list(FILTERS_TEMPLATE_IDS),
        },
        "why": "A template bug on five pages. Any member is a legitimate answer, so assert one-of.",
    },
    {
        "id": "search_dashboard_wrong_date",
        "category": "search",
        "message": "the dashboard shows a date one day earlier than the one I picked",
        "expect": {
            "expect_tool": "find_similar_bugs",
            "expect_any_ids": [DASHBOARD_WRONG_DATE],
        },
        "why": "Unique symptom, unique bug. The floor of the search category.",
    },
    {
        "id": "search_csv_slow",
        "category": "search",
        "message": "exporting to CSV just spins for over half a minute before anything loads",
        "expect": {
            "expect_tool": "find_similar_bugs",
            "expect_any_ids": list(SLOW_TEMPLATE_IDS),
        },
        "why": "Paraphrase of a template. Tests that a described symptom beats keyword matching.",
    },
    {
        "id": "search_mobile_crash",
        "category": "search",
        "message": "when I hit save on the mobile view the page goes blank and the console shows an error",
        "expect": {
            "expect_tool": "find_similar_bugs",
            "expect_any_ids": list(CRASH_TEMPLATE_IDS),
        },
        "why": "The crash template is the most crowded family. Any member is defensible.",
        "held_out": True,
    },
    {
        "id": "search_email_500",
        "category": "search",
        "message": "submitting email invitations returns a 500 from the server",
        "expect": {
            "expect_tool": "find_similar_bugs",
            "expect_any_ids": [EMAIL_500],
        },
        "why": "A server error, not a UI symptom. Retrieval should not need the word 'bug'.",
    },
    {
        "id": "search_project_list_duplicate",
        "category": "search",
        "message": "if I double click submit on the project list it creates two identical entries",
        "expect": {
            "expect_tool": "find_similar_bugs",
            "expect_any_ids": [PROJECT_LIST_DUPLICATE],
        },
        "why": "Double-submit template, one page named. Tests matching on the trigger, not the word.",
    },
    {
        "id": "search_notifications_unsaved",
        "category": "search",
        "message": "I filled in the notifications form, switched tabs, and my input was gone when I came back",
        "expect": {
            "expect_tool": "find_similar_bugs",
            "expect_any_ids": [NOTIFICATIONS_UNSAVED],
        },
        "why": "Paraphrase with no verbatim title words except the page name.",
        "held_out": True,
    },
    # --- exact id -------------------------------------------------------------
    {
        "id": "id_mobile_save_crash",
        "category": "exact_id",
        "message": "what is B-5918235077 about?",
        "expect": {
            "expect_tool": "get_bug",
            "expect_ids": [MOBILE_SAVE_CRASH],
        },
        "requires": "data",
        "why": "The simplest grounded lookup. If this fails, nothing else is worth reading.",
    },
    {
        "id": "id_csv_slow",
        "category": "exact_id",
        "message": "show me B-7956974562",
        "expect": {
            "expect_tool": "get_bug",
            "expect_ids": [CSV_30S],
        },
        "requires": "data",
        "why": "get_bug must read by id, not run semantic search (an id is not in any vector).",
    },
    {
        "id": "id_search_filters",
        "category": "exact_id",
        "message": "details for B-2472755067 please",
        "expect": {
            "expect_tool": "get_bug",
            "expect_ids": [SEARCH_FILTERS_RESET],
        },
        "requires": "data",
        "why": "Same lookup with the id mid-sentence, not as the whole message.",
    },
    {
        "id": "id_bug_detail_crash",
        "category": "exact_id",
        "message": "what's the status of B-0818918140?",
        "expect": {
            "expect_tool": "get_bug",
            "expect_ids": [BUG_DETAIL_CRASH],
        },
        "requires": "data",
        "why": "Asks for a field the page background would not carry, so a read is mandatory.",
        "held_out": True,
    },
    {
        "id": "id_notifications_crash",
        "category": "exact_id",
        "message": "tell me about B-3464386513",
        "expect": {
            "expect_tool": "get_bug",
            "expect_ids": [NOTIFICATIONS_CRASH],
        },
        "requires": "data",
        "why": "Same as above with a bug whose family is crowded, to confirm the id wins.",
    },
    {
        "id": "id_cross_tenant",
        "category": "exact_id",
        "message": "what is B-1146434553 about?",
        "company": "ABC",
        "expect": {
            "expect_tool": "get_bug",
            "says_not_found": True,
        },
        "requires": "data",
        "why": "That bug belongs to the other tenant. Reading it must not work, and the reply must say so.",
    },
    {
        "id": "id_unknown",
        "category": "exact_id",
        "message": "look up B-0000000000 for me",
        "expect": {
            "expect_tool": "get_bug",
            "says_not_found": True,
        },
        "requires": "data",
        "why": "A missing id is the honest-negative twin of a found one.",
    },
]
