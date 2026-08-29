import path from 'node:path';
import type { ShotRenderInstruction, ShotRenderResult } from '@/src/models';
import { renderWithVeo } from '@/src/providers/render/veo';
import { renderWithSora } from '@/src/providers/render/sora';
import { renderWithRunway } from '@/src/providers/render/runway';
import { renderWithMiniMaxVideo } from '@/src/providers/minimax/video';
import type { TextProviderConfig, RenderProviderConfig } from '@/src/types';
import { logger } from '@/src/lib/logger';
import { runDir } from '@/src/lib/artifacts';

const log = logger('agents/render-dispatcher');

const SUPPORTED_PROVIDERS = ['veo', 'sora', 'runway', 'minimax'] as const;
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export interface DispatcherInputs {
  shotBatches: unknown;
  textProvider: TextProviderConfig;
  renderProviders: Record<'veo' | 'sora' | 'runway' | 'minimax', RenderProviderConfig>;
  runId: string;
  artifactDir?: string;
}

function artifactDirFor(runId: string): string {
  return runDir(
    path.resolve(process.cwd(), process.env.CINESTUDIO_ARTIFACT_DIR || './artifacts'),
    runId,
  );
}

export async function invokeRenderDispatcher(
  textCfg: TextProviderConfig,
  renderProviders: Record<'veo' | 'sora' | 'runway' | 'minimax', RenderProviderConfig>,
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
    case 'minimax':
      return renderWithMiniMaxVideo(
        {
          apiKey: providerCfg.apiKey,
          baseUrl: providerCfg.baseUrl,
          model: providerCfg.model,
          artifactDir,
        },
        {
          shotId: instruction.shotId,
          prompt: instruction.prompt,
          ratio: instruction.aspectRatio,
          duration: instruction.durationSeconds,
          resolution: instruction.resolution,
          firstFrame: instruction.firstFrame,
          lastFrame: instruction.lastFrame,
          referenceImages: instruction.referenceImages,
          referenceVideos: instruction.referenceVideos,
          referenceAudios: instruction.referenceAudios,
        },
      ).then((r) =>
        r.status === 'succeeded'
          ? ({
              shotId: instruction.shotId,
              provider: 'minimax',
              status: 'completed',
              videoPath: r.videoUrl ?? undefined,
              durationSeconds: instruction.durationSeconds,
              modelUsed: r.model,
              attempts: 1,
              completedAt: new Date().toISOString(),
              metadata: { taskId: r.taskId },
            } satisfies ShotRenderResult)
          : ({
              shotId: instruction.shotId,
              provider: 'minimax',
              status: 'failed',
              errorMessage: r.error ?? `MiniMax returned status=${r.status}`,
              attempts: 1,
              metadata: { taskId: r.taskId },
            } satisfies ShotRenderResult),
      );
    default:
      return failed(instruction, instruction.provider, 'unreachable');
  }
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
