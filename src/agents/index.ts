export * as ideaExpander from './idea-expander';
export * as styleGuide from './style-guide';
export * as showrunner from './showrunner';
export * as scriptWriter from './script-writer';
export * as characterDesigner from './character-designer';
export * as worldBuilder from './world-builder';
export * as storyboard from './storyboard';
export * as shotPlanner from './shot-planner';
export * as continuityChecker from './continuity-checker';
export * as critique from './critique';
export * as scoring from './scoring';
export * as editor from './editor';
export * as colorist from './colorist';
export * as composer from './composer';
export * as soundDesigner from './sound-designer';
export * as voiceCasting from './voice-casting';
export * as rightsClearance from './rights-clearance';
export * as distribution from './distribution';

export const AGENT_IDS = [
  'idea_expander',
  'showrunner',
  'style_guide',
  'story_analyst',
  'script_writer',
  'scene_editor',
  'character_designer',
  'costume_designer',
  'world_builder',
  'environment_designer',
  'storyboard',
  'shot_planner',
  'cinematographer',
  'render_dispatcher',
  'continuity_checker',
  'continuity_supervisor',
  'transition_designer',
  'pacing_analyst',
  'visual_quality_reviewer',
  'critique',
  'scoring',
  'production_coordinator',
  'editor',
  'colorist',
  'composer',
  'sound_designer',
  'voice_casting',
  'rights_clearance',
  'distribution',
  'copilot',
] as const;
export type AgentId = (typeof AGENT_IDS)[number];
