# Smart Campus AI Service
<p align="left">
  <img src="https://img.shields.io/badge/Python-3.11%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Docker-Staging-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/RAG-Architecture-FF6F00?style=for-the-badge&logo=databricks&logoColor=white" alt="RAG">
</p>

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

## Deployment

The staging image is published as `kietphan24/smart-campus-ai:staging`.
