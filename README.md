<p align="center">
  <h1 align="center">cinestudio</h1>
  <p align="center">Multi-agent AI film rendering platform. 30-second spots to 20-minute shorts, coordinated by a 22-agent Strands Graph with multimodal (image / voice / music) generation through the MiniMax platform.</p>
  <p align="center">
    <a href="#installation"><img src="https://img.shields.io/badge/node-26%2B-brightgreen" alt="Node"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
    <a href="https://github.com/sachncs/cinestudio/actions"><img src="https://img.shields.io/github/actions/workflow/status/sachncs/cinestudio/ci.yml?branch=master" alt="CI"></a>
    <a href="https://github.com/sachncs/cinestudio/stargazers"><img src="https://img.shields.io/github/stars/sachncs/cinestudio" alt="Stars"></a>
  </p>
</p>

**cinestudio — a Strands Graph (deterministic DAG with optional cycle) of 22 specialized agents that takes a raw creative prompt through Idea → Style → Script → Characters → World → Storyboard → Production → Scoring → Post.**

The pipeline is anchored by MiniMax as the default multimodal backend — one MiniMax API key unlocks the text (MiniMax-M3), video (MiniMax-H3), image (image-01), speech (speech-2.8-hd), and music (music-3.0) routes end to end. Bedrock, Anthropic, OpenAI, Google, and Ollama remain first-class text alternatives; Veo, Sora, and Runway remain first-class render alternatives.

## Multi-agent Improvements Beyond the Reference Strands Pipeline

| Improvement                            | Description                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| **Cinematic Pipeline**                  | 22 specialized agents in a hand-tuned order that maps to a real production workflow     |
| **IdeaExpander**                       | Pre-pipeline agent that produces 3 CinestudioBrief candidates from a raw user prompt    |
| **StyleGuide**                          | Global visual bible (palette + lighting + lensing + grain) shared by every visual agent |
| **RenderDirector**                     | Cross-shot coherence pass: rewrites prompts to harmonize adjacent shots                |
| **Marketing**                          | Terminal agent: per-platform cutdown specs + thumbnail concepts + press blurb        |
| **Multimodal persistence**              | Character portraits, storyboard frames, voice lines, foley, score stems in multimodal_assets |
| **Parallel render Workflow**           | Custom Strands Node fans shots out concurrently across providers, bounded per-provider |
| **StyleGuide -> 5 agents**             | One StyleGuide node feeds character_designer, world_builder, storyboard consistently     |
| **Render jobs tracking**               | Per-shot provider_job_id persisted to render_jobs for poll/resume                    |
| **Session persistence**                | SessionManager + FileStorage at ./data/sessions; resume on crash                       |
| **contextManager:'auto'**              | SummarizingConversationManager + ContextOffloader keeps long agent histories in scope  |
| **Custom retry strategy**              | DefaultModelRetryStrategy + ExponentialBackoff 4-128s with full jitter                |
| **abortSignal**                       | Strands-cancellable pipeline wired to the run page's Cancel button                     |

## Features

- **22 specialized agents** coordinated by a Strands Graph with a custom Node for parallel render
- **Multi-provider text LLM** — Bedrock (default), Anthropic, OpenAI, Google, Ollama, MiniMax
- **Multi-provider video render** — Veo 3.1, Sora 2, Runway, **MiniMax-H3 (recommended)**
- **Multimodal MiniMax integration** — Image (image-01), Speech (speech-2.8-hd), Music (music-3.0), File Upload (voice clone + image refs). One MiniMax API key covers every modality.
- **IdeaExpander** — 3 CinestudioBrief candidates per user prompt with model confidence
- **StyleGuide** — global visual bible (palette + lighting + lensing + grain)
- **RenderDirector** agent + **Marketing** agent for cutdowns, thumbnails, press
- **SSE streaming** — events for run_started, agent_started/completed/failed, render_*, run_*, plus heartbeat. Replays historical events on reconnect.
- **Two-step new-film flow** — write prompt → pick variant from 3 candidates → pipeline starts
- **Run page** with stage-by-stage rail, multimodal asset gallery, Cancel button
- **CinestudioConfig persistence** in SQLite (WAL mode, foreign keys on)
- **Migrations runner** — `migrations` table tracks applied migrations so re-running `pnpm db:migrate` is idempotent

