import { createHash, randomUUID } from 'node:crypto';

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';

const COMPLETED_TTL_SECONDS = 24 * 60 * 60;
const LOCK_TTL_SECONDS = 60;
const MEMORY_CLEANUP_INTERVAL_MS = 60 * 1000;
const RELEASE_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

export interface IdempotencyClaimReplay {
  outcome: 'replay';
  payload: unknown;
}

export interface IdempotencyClaimConflict {
  outcome: 'conflict';
}

export interface IdempotencyClaimAcquired {
  outcome: 'acquired';
  executionKey: string;
  lockKey: string;
  lockToken: string;
}

export type IdempotencyClaim =
  | IdempotencyClaimReplay
  | IdempotencyClaimConflict
  | IdempotencyClaimAcquired;

interface MemoryResult {
  payload: unknown;
  expiresAt: number;
}

interface MemoryLock {
  token: string;
  expiresAt: number;
}

@Injectable()
export class IdempotencyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly redisClient: RedisClientType | null;
  private readonly memoryResults = new Map<string, MemoryResult>();
  private readonly memoryLocks = new Map<string, MemoryLock>();
  private available = false;
  private fallbackWarningLogged = false;
  private lastMemoryCleanupAt = 0;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL', '').trim();
    this.redisClient = redisUrl ? createClient({ url: redisUrl }) : null;

    if (!this.redisClient) {
      return;
    }

    this.redisClient.on('ready', () => {
      this.available = true;
      this.fallbackWarningLogged = false;
    });
    this.redisClient.on('error', (error) => {
      this.activateMemoryFallback(`Redis unavailable for idempotency: ${error.message}`);
    });
  }

  async onModuleInit() {
    if (!this.redisClient) {
      this.activateMemoryFallback('REDIS_URL is not configured for idempotency.');
      return;
    }

    try {
      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }
      this.available = this.redisClient.isOpen;
    } catch (error) {
      this.activateMemoryFallback(
        `Failed to connect Redis for idempotency: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.redisClient?.isOpen) {
      await this.redisClient.close();
    }
    this.available = false;
    this.memoryLocks.clear();
    this.memoryResults.clear();
  }

  /** Kept for compatibility; memory fallback is always available in-process. */
  ensureAvailable() {
    return;
  }

  buildExecutionKey(input: {
    userId: string;
    method: string;
    route: string;
    idempotencyKey: string;
  }) {
    const digest = createHash('sha256')
      .update(`${input.userId}:${input.method}:${input.route}:${input.idempotencyKey}`)
      .digest('hex');
    return `idempotency:${digest}`;
  }

  async claim(executionKey: string): Promise<IdempotencyClaim> {
    const memoryReplay = this.getMemoryResult(executionKey);
    if (memoryReplay !== undefined) {
      return { outcome: 'replay', payload: memoryReplay };
    }

    if (!this.available || !this.redisClient) {
      return this.claimMemory(executionKey);
    }

    try {
      const resultKey = `${executionKey}:result`;
      const cached = await this.redisClient.get(resultKey);
      if (cached) {
        const payload = JSON.parse(cached) as unknown;
        this.setMemoryResult(executionKey, payload);
        return { outcome: 'replay', payload };
      }

      const lockKey = `${executionKey}:lock`;
      const lockToken = randomUUID();
      const acquired = await this.redisClient.set(lockKey, lockToken, {
        NX: true,
        EX: LOCK_TTL_SECONDS,
      });

      if (acquired !== 'OK') {
        return { outcome: 'conflict' };
      }

      return { outcome: 'acquired', executionKey, lockKey, lockToken };
    } catch (error) {
      this.activateMemoryFallback(
        `Redis operation failed for idempotency: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return this.claimMemory(executionKey);
    }
  }

  async storeResult(executionKey: string, payload: unknown) {
    this.setMemoryResult(executionKey, payload);

    if (!this.available || !this.redisClient) {
      return;
    }

    try {
      await this.redisClient.set(`${executionKey}:result`, JSON.stringify(payload), {
        EX: COMPLETED_TTL_SECONDS,
      });
    } catch (error) {
      this.activateMemoryFallback(
        `Redis result storage failed for idempotency: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  async releaseLock(lockKey: string, lockToken: string) {
    this.releaseMemoryLock(lockKey, lockToken);

    if (!this.available || !this.redisClient) {
      return;
    }

    try {
      await this.redisClient.eval(RELEASE_LOCK_SCRIPT, {
        keys: [lockKey],
        arguments: [lockToken],
      });
    } catch (error) {
      this.activateMemoryFallback(
        `Redis lock release failed for idempotency: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private activateMemoryFallback(reason: string) {
    this.available = false;
    if (!this.fallbackWarningLogged) {
      this.logger.warn(`${reason} Falling back to in-memory idempotency.`);
      this.fallbackWarningLogged = true;
    }
  }

  private claimMemory(executionKey: string): IdempotencyClaim {
    const now = Date.now();
    this.cleanupMemory(now);

    const replay = this.getMemoryResult(executionKey, now);
    if (replay !== undefined) {
      return { outcome: 'replay', payload: replay };
    }

    const lockKey = `${executionKey}:lock`;
    const existingLock = this.memoryLocks.get(lockKey);
    if (existingLock && existingLock.expiresAt > now) {
      return { outcome: 'conflict' };
    }

    const lockToken = randomUUID();
    this.memoryLocks.set(lockKey, {
      token: lockToken,
      expiresAt: now + LOCK_TTL_SECONDS * 1000,
    });
    return { outcome: 'acquired', executionKey, lockKey, lockToken };
  }

  private setMemoryResult(executionKey: string, payload: unknown) {
    this.memoryResults.set(executionKey, {
      payload,
      expiresAt: Date.now() + COMPLETED_TTL_SECONDS * 1000,
    });
  }

  private getMemoryResult(executionKey: string, now = Date.now()): unknown | undefined {
    const result = this.memoryResults.get(executionKey);
    if (!result) {
      return undefined;
    }
    if (result.expiresAt <= now) {
      this.memoryResults.delete(executionKey);
      return undefined;
    }
    return result.payload;
  }

  private releaseMemoryLock(lockKey: string, lockToken: string) {
    const lock = this.memoryLocks.get(lockKey);
    if (lock?.token === lockToken) {
      this.memoryLocks.delete(lockKey);
    }
  }

  private cleanupMemory(now: number) {
    if (now - this.lastMemoryCleanupAt < MEMORY_CLEANUP_INTERVAL_MS) {
      return;
    }
    this.lastMemoryCleanupAt = now;

    for (const [key, value] of this.memoryLocks) {
      if (value.expiresAt <= now) {
        this.memoryLocks.delete(key);
      }
    }
    for (const [key, value] of this.memoryResults) {
      if (value.expiresAt <= now) {
        this.memoryResults.delete(key);
      }
    }
  }
}
