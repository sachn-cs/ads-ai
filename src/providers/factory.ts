import { BedrockModel } from '@strands-agents/sdk/models/bedrock';
import { AnthropicModel } from '@strands-agents/sdk/models/anthropic';
import { GoogleModel } from '@strands-agents/sdk/models/google';
import { OpenAIModel } from '@strands-agents/sdk/models/openai';
import { VercelModel } from '@strands-agents/sdk/models/vercel';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModelV3, LanguageModelV4 } from '@ai-sdk/provider';
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
        api: 'responses',
        modelId: cfg.model,
        apiKey: cfg.apiKey ?? process.env.OPENAI_API_KEY,
        clientConfig: cfg.baseUrl
          ? {
              baseURL: cfg.baseUrl,
            }
          : undefined,
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
      return new VercelModel({ provider: buildOpenAICompatibleProvider(cfg) });
    default: {
      const _exhaustive: never = cfg.provider;
      throw new Error(`Unknown provider: ${String(_exhaustive)}`);
    }
  }
}

function buildOpenAICompatibleProvider(cfg: TextProviderConfig): LanguageModelV3 {
  const baseURL = cfg.baseUrl ?? (
    cfg.provider === 'ollama'
      ? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1'
      : process.env.MINIMAX_BASE_URL ?? 'https://api.minimax.io/v1'
  );
  const compat = createOpenAICompatible({
    name: cfg.provider,
    baseURL,
    apiKey: cfg.apiKey || 'no-key-required',
  });
  const model: LanguageModelV3 | LanguageModelV4 = compat(cfg.model);
  return model as unknown as LanguageModelV3;
}

export function describeModel(cfg: TextProviderConfig): string {
  return `${cfg.provider}/${cfg.model}`;
}
