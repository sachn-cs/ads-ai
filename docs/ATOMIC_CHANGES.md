# Cinestudio v2 — Atomic Changes Reference

227 atomic changes across 6 phases. Source of truth for the redesign.

Legend: `[D]`=delete, `[R]`=rewrite, `[N]`=new, `[M]`=modify.

---

## Phase 0 — Foundation, cleanup, V2 alignment (55)

### Cleanup dead code + V1 paths (16)

| # | Act | File(s) | Description |
|---|----|---------|-------------|
| 0.1 | `[D]` | `src/providers/minimax/upload.ts` | unused, V1 endpoint |
| 0.2 | `[D]` | `src/providers/minimax/video.ts` | unused, replaced by 0.4 |
| 0.3 | `[D]` | `src/providers/factory.ts` | all branches dead at runtime |
| 0.4 | `[R]` | `src/providers/minimax/video.ts` | V2 spec: content[], multimodal roles, adaptive ratio, i2va + r2va + t2va |
| 0.5 | `[N]` | `src/providers/minimax/files.ts` | `uploadFile` returning `mm_file://{file_id}` |
| 0.6 | `[M]` | `src/providers/minimax/shared.ts` | drop unused exports |
| 0.7 | `[D]` | `src/agents/factory.ts` | all exports dead |
| 0.7b | `[M]` | `src/orchestrator/run-graph.ts` | drop `setAgentFactoryContext` call |
| 0.8 | `[D]` | `src/agents/iteration-controller.ts` | unused; iterate.ts is canonical |
| 0.9 | `[M]` | `src/workflow/agent-nodes.ts` | drop iterationController |
| 0.10 | `[M]` | `src/agents/index.ts` | drop iteration re-export + id |
| 0.11 | `[M]` | `src/agents/render-dispatcher.ts` | drop renderDispatcherSpec, makeRenderTool |
| 0.12 | `[M]` | `src/graph/cinestudio.ts` | remove `void _invocationState` |
| 0.13 | `[M]` | `src/workflow/render-dispatch-node.ts` | remove `void ({} as NodeDefinition)` |
| 0.14 | `[M]` | `src/types/index.ts` | tighten if needed |
| 0.15 | `[M]` | `app/(onboarding)/...` text-provider UI | honest single-provider dropdown |
| 0.16 | `[M]` | `package.json` | remove unused sdk/model deps |

### Cleanup tests (5)

| # | Act | File(s) | Description |
|---|----|---------|-------------|
| 0.17 | `[R]` | `tests/factory-baseurl.test.ts` | assert api.minimax.io no /v1 |
| 0.18 | `[N]` | `tests/minimax-video-v2.test.ts` | V2 contract tests |
| 0.19 | `[N]` | `tests/minimax-files.test.ts` | upload contract |
| 0.20 | `[N]` | `tests/render-dispatcher-minimax.test.ts` | dispatcher routes minimax |
| 0.21 | `[N]` | `tests/cleanup-coverage.test.ts` | static check |

### Wire MiniMax V2 (2)

| # | Act | File(s) | Description |
|---|----|---------|-------------|
| 0.22 | `[M]` | `src/agents/render-dispatcher.ts` | add `case 'minimax'` calling 0.4 |
| 0.23 | `[M]` | `src/models/*.ts` | add firstFrame/lastFrame/reference fields |

### Design system — deep editorial noir (16)

| # | Act | File(s) | Description |
|---|----|---------|-------------|
| 0.24 | `[R]` | `app/globals.css` | tokens, grain overlay, motion keyframes |
| 0.25 | `[M]` | `tailwind.config.ts` | ink/bone/gold/amber palette |
| 0.26 | `[N]` | `src/lib/design/tokens.ts` | typed token export |
| 0.27 | `[N]` | `src/lib/design/motion.ts` | transitionBase, easeOutQuint |
| 0.28 | `[N]` | `public/fonts/...` | Cormorant + Inter + JetBrains woff2 |
| 0.29 | `[N]` | `components/ui/dialog.tsx` | shadcn primitive |
| 0.30 | `[N]` | `components/ui/sheet.tsx` | shadcn primitive |
| 0.31 | `[N]` | `components/ui/dropdown-menu.tsx` | shadcn primitive |
| 0.32 | `[N]` | `components/ui/command.tsx` | ⌘K palette |
| 0.33 | `[N]` | `components/ui/popover.tsx` | shadcn primitive |
| 0.34 | `[N]` | `components/ui/tooltip.tsx` | shadcn primitive |
| 0.35 | `[N]` | `components/ui/hover-card.tsx` | shadcn primitive |
| 0.36 | `[N]` | `components/ui/accordion.tsx` | shadcn primitive |
| 0.37 | `[N]` | `components/ui/table.tsx` | shadcn primitive |
| 0.38 | `[N]` | `components/ui/avatar.tsx` | shadcn primitive |
| 0.39 | `[M]` | `package.json` | add @dnd-kit/core, @dnd-kit/sortable |

