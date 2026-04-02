import type { PipeTransform } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PAGINATION_DEFAULTS } from '@smart-campus/shared';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

@Injectable()
export class ParsePaginationPipe implements PipeTransform<{ page?: number; limit?: number }, PaginationParams> {
  transform(value: { page?: number; limit?: number }): PaginationParams {
    const page = Math.max(value.page ?? PAGINATION_DEFAULTS.PAGE, 1);
    const limit = Math.min(
      Math.max(value.limit ?? PAGINATION_DEFAULTS.LIMIT, 1),
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    return { page, limit, skip: (page - 1) * limit };
  }
}
