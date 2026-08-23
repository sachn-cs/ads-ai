import { Agent, tool } from '@strands-agents/sdk';
import { z } from 'zod';
import { ShotRenderResultSchema, type ShotRenderInstruction, type ShotRenderResult } from '@/src/models';
import { RENDER_DISPATCHER_SYSTEM_PROMPT } from '@/src/prompts';
import { buildModel } from '@/src/providers/factory';
import type { TextProviderConfig, RenderProviderConfig } from '@/src/types';

export const renderDispatcherSpec = {
  id: 'render_dispatcher',
  description: 'Executes a single ShotRenderInstruction against the configured provider and returns ShotRenderResult.',
  systemPrompt: RENDER_DISPATCHER_SYSTEM_PROMPT,
};

function makeRenderTool(provider: RenderProviderConfig, providerName: 'veo' | 'sora' | 'runway') {
  return tool({
    name: `render_${providerName}`,
    description: `Render a video via ${providerName} (${provider.model}).`,
    inputSchema: ShotRenderResultSchema,
    callback: async (_input) => {
      void provider;
      void providerName;
      throw new Error(
        `render_${providerName} is a stub. Replace with real provider call (see src/providers/render/{veo,sora,runway}.ts)`,
      );
    },
  });
}

export async function invokeRenderDispatcher(
  cfg: TextProviderConfig,
  providers: Record<'veo' | 'sora' | 'runway', RenderProviderConfig>,
  instruction: ShotRenderInstruction,
): Promise<ShotRenderResult> {
  const enabledTools = [];
  if (providers.veo.enabled) enabledTools.push(makeRenderTool(providers.veo, 'veo'));
  if (providers.sora.enabled) enabledTools.push(makeRenderTool(providers.sora, 'sora'));
  if (providers.runway.enabled) enabledTools.push(makeRenderTool(providers.runway, 'runway'));

  if (enabledTools.length === 0) {
    return {
      shotId: instruction.shotId,
      provider: instruction.provider,
      status: 'skipped',
      errorMessage: 'No render provider is enabled.',
      attempts: 0,
      metadata: {},
    };
  }

  const agent = new Agent({
    id: `${renderDispatcherSpec.id}_${instruction.shotId}`,
    description: renderDispatcherSpec.description,
    systemPrompt: renderDispatcherSpec.systemPrompt,
    model: buildModel({ ...cfg, temperature: 0.2 }),
    printer: false,
    tools: enabledTools,
  });

  const prompt = [
    'INSTRUCTION:',
    JSON.stringify(instruction, null, 2),
    `\nProvider enabled: ${instruction.provider}`,
    '\nCall the matching render tool once and return only the resulting ShotRenderResult.',
  ].join('\n');

  try {
    const result = await agent.invoke(prompt, {
      structuredOutputSchema: ShotRenderResultSchema,
    });
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