## Installation

### From source

```bash
git clone https://github.com/sachncs/cinestudio.git
cd cinestudio
pnpm install
```

### From a Next.js template

```bash
npx create-next-app@latest my-cinestudio --typescript --app --tailwind
# then add the cinestudio runtime + agents:
pnpm add @strands-agents/sdk @google/genai openai @anthropic-ai/sdk better-sqlite3
```

## Quick Start

### Web UI (Next.js 16)

```bash
# Install + migrate + dev
pnpm install
pnpm db:migrate
pnpm dev          # http://localhost:3000

# First launch:
#   1. Pick MiniMax (recommended); one key covers text + video + image + speech + music
#   2. Set the MiniMax key, model (MiniMax-M3), and toggle which multimodals are on
#   3. Click 'Test connections' — server pings each provider with latency / status
#   4. Click 'Save & continue' — routed to the dashboard

# Create a film:
#   1. Click 'New film', write your idea, pick genre
#   2. IdeaExpander produces 3 CinestudioBrief candidates
#   3. Pick one; pipeline starts: StyleGuide -> Script -> Characters -> World
#      -> Storyboard -> Production (parallel renders) -> Scoring -> Post
#   4. Run page shows a stage-by-stage rail, multimodal asset gallery, Cancel
```

### HTTP API (curl)

```bash
# 1. Generate 3 idea variants
RUN=$(curl -sS -X POST -H 'Content-Type: application/json' \
  -d '{"prompt":"A teacher reads a letter on a quiet morning."}' \
  http://localhost:3000/api/ideas/expand)
RUN_ID=$(echo "$RUN" | python3 -c "import sys, json; print(json.load(sys.stdin)['runId'])")

# 2. List variants; pick one
curl -sS "http://localhost:3000/api/ideas/$RUN_ID" | python3 -m json.tool

# 3. Select variant 0 -> marks run as 'queued' -> orchestrator picks up
curl -sS -X POST -H 'Content-Type: application/json' \
  -d '{"variantIndex":0}' \
  "http://localhost:3000/api/ideas/select/$RUN_ID"

# 4. Stream run progress over SSE
curl -N "http://localhost:3000/api/runs/$RUN_ID/stream"
```

| Option                  | Default       | Description                                |
| ----------------------- | ------------- | ------------------------------------------ |
| `--prompt <string>`    | required      | Idea / logline / treatment                 |
| `--genre <string>`      | `narrative_short` | Optional genre marker                 |
| `--count <1-5>`        | `3`           | IdeaExpander candidate count               |

### Node.js API (TypeScript)

```typescript
import {
  invokeCinestudioPipeline,
  CinestudioConfig,
  IdeaVariantSchema,
} from 'cinestudio';

const config: CinestudioConfig = await loadConfig(); // ./data/cinestudio.db

const result = await invokeCinestudioPipeline({
  runId: 'r1',
  prompt: 'A teacher reads a letter on a quiet morning.',
  config,
});

console.log('Composite quality:', result.iterationResult.composite.overallScore);
console.log('Final film assembly:', result.iterationResult.assembly);
```

## CinestudioConfig

