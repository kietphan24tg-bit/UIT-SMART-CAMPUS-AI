import {
  ConflictException,
  Injectable,
  NestInterceptor,
  ServiceUnavailableException,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import { catchError, from, mergeMap, of, tap, throwError, type Observable } from 'rxjs';

const RESULT_TTL_SECONDS = 24 * 60 * 60;
const LOCK_TTL_SECONDS = 60;
const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly redisUrl: string | undefined;
  private client: RedisClientType | null = null;
  private clientReady: Promise<RedisClientType> | null = null;
  
  // RAM Fallback Store
  private readonly memoryStore = new Map<string, MemoryEntry>();

  constructor(private readonly configService: ConfigService) {
    this.redisUrl = this.configService.get<string>('REDIS_URL') || undefined;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = String(request.method || '').toUpperCase();
    const idempotencyKey = String(request.header?.('X-Idempotency-Key') || request.headers['x-idempotency-key'] || '').trim();
    if (!idempotencyKey || !IDEMPOTENT_METHODS.has(method)) {
      return next.handle();
    }

    const userId = String(request.user?.id || 'anonymous').trim();
    const routePath = this.resolveRoutePath(request);
    const baseKey = `ai-idempotency:${userId}:${method}:${routePath}:${idempotencyKey}`;
    const resultKey = `${baseKey}:result`;
    const lockKey = `${baseKey}:lock`;

    return from(this.beforeExecution(resultKey, lockKey)).pipe(
      mergeMap((cachedResult) => {
        if (cachedResult !== null) {
          return of(cachedResult);
        }

        return next.handle().pipe(
          tap((data) => {
            void this.storeCompleted(resultKey, lockKey, data);
          }),
          catchError((error) =>
            from(this.releaseLock(lockKey)).pipe(
              mergeMap(() => throwError(() => error)),
            ),
          ),
        );
      }),
    );
  }

  private async beforeExecution(resultKey: string, lockKey: string): Promise<unknown | null> {
    if (this.redisUrl) {
      const client = await this.getClient();
      const cached = await client.get(resultKey);
      if (cached) return JSON.parse(cached);

      const locked = await client.set(lockKey, '1', { NX: true, EX: LOCK_TTL_SECONDS });
      if (locked) return null;

      const completed = await client.get(resultKey);
      if (completed) return JSON.parse(completed);

      throw new ConflictException('Request is already being processed.');
    } else {
      // RAM Fallback
      this.cleanupMemory();
      
      const cached = this.memoryStore.get(resultKey);
      if (cached) return JSON.parse(cached.value);

      const isLocked = this.memoryStore.has(lockKey);
      if (!isLocked) {
        this.memoryStore.set(lockKey, { value: '1', expiresAt: Date.now() + LOCK_TTL_SECONDS * 1000 });
        return null;
      }

      const completed = this.memoryStore.get(resultKey);
      if (completed) return JSON.parse(completed.value);

      throw new ConflictException('Request is already being processed.');
    }
  }

  private async storeCompleted(resultKey: string, lockKey: string, data: unknown): Promise<void> {
    if (this.redisUrl) {
      const client = await this.getClient();
      await client.set(resultKey, JSON.stringify(data), { EX: RESULT_TTL_SECONDS });
      await client.del(lockKey);
    } else {
      this.memoryStore.set(resultKey, { 
        value: JSON.stringify(data), 
        expiresAt: Date.now() + RESULT_TTL_SECONDS * 1000 
      });
      this.memoryStore.delete(lockKey);
    }
  }

  private async releaseLock(lockKey: string): Promise<void> {
    if (this.redisUrl) {
      if (!this.clientReady) return;
      const client = await this.getClient();
      await client.del(lockKey);
    } else {
      this.memoryStore.delete(lockKey);
    }
  }

  private resolveRoutePath(request: Record<string, any>) {
    const baseUrl = String(request.baseUrl || '').trim();
    const routePath = String(request.route?.path || request.path || request.originalUrl || '').trim();
    return `${baseUrl}${routePath}` || '/';
  }

  private async getClient(): Promise<RedisClientType> {
    if (this.client) {
      return this.client;
    }
    if (!this.clientReady) {
      const client = createClient({
        url: this.redisUrl,
        socket: {
          connectTimeout: 1000,
        },
      });
      this.clientReady = client.connect().then(() => {
        this.client = client;
        return client;
      });
    }

    try {
      return await this.clientReady;
    } catch (error) {
      this.clientReady = null;
      this.client = null;
      throw new ServiceUnavailableException('Idempotency backend is unavailable.');
    }
  }

  private cleanupMemory() {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryStore.delete(key);
      }
    }
  }
}
