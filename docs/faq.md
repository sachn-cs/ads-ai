# FAQ

## Why a Graph + custom Node instead of Swarm?

See [ARCHITECTURE.md](./ARCHITECTURE.md#why-graph-not-swarm). Short version: the
pipeline is fundamentally sequential with one bounded cycle; Swarms are for emergent
collaboration. We use a Graph because conditional edges make the iterate-vs-proceed
branching explicit and deterministic.

## Why not use a first-class Workflow class?

The Strands TypeScript SDK exposes `Graph` and `Swarm` but no first-class Workflow.
The Workflow pattern (parallel independent tasks) is implemented as code or a nested
Graph. We chose a **custom Node** that fans out render calls using a bounded
concurrency helper — this gives us per-provider `maxConcurrentShots` caps without
shipping a graph-within-a-graph.

## How do I replace the stub render tools?

`src/agents/render-dispatcher.ts` carries a `render_veo`, `render_sora`, and
`render_runway` tool whose callbacks throw "replace with real provider call". Wire
in:

- Veo: `@google/genai` — `client.models.generate_videos(...)` with a length-poll loop
- Sora: OpenAI's video API (when available)
- Runway: their HTTP client

Each `callback:` returns the provider's response wrapped in `ShotRenderResultSchema`.

## Why are some agents duplicated by intent (e.g., character-designer and world-builder)?

The brief-vs-cast vs brief-vs-world split lets you swap one without re-running the
other. If you only want a color-grade change, you can patch the Colorist without
re-running the World builder or the Continuity checker.

## How do I add a new agent?

1. Add a Zod schema in `src/models/<area>.ts`.
2. Add a system prompt in `src/prompts/system-prompts.ts`.
3. Add a `src/agents/<agent-id>.ts` that exports an `AgentSpec` and an `invoke*()`.
4. Add a node builder in `src/workflow/agent-nodes.ts`.
5. Wire edges in `src/graph/cinestudio.ts`.

## How long does a typical run take?

For a 90-second film (4 scenes, ~12 shots), expect:

- Showrunner + Script + Character + World + Storyboard + ShotPlanner: 1-3 min
- Render (parallel, 12 shots): 2-15 min depending on provider and queue
- Continuity + Critique + Scoring + Iteration: 30-90 s per cycle
- Editor + Colorist + Composer + Sound + Voice + Distribution + Rights: 1-2 min
- **Total: ~5-25 minutes for a first render**, less for subsequent iterations.

## Why use SQLite instead of Postgres?

cinestudio is a single-process, single-tenant app by default. SQLite gives us
zero-config persistence and excellent concurrency under WAL. For multi-tenant or
horizontally-scaled deployments, swap the layer in `src/db/client.ts` for a Postgres
adapter — the schema is portable.

## Can I run the agents in parallel?

Yes — but with care. The current Graph has linear edges between agents. To add
parallelism within a stage, you'd insert a `Swarm` of sub-agents as a node, or split
the stage's `invoke()` into multiple `Promise.all([])` calls. The latter is easier
and what we already do inside the Render Dispatch Node.

## How is the iteration cycle bounded?

Three limits:

- `maxIterations` (CinestudioConfig)
- The Critic + Scorer set `composite.recommendation` to `proceed` or `halt` early
- The Graph's `maxSteps` (defaults to 100 in the cinestudio Graph config)

When any of these trips, the `iteration_controller` → `editor` edge fires and the
rest of the pipeline runs.
