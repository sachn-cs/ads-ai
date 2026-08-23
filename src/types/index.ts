export type RenderProvider = 'veo' | 'sora' | 'runway';

export interface RenderProviderConfig {
  enabled: boolean;
  model: string;
  apiKey?: string;
  projectId?: string;
  baseUrl?: string;
  maxConcurrentShots: number;
}

export interface TextProviderConfig {
  enabled: boolean;
  provider: 'bedrock' | 'anthropic' | 'openai' | 'google' | 'ollama' | 'minimax';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  region?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CinestudioConfig {
  version: string;
  textProvider: TextProviderConfig;
  renderProviders: Record<RenderProvider, RenderProviderConfig>;
  defaults: {
    maxIterations: number;
    qualityThreshold: number;
    targetRuntimeSeconds: { min: number; max: number };
    aspectRatio: '16:9' | '9:16' | '1:1' | '21:9';
    enableVideoRender: boolean;
    enableAudioScore: boolean;
  };
  updatedAt: string;
}

export const DEFAULT_CONFIG: CinestudioConfig = {
  version: '0.1.0',
  textProvider: {
    enabled: false,
    provider: 'bedrock',
    model: 'global.anthropic.claude-sonnet-4-6',
    region: 'us-east-1',
    temperature: 0.7,
    maxTokens: 8192,
  },
  renderProviders: {
    veo: {
      enabled: true,
      model: 'veo-3.1',
      maxConcurrentShots: 4,
    },
    sora: {
      enabled: false,
      model: 'sora-1.0',
      maxConcurrentShots: 4,
    },
    runway: {
      enabled: false,
      model: 'gen3a_turbo',
      maxConcurrentShots: 4,
    },
  },
  defaults: {
    maxIterations: 3,
    qualityThreshold: 70,
    targetRuntimeSeconds: { min: 30, max: 120 },
    aspectRatio: '16:9',
    enableVideoRender: true,
    enableAudioScore: false,
  },
  updatedAt: new Date(0).toISOString(),
};
