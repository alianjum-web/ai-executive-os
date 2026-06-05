import {
  isApiErrorResponse,
  type ApiErrorResponse,
} from "@/common/types/http/errors";

export class ApiClientError extends Error {
  readonly status: number;
  readonly body?: ApiErrorResponse;

  constructor(message: string, status: number, body?: ApiErrorResponse) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

export function parseApiErrorBody(text: string): ApiErrorResponse | undefined {
  try {
    const value: unknown = JSON.parse(text);
    return isApiErrorResponse(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function apiErrorMessage(
  status: number,
  text: string,
  fallback: string
): string {
  const parsed = parseApiErrorBody(text);
  if (parsed?.error.message) {
    return parsed.error.message;
  }
  const short = text.length > 200 ? `${text.slice(0, 200)}…` : text;
  return short || fallback || `Request failed (${status})`;
}