```typescript
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

## Configuration

No environment variables are required for core usage. Defaults are tuned for paper-quality cinematic output. `MINIMAX_API_KEY` env var is read as a fallback by the onboarding screen.

| Setting             | Default       | Description                                 |
| ------------------- | ------------- | ------------------------------------------- |
| `textProvider.provider` | `bedrock`  | `bedrock` / `anthropic` / `openai` / `google` / `ollama` / `minimax` |
| `textProvider.model` | `MiniMax-M3` | Model ID for the chosen text provider        |
| `renderProviders.minimax.enabled` | `true` | Enable MiniMax-H3 (recommended default)  |
| `renderProviders.{veo,sora,runway}.enabled` | `false` | Opt-in per-provider                |
| `multimodal.image.enabled` | `true` | MiniMax image-01 for portraits + frames |
| `multimodal.speech.enabled` | `true` | MiniMax speech-2.8-hd for TTS + foley   |
| `multimodal.music.enabled` | `true` | MiniMax music-3.0 for score stems        |
| `defaults.maxIterations` | `3`     | Critic → iteration cycles                  |
| `defaults.qualityThreshold` | `70` | Composite GO/NO-GO cut-off                  |
| `defaults.ideaExpansionCount` | `3` | IdeaExpander candidates (1..5)            |

## HTTP API

| Symbol                                                                     | Type    | Description                                       |
| -------------------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `POST /api/ideas/expand`                                                  | route   | Body `{prompt, count?}`. Runs IdeaExpander; returns `{runId, result: IdeaExpansionResult}`. Sets run status to `awaiting_review`. |
| `GET /api/ideas/[id]`                                                      | route   | Returns the persisted variants for a run          |
| `POST /api/ideas/select/[id]`                                              | route   | Body `{variantIndex}`. Marks chosen variant; transitions run to `queued`. |
| `POST /api/runs`                                                           | route   | Body `{prompt?, runId?, brief?}`. Three shapes: legacy create-from-prompt, resume-with-brief, resume-with-selected-variant. |
| `GET /api/runs`                                                            | route   | Lists recent runs                                 |
| `GET /api/runs/[id]`                                                       | route   | Returns run row + per-agent outputs               |
| `GET /api/runs/[id]/stream`                                                | route   | SSE stream: replays `run_events` from `?since=N`, then streams live events + heartbeat. Closes when run status ∈ {completed, failed, cancelled}. |
| `POST /api/runs/[id]/cancel`                                               | route   | Flips status to `cancelled`, emits `run_failed`.  |
| `GET /api/runs/[id]/agents`                                                | route   | Per-agent outputs (optional `?agent=<id>` filter) |
| `GET /api/runs/[id]/multimodal`                                            | route   | Lists `multimodal_assets` rows for the run        |
| `GET /api/config`                                                          | route   | Returns CinestudioConfig                           |
| `PUT /api/config`                                                          | route   | Body CinestudioConfig; persists                  |
| `POST /api/config/test`                                                    | route   | Body `{providers: [{provider, apiKey?, model, baseUrl?}]}`. Probes each enabled provider; returns `{results: [{provider, ok, latencyMs, error?}]}`. |

## Examples

### Two-step new-film flow via the web UI

```bash
# 1. Generate variants
RUN_ID=$(curl -sS -X POST -H 'Content-Type: application/json' \
  -d '{"prompt":"A teacher reads a letter on a quiet morning.","count":3}' \
  http://localhost:3000/api/ideas/expand | jq -r .runId)

# 2. List variants; user picks 0 in UI -> IdeaPicker fires POST /api/ideas/select/$RUN_ID
curl -sS "http://localhost:3000/api/ideas/$RUN_ID" | jq '.variants[].brief.logline'

# 3. Run status flips to 'queued' -> orchestrator picks up automatically
#    POST /api/runs {runId} (or just wait; status='queued' is enough)
curl -sS "http://localhost:3000/api/runs/$RUN_ID" | jq '{status, brief: .brief_json | fromjson | .logline}'

# 4. Watch SSE progress
curl -N "http://localhost:3000/api/runs/$RUN_ID/stream" | grep -E "^(data:|event:)" | head -20
```

### Multimodal asset hooks fire automatically

```typescript
// character_designer calls MiniMax image-01 per character -> persists
// kind='character_portrait' to multimodal_assets.
const portraits = await fetch(`/api/runs/${runId}/multimodal`).then((r) => r.json());
const heroPortrait = portraits.assets.find(
  (a) => a.kind === 'character_portrait' && a.artifact_id === 'character-hero',
);
```

### Config test from the onboarding form

```typescript
const res = await fetch('/api/config/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    providers: [
      { provider: 'minimax', apiKey: 'sk-...', model: 'MiniMax-M3' },
    ],
  }),
});
const { results } = await res.json();
// results[0]: { provider: 'minimax', ok: true, latencyMs: 1243 }
```

### Custom CinestudioConfig + lifecycle

```typescript
import { CinestudioConfig, runCinestudioPipeline } from 'cinestudio';

const cfg: CinestudioConfig = {
  // ... (see schema above)
  textProvider: { enabled: true, provider: 'minimax', model: 'MiniMax-M3', apiKey: '...' },
  // ...
};

