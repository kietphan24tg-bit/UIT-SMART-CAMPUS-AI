from unittest.mock import MagicMock

from src.vectorstores.pgvector import PgVectorStore


def test_keyword_search_binds_query_before_source_file_array(monkeypatch):
    store = PgVectorStore(
        database_url="postgresql://example",
        schema="rag",
        dimensions=768,
    )
    cursor = MagicMock()
    cursor.__enter__.return_value = cursor
    cursor.fetchall.return_value = []
    connection = MagicMock()
    connection.__enter__.return_value = connection
    connection.cursor.return_value = cursor
    monkeypatch.setattr(store, "_connect", MagicMock(return_value=connection))

    source_files = ["training.pdf", "exam.pdf"]
    store.keyword_search(
        "điều kiện dự thi",
        filters={"source_files": source_files},
        limit=12,
    )

    parameters = cursor.execute.call_args.args[1]
    assert parameters == [
        "điều kiện dự thi",  # ts_rank_cd
        "điều kiện dự thi",  # WHERE search_vector @@ query
        source_files,
        12,
    ]


def test_validate_embedding_space_rejects_mixed_models(monkeypatch):
    store = PgVectorStore(
        database_url="postgresql://example",
        schema="rag_training_exam_bge",
        dimensions=1024,
        embedding_provider="local",
        embedding_model="BAAI/bge-m3",
    )
    cursor = MagicMock()
    cursor.__enter__.return_value = cursor
    cursor.fetchall.return_value = [
        ("local:BAAI/bge-m3:v1",),
        ("gemini:gemini-embedding-001:v1",),
    ]
    connection = MagicMock()
    connection.__enter__.return_value = connection
    connection.cursor.return_value = cursor
    monkeypatch.setattr(store, "_connect", MagicMock(return_value=connection))

    try:
        store.validate_embedding_space()
    except ValueError as exc:
        assert "incompatible embedding spaces" in str(exc)
    else:
        raise AssertionError("Mixed embedding spaces must be rejected")
