export * as showrunner from './showrunner';
export * as scriptWriter from './script-writer';
export * as characterDesigner from './character-designer';
export * as worldBuilder from './world-builder';
export * as storyboard from './storyboard';
export * as shotPlanner from './shot-planner';
export * as renderDispatcher from './render-dispatcher';
export * as continuityChecker from './continuity-checker';
export * as critique from './critique';
export * as iteration from './iteration-controller';
export * as scoring from './scoring';
export * as editor from './editor';
export * as colorist from './colorist';
export * as composer from './composer';
export * as soundDesigner from './sound-designer';
export * as voiceCasting from './voice-casting';
export * as rightsClearance from './rights-clearance';
export * as distribution from './distribution';

export const AGENT_IDS = [
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
] as const;
export type AgentId = (typeof AGENT_IDS)[number];
