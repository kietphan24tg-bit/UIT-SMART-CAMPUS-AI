from __future__ import annotations

import unicodedata

from .base import AgentTool


_DOMAIN_KEYWORDS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("attendance", ("diem danh", "chuyen can", "attendance", "check-in", "vang hoc", " ma qr", "qr ")),
    ("canteen", ("can tin", "canteen", "suat an", "do an", "do uong", "mon an", "an gi", "don hang can tin")),
    ("library", ("thu vien", "sach", "muon sach", "tra sach", "gia han sach", "loan")),
    ("room", ("phong hoc", "phong giang", "dat phong", "toa nha", "room booking", "room schedule")),
    ("notifications", ("thong bao", "su kien", "notification", "event")),
    ("safety", ("bai xe", "do xe", "phuong tien", "parking", "sos", "khan cap", "hoa hoan", "bao chay", "telemetry")),
    ("users", ("ho so", "tai khoan", "nguoi dung", "vai tro", "profile", "user")),
    ("materials", ("hoc lieu", "tai lieu hoc", "study material")),
    ("policy", ("quy che", "quy dinh", "thu tuc", "cam nang", "hoc bong", "chinh sach")),
    (
        "academic",
        (
            "lich hoc",
            "lich giang",
            "thoi khoa bieu",
            "hom nay hoc",
            "tiet hoc",
            "schedule",
            "diem",
            "bang diem",
            "ket qua hoc tap",
            "hoc phan",
            "mon hoc",
            "dang ky",
            "rut mon",
            "lop hoc",
            "hoc ky",
            "semester",
        ),
    ),
)


def _ascii_text(value: str) -> str:
    value = value.replace("\u0111", "d").replace("\u0110", "D")
    return " ".join(
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").lower().split()
    )


def _tool_domain(name: str) -> str:
    if "attendance" in name or name in {"checkin_attendance", "get_class_section_students"}:
        return "attendance"
    if "canteen" in name:
        return "canteen"
    if any(part in name for part in ("library", "loan", "reservation")):
        return "library"
    if any(part in name for part in ("room", "building", "class_meeting")):
        return "room"
    if "notification" in name or "event" in name:
        return "notifications"
    if any(part in name for part in ("parking", "vehicle", "telemetry", "fire_alert", "sos")):
        return "safety"
    if "study_material" in name:
        return "materials"
    if name == "search_university_policies":
        return "policy"
    if any(part in name for part in ("profile", "user")):
        return "users"
    return "academic"


def _query_domains(message: str) -> tuple[str, ...]:
    normalized = f" {_ascii_text(message)} "
    matched = [domain for domain, keywords in _DOMAIN_KEYWORDS if any(keyword in normalized for keyword in keywords)]
    # A provider/payment request without a named service is genuinely
    # ambiguous. Expose both payment domains so the model can ask for clarity.
    if not matched and any(keyword in normalized for keyword in ("thanh toan", "momo", "sepay")):
        matched.extend(("canteen", "safety"))
    return tuple(dict.fromkeys(matched[:2]))


def _matches_academic_intent(tool_name: str, normalized_message: str) -> bool:
    if any(keyword in normalized_message for keyword in ("diem", "bang diem", "ket qua hoc tap")):
        return "grade" in tool_name
    if any(
        keyword in normalized_message
        for keyword in ("lich hoc", "lich giang", "thoi khoa bieu", "hom nay hoc", "tiet hoc", "schedule")
    ):
        return "schedule" in tool_name
    if any(keyword in normalized_message for keyword in ("dang ky", "rut mon", "hoc phan", "lop hoc")):
        return tool_name in {
            "get_available_class_sections",
            "get_my_registrations",
            "register_class_section",
            "drop_registration",
            "list_class_sections",
        }
    return True


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, AgentTool] = {}

    def register(self, tool: AgentTool) -> None:
        if tool.name in self._tools:
            raise ValueError(f"Tool '{tool.name}' is already registered.")
        self._tools[tool.name] = tool

    def get(self, name: str) -> AgentTool:
        try:
            return self._tools[name]
        except KeyError as exc:
            raise KeyError(f"Unknown tool '{name}'.") from exc

    def for_role(self, role: str) -> list[AgentTool]:
        return [tool for tool in self._tools.values() if role in tool.allowed_roles]

    def definitions_for_role(self, role: str) -> list[dict]:
        return [tool.to_llm_definition() for tool in self.for_role(role) if tool.should_expose_to_llm()]

    def definitions_for_query(self, role: str, message: str) -> list[dict]:
        """Return a bounded domain shortlist without hiding tools globally.

        Sending every typed schema on every turn exhausts provider token quotas
        and exceeds some OpenAI-compatible payload limits. All tools remain in
        the registry; each is exposed when its business domain is relevant.
        The policy search tool stays available as the safe default.
        """
        domains = set(_query_domains(message))
        domains.add("policy")
        normalized_message = f" {_ascii_text(message)} "
        return [
            tool.to_llm_definition()
            for tool in self.for_role(role)
            if tool.should_expose_to_llm()
            and _tool_domain(tool.name) in domains
            and (
                _tool_domain(tool.name) != "academic"
                or _matches_academic_intent(tool.name, normalized_message)
            )
        ]

    def all(self) -> list[AgentTool]:
        return list(self._tools.values())
