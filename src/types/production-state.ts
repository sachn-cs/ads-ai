import type { CinestudioBrief } from '@/src/models';
import type {
  StyleGuide,
  ScriptBreakdown,
  CharacterCast,
  WorldDesign,
  Storyboard,
  RenderBatchPlan,
  ShotRenderResult,
  ContinuityIssue,
  CritiqueReport,
  CompositeQualityReport,
} from '@/src/models';

export interface ProductionSummary {
  id: string;
  title: string;
  logline: string;
  status: 'draft' | 'active' | 'archived';
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterSnapshot {
  id: string;
  name: string;
  appearance: string;
  wardrobeRefs: string[];
  ageCues?: string;
  posture?: string;
  emotionalBaseline?: string;
  relationshipState?: string;
  screenTimeNotes?: string;
  visualMarkers: string[];
}

export interface WardrobeSnapshot {
  characterId: string;
  sceneNumber: number;
  outfitRefs: string[];
  notes?: string;
}

export interface LocationSnapshot {
  id: string;
  name: string;
  weather?: string;
  timeOfDay?: string;
  texture?: string;
  architecture?: string;
  props: string[];
  spatialDensity?: string;
  backgroundActivity?: string;
  atmosphere?: string;
  colorBehavior?: string;
  depthCues?: string;
}

export interface SceneSnapshot {
  id: string;
  number: number;
  title: string;
  locationId?: string;
  beatSummary: string;
  characterIds: string[];
  emotionalIntent: string;
  pacing?: string;
}

export interface ShotSnapshot {
  id: string;
  sceneId: string;
  number: number;
  framing: string;
  angle: string;
  lens: string;
  shotSize: 'W' | 'MS' | 'MCU' | 'CU' | 'ECU' | 'OTS' | 'Insert' | 'Establishing' | 'Tracking';
  movement: string;
  intent: string;
  visualEmphasis?: string;
  subjectPlacement?: string;
  backgroundDepth?: string;
  environmentNotes?: string;
  continuityNotes?: string;
  emotionalIntent?: string;
  transitionIn?: string;
  transitionOut?: string;
  durationSeconds: number;
  prompt?: string;
}

export interface TransitionSnapshot {
  id: string;
  fromShotId: string;
  toShotId: string;
  type: 'cut' | 'dissolve' | 'fade' | 'wipe' | 'match' | 'jump' | 'L-cut' | 'J-cut';
  intent: string;
  continuityNotes?: string;
}

export interface ContinuitySnapshot {
  id: string;
  kind: 'wardrobe' | 'object' | 'spatial' | 'emotional' | 'temporal';
  severity: 'info' | 'warn' | 'error';
  sceneId?: string;
  shotId?: string;
  characterId?: string;
  message: string;
  createdAt: string;
}

export interface ProductionState {
  productionId: string;
  brief: CinestudioBrief;
  styleGuide: StyleGuide;
  script: ScriptBreakdown;
  cast: CharacterCast;
  world: WorldDesign;
  storyboard: Storyboard;
  shotBatches: RenderBatchPlan[];
  renderResults: ShotRenderResult[];
  continuity: ContinuityIssue[];
  critique?: CritiqueReport;
  composite?: CompositeQualityReport;
  characters: CharacterSnapshot[];
  wardrobe: WardrobeSnapshot[];
  locations: LocationSnapshot[];
  scenes: SceneSnapshot[];
  shots: ShotSnapshot[];
  transitions: TransitionSnapshot[];
  unresolved: ContinuitySnapshot[];
}