const controller = new AbortController();
const result = await runCinestudioPipeline({
  runId: 'r1',
  prompt: '...',
  config: cfg,
  abortSignal: controller.signal, // Cancel button
});
```

## Architecture

The system is organized into five layers:

| Layer              | Directory                            | Responsibility                                                     |
| ------------------ | ------------------------------------ | ------------------------------------------------------------------ |
| **Domain**         | `src/models/`                        | Zod schemas for every cross-boundary object                          |
| **Agents**         | `src/agents/`                        | 22 specialized agents as Strands Agent instances + invoke functions   |
| **Pipeline**       | `src/graph/` + `src/workflow/`        | Strands Graph construction + custom Node subclasses                  |
| **Persistence**    | `src/db/` + `src/providers/`          | SQLite migrations + MiniMax + Veo + Sora + Runway integrations       |
| **Stream**         | `src/stream/`                        | In-memory event bus + SSE replayer + DB persistence                 |

The `CinestudioSeedPlugin` reads `invocationState` (which contains `runId`, `config`, `userPrompt`) and seeds the Graph's `StateStore` so every downstream agent has the run context without manual plumbing.

```
USER prompt → [POST /api/ideas/expand] → IdeaExpander
                                          ↓ (3 CinestudioBrief candidates)
                                     user picks via IdeaPicker
                                          ↓
                                     [POST /api/runs {runId, brief}]
                                          ↓
                                     Graph runs linearly:
                                       showrunner → style_guide → script_writer → character_designer
                                                → world_builder → storyboard → shot_planner → render_dispatch
                                                → continuity_checker / critique → scoring → editor
                                                → colorist → composer → sound_designer → voice_casting
                                                → distribution → rights_clearance
                                          ↓
                                     orchestrator iteration loop
                                          ↓
                                     final composite + assembly + rights + marketing assets
```

The `render_dispatch` node is a custom Strands Node. It reads `shotBatches` from `state.app`, fans out per-shot calls in parallel using `pAll`, bounded by each provider's `maxConcurrentShots`. On completion, writes `renderResults` back to `state.app`. Failures are caught per-shot — one failing shot doesn't kill the batch.

## Design Philosophy

- **Parallel fan-out for renders** — A custom Strands Node (RenderDispatchNode) wraps a pAll-style parallel executor. Sequential per provider's maxConcurrentShots; failure-isolated per shot.
- **StateStore as the single source of truth between agents** — Every agent reads inputs and writes outputs to `state.app`. The Plugin reads `invocationState` once at the top of the Graph and seeds run-level fields (`runId`, `cycleNumber`, etc.).
- **AND semantics on incoming edges** — Strands TS Graph fires a node only when ALL incoming sources complete. We exploited this to make StyleGuide's downstream agents (char/world/storyboard) wait for StyleGuide + showrunner without custom edge handlers.
- **Multimodal is opt-in per modality** — Each multimodal agent gates its API call on `config.multimodal.{image|speech|music}.enabled` + `apiKey`. Failures are caught and logged; the pipeline never blocks on missing multimodal output.
- **Iteration is imperative, not Graph-embedded** — TS Graph's AND semantics + cycle detection made iteration loops deadlock. The orchestration loop lives in `src/orchestrator/iterate.ts` and reads state from SQLite between cycles.
- **Strands capabilities are reused, not re-implemented** — SessionManager (FileStorage), `contextManager: 'auto'` (Summarizing + Offloader), retry strategy, abortSignal. No custom plumbing for what the SDK already provides.

## Key Implementation Details

### Strands TS Graph Cycle Deadlock Fix

The original Graph had `scoring → iteration_controller → render_dispatch (cycle)`. With AND semantics on incoming edges, `render_dispatch` required both `shot_planner` AND `iteration_controller` to complete, but `iteration_controller` was downstream of `render_dispatch`. Deadlock.

Fix: dropped the cycle. The main Graph is now strictly linear. Iteration is driven by `src/orchestrator/iterate.ts` which reads the composite from SQLite between cycles and (in a future chunk) invokes `render_dispatch` with `preserveShotIds` to surgically re-render only the failing shots.

### Multi-Modal Pipeline Writes

Each of character_designer, storyboard, composer, sound_designer, voice_casting writes to the `multimodal_assets` table inside its invoke function. The run page renders these via `<MultimodalGallery />` grouped by kind.

### `ContextOffloader` Auto-Composition

Setting `contextManager: 'auto'` on every Agent constructs both `SummarizingConversationManager` (summary ratio 0.3, compression threshold 0.85) and `ContextOffloader` (max 1,500 result tokens). Critical for the 17-agent pipeline — keeps long multi-turn agent histories within the model's context window.

### DefaultModelRetryStrategy

```ts
new Agent({
  retryStrategy: new DefaultModelRetryStrategy({
    maxAttempts: 6,
    backoff: new ExponentialBackoff({ baseMs: 4_000, maxMs: 128_000, multiplier: 2, jitter: 'full' }),
  }),
});
```

Retries on `ModelThrottledError` from text providers. Render providers have their own implicit polling backoff in their respective modules.

### SSE Persistence + Replay

`/api/runs/[id]/stream` replays all events with id > `?since=N` (or all if unset), then subscribes to in-memory `RunBus`. Closes when run status ∈ {completed, failed, cancelled}. Pings `: keepalive` every 15s.

### MiniMax API Surface

| Modality | Endpoint | Method |
|----------|----------|--------|
| Text | `https://api.minimax.io/anthropic/v1/messages` | Anthropic SDK |
| Video | `https://api.minimax.io/v2/video_generation` | POST + poll `/v2/query/video_generation/{id}` every 10s up to 20min |
| Image | `https://api.minimax.io/v1/image_generation` | POST + download returned URL |
| Speech | `https://api.minimax.io/v1/t2a_v2` | POST + decode hex audio |
| Music | `https://api.minimax.io/v1/music_generation` | POST + decode hex audio |
| File Upload | `https://api.minimax.io/v1/files/upload` | multipart POST |

