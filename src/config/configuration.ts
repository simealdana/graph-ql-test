import { Env } from './env.validation';

export interface AppConfig {
  env: Env['NODE_ENV'];
  port: number;
  logLevel: Env['LOG_LEVEL'];
  database: {
    url: string;
  };
  nhtsa: {
    baseUrl: string;
    requestTimeoutMs: number;
    maxRetries: number;
  };
  ingestion: {
    concurrency: number;
    makeLimit: number;
    batchSize: number;
    cronEnabled: boolean;
    cronExpression: string;
  };
}

export function buildAppConfig(env: Env): AppConfig {
  return {
    env: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    database: {
      url: env.DATABASE_URL,
    },
    nhtsa: {
      baseUrl: env.NHTSA_API_BASE_URL,
      requestTimeoutMs: env.NHTSA_REQUEST_TIMEOUT_MS,
      maxRetries: env.NHTSA_MAX_RETRIES,
    },
    ingestion: {
      concurrency: env.INGESTION_CONCURRENCY,
      makeLimit: env.INGESTION_MAKE_LIMIT,
      batchSize: env.INGESTION_BATCH_SIZE,
      cronEnabled: env.INGESTION_CRON_ENABLED,
      cronExpression: env.INGESTION_CRON_EXPRESSION,
    },
  };
}
