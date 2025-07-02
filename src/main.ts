import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  gracefulShutdownMiddleware,
  setShuttingDown,
} from './middleware/graceful-shutdown.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(gracefulShutdownMiddleware);

  await app.listen(process.env.PORT ?? 3000);
  console.log('🚀 Server started on port 3000');
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  signals.forEach((signal) =>
    process.on(signal, async () => {
      console.log(`\n⏳ Received ${signal}, beginning graceful shutdown...`);
      setShuttingDown(true);
      await app.close();
      console.log('🔒 Server closed cleanly');
      process.exit(0);
    }),
  );
}
bootstrap();
