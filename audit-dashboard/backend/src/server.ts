import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import { seedAdminUser } from './services/adminSeed.service';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  // Runs on every boot, not just once manually — idempotent (checks for
  // an existing admin before creating one), so this is safe on every
  // restart and every deploy without ever producing duplicate accounts.
  await seedAdminUser();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Shutdown complete.');
      process.exit(0);
    });

    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', reason);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to bootstrap application', err);
  process.exit(1);
});
