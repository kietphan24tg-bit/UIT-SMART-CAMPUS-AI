from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class Split(str, Enum):
    DEV = "dev"
    TEST = "test"


class ReviewStatus(str, Enum):
    DRAFT = "draft"
    NEEDS_REVIEW = "needs_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class Difficulty(str, Enum):
    DIRECT = "direct"
    PARAPHRASE = "paraphrase"
    EXACT_TERM = "exact_term"
    CONFUSABLE = "confusable"
    MULTI_STEP = "multi_step"
    OUT_OF_SCOPE = "out_of_scope"
    INJECTION = "injection"
    RBAC = "rbac"
    ACTION = "action"


class ExpectedAction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    operation: Literal["read", "create", "update", "delete", "payment", "emergency"]
    should_create_proposal: bool = False
    should_execute_before_confirm: bool = False
    expected_proposal_tool: str | None = None
    expected_status: str | None = None


class ExpectedSource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_file: str
    heading_path: str | None = None
    page_start: int | None = None
    page_end: int | None = None
    relevance: int = Field(default=2, ge=0, le=2)

    @property
    def key(self) -> str:
        heading = self.heading_path or ""
        return f"{self.source_file}::{heading}".lower()


class ExpectedOutcome(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answer_type: Literal["answer", "knowledge", "fallback", "confirmation_required"]
    expected_tool: str | None = None
    acceptable_tools: list[str] = Field(default_factory=list)
    sources: list[ExpectedSource] = Field(default_factory=list)
    reference_answer: str = ""
    must_contain: list[str] = Field(default_factory=list)
    must_not_contain: list[str] = Field(default_factory=list)
    action: ExpectedAction | None = None

    @field_validator("sources", mode="before")
    @classmethod
    def normalize_sources(cls, sources: object) -> object:
        if isinstance(sources, dict):
            return [sources]
        return sources

    @model_validator(mode="after")
    def sync_expected_tool(self) -> "ExpectedOutcome":
        if self.expected_tool and self.expected_tool not in self.acceptable_tools:
            self.acceptable_tools.append(self.expected_tool)
        return self


class ReviewRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reviewer: str
    status: ReviewStatus
    reviewed_at: datetime | None = None
    notes: str | None = None


class EvaluationSample(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=r"^[a-z0-9_]+$")
    split: Split
    category: str
    difficulty: Difficulty
    question: str = Field(min_length=1, max_length=4000)
    history: list[dict[str, str]] = Field(default_factory=list)
    user_fixture: str
    expected: ExpectedOutcome
    reviews: list[ReviewRecord] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("history")
    @classmethod
    def validate_history(cls, history: list[dict[str, str]]) -> list[dict[str, str]]:
        for item in history:
            if item.get("role") not in {"user", "assistant"}:
                raise ValueError("history role must be user or assistant")
            if not isinstance(item.get("content"), str) or not item["content"].strip():
                raise ValueError("history content is required")
        return history

    @property
    def approved(self) -> bool:
        approved_reviewers = {
            review.reviewer
            for review in self.reviews
            if review.status is ReviewStatus.APPROVED
        }
        review_method = str(self.metadata.get("review_method") or "")
        if review_method == "owner_verified":
            owner = str(self.metadata.get("owner_reviewer") or "dataset_owner")
            return bool(self.metadata.get("human_reviewed")) and owner in approved_reviewers
        return bool(self.metadata.get("human_reviewed")) and len(approved_reviewers) >= 2

    @property
    def question_group_id(self) -> str:
        return str(self.metadata.get("question_group_id") or self.id)

    @property
    def subdomain(self) -> str:
        return str(self.metadata.get("subdomain") or self.category)

    @property
    def corpus_gap(self) -> bool:
        return bool(self.metadata.get("corpus_gap"))

    @property
    def answerable(self) -> bool:
        return self.expected.answer_type == "answer" and not self.corpus_gap

    @property
    def expected_documents(self) -> list[str]:
        return [source.source_file for source in self.expected.sources]

    @property
    def primary_expected_documents(self) -> list[str]:
        return [source.source_file for source in self.expected.sources if source.relevance == 2]

    @property
    def expected_source_keys(self) -> dict[str, int]:
        return {source.key: source.relevance for source in self.expected.sources}

    @property
    def primary_expected_source_keys(self) -> list[str]:
        return [source.key for source in self.expected.sources if source.relevance == 2]


class EvaluationDataset(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: str
    samples: list[EvaluationSample]

    @model_validator(mode="after")
    def validate_unique_ids(self) -> "EvaluationDataset":
        ids = [sample.id for sample in self.samples]
        duplicates = sorted({sample_id for sample_id in ids if ids.count(sample_id) > 1})
        if duplicates:
            raise ValueError(f"Duplicate sample ids: {duplicates}")
        return self

    def approved_samples(self) -> list[EvaluationSample]:
        return [sample for sample in self.samples if sample.approved]

    def by_split(self, split: Split) -> list[EvaluationSample]:
        return [sample for sample in self.samples if sample.split is split]