### Shared state model (1)

| # | Act | File(s) | Description |
|---|----|---------|-------------|
| 0.40 | `[N]` | `src/types/production-state.ts` | typed ProductionState aggregate |

### Schema migrations (15)

| # | Migration | Adds |
|---|-----------|------|
| 0.41 | `005_create_productions` | productions |
| 0.42 | `006_create_characters` + character_versions | characters, character_versions |
| 0.43 | `007_create_locations` | locations, location_versions |
| 0.44 | `008_create_scenes` | scenes, scene_versions |
| 0.45 | `009_create_shots` | shots, shot_versions |
| 0.46 | `010_create_transitions` | transitions |
| 0.47 | `011_create_continuity_log` | continuity_log |
| 0.48 | `012_create_knowledge` + FTS5 | knowledge, knowledge_fts |
| 0.49 | `013_create_assets` + tags + collections | assets, asset_tags, asset_collections, asset_collection_items |
| 0.50 | `014_create_comments` | comments |
| 0.51 | `015_create_versions` | generic entity revisions |
| 0.52 | `016_create_copilot_threads` + copilot_messages | copilot tables |
| 0.53 | `017_create_team_members` | team_members, invites, acl |
| 0.54 | `018_alter_runs_add_production_id` | nullable FK on runs |
| 0.55 | `019_alter_productions_add_*` | current_run_id, current_version |

---

## Phase 1 — Production object & shell (63)

### CRUD modules (13)

| # | Act | File(s) | Description |
|---|----|---------|-------------|
| 1.1 | `[N]` | `src/db/productions.ts` | list/get/create/update/archive |
| 1.2 | `[N]` | `src/db/characters.ts` | read-only stub for Phase 2 |
| 1.3 | `[N]` | `src/db/locations.ts` | read-only stub for Phase 2 |
| 1.4 | `[N]` | `src/db/scenes.ts` | read-only stub for Phase 3 |
| 1.5 | `[N]` | `src/db/shots.ts` | read-only stub for Phase 3 |
| 1.6 | `[N]` | `src/db/transitions.ts` | read-only stub for Phase 3 |
| 1.7 | `[N]` | `src/db/continuity-log.ts` | read-only stub for Phase 3 |
| 1.8 | `[N]` | `src/db/knowledge.ts` | stub for Phase 5 |
| 1.9 | `[N]` | `src/db/assets.ts` | stub for Phase 5 |
| 1.10 | `[N]` | `src/db/comments.ts` | stub for Phase 5 |
| 1.11 | `[N]` | `src/db/versions.ts` | snapshot helper |
| 1.12 | `[N]` | `src/db/copilot.ts` | stub for Phase 4 |
| 1.13 | `[N]` | `src/db/team.ts` | stub for Phase 5 |

### Production-scoped API stubs (3)

| # | Act | File(s) | Description |
|---|----|---------|-------------|
| 1.14 | `[N]` | `app/api/productions/route.ts` | list + create |
| 1.15 | `[N]` | `app/api/productions/[id]/route.ts` | get + patch |
| 1.16 | `[N]` | `app/api/productions/[id]/[tab]/route.ts` | tab fetch (stub) |

### Routes (25)

