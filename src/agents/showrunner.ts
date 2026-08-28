import { CinestudioBriefSchema, type CinestudioBrief } from '@/src/models';
import { SHOWRUNNER_SYSTEM_PROMPT } from '@/src/prompts';
import { invokeStructuredAgent } from './invoke';
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
  const { output } = await invokeStructuredAgent<CinestudioBrief>({
    agentId: 'showrunner',
    cfg,
    systemPrompt: SHOWRUNNER_SYSTEM_PROMPT,
    userPrompt: userInput,
    schema: CinestudioBriefSchema,
    temperature: 0.85,
  });
  return output;
}