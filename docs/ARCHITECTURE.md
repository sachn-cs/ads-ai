# Architecture

## Cinematic spine (22 agents, 17 nodes in the Graph)

```
USER
  ↓ POST /api/ideas/expand  (outside Graph)
IdeaExpander produces 3 CinestudioBrief candidates
  ↓ user picks via IdeaPicker
  ↓ POST /api/runs {runId, brief}
main pipeline (Strands Graph, linear):

  showrunner       (CinestudioBrief)
    ↓
  style_guide      (StyleGuide)             ← NEW in v2
    ↓
  script_writer    (ScriptBreakdown)
    ↓
  character_designer (CharacterCast)        ← may produce portraits via MiniMax image
    ↓
  world_builder    (WorldDesign)
    ↓
  storyboard       (Storyboard)             ← may produce frames via MiniMax image
    ↓
  shot_planner     (RenderBatchPlan[])
    ↓
  render_dispatch  (custom Node, parallel fan-out)
    ↓
  continuity_checker / critique           (parallel branches)
    ↓
  scoring          (CompositeQualityReport)
    ↓
  editor → colorist → composer → sound_designer → voice_casting
                                                       ← composer/sound/voice may
                                                          produce audio via MiniMax
    ↓
  distribution → rights_clearance

  (orchestrator-driven, outside the Graph)
  iteration loop → reads composite, invokes iteration_controller,
                   optionally re-renders, repeats up to maxIterations
  marketing → reads assembly + voice + rights, produces MarketingAsset
```

## The 4 new agents

| Agent | Position | What it does |
|-------|----------|--------------|
| **IdeaExpander** | entry, before showrunner | Calls MiniMax Anthropic API; produces 3 CinestudioBrief candidates with rationale + confidence. User picks via UI. |
| **StyleGuide** | inline between showrunner and script_writer | Produces palette + lighting + lensing + grain + reference image hints + global constraints. fed to character_designer / world_builder / storyboard. |
| **RenderDirector** | orchestrator-driven, not in linear spine | Reviews shot plans for cross-shot coherence (palette, eyeline, character refs), writes surgical RenderDirective patches. |
| **Marketing** | terminal, after rights_clearance | Per-platform cutdowns, thumbnail concepts, press blurb, hashtags. |

## The parallel render Workflow

`RenderDispatchNode` is a custom Strands Node. It reads `shotBatches` from `state.app`, fans out per-shot calls in parallel using `pAll`, bounded by each provider's `maxConcurrentShots`. On completion, writes `renderResults` back to `state.app`. Failures are caught per-shot (one failing shot doesn't kill the batch).

Real provider SDKs:
- **Veo** via `@google/genai` (GoogleGenAI client) — `models.generateVideos` + `operations.getVideosOperation` poll + `files.download`
- **Sora** via `openai@7` SDK — `openai.videos.create` + `openai.videos.retrieve` poll + `openai.videos.downloadContent`
- **Runway** via raw fetch to `https://api.dev.runwayml.com/v1/text_to_video` + `/v1/tasks/{id}` poll
- **MiniMax-H3** via raw fetch to `https://api.minimax.io/v2/video_generation` + `/v2/query/video_generation/{id}` poll

## Multimodal wiring

All gated on `config.multimodal.{image|speech|music}.enabled` + `apiKey`. Falls back to text-only if disabled. Each pipeline that uses one of these writes artifacts to the `multimodal_assets` table:

| Agent | Multimodal call |
|-------|-----------------|
| `character_designer` | `minimax.image` for one portrait per character → `kind='character_portrait'` |
| `storyboard` | `minimax.image` for one frame per shot → `kind='storyboard_frame'` |
| `composer` | `minimax.music` for one stem per `MusicCue` → `kind='score_stem'` |
| `sound_designer` | `minimax.speech` for ambient beds + foley → `kind='foley'` |
| `voice_casting` | `minimax.speech` for one sample line per character → `kind='voice_line'` |

The run page renders all of these via `<MultimodalGallery />` (grouped by kind).

## StateStore contract

The `StateStore` (`state.app`) is the per-invocation key-value store exposed by Strands. cinestudio's nodes use it to:

