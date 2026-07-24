import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  NHTSA_API_BASE_URL: z.string().url().default('https://vpic.nhtsa.dot.gov/api'),
  NHTSA_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  NHTSA_MAX_RETRIES: z.coerce.number().int().min(0).default(3),
  INGESTION_CONCURRENCY: z.coerce.number().int().positive().max(50).default(10),
  INGESTION_MAKE_LIMIT: z.coerce.number().int().min(0).default(0),
  INGESTION_BATCH_SIZE: z.coerce.number().int().positive().default(500),
  INGESTION_CRON_ENABLED: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  INGESTION_CRON_EXPRESSION: z.string().default('0 3 * * *'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration -> ${issues}`);
  }
  return result.data;
}
