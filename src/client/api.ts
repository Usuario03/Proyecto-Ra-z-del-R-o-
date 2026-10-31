import type { ApiEnvelope, ApiErrorDetail } from '../../server/contracts/common';

export class ApiClientError extends Error {
  readonly status: number;
  readonly detail: ApiErrorDetail;

  constructor(status: number, detail: ApiErrorDetail) {
    super(detail.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.detail = detail;
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Cliente HTTP tipado para consumir los endpoints /api/* desde el Frontend.
 * Soporta tanto cookies HttpOnly (credentials: 'same-origin') como JWT Bearer opcional.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let serializedBody: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    serializedBody = JSON.stringify(options.body);
  }

  const response = await fetch(path, {
    method,
    headers,
    body: serializedBody,
    credentials: 'same-origin',
    signal: options.signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let parsed: ApiEnvelope<T> | null = null;
  try {
    parsed = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiClientError(response.status, {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Respuesta inesperada del servidor.',
      requestId: 'client-parse-error',
    });
  }

  if (!response.ok || !parsed || 'error' in parsed) {
    const detail: ApiErrorDetail =
      parsed && 'error' in parsed
        ? parsed.error
        : {
            code: 'SERVICE_UNAVAILABLE',
            message: 'No se pudo completar la solicitud.',
            requestId: 'unknown',
          };
    throw new ApiClientError(response.status, detail);
  }

  return parsed.data;
}
