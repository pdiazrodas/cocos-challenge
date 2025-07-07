import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  gracefulShutdownMiddleware,
  setShuttingDown,
} from './middleware/graceful-shutdown.middleware';
import { Logger, ValidationPipe } from '@nestjs/common';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  app.use(gracefulShutdownMiddleware);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(process.env.PORT ?? 3000);
  logger.log('🚀 Server started on port 3000');
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  const shutdownTimeoutMs = 15000; // 15 seconds

  signals.forEach((signal) =>
    process.on(signal, async () => {
      const start = Date.now();
      logger.log(`\n⏳ Received ${signal}, beginning graceful shutdown...`);
      setShuttingDown(true);

      // If it takes too long or something keeps the app from closing (e.g., open connections, pending requests, anything not correctly handled on cleanup),
      // we will force exit after the timeout
      const forceExit = setTimeout(() => {
        logger.error('🛑 Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
      }, shutdownTimeoutMs);

      try {
        // The clean up logic will be handled through life cycle hooks
        await app.close();
        clearTimeout(forceExit);
        const durationMs = Date.now() - start;
        logger.log(`🔒 Server closed cleanly in ${durationMs}ms`);
        process.exit(0);
      } catch (error: unknown) {
        // This should never happen if everything is set up and handled correctly in the app
        if (error instanceof Error) {
          logger.log('❌ Error during shutdown', error.stack);
        } else {
          logger.log('❌ Unknown error during shutdown', String(error));
        }
        process.exit(1);
      }
    }),
  );
}
bootstrap();
