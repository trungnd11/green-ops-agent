export interface AppError {
  code?: string;
  message: string;
  status?: number;
  fieldErrors?: Record<string, string[]>;
  originalError?: unknown;
}

export interface FieldValidationError {
  field: string;
  message: string;
}
