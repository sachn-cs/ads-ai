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

### Cinestudio-Specific Notes

- cinestudio persists API keys in plain text in `./data/cinestudio.db`. For
  production deployments, swap this for an encrypted secrets store and
  inject keys via `process.env` only.
- Rendered video artifacts in `./artifacts/runs/<id>/` may contain
  third-party-IP-derived imagery. Use the `rights_clearance` agent's report
  before publishing.
- The Critic agent's `iteration_controller` runs in a loop with a
  `maxIterations` cap. Default is 3 — review this cap if your prompt
  budget allows more cycles.
- The SSE stream `/api/runs/[id]/stream` does not implement per-user
  authorization. Run the dashboard behind your auth layer (NextAuth,
  Auth.js, Clerk, ...) before exposing publicly.
