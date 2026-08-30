from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from .cache import EvaluationCache
from .dataset import DEFAULT_DATASET_PATH, dataset_fingerprint, load_dataset, validate_dataset
from .schemas import Split
from .report import write_report
from .runner import RETRIEVAL_CONFIGS, run_retrieval

PACKAGE_DIR = Path(__file__).resolve().parent
CORPUS_DIR = PACKAGE_DIR / "corpus" / "training_exam"
RESULTS_DIR = PACKAGE_DIR / "results"
DEFAULT_MANIFEST = CORPUS_DIR / "manifest.json"
DEFAULT_AUTHORITY_MATRIX = CORPUS_DIR / "authority_matrix.json"
DEFAULT_EXPANSION_SPEC = CORPUS_DIR / "expansion_spec.json"


def _samples_or_exit(dataset_path: Path, *, include_drafts: bool, split: str):
    dataset = load_dataset(dataset_path)
    if include_drafts:
        print("WARNING: draft samples are diagnostic only.", file=sys.stderr)
        samples = dataset.samples
    else:
        samples = dataset.approved_samples()
        if not samples:
            raise SystemExit("No samples satisfy the declared approval policy.")
    if split != "all":
        selected_split = Split(split)
        samples = [sample for sample in samples if sample.split is selected_split]
    if not samples:
        raise SystemExit(f"No samples available for split={split!r}.")
    return dataset, samples


def cmd_validate(args: argparse.Namespace) -> int:
    from .corpus import load_corpus_manifest

    dataset = load_dataset(args.dataset)
    manifest = load_corpus_manifest(args.corpus_manifest)
    errors = validate_dataset(
        dataset,
        require_approved=args.require_approved,
        known_sources=set(manifest.benchmark_source_files),
        strict_ground_truth=args.strict_ground_truth or args.require_approved,
    )
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(
        json.dumps(
            {
                "ok": True,
                "domain": "training_exam",
                "version": dataset.version,
                "samples": len(dataset.samples),
                "approved_samples": len(dataset.approved_samples()),
                "human_reviewed_samples": sum(
                    bool(sample.metadata.get("human_reviewed")) for sample in dataset.samples
                ),
                "fingerprint": dataset_fingerprint(dataset),
            },
            ensure_ascii=True,
            indent=2,
        )
    )
    return 0


