# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within cinestudio, please email
**sachncs@gmail.com**. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

### What to Include

When reporting a vulnerability, please include:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if available)

### Response Expectations

- **Acknowledgment**: Within 48 hours of your report
- **Initial assessment**: Within 1 week
- **Resolution timeline**: Depends on severity, typically 1-4 weeks

### Cinestudio-Specific Notes (v0.1.x)

- **Encryption at rest.** When `CINESTUDIO_SECRET` is set, API keys are
  stored in SQLite as AES-256-GCM ciphertext (`v1:iv:tag:enc`). Without the
  secret, keys fall back to plaintext (dev mode only). Rotate by setting
  a new `CINESTUDIO_SECRET` and re-saving the config.
- **Authentication.** `CINESTUDIO_AUTH_TOKEN` (>= 8 chars) gates every
  `/api/**` route and every page except `/login`, `/api/healthz`,
  `/api/readyz`. If unset, the app runs unauthenticated (dev only). The
  middleware accepts the token via a 30-day HttpOnly cookie or a
  `Authorization: Bearer …` header.
- **SSRF guard.** `/api/config/test` blocks `baseUrl` values that resolve
  to loopback, private, link-local, or ULA IPs unless `allowPrivateNetworks`
  is explicitly enabled (and even then only in non-prod).
- **Path-traversal guard.** AI-generated `shotId` and `artifactId` segments
  are sanitized before `path.join`; traversal sequences (`..`, `~`,
  control chars) are stripped and dot-prefixed inputs are rejected.
- **Rendered artefacts** in `./artifacts/runs/<id>/` may contain
  third-party-IP-derived imagery. Use the `rights_clearance` agent's report
  before publishing.
- The Critic agent's `iteration_controller` runs in a loop with a
  `maxIterations` cap. Default is 3 — review this cap if your prompt
  budget allows more cycles.
- `CINESTUDIO_AUTH_TOKEN` and `CINESTUDIO_SECRET` should both be >= 16
  random bytes. Generate with `openssl rand -hex 32`.

### Threat model (single-user self-hosted)

The app is designed for a single trusted operator running on a single
host behind a TLS terminator. Multi-user, multi-tenant, or serverless
deployments require additional hardening (per-user auth, rate limiting,
shared storage backend, etc.) that is out of scope for this release.