All providers use the same `Authorization: Bearer ${MINIMAX_API_KEY}`. One key covers every modality.

## The Math

### Strands TS Graph AND-Semantics Edge Traversal

A node fires only when ALL of its incoming edges' sources have completed and are `COMPLETED`. If any incoming source is `FAILED`, the node still fires (failures propagate via `result.results[]`, not via blocked scheduling).

### Render Dispatch Concurrency

`maxConcurrentInFlight = Σ_providers min(maxConcurrentShots[p], shots_using_p)`. With MiniMax-H3 defaulting to `maxConcurrentShots: 4`, an 8-shot render dispatches all 8 concurrently. The custom Node awaits `Promise.all` and catches per-shot failures so one failing shot doesn't abort the batch.

### StyleGuide → 5 Visual Agents

`prompt += styleGuide.palette + styleGuide.lighting + styleGuide.lensing + styleGuide.globalConstraints` is prepended to every downstream visual agent's user message. This makes the entire film feel like one film, not 17 disconnected shots.

### IdeaExpander Confidence Scoring

Each of 3 variants gets `confidence ∈ [0, 1]`. The orchestrator sorts variants by `confidence DESC` so the next user's best guess lands first. Low-confidence variants are flagged with `(low confidence)` in the IdeaPicker UI.

### Render Polling Backoff

Default `POLL_INTERVAL_MS = 10_000` (5_000 for Veo, 2_000 for Sora which streams progress). Total wall-clock cap `DEFAULT_TIMEOUT_MS = 20 * 60 * 1000` for video. Resumable via `runs.selected_variant_id` + the abortSignal.

### Quality Composite

`composite.overallScore = trimmedMean(perShotOverallScore)` (drop best + worst when N ≥ 6). `composite.recommendation ∈ {iterate, proceed, halt}`:
- `proceed` if `overallScore ≥ 0.95 × qualityThreshold`
- `halt` if any shot has criticalIssue
- `iterate` otherwise

### Multimodal Artifact Storage

Each multimodal call writes `multimodal_assets` rows with `storage_path = ${artifactDir}/multimodal/${kind}/${artifactId}.{ext}`. The run page's `<MultimodalGallery />` reads these via `/api/runs/[id]/multimodal` and renders them grouped by kind.

## Performance Tips

