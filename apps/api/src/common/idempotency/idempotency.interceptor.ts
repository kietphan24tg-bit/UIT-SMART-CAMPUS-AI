import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { catchError, from, mergeMap, of } from 'rxjs';
import type { Request } from 'express';

import { IdempotencyService } from './idempotency.service';

const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: { id?: string } }>();
    const idempotencyKey = this.getIdempotencyKey(request);

    if (!idempotencyKey || !IDEMPOTENT_METHODS.has(request.method.toUpperCase())) {
      return next.handle();
    }

    const userId = request.user?.id;
    if (!userId) {
      throw new ServiceUnavailableException('Idempotent actions require an authenticated user.');
    }

    const executionKey = this.idempotencyService.buildExecutionKey({
      userId,
      method: request.method.toUpperCase(),
      route: this.resolveRouteKey(request),
      idempotencyKey,
    });

    return from(this.idempotencyService.claim(executionKey)).pipe(
      mergeMap((claim) => {
        if (claim.outcome === 'replay') {
          return of(claim.payload);
        }
        if (claim.outcome === 'conflict') {
          throw new ConflictException('Another request with the same idempotency key is in progress.');
        }

        return next.handle().pipe(
          mergeMap((payload) =>
            from(this.idempotencyService.storeResult(claim.executionKey, payload)).pipe(
              mergeMap(() => from(this.idempotencyService.releaseLock(claim.lockKey, claim.lockToken))),
              mergeMap(() => of(payload)),
            ),
          ),
          catchError((error) =>
            from(this.idempotencyService.releaseLock(claim.lockKey, claim.lockToken)).pipe(
              mergeMap(() => {
                throw error;
              }),
            ),
          ),
        );
      }),
    );
  }

  private getIdempotencyKey(request: Request): string | null {
    const rawHeader = request.header('x-idempotency-key')?.trim();
    if (!rawHeader) {
      return null;
    }

    if (!UUID_V4_RE.test(rawHeader)) {
      throw new BadRequestException('X-Idempotency-Key must be a valid UUID.');
    }

    return rawHeader;
  }

  private resolveRouteKey(request: Request): string {
    const routePath = request.route?.path ? String(request.route.path) : request.path;
    return `${request.baseUrl}${routePath}`;
  }
}
