import { Agent, tool } from '@strands-agents/sdk';
import { ShotRenderResultSchema, type ShotRenderInstruction, type ShotRenderResult } from '@/src/models';
import type { TextProviderConfig, RenderProviderConfig } from '@/src/types';

export const renderDispatcherSpec = {
  id: 'render_dispatcher',
  description: 'Executes a single ShotRenderInstruction against the configured provider and returns ShotRenderResult.',
};

function makeRenderTool(provider: RenderProviderConfig, providerName: 'veo' | 'sora' | 'runway') {
  return tool({
    name: `render_${providerName}`,
    description: `Render a video via ${providerName} (${provider.model}). Returns ShotRenderResult.`,
    inputSchema: ShotRenderResultSchema,
    callback: async (input): Promise<ShotRenderResult> => {
      const result = input as unknown as ShotRenderResult;
      void provider;
      return {
        shotId: result.shotId,
        provider: providerName,
        status: 'completed',
        videoPath: `/tmp/cinestudio/${providerName}/${result.shotId}.mp4`,
        stillPath: `/tmp/cinestudio/${providerName}/${result.shotId}.png`,
        durationSeconds: result.durationSeconds ?? 8,
        modelUsed: provider.model,
        costUnits: 1,
        attempts: 1,
        completedAt: new Date().toISOString(),
        metadata: { stub: true, provider: providerName },
      };
    },
  });
}

export async function invokeRenderDispatcher(
  cfg: TextProviderConfig,
  providers: Record<'veo' | 'sora' | 'runway', RenderProviderConfig>,
  instruction: ShotRenderInstruction,
): Promise<ShotRenderResult> {
  const providerCfg = providers[instruction.provider];
  if (!providerCfg?.enabled) {
    return {
      shotId: instruction.shotId,
      provider: instruction.provider,
      status: 'skipped',
      errorMessage: `Render provider "${instruction.provider}" is not enabled.`,
      attempts: 0,
      metadata: {},
    };
  }

  const toolImpl = makeRenderTool(providerCfg, instruction.provider);

  const agent = new Agent({
    id: `${renderDispatcherSpec.id}_${instruction.shotId}`,
    description: renderDispatcherSpec.description,
    systemPrompt:
      'You are the render dispatcher. Call the matching render tool once and return its result verbatim as a ShotRenderResult.',
    model: cfg.enabled
      ? (await import('@/src/providers/factory')).buildModel({ ...cfg, temperature: 0.0 })
      : undefined,
    printer: false,
    tools: [toolImpl],
  });

  if (!cfg.enabled) {
    return {
      shotId: instruction.shotId,
      provider: instruction.provider,
      status: 'skipped',
      errorMessage: 'No text provider configured — render dispatcher cannot run.',
      attempts: 0,
      metadata: {},
    };
  }

  try {
    const result = await agent.invoke(
      `INSTRUCTION: ${JSON.stringify(instruction)}\n\nProvider: ${instruction.provider}\nModel: ${providerCfg.model}\n\nCall the render_${instruction.provider} tool exactly once and return its result as a ShotRenderResult.`,
      { structuredOutputSchema: ShotRenderResultSchema },
    );
    const parsed = ShotRenderResultSchema.parse(result.structuredOutput);
    return { ...parsed, shotId: instruction.shotId, provider: instruction.provider };
  } catch (err) {
    return {
      shotId: instruction.shotId,
      provider: instruction.provider,
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'render_failed',
      attempts: 1,
      metadata: {},
    };
  }
}

export function validateRenderResult(
  result: ShotRenderResult,
  expectedShotIds: Set<string>,
): ShotRenderResult {
  if (!expectedShotIds.has(result.shotId)) {
    return {
      ...result,
      status: 'failed',
      errorMessage: `Unexpected shotId ${result.shotId} in render result.`,
    };
  }
  return result;
}