- **Quick test:** `defaults.maxIterations: 1, renderProviders.minimax.maxConcurrentShots: 4`. One render pass.
- **Production:** `defaults.maxIterations: 3` (Critic-driven). MiniMax defaults to `maxConcurrentShots: 4`; raise to 8 if your account quota allows.
- **Cost control:** Disable `multimodal.image` / `speech` / `music` for a text-only run. Each portrait costs ~$0.01, each frame ~$0.01, each minute of TTS ~$0.10, each minute of music ~$0.30.
- **Local-only:** Use `ollama` text + `veo`/`sora`/`runway` render (MiniMax only for multimodal). Cinestudio gracefully skips multimodal calls when the corresponding flag is off.
- **Cancel mid-run:** Click "Cancel run" on the run page. `AbortSignal` propagates to all in-flight agent invocations and tool calls within seconds.

## Development

```bash
pnpm install
pnpm dev                  # http://localhost:3000
pnpm build                # next build
pnpm start                # next start (production)
pnpm typecheck            # tsc --noEmit
pnpm lint                 # eslint
pnpm lint:fix
pnpm format               # prettier --write .
pnpm format:check
pnpm test                 # vitest run (33 tests)
pnpm test:watch
pnpm test:coverage        # vitest --coverage
pnpm db:migrate           # apply SQLite migrations
pnpm db:reset             # wipe + re-apply
```

## Testing

```bash
pnpm test                  # vitest run — 33 tests across 10 spec files
pnpm test:watch
pnpm test:coverage
```

Coverage:

- `tests/lib.test.ts` — `pAll` concurrency, ULID, JSON safe.
- `tests/config.test.ts` — CinestudioConfig round-trip.
- `tests/enums.test.ts` — `NO_GO not NO-GO`, snake_case naming, valid aspect ratios.
- `tests/models.test.ts` — CinestudioBrief validates.
- `tests/models-new.test.ts` — IdeaVariant / IdeaExpansionResult / StyleGuide / RenderDirective / MarketingAsset validate.
- `tests/render-veo.test.ts`, `tests/render-sora.test.ts`, `tests/render-runway.test.ts` — real SDK/fetch mocking per render provider.
- `tests/graph.test.ts` — CinestudioGraph construction smoke test.
- `tests/graph-e2e.test.ts` — **end-to-end test**: 17-agent pipeline executes in order with mocked LLM, verifies all expected nodeIds appear in `result.results`.

## Build

```bash
pnpm build    # Next.js production build (Turbopack)
pnpm start    # serve production build
```

Artifacts:

- `.next/` — Next.js build output
- `data/cinestudio.db` — SQLite schema applied on first run
- `data/sessions/<runId>/.../snapshot_latest.json` — Strands session snapshots
- `artifacts/runs/<runId>/{renders,multimodal,...}` — per-run artifacts

