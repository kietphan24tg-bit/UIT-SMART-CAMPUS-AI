from src.ingestion.pipeline import IngestionPipeline


def main() -> None:
    result = IngestionPipeline().rebuild()
    print(
        {
            "documents_seen": result.documents_seen,
            "documents_indexed": result.documents_indexed,
            "chunks_indexed": result.chunks_indexed,
            "errors": result.errors,
        }
    )


if __name__ == "__main__":
    main()
