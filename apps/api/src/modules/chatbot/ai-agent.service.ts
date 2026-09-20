import { randomUUID, timingSafeEqual } from 'node:crypto';

import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  GatewayTimeoutException,
  GoneException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Role } from '@prisma/client';
import axios, { AxiosError, type AxiosInstance } from 'axios';

import type { AgentProposal, AgentTraceStep, ChatbotCitation } from './chatbot.types';

interface FastAgentCitation {
  index?: number;
  source_file?: string | null;
  source_unit?: string | null;
  category?: string | null;
  heading_path?: string | null;
  parent_heading_path?: string | null;
  page_start?: number | null;
  page_end?: number | null;
  distance?: number | null;
  score?: number | null;
}

interface FastAgentTraceStep {
  type: string;
  label: string;
  status: string;
  tool?: string | null;
}

interface FastAgentProposal {
  id: string;
  tool: string;
  operation: string;
  risk_level: string;
  summary: string;
  status: string;
  expires_at: string;
  confirm_path: string;
  reject_path: string;
}

interface FastAgentQueryResponse {
  answer_type: 'answer' | 'clarification' | 'confirmation_required' | 'fallback';
  answer: string;
  proposal?: FastAgentProposal | null;
  citations?: FastAgentCitation[];
  trace?: FastAgentTraceStep[];
  fallback_reason?: string | null;
  confidence?: number | null;
}

interface FastProposalStatusResponse {
  id: string;
  tool: string;
  operation: string;
  risk_level: string;
  summary: string;
  status: string;
  expires_at: string;
  confirmed_at?: string | null;
  executed_at?: string | null;
  result?: Record<string, unknown> | null;
  error?: Record<string, unknown> | null;
}

interface FastProposalConfirmResponse {
  answer: string;
  status: string;
  result?: Record<string, unknown> | null;
}

export interface AgentQueryPayload {
  message: string;
  sessionId: string;
  history: AgentQueryHistoryMessage[];
}

export interface AgentQueryHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentQueryMappedResponse {
  answerType: 'answer' | 'clarification' | 'confirmation_required' | 'fallback';
  answer: string;
  citations: ChatbotCitation[];
  trace: AgentTraceStep[];
  proposal: AgentProposal | null;
  fallbackReason?: string | null;
  confidence?: number | null;
}

export interface AgentProposalStatus {
  id: string;
  tool: string;
  operation: string;
  riskLevel: string;
  summary: string;
  status: string;
  expiresAt: string;
  confirmedAt?: string | null;
  executedAt?: string | null;
  result?: Record<string, unknown> | null;
  error?: Record<string, unknown> | null;
}

export interface AgentProposalConfirmResult {
  answer: string;
  status: string;
  result?: Record<string, unknown> | null;
}

