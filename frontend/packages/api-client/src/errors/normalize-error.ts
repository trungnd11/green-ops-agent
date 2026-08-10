import { AxiosError } from 'axios';
import type { AppError } from '@xanh/shared-types';

export function normalizeError(error: unknown): AppError {
  if (isAxiosError(error)) {
    const result: AppError = {
      message: error.response?.data?.message ?? error.message,
      originalError: error,
    };
    const code = error.response?.data?.code;
    const status = error.response?.status;
    const fieldErrors = error.response?.data?.fieldErrors;
    if (code !== undefined) result.code = code;
    if (status !== undefined) result.status = status;
    if (fieldErrors !== undefined) result.fieldErrors = fieldErrors;
    return result;
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