| # | Act | File(s) |
|---|----|---------|
| 1.17 | `[R]` | `app/(dashboard)/dashboard/page.tsx` (redesigned home) |
| 1.18 | `[N]` | `app/(dashboard)/dashboard/productions/page.tsx` (list) |
| 1.19 | `[N]` | `app/(dashboard)/dashboard/productions/[id]/layout.tsx` |
| 1.20 | `[N]` | `app/(dashboard)/dashboard/productions/[id]/page.tsx` (Overview) |
| 1.21–1.37 | `[N]` | 17 production tabs (story, characters, wardrobe, locations, scenes, shots, transitions, continuity, runs, versions, exports, comments, settings, agents, knowledge, assets, copilot) |
| 1.38–1.41 | `[N]` | queue, analytics, templates, team |

### Dashboard components (9)

| # | Act | File(s) |
|---|----|---------|
| 1.42 | `[N]` | `components/dashboard/production-card.tsx` |
| 1.43 | `[N]` | `components/dashboard/continuity-warnings-panel.tsx` |
| 1.44 | `[N]` | `components/dashboard/agent-tasks-panel.tsx` |
| 1.45 | `[N]` | `components/dashboard/shot-progress-chart.tsx` |
| 1.46 | `[N]` | `components/dashboard/revision-timeline.tsx` |
| 1.47 | `[N]` | `components/dashboard/next-action-card.tsx` |
| 1.48 | `[N]` | `components/dashboard/render-status-feed.tsx` |
| 1.49 | `[N]` | `components/dashboard/character-alerts-panel.tsx` |
| 1.50 | `[N]` | `components/dashboard/gap-list.tsx` |

### Production layout components (6)

| # | Act | File(s) |
|---|----|---------|
| 1.51 | `[N]` | `components/production/top-bar.tsx` |
| 1.52 | `[N]` | `components/production/tabs-strip.tsx` |
| 1.53 | `[N]` | `components/production/left-rail.tsx` |
| 1.54 | `[N]` | `components/production/empty-state.tsx` |
| 1.55 | `[N]` | `components/production/skeleton.tsx` |
| 1.56 | `[N]` | `components/production/page-transition.tsx` |

### Legacy route deletions + run rewire (7)

| # | Act | File(s) | Description |
|---|----|---------|-------------|
| 1.57 | `[D]` | `app/(dashboard)/dashboard/runs/page.tsx` | old runs list |
| 1.58 | `[D]` | `app/(dashboard)/dashboard/runs/[id]/page.tsx` | old run detail |
| 1.59 | `[D]` | `app/(dashboard)/dashboard/new/page.tsx` | replaced by production wizard |
| 1.60 | `[D]` | `app/api/ideas/expand/route.ts` | replaced by production-scoped idea expand |
| 1.61 | `[D]` | `app/api/ideas/select/[id]/route.ts` | replaced |
| 1.62 | `[D]` | `app/api/ideas/[id]/route.ts` | replaced |
| 1.63 | `[M]` | `src/orchestrator/run.ts` | require explicit productionId |

---

## Phase 2 — Interactive editors + new agents (30)

### New agents (9)

| # | Act | File(s) |
|---|----|---------|
| 2.1 | `[N]` | `src/agents/costume-designer.ts` |
| 2.2 | `[N]` | `src/agents/environment-designer.ts` |
| 2.3 | `[N]` | `src/agents/transition-designer.ts` |
| 2.4 | `[N]` | `src/agents/pacing-analyst.ts` |
| 2.5 | `[N]` | `src/agents/visual-quality-reviewer.ts` |
| 2.6 | `[N]` | `src/agents/production-coordinator.ts` |
| 2.7 | `[N]` | `src/agents/scene-composer.ts` |
| 2.8 | `[N]` | `src/agents/continuity-supervisor.ts` |
| 2.9 | `[N]` | `src/agents/story-analyst.ts` |

### Swarm + Graph re-route (4)

| # | Act | File(s) | Description |
|---|----|---------|-------------|
| 2.10 | `[N]` | `src/workflow/swarm.ts` | Story ↔ Character ↔ Costume ↔ Environment swarm |
| 2.11 | `[R]` | `src/graph/cinestudio.ts` | new topology |
| 2.12 | `[M]` | `src/workflow/agent-nodes.ts` | add new agent nodes |
| 2.13 | `[M]` | `src/models/index.ts` | new Zod schemas |

### Interactive editor pages (4)

