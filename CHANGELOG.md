# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — Unreleased

### BREAKING — Full rewrite to TypeScript

cinestudio is a complete TypeScript rewrite of the previously Python-only `ads-ai`
package. There is **no migration path** — the Python package, CLI, and PyPI release
have been removed. See the migration notes below.

### Added

- **Next.js 16** web app (App Router, React 19, Server Actions)
- **17-agent Strands Graph** orchestrated pipeline
  - Showrunner, Script Writer, Character Designer, World Builder, Storyboard,
    Shot Planner, Render Dispatcher, Continuity Checker, Critic, Iteration
    Controller, Scorer, Editor, Colorist, Composer, Sound Designer, Voice Casting,
    Distribution Planner, Rights Clearance
- **Custom Node parallel render Workflow** — shots fan out concurrently across
  enabled render providers at per-provider concurrency limits
- **Multi-provider text LLM** — Bedrock (default), Anthropic, OpenAI, Google,
  Ollama, MiniMax. Configured through the onboarding screen
- **Multi-provider rendering** — Veo 3.1, Sora, Runway
- **Onboarding flow** — single-screen provider setup with persistent SQLite config
- **Dashboard** — recent runs list with status pills
- **New-film form** — genre marker + freeform prompt
- **Run detail page** — live SSE timeline + event log + per-agent JSON inspector
- **SQLite persistence** — runs, configs, agent outputs, event log
- **SSE event stream** — replays historical events on connect, then live updates
- **18 Zod schemas** mirroring the old 40+ Pydantic models with new film-domain
  shapes (CinestudioBrief, ScriptBreakdown, CharacterCast, WorldDesign, Storyboard,
  ShotRenderInstruction, CritiqueReport, CompositeQualityReport, AssemblyPlan,
  ColorGradeDirection, ScorePlan, SoundDesignPlan, VoiceCast, DistributionPackage,
  RightsReport, ...)
- **Vitest** spec coverage for models, config persistence, lib helpers, enum
  invariants, Graph construction

### Removed

- `ads_ai/` Python package (40+ files, ~4.7k LOC)
- All pytest tests under `tests/test_*.py`
- `pyproject.toml`
- Python CI matrix
- The `ads-ai` CLI binary
- Pydantic v2 / Google GenAI runtime dependencies

### Migration notes (from ads-ai 0.2.0 → cinestudio 0.1.0)

| ads-ai (Python) | cinestudio (TypeScript) |
|-----------------|--------------------------|
| `Pipeline.run(prompt=..., audience=...)` | `POST /api/runs {prompt}` |
| `ExtractedInputs` | `CinestudioBrief` |
| `StrategyAgent` | `showrunner` |
| `CreativeAgent` | `script_writer` |
| `AudienceAgent` | `character_designer` |
| (new) | `world_builder` |
| `MessageClarityAgent` etc. | `critique` (10-dimension single agent) |
| `ScoringAgent` | `scoring` |
| `IterationControllerAgent` | `iteration_controller` |
| `VideoGenerationAgent` | `render_dispatcher` (now in parallel Workflow) |
| `ComplianceRiskAgent` | `rights_clearance` |
| `DeploymentExperimentationAgent` | `distribution` |
| Pydantic `BaseModel` | Zod `z.object(...)` + `z.infer<typeof X>` |
| `gemini-3.1-pro-preview` model id | Configurable per provider |
| `.env` | Onboarding screen + DB-backed config |

## [0.2.0] — 2026-07-14 (ads-ai)

### Added
- Multi-provider LLM support scaffolding
- Dynamic `PipelineStageRegistry` with declarative configurations
- `Veo 3.1` direct integration for video generation
- Quantified quality enforcement via CompositeReadinessReport

(Historical; this release was the last Python-only version of the project.)
