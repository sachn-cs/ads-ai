export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { logger } = await import('@/src/lib/logger');
  const log = logger('instrumentation');

  process.on('unhandledRejection', (reason) => {
    log.error('unhandled_rejection', { reason: String(reason) });
  });
  process.on('uncaughtException', (err) => {
    log.error('uncaught_exception', { err: err.message, stack: err.stack });
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info('shutdown_started', { signal });
    try {
      const { resetDbForTesting } = await import('@/src/db/client');
      resetDbForTesting();
    } catch (err) {
      log.warn('db_close_failed', { err: String(err) });
    }
    log.info('shutdown_complete', { signal });
    setTimeout(() => process.exit(0), 100).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  log.info('instrumentation_registered', { nodeEnv: process.env.NODE_ENV ?? 'unknown' });
}
