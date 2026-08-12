import json

from src.documents.loader import iter_manifest_markdown_files, load_markdown_document


def test_manifest_selector_filters_ok_markdown_and_deduplicates(tmp_path):
    first = tmp_path / "first.md"
    duplicate = tmp_path / "duplicate.md"
    skipped = tmp_path / "skipped.md"
    first.write_text("---\nsource_file: a.pdf\nsource_unit: DAA\ncategory: handbook\nextraction_status: ok\n---\nBody", encoding="utf-8")
    duplicate.write_text(first.read_text(encoding="utf-8"), encoding="utf-8")
    skipped.write_text("Skipped", encoding="utf-8")

    records = [
        {"status": "ok", "output_path": str(first), "metadata": {"sha256": "same", "extraction_status": "ok"}},
        {"status": "ok", "output_path": str(duplicate), "metadata": {"sha256": "same", "extraction_status": "ok"}},
        {"status": "skipped", "output_path": str(skipped), "metadata": {"sha256": "other", "extraction_status": "ok"}},
    ]
    (tmp_path / "manifest-current.jsonl").write_text(
        "\n".join(json.dumps(record) for record in records),
        encoding="utf-8",
    )

    assert list(iter_manifest_markdown_files(tmp_path)) == [first]


def test_load_markdown_document_parses_frontmatter(tmp_path):
    path = tmp_path / "doc.md"
    path.write_text(
        "---\nsource_file: doc.pdf\nsource_unit: DAA\ncategory: learning_outcome\nextraction_status: ok\nsha256: abc\n---\n# Title\nText",
        encoding="utf-8",
    )

    document = load_markdown_document(path)

    assert document.metadata.source_file == "doc.pdf"
    assert document.metadata.source_unit == "DAA"
    assert document.body.startswith("# Title")
