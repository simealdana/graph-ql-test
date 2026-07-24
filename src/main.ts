import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  const config = app.get(AppConfigService);
  await app.listen(config.port);

  logger.log({ port: config.port, env: config.env, graphqlPath: '/graphql' }, 'Service started');

  const shutdown = (signal: string) => {
    logger.log({ signal }, 'Shutdown signal received');
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error: unknown) => {
  console.error('Fatal error during bootstrap', error);
  process.exit(1);
});
