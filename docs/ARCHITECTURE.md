# Architecture

Cinestudio coordinates a 22-agent creative production through three Strands patterns:

## 1. Graph — deterministic creative workflow

The main pipeline is a Strands Graph (`src/graph/cinestudio.ts`). Each node is an agent or a custom dispatcher. Edges express hard dependencies.

```
Showrunner
  → StyleGuide
  → Swarm(Story ↔ Character ↔ Costume ↔ Environment)  [Phase 2 wiring]
  → ScriptWriter
  → SceneComposer         [Phase 2]
  → ShotPlanner
  → ContinuitySupervisor  (fan-out: Continuity + Transition + Pacing + VisualQuality)
  → RenderDispatch
  → Scoring
  → Editor → Colorist → Composer → Sound → Voice
  → Distribution
  → RightsClearance
```

`RenderDispatchNode` (`src/workflow/render-dispatch-node.ts`) is the parallel-render node that fans shots out across enabled providers, bounded per-provider.

## 2. Swarm — collaborative exploration

For visual + character coherence, the Story Analyst, Character Designer, Costume Designer, and Environment Designer iterate in a swarm (`src/workflow/swarm.ts`). Each turn produces a Story / Costume / Environment revision; a probe decides whether the swarm has converged. Up to N turns.

## 3. Workflow — per-shot production pipeline

When a writer says "re-cut this scene with warmer light" or "re-color this shot", Cinestudio invokes a per-shot Workflow (`src/workflow/strands-workflow.ts`):

```
plan_revision → regenerates → recolor / revoice / recut → continuity_review → done
```

Deterministic, idempotent, resumable. Caller persists intermediate state and can re-enter at the right step.

## Production state

Every agent reads from a typed `ProductionState` aggregate (`src/types/production-state.ts`) — characters, wardrobe, locations, scenes, shots, transitions, continuity, unresolved gaps. The aggregate is what every agent carries forward; no agent acts as if the prompt were isolated.

## Shared services

- `src/db/productions.ts` — production CRUD
- `src/db/characters.ts`, `locations.ts`, `scenes.ts`, `shots.ts`, `transitions.ts` — entity CRUD
- `src/db/continuity-log.ts` — gap log
- `src/db/knowledge.ts` — bibles + FTS5 search
- `src/db/assets.ts` — asset library
- `src/db/copilot.ts` — production-scoped threads
- `src/db/versions.ts` — generic revision snapshots

## LLM access

Every agent's LLM call goes through `src/agents/invoke.ts → invokeStructuredAgent → invokeMiniMaxAnthropic`. There is no Strands-model-factory abstraction layer — every text call hits MiniMax directly with the Anthropic-compatible SDK.
