import type { ExecutionContext } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { of } from 'rxjs';

import { IdempotencyInterceptor } from './idempotency.interceptor';
import type { IdempotencyService } from './idempotency.service';

function createExecutionContext(headers?: Record<string, string>): ExecutionContext {
  const request = {
    method: 'POST',
    baseUrl: '/api/v1/chatbot/proposals',
    route: { path: '/:id/confirm' },
    path: '/api/v1/chatbot/proposals/11111111-1111-1111-1111-111111111111/confirm',
    header: (name: string) => headers?.[name.toLowerCase()],
    user: { id: 'user-1' },
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('IdempotencyInterceptor', () => {
  const idempotencyService: jest.Mocked<IdempotencyService> = {
    ensureAvailable: jest.fn(),
    buildExecutionKey: jest.fn(() => 'exec-1'),
    claim: jest.fn(),
    storeResult: jest.fn(),
    releaseLock: jest.fn(),
  } as unknown as jest.Mocked<IdempotencyService>;

  beforeEach(() => {
    jest.clearAllMocks();
    idempotencyService.storeResult.mockResolvedValue(undefined as never);
    idempotencyService.releaseLock.mockResolvedValue(undefined as never);
  });

  it('replays cached results without calling the handler again', async () => {
    idempotencyService.claim.mockResolvedValue({
      outcome: 'replay',
      payload: { ok: true },
    });

    const interceptor = new IdempotencyInterceptor(idempotencyService);
    const next = { handle: jest.fn(() => of({ ok: false })) };

    const result = await new Promise<unknown>((resolve, reject) => {
      interceptor.intercept(
        createExecutionContext({ 'x-idempotency-key': '11111111-1111-4111-8111-111111111111' }),
        next as never,
      ).subscribe({ next: resolve, error: reject });
    });

    expect(result).toEqual({ ok: true });
    expect(next.handle).not.toHaveBeenCalled();
  });

  it('rejects concurrent requests with the same idempotency key', async () => {
    idempotencyService.claim.mockResolvedValue({
      outcome: 'conflict',
    });

    const interceptor = new IdempotencyInterceptor(idempotencyService);
    const next = { handle: jest.fn(() => of({ ok: true })) };

    await expect(
      new Promise<unknown>((resolve, reject) => {
        interceptor.intercept(
          createExecutionContext({ 'x-idempotency-key': '11111111-1111-4111-8111-111111111111' }),
          next as never,
        ).subscribe({ next: resolve, error: reject });
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('stores the successful response when acquiring a fresh lock', async () => {
    idempotencyService.claim.mockResolvedValue({
      outcome: 'acquired',
      executionKey: 'exec-1',
      lockKey: 'lock-1',
      lockToken: 'token-1',
    });

    const interceptor = new IdempotencyInterceptor(idempotencyService);
    const next = { handle: jest.fn(() => of({ ok: true })) };

    const result = await new Promise<unknown>((resolve, reject) => {
      interceptor.intercept(
        createExecutionContext({ 'x-idempotency-key': '11111111-1111-4111-8111-111111111111' }),
        next as never,
      ).subscribe({ next: resolve, error: reject });
    });

    expect(result).toEqual({ ok: true });
    expect(idempotencyService.storeResult).toHaveBeenCalledWith('exec-1', { ok: true });
    expect(idempotencyService.releaseLock).toHaveBeenCalledWith('lock-1', 'token-1');
  });
});
