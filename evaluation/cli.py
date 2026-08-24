from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from .cache import EvaluationCache
from .dataset import DEFAULT_DATASET_PATH, dataset_fingerprint, load_dataset, validate_dataset
from .report import write_report
from .runner import RETRIEVAL_CONFIGS, run_agent, run_retrieval

PACKAGE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = PACKAGE_DIR / "results"
BASELINE_PATH = PACKAGE_DIR / "baselines" / "approved.json"


def _samples_or_exit(dataset_path: Path, *, include_drafts: bool):
    dataset = load_dataset(dataset_path)
    if include_drafts:
        print(
            "WARNING: running on draft/unapproved samples. Use these numbers only as preliminary diagnostics.",
            file=sys.stderr,
        )
        return dataset, dataset.samples
    approved = dataset.approved_samples()
    if not approved:
        raise SystemExit(
            "No approved samples found. Add two approved review records per sample before running live benchmarks."
        )
    return dataset, approved


def cmd_validate(args: argparse.Namespace) -> int:
    dataset = load_dataset(args.dataset)
    errors = validate_dataset(dataset, require_two_approvals=args.require_approved)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(
        json.dumps(
            {
                "ok": True,
                "version": dataset.version,
                "samples": len(dataset.samples),
                "approved_samples": len(dataset.approved_samples()),
                "fingerprint": dataset_fingerprint(dataset),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


def cmd_run(args: argparse.Namespace) -> int:
    dataset, samples = _samples_or_exit(args.dataset, include_drafts=args.include_drafts)
    if args.suite == "retrieval":
        samples = [
            sample
            for sample in samples
            if sample.expected.expected_tool == "search_university_policies"
            or sample.expected.answer_type == "fallback"
        ]
    if args.limit is not None:
        samples = samples[: args.limit]
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    all_rows = []
    if args.suite == "retrieval":
        configs = args.config or ["hybrid_reranker"]
        for config_name in configs:
            all_rows.extend(run_retrieval(samples, config_name=config_name, k=args.k))
    elif args.suite == "agent":
        all_rows.extend(run_agent(samples, config_name=(args.config or ["agent_full"])[0]))
    else:
        raise SystemExit(f"Unknown suite: {args.suite}")

    output_dir = RESULTS_DIR / f"{args.suite}_{timestamp}"
    summary = write_report(all_rows, output_dir, title=f"Smart Campus {args.suite} evaluation")
    (output_dir / "run_metadata.json").write_text(
        json.dumps(
            {
                "dataset_version": dataset.version,
                "dataset_hash": dataset_fingerprint(dataset),
                "suite": args.suite,
                "configs": args.config,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(json.dumps({"output_dir": str(output_dir), "summary": summary}, ensure_ascii=True, indent=2))
    return 0


def cmd_judge(args: argparse.Namespace) -> int:
    from .judge import GeminiJudge

    dataset, samples = _samples_or_exit(args.dataset, include_drafts=args.include_drafts)
    cache = EvaluationCache(PACKAGE_DIR / ".cache" / "judge")
    judge = GeminiJudge(cache=cache)
    rows = []
    for sample in samples:
        rows.append(
            {
                "sample_id": sample.id,
                "score": judge.score(sample, generated_answer="", evidence=[], refresh=args.refresh).model_dump(mode="json"),
            }
        )
    output_dir = RESULTS_DIR / f"judge_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "judge.jsonl").write_text(
        "".join(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n" for row in rows),
        encoding="utf-8",
    )
    print(f"Judge results written to {output_dir}")
    return 0


def cmd_report(args: argparse.Namespace) -> int:
    rows = []
    for path in args.input:
        with Path(path).open(encoding="utf-8") as file:
            for line in file:
                if line.strip():
                    rows.append(json.loads(line))
    write_report(rows, args.output, title="Smart Campus evaluation report")
    print(f"Report written to {args.output}")
    return 0


def cmd_check_baseline(args: argparse.Namespace) -> int:
    dataset = load_dataset(args.dataset)
    expected = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    actual = dataset_fingerprint(dataset)
    if actual != expected.get("dataset_hash"):
        print("ERROR: approved baseline is stale for current dataset.", file=sys.stderr)
        print(f"expected={expected.get('dataset_hash')}", file=sys.stderr)
        print(f"actual={actual}", file=sys.stderr)
        return 1
    print("Baseline hash is current.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Smart Campus evaluation CLI")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET_PATH)
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate = subparsers.add_parser("validate")
    validate.add_argument("--require-approved", action="store_true")
    validate.set_defaults(func=cmd_validate)

    run = subparsers.add_parser("run")
    run.add_argument("--suite", choices=["retrieval", "agent"], required=True)
    run.add_argument("--config", action="append", choices=[*RETRIEVAL_CONFIGS.keys(), "agent_full"])
    run.add_argument("--k", type=int, default=5)
    run.add_argument("--refresh", action="store_true")
    run.add_argument("--include-drafts", action="store_true")
    run.add_argument("--limit", type=int, default=None, help="Run only the first N samples for smoke/preliminary checks")
    run.set_defaults(func=cmd_run)

    judge = subparsers.add_parser("judge")
    judge.add_argument("--refresh", action="store_true")
    judge.add_argument("--include-drafts", action="store_true")
    judge.set_defaults(func=cmd_judge)

    report = subparsers.add_parser("report")
    report.add_argument("--input", type=Path, action="append", required=True)
    report.add_argument("--output", type=Path, default=RESULTS_DIR / "combined")
    report.set_defaults(func=cmd_report)

    baseline = subparsers.add_parser("check-baseline")
    baseline.set_defaults(func=cmd_check_baseline)
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    raise SystemExit(args.func(args))


if __name__ == "__main__":
    main()
