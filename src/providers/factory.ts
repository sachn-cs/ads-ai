import { BedrockModel } from '@strands-agents/sdk/models/bedrock';
import { AnthropicModel } from '@strands-agents/sdk/models/anthropic';
import { GoogleModel } from '@strands-agents/sdk/models/google';
import { OpenAIModel } from '@strands-agents/sdk/models/openai';
import { VercelModel } from '@strands-agents/sdk/models/vercel';
import type { Model } from '@strands-agents/sdk';
import type { TextProviderConfig } from '@/src/types';
import { ProviderNotConfiguredError } from '@/src/lib/errors';

export type AnyModel = Model;

export function buildModel(cfg: TextProviderConfig): AnyModel {
  if (!cfg.enabled) {
    throw new ProviderNotConfiguredError(cfg.provider);
  }
  switch (cfg.provider) {
    case 'bedrock':
      return new BedrockModel({
        modelId: cfg.model,
        region: cfg.region ?? process.env.AWS_REGION ?? 'us-east-1',
        temperature: cfg.temperature,
        maxTokens: cfg.maxTokens,
        apiKey: cfg.apiKey,
      });
    case 'anthropic':
      return new AnthropicModel({
        modelId: cfg.model,
        apiKey: cfg.apiKey ?? process.env.ANTHROPIC_API_KEY,
        maxTokens: cfg.maxTokens,
      });
    case 'openai':
      return new OpenAIModel({
        modelId: cfg.model,
        apiKey: cfg.apiKey ?? process.env.OPENAI_API_KEY,
        baseUrl: cfg.baseUrl,
        maxTokens: cfg.maxTokens,
      });
    case 'google':
      return new GoogleModel({
        modelId: cfg.model,
        apiKey: cfg.apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        maxTokens: cfg.maxTokens,
      });
    case 'ollama':
    case 'minimax':
      return new VercelModel({
        modelId: cfg.model,
        apiKey: cfg.apiKey ?? 'noop',
        baseUrl: cfg.baseUrl ?? process.env.MINIMAX_BASE_URL ?? process.env.OLLAMA_BASE_URL,
        maxTokens: cfg.maxTokens,
      });
    default: {
      const _exhaustive: never = cfg.provider;
      throw new Error(`Unknown provider: ${String(_exhaustive)}`);
    }
  }
}

export function describeModel(cfg: TextProviderConfig): string {
  return `${cfg.provider}/${cfg.model}`;
}
