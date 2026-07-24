export interface ConcurrencyResult<T, R> {
  item: T;
  result?: R;
  error?: unknown;
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<ConcurrencyResult<T, R>[]> {
  if (concurrency < 1) {
    throw new Error('concurrency must be >= 1');
  }

  const results: ConcurrencyResult<T, R>[] = new Array<ConcurrencyResult<T, R>>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      const item = items[index];
      try {
        results[index] = { item, result: await mapper(item, index) };
      } catch (error) {
        results[index] = { item, error };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size < 1) {
    throw new Error('chunk size must be >= 1');
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
