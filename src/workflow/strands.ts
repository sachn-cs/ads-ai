import path from 'node:path';
import {
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
  const sessionId = runId.toLowerCase();
  const sm = new SessionManager({
    sessionId,
    storage: { snapshot: new FileStorage(SESSION_ROOT) },
    saveLatestOn: 'invocation',
  });
  sessionManagers.set(runId, sm);
  void mkdirQuiet(SESSION_ROOT);
  log.info('session_manager_created', { runId, sessionId, root: SESSION_ROOT });
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