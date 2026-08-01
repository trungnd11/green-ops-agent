import type { ApiError } from "./api.types";

export function normalizeError(error: unknown): ApiError {
  if (error && typeof error === "object" && "message" in error) {
    const err = error as Record<string, unknown>;
    return {
      code: typeof err.code === "string" ? err.code : undefined,
      message: typeof err.message === "string" ? err.message : "Lỗi không xác định",
      status: typeof err.status === "number" ? err.status : undefined,
      fieldErrors: typeof err.fieldErrors === "object" ? (err.fieldErrors as Record<string, string>) : undefined,
    } satisfies ApiError;
  }
  return { message: "Lỗi không xác định" } satisfies ApiError;
}
