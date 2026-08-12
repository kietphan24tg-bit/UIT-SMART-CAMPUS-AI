# Smart Campus AI Service

## Structure

```text
src/
  api/routes/       HTTP routes
  core/             config, logging, shared infrastructure
  documents/        normalized Markdown loading and metadata parsing
  ingestion/        document indexing pipeline
  chunking/         structure-first chunking
  embeddings/       embedding providers
  vectorstores/     vector database adapters
  retrieval/        search, filters, citations
  rag/              RAG orchestration and prompts
  agents/           reserved for future agent orchestration
```

Initial endpoints:

- `GET /health`
- `POST /rag/query`
- `POST /ingest/rebuild`
