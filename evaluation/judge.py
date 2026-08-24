from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any

from google import genai
from pydantic import BaseModel, Field, ValidationError

from .cache import EvaluationCache
from .hashing import stable_hash
from .schemas import EvaluationSample

JUDGE_SYSTEM_PROMPT = """You are an evaluation judge for a Vietnamese university assistant.
Return strict JSON only. Judge whether the answer is grounded in the provided evidence and satisfies the reference.
Do not reward claims that are not supported by evidence."""


class JudgeScore(BaseModel):
    faithfulness: float = Field(ge=0.0, le=1.0)
    answer_relevance: float = Field(ge=0.0, le=1.0)
    completeness: float = Field(ge=0.0, le=1.0)
    citation_correctness: float = Field(ge=0.0, le=1.0)
    must_not_violation: bool = False
    hallucinated_personal_data: bool = False
    hallucinated_action_status: bool = False
    rationale: str = ""


@dataclass(slots=True)
class GeminiJudge:
    api_key: str | None = None
    model: str | None = None
    cache: EvaluationCache | None = None

    def score(self, sample: EvaluationSample, generated_answer: str, evidence: list[dict[str, Any]], *, refresh: bool = False) -> JudgeScore:
        model = self.model or os.environ.get("EVAL_JUDGE_MODEL", "gemini-3.5-flash")
        payload = {
            "sample": sample.model_dump(mode="json"),
            "generated_answer": generated_answer,
            "evidence": evidence,
            "judge_model": model,
            "judge_prompt_hash": stable_hash(JUDGE_SYSTEM_PROMPT),
        }
        cache_key = self.cache.key(payload) if self.cache else None
        if cache_key and not refresh:
            cached = self.cache.get(cache_key)
            if cached:
                return JudgeScore.model_validate(cached)

        client = genai.Client(api_key=self.api_key or os.environ.get("GEMINI_KEY"))
        prompt = json.dumps(payload, ensure_ascii=False)
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config={
                "system_instruction": JUDGE_SYSTEM_PROMPT,
                "temperature": 0,
                "response_mime_type": "application/json",
            },
        )
        try:
            score = JudgeScore.model_validate_json(response.text or "{}")
        except ValidationError as exc:
            raise ValueError(f"Judge returned invalid JSON: {exc}") from exc
        if cache_key:
            self.cache.set(cache_key, score.model_dump(mode="json"))
        return score
