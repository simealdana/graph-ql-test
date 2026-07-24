import { withRetry } from './retry';

describe('withRetry', () => {
  beforeEach(() => {
    jest.spyOn(global, 'setTimeout').mockImplementation((fn: () => void) => {
      fn();
      return 0 as unknown as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the result when the operation succeeds first try', async () => {
    const operation = jest.fn().mockResolvedValue('ok');

    await expect(withRetry(operation, { maxRetries: 3 })).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries failed operations until success', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    await expect(withRetry(operation, { maxRetries: 3 })).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('throws the last error after exhausting retries', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('always fails'));

    await expect(withRetry(operation, { maxRetries: 2 })).rejects.toThrow('always fails');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('does not retry when shouldRetry returns false', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('fatal'));

    await expect(withRetry(operation, { maxRetries: 3, shouldRetry: () => false })).rejects.toThrow(
      'fatal',
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('notifies each retry attempt', async () => {
    const onRetry = jest.fn();
    const operation = jest.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('ok');

    await withRetry(operation, { maxRetries: 3, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, expect.any(Number));
  });
});