| # | Act | File(s) |
|---|----|---------|
| 2.14 | `[M]` | `.../productions/[id]/story/page.tsx` |
| 2.15 | `[M]` | `.../productions/[id]/characters/page.tsx` |
| 2.16 | `[M]` | `.../productions/[id]/wardrobe/page.tsx` |
| 2.17 | `[M]` | `.../productions/[id]/locations/page.tsx` |

### Editor components (6)

| # | Act | File(s) |
|---|----|---------|
| 2.18 | `[N]` | `components/editor/markdown-editor.tsx` |
| 2.19 | `[N]` | `components/editor/ai-improve-button.tsx` |
| 2.20 | `[N]` | `components/editor/character-drawer.tsx` |
| 2.21 | `[N]` | `components/editor/location-drawer.tsx` |
| 2.22 | `[N]` | `components/editor/wardrobe-board.tsx` |
| 2.23 | `[N]` | `components/editor/continuity-heatmap.tsx` |

### Tests (7)

| # | Act | File(s) |
|---|----|---------|
| 2.24–2.29 | `[N]` | unit tests for each of 2.1–2.6 |
| 2.30 | `[N]` | `tests/swarm-convergence.test.ts` |

---

## Phase 3 — Scenes/Shots/Transitions/Continuity + storyboard (21)

### CRUD full impl (5)

| # | Act | File(s) |
|---|----|---------|
| 3.1 | `[M]` | `src/db/scenes.ts` |
| 3.2 | `[M]` | `src/db/shots.ts` |
| 3.3 | `[M]` | `src/db/transitions.ts` |
| 3.4 | `[M]` | `src/db/continuity-log.ts` |
| 3.5 | `[M]` | `src/models/index.ts` |

### Agent expansion (2)

| # | Act | File(s) |
|---|----|---------|
| 3.6 | `[M]` | `src/agents/shot-planner.ts` |
| 3.7 | `[M]` | `src/agents/continuity-checker.ts` |

### Workflow pattern (2)

| # | Act | File(s) |
|---|----|---------|
| 3.8 | `[N]` | `src/workflow/strands-workflow.ts` |
| 3.9 | `[N]` | `app/api/productions/[id]/workflows/[workflow]/route.ts` |

### Storyboard UI (10)

| # | Act | File(s) |
|---|----|---------|
| 3.10 | `[N]` | `components/storyboard/scene-lane.tsx` |
| 3.11 | `[N]` | `components/storyboard/shot-card.tsx` |
| 3.12 | `[N]` | `components/storyboard/transition-chip.tsx` |
| 3.13 | `[N]` | `components/storyboard/continuity-marker.tsx` |
| 3.14 | `[N]` | `components/storyboard/camera-notes-overlay.tsx` |
| 3.15 | `[N]` | `components/storyboard/revision-history-popover.tsx` |
| 3.16 | `[M]` | `.../productions/[id]/scenes/page.tsx` |
| 3.17 | `[M]` | `.../productions/[id]/shots/page.tsx` |
| 3.18 | `[M]` | `.../productions/[id]/transitions/page.tsx` |
| 3.19 | `[M]` | `.../productions/[id]/continuity/page.tsx` |

### Tests (2)

| # | Act | File(s) |
|---|----|---------|
| 3.20 | `[N]` | `tests/workflow-resume.test.ts` |
| 3.21 | `[N]` | `tests/storyboard-drag.test.ts` |

---

## Phase 4 — Persistent copilot (20)

### Agent + tools (10)

| # | Act | File(s) |
|---|----|---------|
| 4.1 | `[N]` | `src/agents/copilot.ts` |
| 4.2 | `[N]` | `src/tools/search_knowledge.ts` |
| 4.3 | `[N]` | `src/tools/get_character.ts` |
| 4.4 | `[N]` | `src/tools/get_scene.ts` |
| 4.5 | `[N]` | `src/tools/get_shot.ts` |
| 4.6 | `[N]` | `src/tools/find_continuity_gaps.ts` |
| 4.7 | `[N]` | `src/tools/suggest_shot_replacement.ts` |
| 4.8 | `[N]` | `src/tools/suggest_wardrobe_change.ts` |
| 4.9 | `[N]` | `src/tools/compare_alternatives.ts` |
| 4.10 | `[N]` | `src/tools/draft_scene_revision.ts` |

### API + persistence (3)

