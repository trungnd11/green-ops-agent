import { AxiosError } from 'axios';
import type { AppError } from '@xanh/shared-types';

export function normalizeError(error: unknown): AppError {
  if (isAxiosError(error)) {
    return {
      code: error.response?.data?.code,
      message: error.response?.data?.message ?? error.message,
      status: error.response?.status,
      fieldErrors: error.response?.data?.fieldErrors,
      originalError: error,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      originalError: error,
    };
  }

  return {
    message: 'An unknown error occurred',
    originalError: error,
  };
}

function isAxiosError(error: unknown): error is AxiosError<{
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  return error instanceof AxiosError;
}
