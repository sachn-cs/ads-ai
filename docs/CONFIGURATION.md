# Configuration

cinestudio stores its configuration in a local SQLite database (`./data/cinestudio.db`)
by default. There is no required environment variable — the onboarding screen captures
all keys and saves them to the DB.

## Required (none — fully onboarding-driven)

cinestudio can boot with no environment variables set. The onboarding screen will
prompt for the first text provider configuration.

## Optional Environment Overrides

| Variable | Default | Purpose |
|----------|---------|---------|
| `CINESTUDIO_DATA_DIR` | `./data` | Where SQLite + cache live |
| `CINESTUDIO_ARTIFACT_DIR` | `./artifacts` | Where rendered videos land |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |

## Provider-Specific Environment Variables

These are only used when the provider is configured to read them. The onboarding
form takes precedence over the environment when both are set.

| Provider | Variable | Used for |
|----------|----------|----------|
| Bedrock | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | BedrockModel auth |
| Anthropic | `ANTHROPIC_API_KEY` | AnthropicModel auth |
| OpenAI | `OPENAI_API_KEY` | OpenAIModel + Sora auth |
| Google | `GOOGLE_GENERATIVE_AI_API_KEY` | GoogleModel + Veo auth |
| Ollama | `OLLAMA_BASE_URL` | VercelModel base URL |
| MiniMax | `MINIMAX_API_KEY` / `MINIMAX_BASE_URL` | VercelModel auth |
| Veo | `VEO_PROJECT_ID` / `VEO_MODEL` | Veo render |
| Runway | `RUNWAY_API_KEY` | Runway render |
| Sora | `SORA_API_KEY` | Sora render |

## Production Hardening

For production deployments we recommend:

- A managed Postgres or SQLite-on-disk location, not the local file system.
- Real provider keys injected via your secret store (AWS Secrets Manager, GCP
  Secret Manager, Vault). The onboarding screen accepts keys but you should not
  expect end-users to paste production keys.
- A queue (BullMQ, SQS, etc.) wrapping `startRun()` so long renders do not tie up
  the Next.js process.
- An object store (S3, R2, GCS) for `artifacts/` so rendered videos persist
  beyond the container.