def cmd_run(args: argparse.Namespace) -> int:
    from .corpus import load_corpus_manifest

    dataset, samples = _samples_or_exit(
        args.dataset, include_drafts=args.include_drafts, split=args.split
    )
    manifest = load_corpus_manifest(args.corpus_manifest)
    if args.sample_id:
        requested_ids = set(args.sample_id)
        samples = [sample for sample in samples if sample.id in requested_ids]
        missing_ids = requested_ids - {sample.id for sample in samples}
        if missing_ids:
            raise SystemExit(f"Unknown or unavailable sample ids: {sorted(missing_ids)}")
    if args.limit is not None:
        samples = samples[: args.limit]

    rows = []
    for config_name in args.config or ["hybrid_reranker"]:
        rows.extend(
            run_retrieval(
                samples,
                config_name=config_name,
                k=args.k,
                filters=manifest.retrieval_filters(),
            )
        )

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    output_dir = RESULTS_DIR / f"training_exam_retrieval_{timestamp}"
    summary = write_report(rows, output_dir, title="Training and Examination Retrieval Evaluation")
    (output_dir / "run_metadata.json").write_text(
        json.dumps(
            {
                "dataset_version": dataset.version,
                "dataset_hash": dataset_fingerprint(dataset),
                "domain": "training_exam",
                "configs": args.config or ["hybrid_reranker"],
                "split": args.split,
                "corpus_id": manifest.corpus_id,
                "corpus_version": manifest.version,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(json.dumps({"output_dir": str(output_dir), "summary": summary}, ensure_ascii=False, indent=2))
    return 0


def cmd_answer_eval(args: argparse.Namespace) -> int:
    from .answer_runner import run_answer_evaluation
    from .corpus import load_corpus_manifest

    dataset, samples = _samples_or_exit(
        args.dataset, include_drafts=args.include_drafts, split=args.split
    )
    if args.sample_id:
        requested_ids = set(args.sample_id)
        samples = [sample for sample in samples if sample.id in requested_ids]
        missing_ids = requested_ids - {sample.id for sample in samples}
        if missing_ids:
            raise SystemExit(f"Unknown or unavailable sample ids: {sorted(missing_ids)}")
    if args.limit is not None:
        samples = samples[: args.limit]

    existing_rows: list[dict[str, Any]] = []
    if args.resume and args.resume.exists():
        resume_path = args.resume if args.resume.is_file() else args.resume / "raw.jsonl"
        if resume_path.exists():
            with resume_path.open(encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        existing_rows.append(json.loads(line))

    manifest = load_corpus_manifest(args.corpus_manifest)
    rows = run_answer_evaluation(
        samples,
        retrieval_config=args.retrieval_config,
        filters=manifest.retrieval_filters(),
        refresh=args.refresh,
        cache=EvaluationCache(PACKAGE_DIR / ".cache" / "judge"),
        existing_rows=existing_rows,
    )

    if args.output_dir:
        output_dir = args.output_dir
    else:
        output_dir = RESULTS_DIR / f"training_exam_answer_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"

    summary = write_report(rows, output_dir, title="Training and Examination Answer Evaluation")
    (output_dir / "run_metadata.json").write_text(
        json.dumps(
            {
                "dataset_version": dataset.version,
                "dataset_hash": dataset_fingerprint(dataset),
                "domain": "training_exam",
                "refresh": args.refresh,
                "split": args.split,
                "retrieval_config": args.retrieval_config,
                "corpus_id": manifest.corpus_id,
                "corpus_version": manifest.version,
                "resumed_from": str(args.resume) if args.resume else None,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    provider_errors = sum(1 for r in rows if float(r.get("provider_error", 0.0)) > 0.0)
    judge_errors = sum(1 for r in rows if float(r.get("judge_error_rate", 0.0)) > 0.0)
    valid_samples = len(rows) - provider_errors - judge_errors

    print(
        json.dumps(
            {
                "output_dir": str(output_dir),
                "total_samples": len(rows),
                "valid_samples": valid_samples,
                "provider_errors": provider_errors,
                "judge_errors": judge_errors,
                "is_complete": (len(rows) == len(samples)) and (provider_errors == 0) and (judge_errors == 0),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 1 if rows and all(
        row.get("provider_error") or row.get("judge_error_rate") for row in rows
    ) else 0


def cmd_report(args: argparse.Namespace) -> int:
    rows = []
    for path in args.input:
        with path.open(encoding="utf-8") as file:
            rows.extend(json.loads(line) for line in file if line.strip())
    write_report(rows, args.output, title="Training and Examination RAG Evaluation")
    print(f"Report written to {args.output}")
    return 0


def cmd_corpus_validate(args: argparse.Namespace) -> int:
    from .corpus import load_corpus_manifest, validate_corpus, write_corpus_quality_report

    manifest = load_corpus_manifest(args.manifest)
    report = validate_corpus(manifest, args.authority_matrix, max_tokens=args.max_tokens)
    json_path, markdown_path = write_corpus_quality_report(report, args.output_dir)
    print(
        json.dumps(
            {
                "quality_report": str(json_path),
                "markdown_report": str(markdown_path),
                **report["summary"],
            },
            ensure_ascii=True,
            indent=2,
        )
    )
    return 1 if report["summary"]["error_count"] else 0


def cmd_expand_dataset(args: argparse.Namespace) -> int:
    from src.core.config import settings
    from .dataset_expansion import build_expanded_dataset

    if not settings.gemini_key:
        raise SystemExit("GEMINI_KEY is required for dataset expansion.")
    rows = build_expanded_dataset(
        args.dataset,
        args.spec,
        CORPUS_DIR / "documents",
        args.output,
        api_key=settings.gemini_key,
        model=args.model or settings.agent_model,
        cache_dir=PACKAGE_DIR / ".cache" / "dataset_expansion",
        refresh=args.refresh,
    )
    print(json.dumps({"output": str(args.output), "samples": len(rows)}, ensure_ascii=False, indent=2))
    return 0


def cmd_analyze(args: argparse.Namespace) -> int:
    from .offline_analysis import run_offline_analysis

    input_path = args.input
    if input_path.is_dir():
        input_path = input_path / "raw.jsonl"
    if not input_path.exists():
        raise SystemExit(f"Input evaluation raw file not found: {input_path}")

    output_dir = args.output_dir or input_path.parent
    res = run_offline_analysis(
        raw_path=input_path,
        output_dir=output_dir,
        baseline_config=args.baseline_config,
        seed=args.seed,
        resamples=args.resamples,
    )
    print(json.dumps(res["summary"], ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Training and examination RAG evaluation")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET_PATH)
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate = subparsers.add_parser("validate")
    validate.add_argument("--require-approved", action="store_true")
    validate.add_argument("--strict-ground-truth", action="store_true")
    validate.add_argument("--corpus-manifest", type=Path, default=DEFAULT_MANIFEST)
    validate.set_defaults(func=cmd_validate)

    run = subparsers.add_parser("run", help="Run retrieval benchmark")
    run.add_argument("--config", action="append", choices=RETRIEVAL_CONFIGS.keys())
    run.add_argument("--k", type=int, default=5)
    run.add_argument("--include-drafts", action="store_true")
    run.add_argument("--split", choices=("dev", "test", "all"), default="dev")
    run.add_argument("--limit", type=int, default=None)
    run.add_argument("--sample-id", action="append", default=[])
    run.add_argument("--corpus-manifest", type=Path, default=DEFAULT_MANIFEST)
    run.set_defaults(func=cmd_run)

    answer = subparsers.add_parser("answer-eval")
    answer.add_argument("--refresh", action="store_true")
    answer.add_argument("--include-drafts", action="store_true")
    answer.add_argument("--split", choices=("dev", "test", "all"), default="dev")
    answer.add_argument("--limit", type=int, default=None)
    answer.add_argument("--sample-id", action="append", default=[])
    answer.add_argument(
        "--retrieval-config",
        choices=RETRIEVAL_CONFIGS.keys(),
        default="vector_baseline",
    )
    answer.add_argument("--corpus-manifest", type=Path, default=DEFAULT_MANIFEST)
    answer.add_argument("--resume", type=Path, default=None, help="Resume evaluation reusing complete valid samples from an existing raw.jsonl file")
    answer.add_argument("--output-dir", type=Path, default=None, help="Custom directory for evaluation results")
    answer.set_defaults(func=cmd_answer_eval)

    report = subparsers.add_parser("report")
    report.add_argument("--input", type=Path, action="append", required=True)
    report.add_argument("--output", type=Path, default=RESULTS_DIR / "training_exam_combined")
    report.set_defaults(func=cmd_report)

    corpus = subparsers.add_parser("corpus-validate")
    corpus.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    corpus.add_argument("--authority-matrix", type=Path, default=DEFAULT_AUTHORITY_MATRIX)
    corpus.add_argument("--output-dir", type=Path, default=CORPUS_DIR / "reports")
    corpus.add_argument("--max-tokens", type=int, default=700)
    corpus.set_defaults(func=cmd_corpus_validate)

    expand = subparsers.add_parser("expand-dataset")
    expand.add_argument("--spec", type=Path, default=DEFAULT_EXPANSION_SPEC)
    expand.add_argument("--output", type=Path, default=CORPUS_DIR / "samples.expanded.jsonl")
    expand.add_argument("--model", default=None)
    expand.add_argument("--refresh", action="store_true")
    expand.set_defaults(func=cmd_expand_dataset)

    analyze = subparsers.add_parser("analyze", help="Run offline error analysis and paired statistics on raw files")
    analyze.add_argument("--input", type=Path, default=RESULTS_DIR / "training_exam_answer_ablation_complete" / "raw.jsonl")
    analyze.add_argument("--output-dir", type=Path, default=None)
    analyze.add_argument("--baseline-config", default="vector_baseline")
    analyze.add_argument("--seed", type=int, default=42)
    analyze.add_argument("--resamples", type=int, default=10000)
    analyze.set_defaults(func=cmd_analyze)
    return parser


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
    args = build_parser().parse_args()
    raise SystemExit(args.func(args))


if __name__ == "__main__":
    main()
