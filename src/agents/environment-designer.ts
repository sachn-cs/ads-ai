import { z } from 'zod';
import { invokeStructuredAgent } from './invoke';
import type { TextProviderConfig } from '@/src/types';
import type { WorldDesign } from '@/src/models';

export const ENVIRONMENT_SYSTEM_PROMPT = `You are the Environment Designer. You shape the locations a film needs.
For each location, output:
- weather: conditions (rain, fog, dry, etc.)
- timeOfDay: golden hour / blue hour / midday / night
- texture: surface qualities (concrete, brick, leaves, glass, water)
- architecture: structural descriptors
- props: key props visible in frame
- spatialDensity: dense / medium / sparse
- backgroundActivity: what is happening beyond the focus (people, traffic, weather, leaves)
- atmosphere: emotional tone of the place
- colorBehavior: how the palette shifts in this space
- depthCues: foreground / midground / background separation
Be precise. Locations support story, not the other way around.`;

export const EnvironmentRevisionSchema = z.object({
  locations: z.array(
    z.object({
      id: z.string(),
      weather: z.string().optional(),
      timeOfDay: z.string().optional(),
      texture: z.string().min(20),
      architecture: z.string().min(20),
      props: z.array(z.string()).min(2),
      spatialDensity: z.enum(['dense', 'medium', 'sparse']),
      backgroundActivity: z.string().min(20),
      atmosphere: z.string().min(20),
      colorBehavior: z.string().min(20),
      depthCues: z.string().min(20),
    }),
  ),
});
export type EnvironmentRevision = z.infer<typeof EnvironmentRevisionSchema>;

export async function invokeEnvironmentDesigner(
  cfg: TextProviderConfig,
  world: WorldDesign,
): Promise<EnvironmentRevision> {
  const { output } = await invokeStructuredAgent<EnvironmentRevision>({
    agentId: 'environment_designer',
    cfg: { ...cfg, temperature: 0.7 },
    systemPrompt: ENVIRONMENT_SYSTEM_PROMPT,
    userPrompt: JSON.stringify({ world }, null, 2),
    schema: EnvironmentRevisionSchema,
    temperature: 0.7,
  });
  return output;
}
