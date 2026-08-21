import { Injectable, Logger } from '@nestjs/common';

export interface RagQueryResponse {
  answer: string;
  citations: RagCitation[];
  answer_type: 'grounded' | 'fallback' | 'out_of_scope';
  confidence: number;
}

export interface RagCitation {
  source_file: string;
  heading_path: string;
  content_preview: string;
}

/**
 * HTTP client that calls the FastAPI RAG service.
 *
 * Design decisions:
 * - Uses native fetch (Node 18+) — no Axios dependency needed.
 * - Hard timeout of 10s so NestJS chatbot never blocks on slow embedding.
 * - Returns null on any error so callers can fall back to the keyword KB.
 * - Does NOT forward student auth tokens to the LLM — safety boundary.
 */
@Injectable()
export class AiRagService {
  private readonly logger = new Logger(AiRagService.name);

  /** Base URL of the FastAPI AI service, e.g. http://localhost:8000 */
  private readonly baseUrl: string;

  /** Shared service token so FastAPI can reject requests not from Nest */
  private readonly serviceToken: string | undefined;

  /** Legacy secret kept for one release during header migration */
  private readonly internalSecret: string | undefined;

  /** Max milliseconds to wait for a RAG response */
  private readonly timeoutMs = 10_000;

  constructor() {
    this.baseUrl = process.env['AI_SERVICE_URL'] ?? 'http://localhost:8000';
    this.serviceToken = process.env['AI_SERVICE_TOKEN'];
    this.internalSecret = process.env['AI_INTERNAL_SECRET'];
  }

  /**
   * Ask the RAG pipeline a knowledge question.
   * Returns null if the service is unavailable or returns an error.
   */
  async query(question: string, topK = 6): Promise<RagQueryResponse | null> {
    const url = `${this.baseUrl}/ai/rag/query`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.serviceToken) {
      headers['X-AI-Service-Token'] = this.serviceToken;
    }
    if (this.internalSecret) {
      headers['X-Internal-Secret'] = this.internalSecret;
    }

    const body = JSON.stringify({ question, top_k: topK });

    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body,
        timeoutMs: this.timeoutMs,
      });

      if (!response.ok) {
        this.logger.warn(`RAG service returned ${response.status} for question: "${question.slice(0, 60)}"`);
        return null;
      }

      const data = (await response.json()) as RagQueryResponse;
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`RAG service unavailable: ${message}`);
      return null;
    }
  }

  /**
   * Returns true when the RAG answer is grounded and usable.
   * Falls back to KB if the answer is OOS or confidence is too low.
   */
  isUsableAnswer(response: RagQueryResponse | null): boolean {
    if (!response) return false;
    if (response.answer_type === 'out_of_scope') return false;
    if (response.answer_type === 'fallback') return false;
    if (response.confidence < 0.3) return false;
    return true;
  }
}

// ── Internal helper ────────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  opts: RequestInit & { timeoutMs: number },
): Promise<Response> {
  const { timeoutMs, ...fetchOpts } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...fetchOpts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
