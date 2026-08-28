import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export class SSRFBlockedError extends Error {
  constructor(public readonly reason: string) {
    super(`URL blocked by SSRF guard: ${reason}`);
    this.name = 'SSRFBlockedError';
  }
}

export interface GuardOptions {
  allowHttp?: boolean;
  allowPrivateNetworks?: boolean;
}

const DEFAULT_OPTS: Required<GuardOptions> = {
  allowHttp: false,
  allowPrivateNetworks: false,
};

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true;
  const a = parts[0] as number;
  const b = parts[1] as number;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 0) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1') return true;
  if (lower === '::' || lower === '0:0:0:0:0:0:0:0' || lower === '0:0:0:0:0:0:0:1') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  if (lower.startsWith('fe80')) return true;
  if (lower.startsWith('ff')) return true;
  return false;
}

function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return isPrivateIPv4(ip);
  if (v === 6) return isPrivateIPv6(ip);
  return true;
}

export function assertSafeUrl(raw: string, opts: GuardOptions = {}): URL {
  const o = { ...DEFAULT_OPTS, ...opts };
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SSRFBlockedError('not a valid URL');
  }
  if (url.protocol === 'http:' && !o.allowHttp) {
    throw new SSRFBlockedError(`non-HTTPS scheme "${url.protocol}" not allowed`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SSRFBlockedError(`scheme "${url.protocol}" not allowed`);
  }
  if (url.username || url.password) {
    throw new SSRFBlockedError('userinfo in URL not allowed');
  }
  if (!o.allowPrivateNetworks) {
    const host = url.hostname.replace(/^\[|\]$/g, '');
    const literal = isIP(host);
    if (literal !== 0 && isPrivateIp(host)) {
      throw new SSRFBlockedError(`private IP "${host}" not allowed`);
    }
  }
  return url;
}

export async function resolveAndAssertSafe(raw: string, opts: GuardOptions = {}): Promise<URL> {
  const url = assertSafeUrl(raw, opts);
  const o = { ...DEFAULT_OPTS, ...opts };
  if (o.allowPrivateNetworks) return url;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const literal = isIP(host);
  if (literal !== 0) return url;
  try {
    const addrs = await lookup(host, { all: true });
    for (const a of addrs) {
      if (isPrivateIp(a.address)) {
        throw new SSRFBlockedError(`hostname "${host}" resolves to private IP ${a.address}`);
      }
    }
  } catch (err) {
    if (err instanceof SSRFBlockedError) throw err;
    throw new SSRFBlockedError(`DNS lookup for "${host}" failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  return url;
}
