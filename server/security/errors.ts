import crypto from 'node:crypto';
import {
  type ApiErrorCode,
  type ApiErrorEnvelope,
  type ApiSuccessEnvelope,
  MAX_JSON_BODY_BYTES,
  isPlainObject,
} from '../contracts/common';

export class AppHttpError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fields?: Record<string, string>;
  readonly details?: Record<string, unknown>;
  readonly headers?: Record<string, string>;

  constructor(options: {
    status: number;
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
    details?: Record<string, unknown>;
    headers?: Record<string, string>;
  }) {
    super(options.message);
    this.name = 'AppHttpError';
    this.status = options.status;
    this.code = options.code;
    this.fields = options.fields;
    this.details = options.details;
    this.headers = options.headers;
  }
}

export const httpErrors = {
  badRequest: (message: string, fields?: Record<string, string>) =>
    new AppHttpError({ status: 400, code: 'BAD_REQUEST', message, fields }),
  invalidJson: (message = 'El cuerpo de la petición no es un JSON válido.') =>
    new AppHttpError({ status: 400, code: 'INVALID_JSON', message }),
  unauthorized: (message = 'Debes iniciar sesión para continuar.') =>
    new AppHttpError({ status: 401, code: 'UNAUTHORIZED', message }),
  forbidden: (
    message = 'No tienes permiso para realizar esta operación.',
    code: ApiErrorCode = 'FORBIDDEN',
  ) => new AppHttpError({ status: 403, code, message }),
  notFound: (message = 'El recurso solicitado no existe o no está disponible.') =>
    new AppHttpError({ status: 404, code: 'NOT_FOUND', message }),
  conflict: (
    message: string,
    code: ApiErrorCode = 'CONFLICT',
    details?: Record<string, unknown>,
  ) => new AppHttpError({ status: 409, code, message, details }),
  payloadTooLarge: (message = 'El tamaño de la petición supera el límite permitido (64 KiB).') =>
    new AppHttpError({ status: 413, code: 'PAYLOAD_TOO_LARGE', message }),
  validation: (
    message: string,
    fields?: Record<string, string>,
    code: ApiErrorCode = 'VALIDATION_ERROR',
  ) => new AppHttpError({ status: 422, code, message, fields }),
  rateLimited: (retryAfterSeconds: number, message = 'Demasiadas peticiones. Intenta más tarde.') =>
    new AppHttpError({
      status: 429,
      code: 'RATE_LIMITED',
      message,
      headers: { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterSeconds))) },
    }),
  serviceUnavailable: (
    message = 'El servicio de base de datos no está disponible temporalmente.',
  ) => new AppHttpError({ status: 503, code: 'SERVICE_UNAVAILABLE', message }),
};

export function jsonSuccess<T>(
  data: T,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  const body: ApiSuccessEnvelope<T> = { data };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      ...extraHeaders,
    },
  });
}

export function toErrorResponse(error: unknown, requestId = crypto.randomUUID()): Response {
  if (error instanceof AppHttpError) {
    const payload: ApiErrorEnvelope = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
        ...(error.details ? { details: error.details } : {}),
        requestId,
      },
    };
    return new Response(JSON.stringify(payload), {
      status: error.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'private, no-store',
        ...(error.headers ?? {}),
      },
    });
  }

  const fallback: ApiErrorEnvelope = {
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'No se pudo completar la operación en este momento. Intenta nuevamente.',
      requestId,
    },
  };
  return new Response(JSON.stringify(fallback), {
    status: 503,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
}

export async function readValidatedJsonBody(
  request: Request,
  maxBytes = MAX_JSON_BODY_BYTES,
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw httpErrors.badRequest('Se requiere Content-Type: application/json.');
  }

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const declaredBytes = Number(contentLengthHeader);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      throw httpErrors.payloadTooLarge();
    }
  }

  const rawText = await request.text();
  if (Buffer.byteLength(rawText, 'utf8') > maxBytes) {
    throw httpErrors.payloadTooLarge();
  }
  if (!rawText.trim()) {
    throw httpErrors.invalidJson('El cuerpo JSON no puede estar vacío.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw httpErrors.invalidJson();
  }

  if (!isPlainObject(parsed)) {
    throw httpErrors.validation('El cuerpo JSON debe ser un objeto.');
  }
  return parsed;
}
