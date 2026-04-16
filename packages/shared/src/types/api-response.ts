export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
  /** Machine-readable error code when success is false (e.g. attendance check-in). */
  code?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
