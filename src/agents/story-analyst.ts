import { z } from 'zod';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { CinestudioBrief } from '@/src/models';

export const STORY_ANALYST_SYSTEM_PROMPT = `You are the Story Analyst. You refine narrative structure, themes, and beats.
Given a CinestudioBrief, output:
- themes: 3-5 thematic threads
- beats: ordered list of story beats with emotional intent
- references: 2-4 reference films with notes
- structuralNotes: any pacing, structure, or arc issues
Be terse and specific.`;

export const StoryAnalysisSchema = z.object({
  themes: z.array(z.string().min(3)).min(3).max(5),
  beats: z.array(
    z.object({
      index: z.number().int().min(0),
      label: z.string().min(3),
      emotionalIntent: z.string().min(10),
    }),
  ),
  references: z.array(
    z.object({
      title: z.string(),
      note: z.string().min(10),
    }),
  ),
  structuralNotes: z.string().min(20),
});
export type StoryAnalysis = z.infer<typeof StoryAnalysisSchema>;

export async function invokeStoryAnalyst(
  cfg: TextProviderConfig,
  brief: CinestudioBrief,
): Promise<StoryAnalysis> {
  const { output } = await invokeStructuredAgent<StoryAnalysis>({
    agentId: 'story_analyst',
    cfg: { ...cfg, temperature: 0.7 },
    systemPrompt: STORY_ANALYST_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ brief }, null, 2),
    schema: StoryAnalysisSchema,
    temperature: 0.7,
  });
  return output;
}
