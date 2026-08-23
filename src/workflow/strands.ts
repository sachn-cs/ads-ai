import path from 'node:path';
import {
  Agent,
  type Model,
  SessionManager,
  FileStorage,
  DefaultModelRetryStrategy,
  ExponentialBackoff,
} from '@strands-agents/sdk';
import { logger } from '@/src/lib/logger';

const log = logger('workflow/strands');

const SESSION_ROOT = path.resolve(process.cwd(), './data/sessions');

const sessionManagers = new Map<string, SessionManager>();

export function getSessionManager(runId: string): SessionManager {
  const existing = sessionManagers.get(runId);
  if (existing) return existing;
  const sm = new SessionManager({
    sessionId: runId,
    storage: { snapshot: new FileStorage(SESSION_ROOT) },
    saveLatestOn: 'invocation',
  });
  sessionManagers.set(runId, sm);
  void mkdirQuiet(SESSION_ROOT);
  log.info('session_manager_created', { runId, root: SESSION_ROOT });
  return sm;
}

async function mkdirQuiet(p: string): Promise<void> {
  try {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(p, { recursive: true });
  } catch {
    /* best-effort */
  }
}

/**
 * Build a TextProviderConfig-aware default retry strategy.
 * 6 attempts total, exponential with 4s -> 128s backoff, full jitter.
 */
export function buildRetryStrategy() {
  return new DefaultModelRetryStrategy({
    maxAttempts: 6,
    backoff: new ExponentialBackoff({
      baseMs: 4_000,
      maxMs: 128_000,
      multiplier: 2,
      jitter: 'full',
    }),
  });
}

/**
 * Build an Agent instance with:
 *  - SessionManager as a plugin (state persisted to ./data/sessions)
 *  - contextManager: 'auto' (composes SummarizingConversationManager
 *    + ContextOffloader; critical for the long 17-agent pipeline)
 *  - retryStrategy (handles 429 / 503 from text providers)
 */
export function createCinestudioAgent(opts: {
  id: string;
  description: string;
  systemPrompt: string;
  model: Model;
  tools?: unknown[];
  runId: string;
}): Agent {
  log.info('agent_created', { id: opts.id, runId: opts.runId });
  return new Agent({
    id: opts.id,
    description: opts.description,
    systemPrompt: opts.systemPrompt,
    model: opts.model,
    printer: false,
    contextManager: 'auto',
    retryStrategy: buildRetryStrategy(),
    plugins: [getSessionManager(opts.runId)],
    tools: (opts.tools ?? []) as never[],
  });
}
