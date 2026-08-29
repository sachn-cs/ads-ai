import { invokeStructuredAgent } from '@/src/agents/invoke';
import type { TextProviderConfig } from '@/src/types';
import type { CinestudioBrief } from '@/src/models';
import type { CharacterCast } from '@/src/models';
import type { CostumeRevision } from '@/src/agents/costume-designer';
import type { EnvironmentRevision } from '@/src/agents/environment-designer';
import type { StoryAnalysis } from '@/src/agents/story-analyst';
import { CostumeRevisionSchema } from '@/src/agents/costume-designer';
import { EnvironmentRevisionSchema } from '@/src/agents/environment-designer';
import { StoryAnalysisSchema } from '@/src/agents/story-analyst';
import { z } from 'zod';

export interface SwarmTurnInput {
  cfg: TextProviderConfig;
  brief: CinestudioBrief;
  cast: CharacterCast;
  previous?: {
    story?: StoryAnalysis;
    costume?: CostumeRevision;
    environment?: EnvironmentRevision;
  };
}

export interface SwarmTurnResult {
  story: StoryAnalysis;
  costume: CostumeRevision;
  environment: EnvironmentRevision;
  converged: boolean;
  probeReason: string;
}

const TURNS = 3;

const ConvergenceProbeSchema = z.object({
  converged: z.boolean(),
  reason: z.string(),
});

/**
 * Story ↔ Character ↔ Costume ↔ Environment swarm.
 * Iterates up to N turns, exchanging revisions, until convergence.
 */
export async function runCreativeSwarm(input: SwarmTurnInput): Promise<SwarmTurnResult> {
  const { cfg, brief, cast } = input;
  let story = input.previous?.story;
  let costume = input.previous?.costume;
  let environment = input.previous?.environment;
  let converged = false;
  let probeReason = '';

  for (let turn = 0; turn < TURNS; turn++) {
    if (!story) {
      const r = await invokeStructuredAgent<StoryAnalysis>({
        agentId: 'story_analyst',
        cfg,
        systemPrompt: 'Refine themes and beats based on the brief and any prior turns.',
        userPrompt: JSON.stringify({ brief, previous: { costume, environment } }, null, 2),
        schema: StoryAnalysisSchema,
        temperature: 0.7,
      });
      story = r.output;
    }
    if (!costume) {
      const r = await invokeStructuredAgent<CostumeRevision>({
        agentId: 'costume_designer',
        cfg,
        systemPrompt: 'Refine wardrobe based on brief, story, environment.',
        userPrompt: JSON.stringify({ brief, cast, story, environment }, null, 2),
        schema: CostumeRevisionSchema,
        temperature: 0.7,
      });
      costume = r.output;
    }
    if (!environment) {
      const r = await invokeStructuredAgent<EnvironmentRevision>({
        agentId: 'environment_designer',
        cfg,
        systemPrompt: 'Refine locations based on brief, story, costume intent.',
        userPrompt: JSON.stringify({ brief, story, costume }, null, 2),
        schema: EnvironmentRevisionSchema,
        temperature: 0.7,
      });
      environment = r.output;
    }

    const probe = await invokeStructuredAgent<{ converged: boolean; reason: string }>({
      agentId: 'swarm_probe',
      cfg: { ...cfg, temperature: 0.2 },
      systemPrompt: 'Decide if the swarm has converged. Return {converged: boolean, reason: string}.',
      userPrompt: JSON.stringify({ turn, story, costume, environment }, null, 2),
      schema: ConvergenceProbeSchema,
      temperature: 0.2,
    });
    converged = probe.output.converged;
    probeReason = probe.output.reason;
    if (converged) break;
  }

  return {
    story: story!,
    costume: costume!,
    environment: environment!,
    converged,
    probeReason,
  };
}
