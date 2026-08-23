import { Agent } from '@strands-agents/sdk';
import { CinestudioBriefSchema, type CinestudioBrief } from '@/src/models';
import { SHOWRUNNER_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig } from '@/src/types';

export const showrunnerSpec = {
  id: 'showrunner',
  description:
    'Senior creative producer. Translates user intent into a CinestudioBrief that constrains all downstream agents.',
  systemPrompt: SHOWRUNNER_SYSTEM_PROMPT,
};

export async function invokeShowrunner(
  cfg: TextProviderConfig,
  userInput: string,
): Promise<CinestudioBrief> {
  const agent = new Agent({
    id: showrunnerSpec.id,
    description: showrunnerSpec.description,
    systemPrompt: showrunnerSpec.systemPrompt,
    model: buildModel(cfg),
    printer: false,
  });
  const result = await agent.invoke(userInput, {
    structuredOutputSchema: CinestudioBriefSchema,
  });
  return CinestudioBriefSchema.parse(result.structuredOutput);
}
