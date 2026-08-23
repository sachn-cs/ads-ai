<p align="center">
  <h1 align="center">cinestudio</h1>
  <p align="center">Multi-agent AI film rendering platform. 30-second spots to 20-minute shorts, coordinated by a 22-agent Strands Graph with multimodal (image / voice / music) generation through the MiniMax platform.</p>
  <p align="center">
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%E2%89%A526-blue" alt="Node"></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js"></a>
    <a href="https://strandsagents.com/"><img src="https://img.shields.io/badge/Strands-TS-purple" alt="Strands"></a>
    <a href="https://platform.minimax.io/"><img src="https://img.shields.io/badge/MiniMax-orange" alt="MiniMax"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  </p>
</p>

**cinestudio** is a production-grade, multi-agent AI film rendering platform. The pipeline
runs a Strands Graph (deterministic DAG with optional cycle) of 22 specialized agents that take a
raw creative prompt through:

1. **Idea** — IdeaExpander produces 3 CinestudioBrief candidates; user picks one
2. **Style** — StyleGuide constrains every visual agent
3. **Script** — Scene breakdown, dialogue, voiceover
4. **Characters** — Cast profiles + MiniMax-generated portraits (multimodal)
5. **World** — Locations, palette, sound world
6. **Storyboard** — Shot-by-shot coverage + MiniMax-generated reference frames
7. **Production** — RenderDispatcher fans shots out to Veo / Sora / Runway / MiniMax-H3
8. **Scoring** — Continuity + critique + composite quality
9. **Post** — Editor, colorist, composer (score stems via MiniMax), sound, voice, distribution, rights

Strands capabilities wired: SessionManager (FileStorage) for run
state persistence, `contextManager: 'auto'` (SummarizingConversationManager + ContextOffloader),
custom retry strategy (6 attempts, exponential 4-128s), AbortSignal for the Cancel button.

---

## Features

- **22 specialized agents** coordinated by a Strands Graph with custom Node for parallel render
- **Multi-provider text LLM** — Bedrock (default), Anthropic, OpenAI, Google, Ollama, MiniMax
- **Multi-provider video render** — Veo 3.1, Sora 2, Runway, **MiniMax-H3** (recommended)
- **Multimodal MiniMax integration** — Image (image-01), Speech (speech-2.8-hd), Music (music-3.0), File Upload (voice clone + image refs). All driven by one MiniMax API key.
- **IdeaExpander** — 3 CinestudioBrief candidates per user prompt with model confidence
- **StyleGuide** — global visual bible (palette + lighting + lensing + grain)
- **RenderDirector** agent + **Marketing** agent for cutdowns, thumbnails, press
- **SSE streaming** — events for run_started, agent_started/completed/failed, render_*, run_*, plus heartbeat. Replays historical events on reconnect.
- **Two-step new-film flow** — write prompt → pick variant from 3 candidates → pipeline starts
- **Run page** with stage-by-stage rail, multimodal asset gallery, Cancel button
- **CinestudioConfig persistence** in SQLite (WAL mode, foreign keys on)
- **Migrations runner** — `migrations` table tracks applied migrations so re-running `pnpm db:migrate` is idempotent

---

## Quick Start

```bash
git clone https://github.com/your-org/cinestudio.git
cd cinestudio
pnpm install
pnpm db:migrate
pnpm dev
```

Visit `http://localhost:3000`. The onboarding screen will guide you through:

1. Choose **MiniMax** (recommended). One key covers text + video + image + speech + music.
2. Set the MiniMax key, model (`MiniMax-M3`), and toggle which multimodals are on.
3. Hit **Test connections** — the server pings each provider and shows latency / status.
4. Hit **Save & continue** — routed to the dashboard.

Create a film:

1. Click **New film**, write your idea, pick genre.
2. cinestudio's **IdeaExpander** generates 3 distinct CinestudioBrief candidates.
3. Pick one. The pipeline starts: StyleGuide → Script → Characters → World → Storyboard → Production (parallel renders) → Scoring → Post.
4. The run page shows a stage-by-stage rail, the multimodal artifact gallery, and a Cancel button.

---

## Configuration

`CinestudioConfig` lives at `./data/cinestudio.db` (config row).

| Setting | Default | Description |
|---------|---------|-------------|
| `textProvider.provider` | `bedrock` | `bedrock` / `anthropic` / `openai` / `google` / `ollama` / `minimax` |
| `textProvider.model` | `MiniMax-M3` | Model ID for the chosen text provider |
| `renderProviders.minimax.enabled` | `true` | Enable MiniMax-H3 (recommended default) |
| `renderProviders.{veo,sora,runway}.enabled` | `false` | Opt-in per-provider |
| `multimodal.image.enabled` | `true` | MiniMax image-01 for character portraits + storyboard frames |
| `multimodal.speech.enabled` | `true` | MiniMax speech-2.8-hd for TTS voice lines + foley |
| `multimodal.music.enabled` | `true` | MiniMax music-3.0 for score stems |
| `defaults.maxIterations` | `3` | Critic → iteration cycles |
| `defaults.qualityThreshold` | `70` | Composite GO/NO-GO cut-off |
| `defaults.ideaExpansionCount` | `3` | IdeaExpander candidates (1..5) |

---

## Tech Stack

- **Strands Agents (TS SDK)** — multi-agent Graph, SessionManager, retry, context management
- **MiniMax platform** — text, video (H3), image (image-01), speech (speech-2.8-hd), music (music-3.0)
- **Next.js 16** App Router with Server Actions and Server-Sent Events
- **Tailwind CSS** + **shadcn/ui** (new-york style, neutral base)
- **TypeScript** strict mode (noUncheckedIndexedAccess)
- **better-sqlite3** (WAL mode) — runs, configs, agent outputs, multimodal assets, idea variants, render jobs
- **pnpm 9** / **Node 26**

---

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full detail. Summary:

- **Cinematic spine** — 17-node linear Graph + 4 orchestrator-driven side agents
- **Workflow** — parallel fan-out Node for render_dispatch (bounded concurrency)
- **Storage** — runs + configs in SQLite; agent outputs and multimodal artifacts persisted for replay
- **Streaming** — SSE via in-memory event bus + DB persistence (replay on reconnect)

```
USER prompt → [POST /api/ideas/expand]
                ↓
            3 IdeaVariants (DB persisted)
                ↓
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
            orchestrator iteration loop (imperative)
                ↓
            final composite + assembly + rights + marketing assets
```

---

## License

[MIT](LICENSE)