## Release

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
# Bump version in package.json (e.g. 0.1.0 -> 0.2.0)
git tag v0.2.X && git push origin v0.2.X
```

## Project Structure

```
cinestudio/
├── app/
│   ├── (onboarding)/
│   │   └── onboarding/
│   │       ├── page.tsx                  # Welcome splash
│   │       └── setup/
│   │           └── page.tsx              # MiniMax-first wizard
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── layout.tsx
│   │       ├── page.tsx                  # Run list
│   │       ├── new/
│   │       │   └── page.tsx              # Compose + IdeaPicker
│   │       └── runs/[id]/
│   │           └── page.tsx              # Live run page
│   └── api/
│       ├── config/
│       │   ├── route.ts                  # GET / PUT CinestudioConfig
│       │   └── test/route.ts             # POST test connection
│       ├── ideas/
│       │   ├── expand/route.ts           # POST IdeaExpander
│       │   ├── select/[id]/route.ts       # POST select variant
│       │   └── [id]/route.ts             # GET variants
│       └── runs/
│           ├── route.ts                  # GET / POST runs
│           ├── [id]/
│           │   ├── route.ts              # GET run
│           │   ├── agents/route.ts       # GET per-agent outputs
│           │   ├── cancel/route.ts       # POST cancel
│           │   ├── multimodal/route.ts   # GET multimodal assets
│           │   └── stream/route.ts        # GET SSE stream
├── src/
│   ├── agents/                          # 22 specialized agents + invoke functions
│   │   ├── idea-expander.ts
│   │   ├── showrunner.ts
│   │   ├── style-guide.ts
│   │   ├── script-writer.ts
│   │   ├── character-designer.ts
│   │   ├── world-builder.ts
│   │   ├── storyboard.ts
│   │   ├── shot-planner.ts
│   │   ├── render-director.ts
│   │   ├── continuity-checker.ts
│   │   ├── critique.ts
│   │   ├── iteration-controller.ts
│   │   ├── scoring.ts
│   │   ├── editor.ts
│   │   ├── colorist.ts
│   │   ├── composer.ts
│   │   ├── sound-designer.ts
│   │   ├── voice-casting.ts
│   │   ├── rights-clearance.ts
│   │   ├── distribution.ts
│   │   ├── marketing.ts
│   │   ├── index.ts                      # AGENT_IDS + exports
│   │   └── factory.ts                    # makeAgent helper
│   ├── db/
│   │   ├── client.ts                     # SQLite singleton + applyMigrations
│   │   ├── schema.ts                     # SCHEMA_DDL + MIGRATIONS registry
│   │   ├── configs.ts                    # CinestudioConfig CRUD
│   │   ├── runs.ts                       # Run row CRUD
│   │   ├── events.ts                     # Agent outputs + run events
│   │   ├── idea-variants.ts              # 3 CinestudioBrief candidates per run
│   │   ├── multimodal-assets.ts          # Character portraits, frames, voice, etc.
│   │   └── render-jobs.ts                # Per-shot provider task tracking
│   ├── graph/
│   │   ├── cinestudio.ts                 # buildCinestudioGraph
│   │   └── plugin.ts                     # CinestudioSeedPlugin (state.app seeding)
│   ├── models/                           # Zod schemas (cinestudio domain)
│   │   ├── common.ts brief.ts character.ts world.ts script.ts
│   │   ├── storyboard.ts render.ts critique.ts scoring.ts
│   │   ├── iteration.ts editor.ts colorist.ts composer.ts
│   │   ├── sound.ts distribution.ts compliance.ts run.ts
│   │   ├── idea.ts style.ts directives.ts marketing.ts
│   │   └── index.ts
│   ├── providers/                        # Real API integrations
│   │   ├── factory.ts                    # textProvider dispatch
│   │   ├── minimax/
│   │   │   ├── shared.ts                # auth + helpers
│   │   │   ├── text.ts                  # MiniMax-M3 via Anthropic SDK
│   │   │   ├── video.ts                 # MiniMax-H3
│   │   │   ├── image.ts                 # image-01
│   │   │   ├── speech.ts                # speech-2.8-hd
│   │   │   ├── music.ts                 # music-3.0
│   │   │   └── upload.ts                # file uploads
│   │   ├── sora.ts                       # Sora via openai SDK
│   │   ├── runway.ts                     # Runway REST
│   │   ├── veo.ts                        # Veo via @google/genai
│   │   └── render-dispatcher.ts          # Per-provider dispatch
│   ├── orchestrator/
│   │   ├── run.ts                        # startRun (legacy create)
│   │   ├── run-graph.ts                  # runCinestudioPipeline (Graph + iter)
│   │   └── iterate.ts                    # Iteration loop driver
│   ├── prompts/system-prompts.ts          # 22 system prompts
│   ├── types/index.ts                    # CinestudioConfig + helpers
│   ├── stream/
│   │   ├── bus.ts                        # RunBus (in-memory event pub-sub)
│   │   └── sinks.ts                      # emit() + emitAgentOutput()
│   ├── workflow/
│   │   ├── agent-node.ts                 # Custom Node subclass wrapping invoke
│   │   ├── app-state.ts                  # AppState schema for state.app
│   │   ├── render-dispatch-node.ts       # Parallel render Workflow Node
│   │   └── strands.ts                    # SessionManager + retry strategy
│   └── lib/
│       ├── logger.ts                     # JSON structured logger
│       ├── id.ts                         # ULID
│       ├── json.ts                       # safe JSON
│       ├── promise.ts                    # pAll
│       └── artifacts.ts                  # filesystem paths
├── components/
│   ├── pipeline/
│   │   ├── stage-rail.tsx               # 9-stage production rail
│   │   └── multimodal-gallery.tsx       # Multimodal artifacts grid
│   ├── ui/                              # shadcn primitives
│   └── theme-provider.tsx
├── tests/                                # vitest specs (33 tests)
├── docs/
│   ├── ARCHITECTURE.md
│   └── CONFIGURATION.md
├── data/                                  # SQLite + sessions (gitignored)
├── artifacts/                             # per-run outputs (gitignored)
└── README.md
```

## Tech Stack

| Category       | Technology                                                                  |
| -------------- | --------------------------------------------------------------------------- |
| Language       | TypeScript 5.5+                                                             |
| Module system  | ES Modules (`type: module`)                                                |
| Runtime        | Node.js ≥ 26                                                                 |
| Build          | Next.js 16 + Turbopack                                                      |
| Lint           | ESLint 9 (flat config)                                                      |
| Type check     | `tsc --noEmit` (strict + `noUncheckedIndexedAccess`)                       |
| Format         | Prettier 3                                                                  |
| Test framework | Vitest + happy-dom                                                          |
| UI library     | Tailwind CSS + shadcn/ui (new-york style)                                    |
| Agent framework | Strands Agents TS SDK (`@strands-agents/sdk`)                              |
| LLM providers  | Bedrock, Anthropic, OpenAI, Google Gemini, Ollama, MiniMax                  |
| Render providers | Veo (`@google/genai`), Sora (`openai`), Runway, MiniMax-H3                |
| Persistence    | better-sqlite3 (WAL mode, foreign keys on)                                 |
| Realtime       | Server-Sent Events via Next.js Route Handlers                              |
| Runtime libs   | `@anthropic-ai/sdk`, `openai`, `@google/genai`, `@ai-sdk/openai-compatible`  |

## Roadmap

- **v1.x** — Current: 22-agent cinematic pipeline, MiniMax-first defaults, multimodal assets, Strands SessionManager + context management + retry strategy. 33 tests passing.
- **v1.2** — Planned: StyleGuide → render_dispatch as a single StyleGuide-aware render path (StyleGuide.palette embedded in each shot's reference_image_hint). Real-time SSE→WebSocket progress for multi-user collaboration.
- **v1.3** — Planned: Voice cloning UI (MiniMax /v1/files/upload already wired in src/providers/minimax/upload.ts). Multi-depot variant. Lightweight storyboard editor (drag-drop reordering).
- **v2.0** — Hardening: production sample bundles (a complete 30s + a complete 3min), release provenance, Dependabot, SECURITY.md, multi-user via API tokens, benchmark suite for render quality. Initial WebGPU client for browser-side preview.

## Contributing

Bug reports and PRs welcome on GitHub. Open an issue before sending
large changes so we can align on direction.

## Security

Report vulnerabilities to **sachncs@gmail.com**. Please don't open a
public issue for security-sensitive reports.

Common hardening notes:

- cinestudio persists API keys in plain text at `./data/cinestudio.db`. For
  production deployments, swap this for an encrypted secrets store and
  inject via `process.env` only.
- Rendered video artifacts in `./artifacts/runs/<id>/` may contain
  third-party-IP-derived imagery. Use the `rights_clearance` agent's
  report before publishing.
- The Critic agent's `iteration_controller` runs in a loop with a
  `maxIterations` cap (default 3). Review this cap if your prompt
  budget allows more cycles.
- The SSE stream `/api/runs/[id]/stream` does not implement per-user
  authorization. Run the dashboard behind your auth layer (NextAuth,
  Auth.js, Clerk, ...) before exposing publicly.

## License

[MIT](LICENSE) © 2026 Sachin

## References

- Strands Agents TS SDK — <https://strandsagents.com/>
- MiniMax platform — <https://platform.minimax.io/>
- Next.js 16 App Router — <https://nextjs.org/docs/app>
- Strands Agent Loop — <https://strandsagents.com/docs/user-guide/concepts/agents/agent-loop/>
- Strands Session Management — <https://strandsagents.com/docs/user-guide/concepts/agents/session-management/>
- Strands Context Management — <https://strandsagents.com/docs/user-guide/concepts/context-management/>
- Strands Tool Executors — <https://strandsagents.com/docs/user-guide/concepts/tools/executors/>
- Strands Retry Strategies — <https://strandsagents.com/docs/user-guide/concepts/agents/retry-strategies/>
