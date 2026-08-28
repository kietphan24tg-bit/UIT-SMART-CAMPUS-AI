from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from .cache import EvaluationCache
from .dataset import DEFAULT_DATASET_PATH, dataset_fingerprint, load_dataset, validate_dataset
from .report import write_report
from .runner import RETRIEVAL_CONFIGS, run_retrieval

PACKAGE_DIR = Path(__file__).resolve().parent
CORPUS_DIR = PACKAGE_DIR / "corpus" / "training_exam"
RESULTS_DIR = PACKAGE_DIR / "results"
DEFAULT_MANIFEST = CORPUS_DIR / "manifest.json"
DEFAULT_AUTHORITY_MATRIX = CORPUS_DIR / "authority_matrix.json"


def _samples_or_exit(dataset_path: Path, *, include_drafts: bool):
    dataset = load_dataset(dataset_path)
    if include_drafts:
        print("WARNING: draft samples are diagnostic only.", file=sys.stderr)
        return dataset, dataset.samples
    approved = dataset.approved_samples()
    if not approved:
        raise SystemExit("No samples have two review approvals.")
    return dataset, approved


def cmd_validate(args: argparse.Namespace) -> int:
    dataset = load_dataset(args.dataset)
    errors = validate_dataset(
        dataset,
        require_two_approvals=args.require_approved,
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

    dataset, samples = _samples_or_exit(args.dataset, include_drafts=args.include_drafts)
    manifest = load_corpus_manifest(args.corpus_manifest)
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

    dataset, samples = _samples_or_exit(args.dataset, include_drafts=args.include_drafts)
    if args.limit is not None:
        samples = samples[: args.limit]
    rows = run_answer_evaluation(
        samples,
        refresh=args.refresh,
        cache=EvaluationCache(PACKAGE_DIR / ".cache" / "judge"),
    )
    output_dir = RESULTS_DIR / f"training_exam_answer_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    write_report(rows, output_dir, title="Training and Examination Answer Evaluation")
    (output_dir / "run_metadata.json").write_text(
        json.dumps(
            {
                "dataset_version": dataset.version,
                "dataset_hash": dataset_fingerprint(dataset),
                "domain": "training_exam",
                "refresh": args.refresh,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Answer evaluation written to {output_dir}")
    return 1 if rows and all(row.get("provider_error") for row in rows) else 0


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


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Training and examination RAG evaluation")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET_PATH)
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate = subparsers.add_parser("validate")
    validate.add_argument("--require-approved", action="store_true")
    validate.add_argument("--strict-ground-truth", action="store_true")
    validate.set_defaults(func=cmd_validate)

    run = subparsers.add_parser("run", help="Run retrieval benchmark")
    run.add_argument("--config", action="append", choices=RETRIEVAL_CONFIGS.keys())
    run.add_argument("--k", type=int, default=5)
    run.add_argument("--include-drafts", action="store_true")
    run.add_argument("--limit", type=int, default=None)
    run.add_argument("--corpus-manifest", type=Path, default=DEFAULT_MANIFEST)
    run.set_defaults(func=cmd_run)

    answer = subparsers.add_parser("answer-eval")
    answer.add_argument("--refresh", action="store_true")
    answer.add_argument("--include-drafts", action="store_true")
    answer.add_argument("--limit", type=int, default=None)
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
    return parser


def main() -> None:
    args = build_parser().parse_args()
    raise SystemExit(args.func(args))


if __name__ == "__main__":
    main()
