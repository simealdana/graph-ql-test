import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig, buildAppConfig } from './configuration';
import { Env } from './env.validation';

@Injectable()
export class AppConfigService {
  private readonly config: AppConfig;

  constructor(configService: ConfigService<Env, true>) {
    this.config = buildAppConfig({
      NODE_ENV: configService.get('NODE_ENV', { infer: true }),
      PORT: configService.get('PORT', { infer: true }),
      LOG_LEVEL: configService.get('LOG_LEVEL', { infer: true }),
      DATABASE_URL: configService.get('DATABASE_URL', { infer: true }),
      NHTSA_API_BASE_URL: configService.get('NHTSA_API_BASE_URL', { infer: true }),
      NHTSA_REQUEST_TIMEOUT_MS: configService.get('NHTSA_REQUEST_TIMEOUT_MS', { infer: true }),
      NHTSA_MAX_RETRIES: configService.get('NHTSA_MAX_RETRIES', { infer: true }),
      INGESTION_CONCURRENCY: configService.get('INGESTION_CONCURRENCY', { infer: true }),
      INGESTION_MAKE_LIMIT: configService.get('INGESTION_MAKE_LIMIT', { infer: true }),
      INGESTION_BATCH_SIZE: configService.get('INGESTION_BATCH_SIZE', { infer: true }),
      INGESTION_CRON_ENABLED: configService.get('INGESTION_CRON_ENABLED', { infer: true }),
      INGESTION_CRON_EXPRESSION: configService.get('INGESTION_CRON_EXPRESSION', { infer: true }),
    });
  }

  get env(): AppConfig['env'] {
    return this.config.env;
  }

  get port(): number {
    return this.config.port;
  }

  get logLevel(): AppConfig['logLevel'] {
    return this.config.logLevel;
  }

  get database(): AppConfig['database'] {
    return this.config.database;
  }

  get nhtsa(): AppConfig['nhtsa'] {
    return this.config.nhtsa;
  }

  get ingestion(): AppConfig['ingestion'] {
    return this.config.ingestion;
  }
}