| # | Act | File(s) |
|---|----|---------|
| 4.11 | `[M]` | `src/db/copilot.ts` |
| 4.12 | `[N]` | `app/api/productions/[id]/copilot/threads/route.ts` |
| 4.13 | `[N]` | `app/api/productions/[id]/copilot/threads/[threadId]/messages/route.ts` |

### UI (6)

| # | Act | File(s) |
|---|----|---------|
| 4.14 | `[M]` | `components/production/left-rail.tsx` |
| 4.15 | `[N]` | `components/copilot/message-bubble.tsx` |
| 4.16 | `[N]` | `components/copilot/slash-palette.tsx` |
| 4.17 | `[N]` | `components/copilot/citation-link.tsx` |
| 4.18 | `[M]` | `.../productions/[id]/copilot/page.tsx` |
| 4.19 | `[N]` | `components/copilot/voice-button.tsx` |

### Tests (1)

| # | Act | File(s) |
|---|----|---------|
| 4.20 | `[N]` | `tests/copilot-citations.test.ts` |

---

## Phase 5 — Asset/Knowledge/Templates/Team/Analytics/Polish (28)

| # | Act | File(s) |
|---|----|---------|
| 5.1 | `[M]` | `src/db/assets.ts` |
| 5.2 | `[M]` | `src/db/knowledge.ts` |
| 5.3 | `[M]` | `src/db/team.ts` |
| 5.4 | `[N]` | `components/assets/asset-grid.tsx` |
| 5.5 | `[N]` | `components/assets/asset-card.tsx` |
| 5.6 | `[N]` | `components/assets/collection-sidebar.tsx` |
| 5.7 | `[N]` | `components/assets/tag-picker.tsx` |
| 5.8 | `[N]` | `components/assets/ai-tagger.tsx` |
| 5.9 | `[N]` | `components/knowledge/bible-tabs.tsx` |
| 5.10 | `[N]` | `components/knowledge/search-bar.tsx` |
| 5.11 | `[N]` | `components/knowledge/bible-editor.tsx` |
| 5.12 | `[N]` | `components/team/operator-card.tsx` |
| 5.13 | `[N]` | `components/team/invite-list.tsx` |
| 5.14 | `[N]` | `components/team/role-definitions.tsx` |
| 5.15 | `[N]` | `components/team/multi-account-badge.tsx` |
| 5.16 | `[N]` | `components/templates/genre-template-grid.tsx` |
| 5.17 | `[N]` | `components/analytics/continuity-health-chart.tsx` |
| 5.18 | `[N]` | `components/analytics/agent-confidence-chart.tsx` |
| 5.19 | `[N]` | `components/analytics/render-success-rate.tsx` |
| 5.20 | `[N]` | `components/analytics/revision-count-chart.tsx` |
| 5.21 | `[N]` | `app/api/productions/[id]/assets/route.ts` |
| 5.22 | `[N]` | `app/api/productions/[id]/knowledge/route.ts` |
| 5.23 | `[N]` | `app/api/templates/route.ts` |
| 5.24 | `[N]` | `app/api/team/invites/route.ts` |
| 5.25 | `[N]` | `app/api/analytics/route.ts` |
| 5.26 | `[M]` | all production pages (empty states + skeleton + motion) |
| 5.27 | `[M]` | `tailwind.config.ts` (responsive + dark defaults) |
| 5.28 | `[M]` | `app/globals.css` (a11y + print-safe) |

---

## Phase 6 — Docs + tests (10)

| # | Act | File(s) |
|---|----|---------|
| 6.1 | `[M]` | `README.md` |
| 6.2 | `[M]` | `docs/ARCHITECTURE.md` |
| 6.3 | `[N]` | `docs/PRODUCTION_MODEL.md` |
| 6.4 | `[N]` | `docs/AGENTS.md` |
| 6.5 | `[N]` | `docs/CONTINUITY.md` |
| 6.6 | `[N]` | `tests/e2e/production-create.test.ts` |
| 6.7 | `[N]` | `tests/e2e/storyboard-drag.test.ts` |
| 6.8 | `[N]` | `tests/e2e/copilot-thread.test.ts` |
| 6.9 | `[M]` | `tests/setup.ts` (fixtures) |
| 6.10 | `[M]` | `vitest.config.ts` (coverage threshold) |

---

**Total: 227 atomic changes**
