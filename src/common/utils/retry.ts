export interface RetryOptions {
  maxRetries: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { maxRetries, baseDelayMs = 300, maxDelayMs = 10_000, shouldRetry, onRetry } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const retriesLeft = attempt < maxRetries;
      const retryable = shouldRetry ? shouldRetry(error) : true;
      if (!retriesLeft || !retryable) {
        throw error;
      }
      const exponential = baseDelayMs * 2 ** attempt;
      const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
      const delayMs = Math.min(Math.round(exponential + jitter), maxDelayMs);
      onRetry?.(error, attempt + 1, delayMs);
      await delay(delayMs);
    }
  }
  throw lastError;
}
