import { httpErrors } from './errors';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function parseTrustedOrigins(envOrigins?: string): Set<string> {
  const defaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];
  const vercelHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]
    .filter((h): h is string => Boolean(h && h.trim()))
    .map(h => (h.startsWith('http') ? h.trim() : `https://${h.trim()}`));

  const configured = (envOrigins ?? process.env.TRUSTED_ORIGINS ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  return new Set([...defaults, ...vercelHosts, ...configured]);
}

/**
 * Verifica protección CSRF / Cross-Site en métodos mutantes:
 * - Rechaza peticiones con Sec-Fetch-Site: cross-site.
 * - Exige cabecera Origin exacta dentro de la lista de orígenes confiables
 *   (o coincidente con el origen propio de la petición en despliegues Vercel).
 */
export function verifyRequestOrigin(
  request: Request,
  options?: { trustedOrigins?: string },
): void {
  const method = request.method.toUpperCase();
  if (!MUTATING_METHODS.has(method)) {
    return;
  }

  const fetchSite = request.headers.get('sec-fetch-site')?.toLowerCase();
  if (fetchSite === 'cross-site') {
    throw httpErrors.forbidden(
      'Petición entre sitios (cross-site) no permitida.',
      'CROSS_SITE_FORBIDDEN',
    );
  }

  const origin = request.headers.get('origin')?.trim();
  if (!origin || origin === 'null') {
    throw httpErrors.forbidden(
      'Falta cabecera Origin válida para esta operación.',
      'CROSS_SITE_FORBIDDEN',
    );
  }

  let normalizedOrigin: string;
  let originHost: string;
  try {
    const parsedUrl = new URL(origin);
    normalizedOrigin = parsedUrl.origin;
    originHost = parsedUrl.host.toLowerCase();
  } catch {
    throw httpErrors.forbidden('Cabecera Origin malformada.', 'CROSS_SITE_FORBIDDEN');
  }

  const allowedOrigins = parseTrustedOrigins(options?.trustedOrigins);
  let requestSelfOrigin: string | null = null;
  try {
    requestSelfOrigin = new URL(request.url).origin;
  } catch {
    requestSelfOrigin = null;
  }

  const forwardedHost = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  )
    .split(',')[0]
    .trim()
    .toLowerCase();

  if (
    !allowedOrigins.has(normalizedOrigin) &&
    normalizedOrigin !== requestSelfOrigin &&
    (!forwardedHost || originHost !== forwardedHost)
  ) {
    throw httpErrors.forbidden(
      'El origen de la petición no está autorizado.',
      'CROSS_SITE_FORBIDDEN',
    );
  }
}
