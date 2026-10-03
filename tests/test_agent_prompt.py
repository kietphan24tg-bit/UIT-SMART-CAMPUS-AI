from datetime import datetime, timezone

from src.agent.prompt import AGENT_TIMEZONE_NAME, build_agent_system_prompt


def test_agent_prompt_includes_vietnam_time_and_relative_schedule_rules():
    prompt = build_agent_system_prompt(datetime(2026, 10, 3, 2, 30, tzinfo=timezone.utc))

    assert AGENT_TIMEZONE_NAME in prompt
    assert "2026-10-03 09:30:00" in prompt
    assert "Thứ Bảy, 03/10/2026" in prompt
    assert '"Tuần này" means Monday through Sunday' in prompt
    assert "0=Sunday, 1=Monday, ..., 6=Saturday" in prompt
    assert "call `get_current_schedule`" in prompt
    assert "Never ask the user what today's date" in prompt


def test_agent_prompt_treats_naive_time_as_vietnam_local_time():
    prompt = build_agent_system_prompt(datetime(2026, 10, 3, 9, 30))

    assert "2026-10-03 09:30:00" in prompt
    assert "Thứ Bảy, 03/10/2026" in prompt
