# Deploying cinestudio (single-user, self-hosted)

This guide targets the **single-user self-hosted** profile: one Docker container
on one host, SQLite for state, filesystem for artefacts. No Redis, no Postgres,
no S3, no horizontal scaling.

> **Important security notes before you start:**
> - cinestudio runs long-lived in-flight jobs (often 10–60 minutes per run).
>   Serverless hosts (Vercel, Cloudflare Workers) will kill long requests.
>   Always run it on a long-lived container or VM.
> - The default config has **no auth**. Set `CINESTUDIO_AUTH_TOKEN` and
>   `CINESTUDIO_SECRET` or anyone who can reach the port can read your
>   runs and your API keys.

---

## 1. Prerequisites

- Linux host (any modern distro) with Docker 24+ and Docker Compose v2
- 2 vCPU / 4 GB RAM minimum (8 GB recommended for parallel render)
- 50 GB disk (renders + sessions can be large)
- Inbound port 3000 open (or behind a reverse proxy — see §6)
- An A-record or DDNS pointing at your host's public IP (for TLS)

---

## 2. Configure environment

```bash
cp .env.example .env
chmod 600 .env
```

Edit `.env` and set at minimum:

```dotenv
# Generate with: openssl rand -hex 32
CINESTUDIO_AUTH_TOKEN=<32-byte-hex>
CINESTUDIO_SECRET=<32-byte-hex>

# Pick at least one provider key
MINIMAX_API_KEY=sk-...

LOG_LEVEL=info
TZ=UTC
NODE_ENV=production
```

`CINESTUDIO_AUTH_TOKEN` gates all `/api/**` and UI routes.
`CINESTUDIO_SECRET` encrypts API keys at rest in SQLite (AES-256-GCM via scrypt).
If unset, secrets are stored in plaintext (dev only).

---

## 3. Build and start

```bash
docker compose build
docker compose up -d
docker compose logs -f cinestudio
```

The container mounts two named volumes:
- `cinestudio_data` → `/data` (SQLite DB + Strands session files)
- `cinestudio_artifacts` → `/artifacts` (renders, portraits, audio, logs)

These persist across container recreations. To wipe state, run
`docker compose down -v`.

---

## 4. First-run setup

1. Browse to `http://<host>:3000` (or `https://…` behind a reverse proxy).
2. If `CINESTUDIO_AUTH_TOKEN` is set, the login screen asks for the token.
   Paste it; you get a 30-day HttpOnly cookie.
3. The onboarding screen walks you through provider setup. Click
   **Test connections** to ping MiniMax / Bedrock / etc. before saving.
4. **Save & continue** lands you on the dashboard.

API keys are encrypted at rest as soon as `CINESTUDIO_SECRET` is set.
A subsequent `GET /api/config` returns `apiKeySet: true` instead of the
key itself.

---

## 5. Healthchecks and monitoring

| Endpoint        | Purpose                                                   |
| --------------- | --------------------------------------------------------- |
| `/api/healthz`  | DB + disk. Returns 200 if healthy, 503 if degraded.       |
| `/api/readyz`   | Quick DB ping. Returns 200 once schema migrations done.   |

Use these for `healthcheck` directives in your orchestrator (already wired
in `docker-compose.yml`) and for any external uptime monitor (Uptime Kuma,
BetterStack, etc.). The container's stdout is structured JSON — pipe to
your existing log aggregator (Loki, Datadog, etc.) via the standard Docker
json-file driver.

**Backups:** snapshot the `cinestudio_data` named volume nightly. SQLite is
in WAL mode, so a `cp` while the container is running is unsafe; stop the
container (or use SQLite's `.backup` command via the volume) before copying.

```bash
docker compose stop cinestudio
docker run --rm -v cinestudio_data:/data -v $PWD:/backup alpine \
  sh -c 'apk add sqlite && sqlite3 /data/cinestudio.db ".backup /backup/cinestudio-$(date +%F).db"'
docker compose start cinestudio
```

---

## 6. Reverse proxy + TLS

Run a Caddy or nginx in front of the container. Minimal Caddyfile:

```caddy
cinestudio.example.com {
  reverse_proxy 127.0.0.1:3000
  encode gzip zstd
}
```

If you put a TLS terminator in front, set `Trust-Host` headers so
Next.js knows the original scheme:

```caddy
cinestudio.example.com {
  reverse_proxy 127.0.0.1:3000 {
    header_up X-Forwarded-Proto {scheme}
    header_up X-Forwarded-Host {host}
  }
}
```

---

## 7. Upgrading

```bash
git pull
docker compose build --pull
docker compose up -d
```

SQLite migrations run on every `getDb()` call and are idempotent.
The app starts serving as soon as `next start` boots.

---

## 8. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `ECONNREFUSED` to MiniMax | `MINIMAX_BASE_URL` or network egress blocked |
| Run stuck in `queued` | Look at `docker compose logs`; orchestrator crash leaves runs in `queued` |
| SSE stream never closes | Browser lost focus / network dropped; reload the page |
| `unauthorized` everywhere | Cookie expired; log in again |
| `/api/healthz` returns 503 | DB unreachable or disk full — check `cinestudio_data` volume |
| `CINESTUDIO_SECRET required` error | Set the env var; existing plaintext keys need re-save after rotation |

---

## 9. Security checklist before exposing publicly

- [ ] `CINESTUDIO_AUTH_TOKEN` set and rotated periodically
- [ ] `CINESTUDIO_SECRET` set so API keys are encrypted at rest
- [ ] TLS terminator in front (Caddy / nginx / Cloudflare)
- [ ] Inbound port 3000 not directly exposed to the internet
- [ ] SSH key-only auth on the host; no password login
- [ ] `ufw`/`firewalld` blocking everything except 80/443
- [ ] Backups verified restorable (do a dry run before relying on them)
- [ ] `LOG_LEVEL=info` (avoid `debug` in production)
- [ ] Disk alerts configured (renders can fill disk fast)
