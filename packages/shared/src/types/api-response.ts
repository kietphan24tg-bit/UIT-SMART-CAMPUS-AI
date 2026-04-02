export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
