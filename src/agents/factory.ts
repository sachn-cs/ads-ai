import { Agent } from '@strands-agents/sdk';
import type { tool } from '@strands-agents/sdk';
import type { TextProviderConfig } from '@/src/types';
import { buildModel, describeModel } from '@/src/providers/factory';

export interface AgentSpec {
  id: string;
  description: string;
  systemPrompt: string;
}

const DEFAULT_TEMPERATURE_BY_INTENT: Record<string, number> = {
  showrunner: 0.85,
  scriptWriter: 0.9,
  characterDesigner: 0.75,
  worldBuilder: 0.7,
  storyboard: 0.8,
  shotPlanner: 0.5,
  renderDispatcher: 0.2,
  continuityChecker: 0.4,
  critique: 0.55,
  iteration: 0.55,
  scoring: 0.3,
  editor: 0.4,
  colorist: 0.6,
  composer: 0.85,
  soundDesigner: 0.6,
  voiceCasting: 0.5,
  rightsClearance: 0.2,
  distribution: 0.4,
};

export function makeAgent(spec: AgentSpec, cfg: TextProviderConfig, tools: ReturnType<typeof tool>[] = []): Agent {
  return new Agent({
    id: spec.id,
    description: spec.description,
    systemPrompt: spec.systemPrompt,
    model: buildModel(cfg),
    printer: false,
    tools,
  });
}

export function describe(spec: AgentSpec, cfg: TextProviderConfig): string {
  return `${spec.id}@${describeModel(cfg)}`;
}

export function getDefaultTemperature(agentId: string, fallback = 0.6): number {
  return DEFAULT_TEMPERATURE_BY_INTENT[agentId] ?? fallback;
}
