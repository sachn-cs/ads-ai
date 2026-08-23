# Architecture

This document explains how cinestudio's orchestrator is structured — the agent roles,
the Graph topology, the parallel render Workflow, the iteration cycle, and the
runtime data plane.

## High-level

cinestudio is a Strands Agents TypeScript application. The Strands SDK
(`@strands-agents/sdk`) gives us three multi-agent patterns:

1. **Graph** — a deterministic DAG with conditional edges and cycle support.
2. **Swarm** — agent-driven handoffs via structured output.
3. **Workflow** — a task graph with parallel execution (in TS this is implemented
   as code or a nested Graph; there is no first-class Workflow class).

cinestudio uses **Graph** for the main pipeline (including the iteration cycle) and a
**custom Node** that fans out render work in parallel — implementing the Workflow
pattern over the Graph API.

## The Agent Roster

| ID | Agent | Role in Pipeline |
|----|-------|------------------|
| `showrunner` | CinestudioShowrunner | Synthesis of CinestudioBrief |
| `script_writer` | Screenplay generation | ScriptBreakdown |
| `character_designer` | Cast + character profiles | CharacterCast |
| `world_builder` | Locations, palette, sound world | WorldDesign |
| `storyboard` | Shot-by-shot coverage | Storyboard |
| `shot_planner` | Provider-aware render instructions | RenderBatchPlan[] |
| `render_dispatcher` (Node) | Parallel fan-out | ShotRenderResult[] |
| `continuity_checker` | Cross-shot consistency audit | ContinuityIssue[] |
| `critique` | Quality scoring (10 dimensions) | CritiqueReport |
| `scoring` | Composite quality decision | CompositeQualityReport |
| `iteration_controller` | Surgical-refinement directives | IterationControlReport |
| `editor` | Edit decision list + pacing | AssemblyPlan |
| `colorist` | LUT plan opening → climax → resolution | ColorGradeDirection |
| `composer` | Score cue map + motif | ScorePlan |
| `sound_designer` | Foley + ambient beds | SoundDesignPlan |
| `voice_casting` | VO direction + dialogue coverage | VoiceCast |
| `distribution` | Exports + festival apps | DistributionPackage |
| `rights_clearance` | Likeness, IP, platform-policy gate | RightsReport |

## The Graph

```
                                                                                    ┌────────────────────────────┐
                                                                                    │   iteration_controller     │
                                                                                    │   (cycle back to render)   │
                                                                                    └──────────────┬─────────────┘
                                                                                                 │
                                                                                                 ▼
showrunner → script_writer → character_designer → world_builder → storyboard → shot_planner → render_dispatch (custom Node, parallel) →
                                                                              continuity_checker → critique →
                                                                              scoring → iteration_controller ─┐
                                                                                                              │ proceed?
                                                                                                              ▼
                                                                                                       editor → colorist → composer →
                                                                                                       sound_designer → voice_casting →
                                                                                                       distribution → rights_clearance
```

### Conditional Edges

- `iteration_controller` → `render_dispatch` fires when the composite decision is
  `iterate` and `iteration.shouldContinue` is true and `cycleNumber < maxIterations`.
- `iteration_controller` → `editor` fires when the composite decision is `proceed`
  or `iteration.shouldContinue` is false.

Both edges are guarded by `EdgeHandler` functions that read the Graph's StateStore.

### Why Cycles

The Critic + Scorer + IterationController form a bounded refinement loop. Each cycle
re-renders only the failing shots (preserving GO shots) and may also revise the
script / storyboard / shot-plans through the cycle's upstream nodes.

## The StateStore (Shared State)

Strands exposes a key-value `app` store on every `MultiAgentState`. The
`CinestudioSeedPlugin` reads `invocationState` (passed to `graph.invoke`) and seeds
the store with:

- `runId` — for tracing + persistence
- `textProvider` — the CinestudioConfig's text-provider block
- `renderProviders` — the CinestudioConfig's render-provider block
- `originalInput` — the user's prompt
- `cycleNumber` — current iteration cycle

Each AgentNode reads its inputs from the store, invokes its LLM, and writes its
output back into the store before emitting SSE events.

## The Parallel Render Workflow

The Strands TS SDK does not ship a first-class Workflow class. Instead we implement
the Workflow pattern as a **custom Node**:

```typescript
class RenderDispatchNode extends Node<unknown, ShotRenderResult[]> {
  // Reads shotBatches from state.app, fans out render calls in parallel,
  // writes renderResults back. Concurrency is bounded per-provider via
  // the pAll helper.
}
```

The shot planner pre-computes `renderBatches[]` in the Storyboard — each batch shares
a style tag, prompt prefix, and provider assignment. The render dispatcher then
takes the union of all batches and dispatches each shot using the configured
provider's `maxConcurrentShots` cap.

## Persistence

Every event and every agent output is persisted to a SQLite database (better-sqlite3,
WAL mode) before being broadcast on the SSE bus. This means:

- A client disconnecting mid-run does not lose events; on reconnect it can replay
  the event log with `?since=<last-id>`.
- A run can be resumed (or inspected) from SQLite without re-running the agents.

The event log shape (`RunEvent` in `src/models/run.ts`) is the union of:

- `run_started`, `run_completed`, `run_failed`
- `agent_started`, `agent_message`, `agent_completed`, `agent_failed`
- `render_started`, `render_progress`, `render_completed`, `render_failed`
- `iteration_started`, `iteration_completed`
- `checkpoint_written`, `tool_called`

## Why Graph, not Swarm?

We considered a Swarm for the iteration loop (Critic → Iteration → ShotPlanner
handing off dynamically). We picked Graph because:

1. The 17-agent pipeline is fundamentally sequential. Swarms are designed for
   collaborative ideation, not deterministic orchestration.
2. The conditional edges (iterate vs. proceed) are explicit, not emergent.
3. Cycle bounds (`maxSteps`, `maxIterations`) are easier to enforce.
4. We can show the user a precise agent timeline, not an emergent chat history.

## Next Steps

- Replace the stub `render_*` tools with real provider SDKs (Veo via
  `@google/genai`, Sora via OpenAI's video endpoint, Runway's HTTP API).
- Add a Swarm-of-three for the iteration cycle itself — let the Critic, Iter, and
  ShotPlanner hand off rather than executing strictly in sequence.
- Add an interrupt / human-in-the-loop node before Rights Clearance for optional
  manual sign-off.
