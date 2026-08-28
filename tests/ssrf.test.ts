import { describe, it, expect } from 'vitest';
import { assertSafeUrl, SSRFBlockedError } from '@/src/lib/ssrf';

describe('SSRF guard', () => {
  it('accepts HTTPS public URLs', () => {
    const u = assertSafeUrl('https://api.example.com/v1/models');
    expect(u.hostname).toBe('api.example.com');
  });
  it('rejects http:// by default', () => {
    expect(() => assertSafeUrl('http://api.example.com')).toThrow(SSRFBlockedError);
  });
  it('allows http when allowHttp=true', () => {
    const u = assertSafeUrl('http://localhost:11434', { allowHttp: true });
    expect(u.hostname).toBe('localhost');
  });
  it('rejects ftp and other schemes', () => {
    expect(() => assertSafeUrl('ftp://example.com')).toThrow(SSRFBlockedError);
    expect(() => assertSafeUrl('file:///etc/passwd')).toThrow(SSRFBlockedError);
  });
  it('rejects userinfo', () => {
    expect(() => assertSafeUrl('https://user:pass@example.com')).toThrow(SSRFBlockedError);
  });
  it('rejects private IPv4 literals', () => {
    expect(() => assertSafeUrl('https://127.0.0.1/x')).toThrow(SSRFBlockedError);
    expect(() => assertSafeUrl('https://10.0.0.1/x')).toThrow(SSRFBlockedError);
    expect(() => assertSafeUrl('https://192.168.1.1/x')).toThrow(SSRFBlockedError);
    expect(() => assertSafeUrl('https://169.254.169.254/x')).toThrow(SSRFBlockedError);
    expect(() => assertSafeUrl('https://172.16.0.1/x')).toThrow(SSRFBlockedError);
  });
  it('rejects private IPv6 literals', () => {
    expect(() => assertSafeUrl('https://[::1]/x')).toThrow(SSRFBlockedError);
    expect(() => assertSafeUrl('https://[fc00::1]/x')).toThrow(SSRFBlockedError);
  });
  it('allows private networks when explicitly opted in', () => {
    const u = assertSafeUrl('http://localhost:11434', { allowHttp: true, allowPrivateNetworks: true });
    expect(u.hostname).toBe('localhost');
  });
});
