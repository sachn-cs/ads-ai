# cinestudio — Multi-agent AI film rendering platform

Production-centric, deep editorial noir, MiniMax-first.

A Story Analyst, Character Designer, Costume Designer, Environment Designer, Script Writer, Scene Composer, Shot Planner, Continuity Supervisor, Transition Designer, Pacing Analyst, Visual Quality Reviewer, Render Dispatcher, Production Coordinator, plus Editor / Colorist / Composer / Sound / Voice / Scoring / Critique — coordinated by a Strands **Graph**, with a **Swarm** for the Story ↔ Character ↔ Costume ↔ Environment collaboration, and a **Workflow** for per-shot production revisions.

The default backend is MiniMax (`MiniMax-M3` text, `MiniMax-H3` video, `image-01`, `speech-2.8-hd`, `music-3.0`). One API key covers every modality end-to-end.

## Production-first

Every story is a **Production** — the central object. Characters, Wardrobe, Locations, Scenes, Shots, Transitions, Continuity, Knowledge, Assets, Comments, Versions, Runs, Copilot threads all live inside one production. Runs become execution traces, not the unit of truth.

## Quick start

```bash
pnpm install
pnpm db:migrate    # applies migrations 005–019 (productions, characters, locations, scenes, shots, transitions, continuity_log, knowledge, knowledge_fts, assets, asset_tags, asset_collections, asset_collection_items, comments, versions, copilot_threads, copilot_messages, team_members, invites, acl)
pnpm dev           # http://localhost:3000
```

Create a production at `/dashboard/productions/new`. Pick a template at `/dashboard/templates`. Use the **Copilot** (left rail in any production) to ask for help.

## Architecture

- **Graph** — deterministic creative DAG with branching, conditions, checks, and loops (`src/graph/cinestudio.ts`).
- **Swarm** — Story ↔ Character ↔ Costume ↔ Environment convergence (`src/workflow/swarm.ts`).
- **Workflow** — per-shot production pipeline: re-render / re-color / re-voice, deterministic + resumable (`src/workflow/strands-workflow.ts`).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the topology, [docs/PRODUCTION_MODEL.md](docs/PRODUCTION_MODEL.md) for the entity model, [docs/AGENTS.md](docs/AGENTS.md) for every agent's role, and [docs/CONTINUITY.md](docs/CONTINUITY.md) for how the supervisor detects gaps.

## Visual design

Deep editorial noir: ink/bone palette, gold/amber accents, serif display + sans body + mono, subtle grain, warm shadows. See `src/lib/design/tokens.ts`.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
