# Agents

22 agents + 1 swarm orchestrator + 1 workflow orchestrator + 1 copilot.

## Graph agents (deterministic DAG)

| Agent | File | Role | Inputs | Outputs |
|-------|------|------|--------|---------|
| Showrunner | `src/agents/showrunner.ts` | Synthesize CinestudioBrief from raw prompt. | originalInput | CinestudioBrief |
| StyleGuide | `src/agents/style-guide.ts` | Visual bible (palette, lensing, grain). | CinestudioBrief | StyleGuide |
| StoryAnalyst | `src/agents/story-analyst.ts` | Themes, beats, references, structure. | CinestudioBrief | StoryAnalysis |
| CharacterDesigner | `src/agents/character-designer.ts` | Cast with intent. | CinestudioBrief | CharacterCast |
| CostumeDesigner | `src/agents/costume-designer.ts` | Wardrobe intent + variants + continuity rules. | CharacterCast | CostumeRevision |
| EnvironmentDesigner | `src/agents/environment-designer.ts` | Location texture, weather, props, depth. | WorldDesign | EnvironmentRevision |
| ScriptWriter | `src/agents/script-writer.ts` | Beats + dialogue. | CinestudioBrief + ScriptBreakdown | ScriptBreakdown |
| SceneComposer | `src/agents/scene-composer.ts` | Break script into scenes. | ScriptBreakdown | SceneList |
| ShotPlanner | `src/agents/shot-planner.ts` | Shot list with framing + lens + movement. | Storyboard | Storyboard |
| ContinuitySupervisor | `src/agents/continuity-supervisor.ts` | Fan-out: continuity + transition + pacing + visual quality. | Storyboard | SupervisorReport |
| ContinuityChecker | `src/agents/continuity-checker.ts` | Per-shot continuity issues. | CinestudioBrief + Storyboard | ContinuityIssue[] |
| TransitionDesigner | `src/agents/transition-designer.ts` | Per-cut transition type + intent. | Storyboard | TransitionPlan |
| PacingAnalyst | `src/agents/pacing-analyst.ts` | Beat density + pacing warnings. | ScriptBreakdown | PacingReport |
| VisualQualityReviewer | `src/agents/visual-quality-reviewer.ts` | Style-guide adherence score. | Storyboard + StyleGuide | VisualQualityReport |
| RenderDispatcher | `src/agents/render-dispatcher.ts` | Dispatch shots to MiniMax / Veo / Sora / Runway. | RenderBatchPlan | ShotRenderResult |
| ProductionCoordinator | `src/agents/production-coordinator.ts` | Track unresolved dependencies. | Agent statuses + unresolved list | CoordinatorReport |
| Scoring | `src/agents/scoring.ts` | Composite quality score. | CinestudioBrief + continuity + critique | CompositeQualityReport |
| Critique | `src/agents/critique.ts` | Per-shot GO/NO-GO. | Continuity + render results | CritiqueReport |
| Editor | `src/agents/editor.ts` | Assembly plan. | Script + storyboard + shots | AssemblyPlan |
| Colorist | `src/agents/colorist.ts` | Color grade direction. | Storyboard + script | ColorGradeDirection |
| Composer | `src/agents/composer.ts` | Score plan. | Storyboard + script | ScorePlan |
| SoundDesigner | `src/agents/sound-designer.ts` | Foley + atmosphere. | Storyboard + world | SoundDesignPlan |
| VoiceCasting | `src/agents/voice-casting.ts` | Voice cast + lines. | Cast + script | VoiceCast |
| Distribution | `src/agents/distribution.ts` | Cutdowns + thumbnails + press. | Assembly + cast | DistributionPackage |
| RightsClearance | `src/agents/rights-clearance.ts` | Compliance. | Brief + script + cast + world + continuity | RightsReport |

## Swarm (collaborative)

`src/workflow/swarm.ts` orchestrates: Story ↔ Character ↔ Costume ↔ Environment with up to N turns + convergence probe.

## Workflow (per-shot)

`src/workflow/strands-workflow.ts`: plan_revision → regenerates → recolor / revoice / recut → continuity_review → done. Resumable.

## Copilot

`src/agents/copilot.ts` — production-scoped creative partner. Uses tools in `src/tools/`:
- `search_knowledge.ts` — FTS5 over bibles
- `get_character.ts`, `get_scene.ts`, `get_shot.ts`
- `find_continuity_gaps.ts`
- `suggest_shot_replacement.ts`, `suggest_wardrobe_change.ts`
- `compare_alternatives.ts`, `draft_scene_revision.ts`

Every reply carries a `citations` array linking to specific entities.
