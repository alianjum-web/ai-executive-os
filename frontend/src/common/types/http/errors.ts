/** Mirrors backend `app/models/http/errors.py`. */

export type ApiErrorDetail = {
  message: string;
  code?: string | null;
  field?: string | null;
};

export type ApiErrorResponse = {
  error: ApiErrorDetail;
  status_code: number;
};

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (typeof row.status_code !== "number") return false;
  const err = row.error;
  if (!err || typeof err !== "object") return false;
  return typeof (err as ApiErrorDetail).message === "string";
}
