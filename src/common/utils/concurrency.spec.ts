import { chunk, mapWithConcurrency } from './concurrency';

describe('mapWithConcurrency', () => {
  it('maps every item preserving order', async () => {
    const results = await mapWithConcurrency([1, 2, 3, 4], 2, (n) => Promise.resolve(n * 2));

    expect(results.map((r) => r.result)).toEqual([2, 4, 6, 8]);
  });

  it('never exceeds the concurrency limit', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    await mapWithConcurrency(
      Array.from({ length: 20 }, (_, i) => i),
      3,
      async () => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setImmediate(resolve));
        inFlight--;
      },
    );

    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it('captures per-item errors without failing the batch', async () => {
    const results = await mapWithConcurrency([1, 2, 3], 2, (n) =>
      n === 2 ? Promise.reject(new Error('boom')) : Promise.resolve(n),
    );

    expect(results[0].result).toBe(1);
    expect(results[1].error).toBeInstanceOf(Error);
    expect(results[2].result).toBe(3);
  });

  it('rejects invalid concurrency values', async () => {
    await expect(mapWithConcurrency([1], 0, (n) => Promise.resolve(n))).rejects.toThrow();
  });
});

describe('chunk', () => {
  it('splits an array into fixed-size chunks', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns an empty array for empty input', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('rejects invalid sizes', () => {
    expect(() => chunk([1], 0)).toThrow();
  });
});
