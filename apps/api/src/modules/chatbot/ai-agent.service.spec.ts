import { HttpStatus } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { AiAgentService } from './ai-agent.service';

jest.mock('axios');

describe('AiAgentService', () => {
  const requestMock = jest.fn();
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  function createConfig(overrides?: Record<string, unknown>) {
    return {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          AI_SERVICE_URL: 'http://ai-service:8000',
          AI_SERVICE_TOKEN: 'shared-secret',
          AI_AGENT_ENABLED: true,
          AI_AGENT_TIMEOUT_MS: 30_000,
          ...overrides,
        };
        return values[key] ?? defaultValue;
      }),
    } as unknown as ConfigService;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    requestMock.mockReset();
    mockedAxios.create.mockReturnValue({
      request: requestMock,
    } as unknown as ReturnType<typeof axios.create>);
  });

  it('forwards bearer token, service token and request id for agent query', async () => {
    requestMock.mockResolvedValue({
      data: {
        answer_type: 'confirmation_required',
        answer: 'Ban co chac muon huy lop NT101 khong?',
        proposal: {
          id: '11111111-1111-1111-1111-111111111111',
          tool: 'drop_registration',
          operation: 'update',
          risk_level: 'medium',
          summary: 'Huy dang ky lop NT101',
          status: 'pending',
          expires_at: '2026-08-23T12:00:00.000Z',
          confirm_path: '/agent/proposals/11111111-1111-1111-1111-111111111111/confirm',
          reject_path: '/agent/proposals/11111111-1111-1111-1111-111111111111/reject',
        },
        citations: [{ index: 1, source_file: 'quy-che.md', heading_path: 'Dieu 5' }],
        trace: [{ type: 'analysis', label: 'Da phan tich', status: 'completed' }],
      },
    });

    const service = new AiAgentService(createConfig());
    const result = await service.query(
      'Bearer user-jwt',
      'student' as never,
      { message: 'Huy lop NT101', sessionId: 'session-1', history: [] },
      'req-1',
    );

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/agent/query',
        data: { message: 'Huy lop NT101', session_id: 'session-1', history: [] },
        headers: expect.objectContaining({
          Authorization: 'Bearer user-jwt',
          'X-AI-Service-Token': 'shared-secret',
          'X-Request-ID': 'req-1',
        }),
      }),
    );
    expect(result.answerType).toBe('confirmation_required');
    expect(result.proposal?.confirmPath).toBe(
      '/api/v1/chatbot/proposals/11111111-1111-1111-1111-111111111111/confirm',
    );
  });

  it('maps upstream 404 proposal responses to Nest 404', async () => {
    requestMock.mockRejectedValue({
      response: {
        status: 404,
        data: { detail: 'Proposal not found.' },
      },
    });

    const service = new AiAgentService(createConfig());
    await expect(
      service.getProposal('Bearer user-jwt', '11111111-1111-1111-1111-111111111111', 'req-1'),
    ).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
      message: 'Proposal not found.',
    });
  });

  it('rejects malformed authorization headers before making upstream request', async () => {
    const service = new AiAgentService(createConfig());

    await expect(
      service.query('invalid-token', 'student' as never, { message: 'test', sessionId: 's1', history: [] }),
    ).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
    });
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('forwards history payload for conversational memory', async () => {
    requestMock.mockResolvedValue({
      data: {
        answer_type: 'answer',
        answer: 'Tuan sau van hoc thu ba.',
        citations: [],
        trace: [],
      },
    });

    const service = new AiAgentService(createConfig());
    await service.query(
      'Bearer user-jwt',
      'student' as never,
      {
        message: 'Con tuan sau thi sao?',
        sessionId: 'session-1',
        history: [
          { role: 'user', content: 'Lich SE104?' },
          { role: 'assistant', content: 'SE104 hoc thu ba.' },
        ],
      },
      'req-2',
    );

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          message: 'Con tuan sau thi sao?',
          session_id: 'session-1',
          history: [
            { role: 'user', content: 'Lich SE104?' },
            { role: 'assistant', content: 'SE104 hoc thu ba.' },
          ],
        },
      }),
    );
  });
});
