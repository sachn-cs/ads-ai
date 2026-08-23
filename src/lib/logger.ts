type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function emit(level: Level, scope: string, message: string, fields?: Record<string, unknown>) {
  const minRank = LEVEL_RANK[(process.env.LOG_LEVEL as Level) ?? 'info'];
  if (LEVEL_RANK[level] < minRank) return;
  const line = {
    t: new Date().toISOString(),
    level,
    scope,
    message,
    ...fields,
  };
  const out = level === 'error' ? process.stderr : process.stdout;
  out.write(JSON.stringify(line) + '\n');
}

function makeLogger(scope: string) {
  return {
    debug: (msg: string, fields?: Record<string, unknown>) => emit('debug', scope, msg, fields),
    info: (msg: string, fields?: Record<string, unknown>) => emit('info', scope, msg, fields),
    warn: (msg: string, fields?: Record<string, unknown>) => emit('warn', scope, msg, fields),
    error: (msg: string, fields?: Record<string, unknown>) => emit('error', scope, msg, fields),
  };
}

export type Logger = ReturnType<typeof makeLogger>;
export function logger(scope: string): Logger {
  return makeLogger(scope);
}
