import { Agent, tool } from '@strands-agents/sdk';
import { TextBlock } from '@strands-agents/sdk';
import path from 'node:path';
import type { ShotRenderInstruction, ShotRenderResult } from '@/src/models';
import { ShotRenderInstructionSchema } from '@/src/models';
import { buildModel } from '@/src/providers/factory';
import { renderWithVeo } from '@/src/providers/render/veo';
import { renderWithSora } from '@/src/providers/render/sora';
import { renderWithRunway } from '@/src/providers/render/runway';
import type { TextProviderConfig, RenderProviderConfig } from '@/src/types';
import { logger } from '@/src/lib/logger';
import { runDir } from '@/src/lib/artifacts';

const log = logger('agents/render-dispatcher');

export const renderDispatcherSpec = {
  id: 'render_dispatcher',
  description: 'Dispatches a single ShotRenderInstruction to the configured provider and returns ShotRenderResult.',
};

const SUPPORTED_PROVIDERS = ['veo', 'sora', 'runway'] as const;
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export interface DispatcherInputs {
  shotBatches: unknown;
  textProvider: TextProviderConfig;
  renderProviders: Record<'veo' | 'sora' | 'runway', RenderProviderConfig>;
  runId: string;
  artifactDir?: string;
}

function artifactDirFor(runId: string): string {
  return runDir(path.resolve(process.cwd(), process.env.CINESTUDIO_ARTIFACT_DIR || './artifacts'), runId);
}

export async function invokeRenderDispatcher(
  textCfg: TextProviderConfig,
  renderProviders: Record<'veo' | 'sora' | 'runway', RenderProviderConfig>,
  instruction: ShotRenderInstruction,
  runId: string,
): Promise<ShotRenderResult> {
  const providerCfg = renderProviders[instruction.provider];
  if (!providerCfg?.enabled) {
    return {
      shotId: instruction.shotId,
      provider: instruction.provider,
      status: 'skipped',
      errorMessage: `Render provider "${instruction.provider}" is not enabled in CinestudioConfig.`,
      attempts: 0,
      metadata: {},
    };
  }
  if (!isSupportedProvider(instruction.provider)) {
    return {
      shotId: instruction.shotId,
      provider: instruction.provider,
      status: 'failed',
      errorMessage: `Unknown render provider: ${instruction.provider}. Supported: ${SUPPORTED_PROVIDERS.join(', ')}.`,
      attempts: 0,
      metadata: {},
    };
  }
  if (!providerCfg.apiKey) {
    return {
      shotId: instruction.shotId,
      provider: instruction.provider,
      status: 'failed',
      errorMessage: `No API key configured for ${instruction.provider}. Set one in the onboarding screen.`,
      attempts: 0,
      metadata: {},
    };
  }

  const artifactDir = artifactDirFor(runId);

  log.info('render_dispatcher_invoking', {
    shotId: instruction.shotId,
    provider: instruction.provider,
    model: providerCfg.model,
  });

  switch (instruction.provider as SupportedProvider) {
    case 'veo':
      return renderWithVeo(
        {
          apiKey: providerCfg.apiKey,
          projectId: providerCfg.projectId,
          model: providerCfg.model,
          artifactDir,
        },
        instruction,
      );
    case 'sora':
      return renderWithSora(
        {
          apiKey: providerCfg.apiKey,
          baseUrl: providerCfg.baseUrl,
          model: providerCfg.model,
          artifactDir,
        },
        instruction,
      );
    case 'runway':
      return renderWithRunway(
        {
          apiKey: providerCfg.apiKey,
          baseUrl: providerCfg.baseUrl,
          model: providerCfg.model,
          artifactDir,
        },
        instruction,
      );
    default:
      return failed(instruction, instruction.provider, 'unreachable');
  }
}

export function makeRenderTool(textCfg: TextProviderConfig) {
  return tool({
    name: 'dispatch_shot_render',
    description:
      'Dispatch a single shot render to the configured video provider. Returns ShotRenderResult.',
    inputSchema: ShotRenderInstructionSchema,
    callback: async (input, ctx) => {
      const instruction = input as unknown as ShotRenderInstruction;
      const runId = (ctx?.invocationState as { runId?: string } | undefined)?.runId ?? 'unknown';
      const providers = (ctx?.invocationState as { renderProviders?: Record<'veo' | 'sora' | 'runway', RenderProviderConfig> } | undefined)
        ?.renderProviders;
      if (!providers) {
        return failed(instruction, instruction.provider, 'renderProviders missing from invocationState');
      }
      const result = await invokeRenderDispatcher(textCfg, providers, instruction, runId);
      return new TextBlock(`Shot ${instruction.shotId} render result: ${result.status}` + (result.errorMessage ? ` — ${result.errorMessage}` : ''));
    },
  });
}

function isSupportedProvider(p: string): p is SupportedProvider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(p);
}

function failed(
  instruction: ShotRenderInstruction,
  provider: ShotRenderInstruction['provider'],
  message: string,
): ShotRenderResult {
  return {
    shotId: instruction.shotId,
    provider,
    status: 'failed',
    errorMessage: message,
    attempts: 1,
    metadata: { stub: false },
  };
}

void Agent;
void buildModel;
