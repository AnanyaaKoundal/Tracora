"""The eval case set itself.

A typo in a case (duplicate id, unknown category, an expectation key the grader ignores)
would quietly score nothing. These assert the set stays well-formed and broad enough to
mean something.
"""

import pytest

from evals import suite


@pytest.mark.unit
def test_case_set_is_valid():
    assert suite.validate() == []


@pytest.mark.unit
def test_case_set_covers_every_category():
    cats = {c["category"] for c in suite.CASES}
    assert suite.CATEGORIES <= cats


@pytest.mark.unit
def test_case_set_is_broad_enough():
    assert len(suite.CASES) >= 35


@pytest.mark.unit
def test_held_out_split_is_present():
    held = [c for c in suite.CASES if c.get("held_out")]
    assert held, "expected a held-out slice so the headline is not fitted"
    assert 0.15 <= len(held) / len(suite.CASES) <= 0.5


@pytest.mark.unit
def test_company_selector_defaults_to_abc():
    assert suite.company_for({}) == suite.COMPANIES["ABC"]
    assert suite.company_for({"company": "DEMO"}) == suite.COMPANIES["DEMO"]
