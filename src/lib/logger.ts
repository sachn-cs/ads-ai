import { randomBytes } from 'node:crypto';

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

let requestId: string | undefined;
let runId: string | undefined;

export function setRequestId(id: string | undefined): void {
  requestId = id;
}
export function getRequestId(): string | undefined {
  return requestId;
}
export function clearRequestId(): void {
  requestId = undefined;
}

export function setCurrentRunId(id: string | undefined): void {
  runId = id;
}
export function clearCurrentRunId(): void {
  runId = undefined;
}

export function newRequestId(): string {
  return randomBytes(8).toString('hex');
}

interface EmitContext {
  scope: string;
  bound: Record<string, unknown>;
}

function buildLine(
  level: Level,
  ctx: EmitContext,
  message: string,
  fields?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    t: new Date().toISOString(),
    level,
    scope: ctx.scope,
    requestId,
    runId,
    message,
    ...ctx.bound,
    ...(fields ?? {}),
  };
}

function emit(
  level: Level,
  ctx: EmitContext,
  message: string,
  fields?: Record<string, unknown>,
): void {
  const minRank = LEVEL_RANK[(process.env.LOG_LEVEL as Level) ?? 'info'];
  if (LEVEL_RANK[level] < minRank) return;
  const line = buildLine(level, ctx, message, fields);
  const out = level === 'error' ? process.stderr : process.stdout;
  out.write(JSON.stringify(line) + '\n');
}

export interface Logger {
  debug: (msg: string, fields?: Record<string, unknown>) => void;
  info: (msg: string, fields?: Record<string, unknown>) => void;
  warn: (msg: string, fields?: Record<string, unknown>) => void;
  error: (msg: string, fields?: Record<string, unknown>) => void;
  child: (bound: Record<string, unknown>) => Logger;
  withRun: (runId: string) => Logger;
}

function makeLogger(scope: string, bound: Record<string, unknown> = {}): Logger {
  const ctx: EmitContext = { scope, bound };
  return {
    debug: (msg, fields) => emit('debug', ctx, msg, fields),
    info: (msg, fields) => emit('info', ctx, msg, fields),
    warn: (msg, fields) => emit('warn', ctx, msg, fields),
    error: (msg, fields) => emit('error', ctx, msg, fields),
    child: (more) => makeLogger(scope, { ...bound, ...more }),
    withRun: (rid) => makeLogger(scope, { ...bound, runId: rid }),
  };
}

export function logger(scope: string): Logger {
  return makeLogger(scope);
}
