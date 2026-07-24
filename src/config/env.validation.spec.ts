import { validateEnv } from './env.validation';

const VALID_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
};

describe('validateEnv', () => {
  it('applies sensible defaults', () => {
    const env = validateEnv(VALID_ENV);

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
      NHTSA_API_BASE_URL: 'https://vpic.nhtsa.dot.gov/api',
      INGESTION_CONCURRENCY: 10,
      INGESTION_MAKE_LIMIT: 0,
      INGESTION_CRON_ENABLED: false,
    });
  });

  it('coerces numeric strings from the environment', () => {
    const env = validateEnv({ ...VALID_ENV, PORT: '8080', INGESTION_CONCURRENCY: '5' });

    expect(env.PORT).toBe(8080);
    expect(env.INGESTION_CONCURRENCY).toBe(5);
  });

  it('parses boolean feature flags', () => {
    expect(
      validateEnv({ ...VALID_ENV, INGESTION_CRON_ENABLED: 'true' }).INGESTION_CRON_ENABLED,
    ).toBe(true);
    expect(
      validateEnv({ ...VALID_ENV, INGESTION_CRON_ENABLED: 'false' }).INGESTION_CRON_ENABLED,
    ).toBe(false);
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejects invalid enum values', () => {
    expect(() => validateEnv({ ...VALID_ENV, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('rejects out-of-range values', () => {
    expect(() => validateEnv({ ...VALID_ENV, INGESTION_CONCURRENCY: '500' })).toThrow(
      /INGESTION_CONCURRENCY/,
    );
  });
});
