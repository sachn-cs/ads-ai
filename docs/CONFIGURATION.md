# Configuration

cinestudio's configuration lives at `./data/cinestudio.db` (config row in `configs` table). You don't need to edit it directly — the onboarding wizard at `/onboarding/setup` writes it through `PUT /api/config`.

## Environment Variables

```bash
# Where SQLite + sessions live
CINESTUDIO_DATA_DIR=./data
CINESTUDIO_ARTIFACT_DIR=./artifacts

# Optional — for direct provider access from env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
MINIMAX_API_KEY=
AWS_ACCESS_KEY_ID=     # for Bedrock
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
OLLAMA_BASE_URL=http://localhost:11434
```

If env vars are set, the onboarding form pre-populates them.

## CinestudioConfig

The full CinestudioConfig JSON schema:

```ts
interface CinestudioConfig {
  version: string;
  textProvider: {
    enabled: boolean;
    provider: 'bedrock' | 'anthropic' | 'openai' | 'google' | 'ollama' | 'minimax';
    model: string;
    apiKey?: string;
    baseUrl?: string;
    region?: string;
    temperature?: number;
    maxTokens?: number;
  };
  renderProviders: {
    veo?:    { enabled: boolean; model: string; apiKey?: string; baseUrl?: string; projectId?: string; maxConcurrentShots: number };
    sora?:   { enabled: boolean; model: string; apiKey?: string; baseUrl?: string; maxConcurrentShots: number };
    runway?: { enabled: boolean; model: string; apiKey?: string; baseUrl?: string; maxConcurrentShots: number };
    minimax:{ enabled: boolean; model: string; apiKey?: string; baseUrl?: string; maxConcurrentShots: number };
  };
  multimodal: {
    image:  { enabled: boolean; provider: 'minimax'; model: string; apiKey?: string; baseUrl?: string };
    speech: { enabled: boolean; provider: 'minimax'; model: string; apiKey?: string; baseUrl?: string };
    music:  { enabled: boolean; provider: 'minimax'; model: string; apiKey?: string; baseUrl?: string };
  };
  defaults: {
    maxIterations: number;
    qualityThreshold: number;
    targetRuntimeSeconds: { min: number; max: number };
    aspectRatio: '16:9' | '9:16' | '1:1' | '21:9';
    enableVideoRender: boolean;
    enableAudioScore: boolean;
    ideaExpansionCount: number;
  };
  updatedAt: string;
}
```

## Defaults

`DEFAULT_CONFIG` ships with MiniMax pre-enabled everywhere. To start a film immediately:

```json
{
  "version": "0.1.0",
  "textProvider": {
    "enabled": true,
    "provider": "minimax",
    "model": "MiniMax-M3"
  },
  "renderProviders": {
    "minimax": {
      "enabled": true,
      "model": "MiniMax-H3",
      "maxConcurrentShots": 4
    }
  },
  "multimodal": {
    "image":  { "enabled": true, "provider": "minimax", "model": "image-01" },
    "speech": { "enabled": true, "provider": "minimax", "model": "speech-2.8-hd" },
    "music":  { "enabled": true, "provider": "minimax", "model": "music-3.0" }
  },
  "defaults": {
    "maxIterations": 3,
    "qualityThreshold": 70,
    "targetRuntimeSeconds": { "min": 30, "max": 120 },
    "aspectRatio": "16:9",
    "enableVideoRender": true,
    "enableAudioScore": false,
    "ideaExpansionCount": 3
  },
  "updatedAt": "..."
}
```

All that's missing is `apiKey`. Set it via the onboarding wizard or directly:

```bash
sqlite3 ./data/cinestudio.db \
  "UPDATE configs SET config_json = REPLACE(config_json, '\"enabled\":true,\"provider\":\"minimax\",\"model\":\"MiniMax-M3\"', '\"enabled\":true,\"provider\":\"minimax\",\"model\":\"MiniMax-M3\",\"apiKey\":\"YOUR_KEY\"') WHERE id='default'"
```

## Provider-specific notes

### MiniMax (one key, all modalities)

Sign up at <https://platform.minimax.io>, subscribe to a Token Plan, and use the resulting key as `MINIMAX_API_KEY` (or paste into the onboarding form). The single key unlocks:

| Modality | Endpoint | Default model |
|----------|----------|---------------|
| Text | `https://api.minimax.io/anthropic/v1/messages` | `MiniMax-M3` |
| Video | `https://api.minimax.io/v2/video_generation` (async poll `/v2/query/video_generation/{id}`) | `MiniMax-H3` |
| Image | `https://api.minimax.io/v1/image_generation` | `image-01` |
| Speech | `https://api.minimax.io/v1/t2a_v2` | `speech-2.8-hd`, `speech-2.8-turbo` |
| Music | `https://api.minimax.io/v1/music_generation` | `music-3.0`, `music-2.6` |
| File upload | `https://api.minimax.io/v1/files/upload` | — |

### Bedrock (no API key — uses AWS_* env)

`textProvider.region` is required. Defaults to `us-east-1`. Bedrock renders aren't supported; pick `veo` / `sora` / `runway` / `minimax` for the render stage.

### Ollama (local)

`baseUrl` defaults to `http://localhost:11434`. `apiKey` is ignored. For multimodal agents Ollama is not used — the pipeline falls back to text-only.

### Anthropic / OpenAI / Google

Standard SDK calls. `apiKey` required. Use the default models or override.

## Verifying your configuration

The onboarding form has a **Test connections** button. It pings each enabled provider and shows `{ok, latencyMs, error?}` per provider. The MiniMax probe hits both `/v1/models` (auth check) and `/anthropic/v1/messages` (real inference).

If you want to verify from the CLI:

```bash
curl -sS http://localhost:3000/api/config | python3 -m json.tool
```

## DB migrations

cinestudio uses `pnpm db:migrate` (or `pnpm db:reset` to wipe first). Migrations are tracked in the `migrations` table so re-running is idempotent.

```
$ pnpm db:migrate
[migrate] applying schema...
[migrate] schema OK
[migrate] no pending migrations
[migrate] done
```

If you have an existing DB at `./data/cinestudio.db`, the runner opens it and applies only the migrations that haven't run yet. Tables added in v2:
- `idea_variants` (chunk 2)
- `multimodal_assets` (chunk 2)
- `render_jobs` (chunk 2)
- `migrations` (chunk 2)
- New column `runs.selected_variant_id` (chunk 2)

The `runs.cost_total_usd` column reserved for the dropped cost dashboard is also added but not currently surfaced in UI.
