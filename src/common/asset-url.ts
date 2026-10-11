const ABSOLUTE_URL = /^https?:\/\//i;

export function requestBaseUrl(request: {
  protocol?: string;
  headers: Record<string, string | string[] | undefined>;
}): string {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const forwardedHost = request.headers['x-forwarded-host'];
  const protoHeader = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto;
  const hostHeader = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost;
  const proto =
    protoHeader?.split(',')[0]?.trim() || request.protocol || 'http';
  const host =
    hostHeader?.split(',')[0]?.trim() || request.headers.host || 'localhost';

  return `${proto}://${host}`;
}

export function absoluteAssetUrl(stored: string, baseUrl: string): string {
  if (!stored || ABSOLUTE_URL.test(stored)) {
    return stored;
  }

  const path = stored.startsWith('/') ? stored : `/${stored}`;
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export function storedAssetPath(value?: string): string | undefined {
  if (!value) {
    return value;
  }

  const match = value.match(/(\/uploads(?:-profile)?\/[^/?#]+)$/);
  return match ? match[1] : value;
}
