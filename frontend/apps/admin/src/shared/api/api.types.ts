export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: unknown;
}

export interface PageResponse<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  page: number;
  first: boolean;
  last: boolean;
}

export interface LegacyPageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
}

export interface ApiError {
  code?: string | undefined;
  message: string;
  status?: number | undefined;
  fieldErrors?: Record<string, string> | undefined;
}