@Injectable()
export class AiAgentService {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly serviceToken: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.normalizeBaseUrl(configService.get<string>('AI_SERVICE_URL', ''));
    this.serviceToken = configService.get<string>('AI_SERVICE_TOKEN', '').trim();
    this.enabled = configService.get<boolean>('AI_AGENT_ENABLED', false);
    this.client = axios.create({
      baseURL: this.baseUrl || undefined,
      timeout: configService.get<number>('AI_AGENT_TIMEOUT_MS', 30_000),
    });
  }

  isEnabled() {
    return this.enabled;
  }

  async query(
    authHeader: string,
    role: Role,
    payload: AgentQueryPayload,
    requestId?: string,
  ): Promise<AgentQueryMappedResponse> {
    void role;
    const response = await this.request<FastAgentQueryResponse>({
      method: 'POST',
      path: '/agent/query',
      authHeader,
      requestId,
      data: {
        message: payload.message,
        session_id: payload.sessionId,
        history: payload.history,
      },
    });

    return {
      answerType: response.answer_type,
      answer: response.answer,
      citations: (response.citations ?? []).map((item) => this.mapCitation(item)),
      trace: (response.trace ?? []).map((item) => ({
        type: item.type as AgentTraceStep['type'],
        label: item.label,
        status: item.status as AgentTraceStep['status'],
        tool: item.tool ?? null,
      })),
      proposal: response.proposal ? this.mapProposal(response.proposal) : null,
      fallbackReason: response.fallback_reason ?? null,
      confidence: response.confidence ?? null,
    };
  }

  async getProposal(authHeader: string, proposalId: string, requestId?: string): Promise<AgentProposalStatus> {
    const response = await this.request<FastProposalStatusResponse>({
      method: 'GET',
      path: `/agent/proposals/${proposalId}`,
      authHeader,
      requestId,
    });
    return this.mapProposalStatus(response);
  }

  async confirmProposal(
    authHeader: string,
    proposalId: string,
    requestId?: string,
  ): Promise<AgentProposalConfirmResult> {
    const response = await this.request<FastProposalConfirmResponse>({
      method: 'POST',
      path: `/agent/proposals/${proposalId}/confirm`,
      authHeader,
      requestId,
    });
    return {
      answer: response.answer,
      status: response.status,
      result: response.result ?? null,
    };
  }

  async rejectProposal(
    authHeader: string,
    proposalId: string,
    requestId?: string,
  ): Promise<AgentProposalStatus> {
    const response = await this.request<FastProposalStatusResponse>({
      method: 'POST',
      path: `/agent/proposals/${proposalId}/reject`,
      authHeader,
      requestId,
    });
    return this.mapProposalStatus(response);
  }

  private async request<T>({
    method,
    path,
    authHeader,
    requestId,
    data,
  }: {
    method: 'GET' | 'POST';
    path: string;
    authHeader: string;
    requestId?: string;
    data?: Record<string, unknown>;
  }): Promise<T> {
    if (!this.enabled) {
      throw new ServiceUnavailableException('AI agent is disabled.');
    }
    if (!this.baseUrl || !this.serviceToken) {
      throw new ServiceUnavailableException('AI agent is not configured.');
    }

    const normalizedAuthHeader = authHeader.trim();
    if (!normalizedAuthHeader.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    try {
      const response = await this.client.request<T>({
        method,
        url: path,
        data,
        headers: {
          Authorization: normalizedAuthHeader,
          'X-AI-Service-Token': this.serviceToken,
          'X-Request-ID': requestId?.trim() || randomUUID(),
        },
      });
      return response.data;
    } catch (error) {
      throw this.mapAxiosError(error);
    }
  }

  private mapProposal(raw: FastAgentProposal): AgentProposal {
    return {
      id: raw.id,
      tool: raw.tool,
      operation: raw.operation,
      riskLevel: raw.risk_level,
      summary: raw.summary,
      status: raw.status,
      expiresAt: raw.expires_at,
      confirmPath: this.toNestProposalPath(raw.id, 'confirm'),
      rejectPath: this.toNestProposalPath(raw.id, 'reject'),
    };
  }

  private mapProposalStatus(raw: FastProposalStatusResponse): AgentProposalStatus {
    return {
      id: raw.id,
      tool: raw.tool,
      operation: raw.operation,
      riskLevel: raw.risk_level,
      summary: raw.summary,
      status: raw.status,
      expiresAt: raw.expires_at,
      confirmedAt: raw.confirmed_at ?? null,
      executedAt: raw.executed_at ?? null,
      result: raw.result ?? null,
      error: raw.error ?? null,
    };
  }

  private mapCitation(raw: FastAgentCitation): ChatbotCitation {
    const sourceFile = raw.source_file?.trim() || 'rag-source';
    const headingPath = raw.heading_path?.trim() || raw.parent_heading_path?.trim() || sourceFile;
    return {
      type: 'rag',
      label: headingPath,
      sourceId: sourceFile,
      index: raw.index,
      sourceFile: raw.source_file ?? null,
      sourceUnit: raw.source_unit ?? null,
      category: raw.category ?? null,
      headingPath: raw.heading_path ?? null,
      parentHeadingPath: raw.parent_heading_path ?? null,
      pageStart: raw.page_start ?? null,
      pageEnd: raw.page_end ?? null,
      distance: raw.distance ?? null,
      score: raw.score ?? null,
    };
  }

  private mapAxiosError(error: unknown): HttpException {
    if (!this.looksLikeAxiosError(error)) {
      return new InternalServerErrorException('AI service request failed.');
    }

    const axiosError = error as AxiosError;
    if (axiosError.code === 'ECONNABORTED') {
      return new GatewayTimeoutException('AI service timed out.');
    }

    if (!axiosError.response) {
      return new BadGatewayException('AI service is unavailable.');
    }

    const status = axiosError.response.status;
    const message = this.extractMessage(axiosError);
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return new BadRequestException(message);
      case HttpStatus.UNAUTHORIZED:
        return new UnauthorizedException(message);
      case HttpStatus.FORBIDDEN:
        return new ForbiddenException(message);
      case HttpStatus.NOT_FOUND:
        return new NotFoundException(message);
      case HttpStatus.CONFLICT:
        return new HttpException(message, HttpStatus.CONFLICT);
      case HttpStatus.GONE:
        return new GoneException(message);
      case HttpStatus.TOO_MANY_REQUESTS:
        return new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message,
            retryAfterSeconds: this.retryAfterSeconds(axiosError),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      case HttpStatus.BAD_GATEWAY:
        return new BadGatewayException('AI service returned an invalid response.');
      case HttpStatus.SERVICE_UNAVAILABLE:
        return new ServiceUnavailableException('AI service is unavailable.');
      case HttpStatus.GATEWAY_TIMEOUT:
        return new GatewayTimeoutException('AI service timed out.');
      default:
        return new BadGatewayException('AI service request failed.');
    }
  }

  private looksLikeAxiosError(error: unknown): error is AxiosError {
    if (axios.isAxiosError(error)) {
      return true;
    }

    if (!error || typeof error !== 'object') {
      return false;
    }

    return 'response' in error || 'code' in error;
  }

  private extractMessage(error: AxiosError): string {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = data.detail;
      if (typeof detail === 'string' && detail.trim()) {
        return detail.trim();
      }
    }
    return 'AI service request failed.';
  }

  private retryAfterSeconds(error: AxiosError): number | null {
    const value = error.response?.headers?.['retry-after'];
    const parsed = Number.parseInt(Array.isArray(value) ? value[0] : String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private normalizeBaseUrl(value: string): string {
    const trimmed = value.trim().replace(/\/+$/, '');
    if (!trimmed) {
      return '';
    }
    if (trimmed.endsWith('/ai')) {
      return trimmed;
    }
    return trimmed;
  }

  private toNestProposalPath(id: string, action: 'confirm' | 'reject'): string {
    return `/api/v1/chatbot/proposals/${id}/${action}`;
  }
}

export function safeSecretsEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}
