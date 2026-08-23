import { ConfigService } from '@nestjs/config';

import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService memory fallback', () => {
  let service: IdempotencyService;

  beforeEach(async () => {
    const configService = {
      get: jest.fn(() => ''),
    } as unknown as ConfigService;
    service = new IdempotencyService(configService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('acquires a lock without Redis and rejects a concurrent claim', async () => {
    const first = await service.claim('exec-1');
    const second = await service.claim('exec-1');

    expect(first.outcome).toBe('acquired');
    expect(second).toEqual({ outcome: 'conflict' });
  });

  it('replays a completed result from memory', async () => {
    const claim = await service.claim('exec-1');
    expect(claim.outcome).toBe('acquired');
    if (claim.outcome !== 'acquired') {
      return;
    }

    await service.storeResult(claim.executionKey, { ok: true });
    await service.releaseLock(claim.lockKey, claim.lockToken);

    await expect(service.claim('exec-1')).resolves.toEqual({
      outcome: 'replay',
      payload: { ok: true },
    });
  });

  it('allows a retry after a failed handler releases its memory lock', async () => {
    const claim = await service.claim('exec-1');
    expect(claim.outcome).toBe('acquired');
    if (claim.outcome !== 'acquired') {
      return;
    }

    await service.releaseLock(claim.lockKey, claim.lockToken);

    await expect(service.claim('exec-1')).resolves.toMatchObject({
      outcome: 'acquired',
      executionKey: 'exec-1',
    });
  });
});