| Key | Written by | Read by |
|-----|------------|---------|
| `originalInput` | CinestudioSeedPlugin | showrunner, IdeaPicker |
| `brief` | showrunner | all downstream agents |
| `styleGuide` | style_guide | character_designer, world_builder, storyboard |
| `script`, `cast`, `world`, `storyboard` | respective agents | subsequent agents |
| `shotBatches` | shot_planner | render_dispatch (custom Node) |
| `renderResults` | render_dispatch | continuity_checker, critique |
| `composite`, `critique` | scoring, critique | editor |

`runId` and `cycleNumber` are seeded by the plugin and incremented by `scoring`.

## Strands capabilities

### SessionManager + FileStorage

```ts
const sm = new SessionManager({
  sessionId: runId,
  storage: { snapshot: new FileStorage('./data/sessions') },
  saveLatestOn: 'invocation',
});
```

Every `Agent` has `plugins: [sm]` so its conversation history is snapshotted to `./data/sessions/<runId>/.../snapshot_latest.json` after each invocation. On restart, an interrupted run can resume from its last completed node.

### contextManager: 'auto'

```ts
new Agent({
  contextManager: 'auto',
  ...
});
```

Composes `SummarizingConversationManager` (summary ratio 0.3, compression threshold 0.85) + `ContextOffloader` plugin (max 1,500 result tokens). Critical for the 22-agent pipeline — keeps long multi-turn agent histories within the model's context window.

### DefaultModelRetryStrategy + ExponentialBackoff

```ts
new Agent({
  retryStrategy: new DefaultModelRetryStrategy({
    maxAttempts: 6,
    backoff: new ExponentialBackoff({ baseMs: 4_000, maxMs: 128_000, multiplier: 2, jitter: 'full' }),
  }),
});
```

Retries on `ModelThrottledError` from text providers. Render providers have their own implicit polling backoff in their respective modules.

### abortSignal

```ts
await graph.invoke(prompt, { cancelSignal: abortController.signal });
```

Wired from the run page's "Cancel run" button. Strands composes `abortSignal` with its internal cancellation token, so all in-flight tool calls observe the signal cooperatively.

## SQLite schema (migrations)

`pnpm db:migrate` runs idempotent migrations tracked in the `migrations` table. Schema:

- `configs` — `CinestudioConfig` JSON singleton
- `runs` — run metadata (status, prompt, brief_json, multimodal_assets counter, cycle_count, selected_variant_id, quality_*, timestamps)
- `run_events` — append-only event log (SSE replay source)
- `run_artifacts` — graph-result JSON
- `agent_outputs` — per-agent snapshot with duration_ms
- `idea_variants` — 3 CinestudioBrief candidates per run (idea-expander output)
- `multimodal_assets` — image / audio / score-stem paths + metadata
- `render_jobs` — per-shot provider task tracking (Veo op name, Sora video_id, Runway task_id, MiniMax task_id)
- `migrations` — applied-migration tracker

## SSE stream

`GET /api/runs/[id]/stream`:

1. Replays all events with id > `?since=N` (or all if unset).
2. Sends a heartbeat `event: heartbeat\ndata: {since: ...}`.
3. Subscribes to in-memory `RunBus`. When `runStatus` ∈ {completed, failed, cancelled}, closes the stream.
4. Pings `: keepalive` every 15s.

The run page mounts an `EventSource` against this URL and re-renders as events arrive. Stage status derivation in `<StageRail>` keys off `agent_completed` / `agent_failed` events.

## Two-step new-film flow

```
/dashboard/new (compose)
  user writes prompt + picks genre + variant count
  → POST /api/ideas/expand
      → runs IdeaExpander agent
      → persists 3 IdeaVariants in idea_variants table
      → returns {runId, result}
  → sets phase='pick' in client state

/dashboard/new (pick)
  renders IdeaPicker with 3 cards
  user clicks a card
  → POST /api/ideas/select/[id]  {variantIndex}
      → marks that variant as user_selected in idea_variants
      → flips run.status to 'queued'
  → POST /api/runs  {runId, brief}
      → starts the orchestrator pipeline
  → router.push(/dashboard/runs/[id])
```

## Out-of-scope (for v2)

- Live cost-tracking dashboard (intentionally dropped — MiniMax key warning in onboarding only)
- Real OAuth for MiniMax (we use API keys)
- Multi-tenant user accounts
- Stripe billing integration
- Voice cloning UI (the API is wired in `upload.ts` but no UI yet)
