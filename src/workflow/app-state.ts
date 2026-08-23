import type { AgentId } from '@/src/agents';
import type {
  CinestudioBrief,
  CharacterCast,
  CompositeQualityReport,
  CritiqueReport,
  DistributionPackage,
  ScorePlan,
  ScriptBreakdown,
  Storyboard,
  ColorGradeDirection,
  WorldDesign,
  AssemblyPlan,
  VoiceCast,
  SoundDesignPlan,
  RightsReport,
  ShotRenderResult,
  RenderBatchPlan,
  CinestudioBrief as _Brief,
  WorldDesign as _World,
  SoundDesignPlan as _Sound,
  ColorGradeDirection as _Color,
  AssemblyPlan as _Assembly,
} from '@/src/models';

export interface AppState {
  // seeded by plugin
  runId?: string;
  textProvider?: unknown;
  renderProviders?: unknown;

  // orchestrator-managed
  iterationDirective?: string;
  preserveShotIds?: string[];

  // agent outputs
  originalInput?: string;
  brief?: CinestudioBrief;
  script?: ScriptBreakdown;
  cast?: CharacterCast;
  world?: WorldDesign;
  storyboard?: Storyboard;
  shotBatches?: RenderBatchPlan[];
  renderResults?: ShotRenderResult[];
  continuityIssues?: unknown;
  critique?: CritiqueReport;
  composite?: CompositeQualityReport;
  cycleNumber?: number;
  iterationReport?: unknown;
  assembly?: AssemblyPlan;
  color?: ColorGradeDirection;
  scorePlan?: ScorePlan;
  soundPlan?: SoundDesignPlan;
  voiceCast?: VoiceCast;
  distribution?: DistributionPackage;
  rightsReport?: RightsReport;
}

void _Brief;
void _World;
void _Sound;
void _Color;
void _Assembly;

export type AppStateKey = keyof AppState;

export function readApp<T>(app: AppState, key: AppStateKey): T {
  const v = app[key];
  if (v === undefined || v === null) {
    throw new Error(`Missing app state key "${String(key)}" required for downstream agent.`);
  }
  return v as T;
}

export function readAppOptional<T>(app: AppState, key: AppStateKey): T | undefined {
  return app[key] as T | undefined;
}

export const ALL_AGENT_IDS: AgentId[] = [
  'showrunner',
  'script_writer',
  'character_designer',
  'world_builder',
  'storyboard',
  'shot_planner',
  'render_dispatcher',
  'continuity_checker',
  'critique',
  'iteration_controller',
  'scoring',
  'editor',
  'colorist',
  'composer',
  'sound_designer',
  'voice_casting',
  'rights_clearance',
  'distribution',
];
