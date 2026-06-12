const RETRYABLE = /fetch failed|ECONNRESET|ETIMEDOUT|ECONNREFUSED|socket hang up/i;

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 4,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error
          ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ""}`
          : String(error);

      if (!RETRYABLE.test(message) || attempt === retries - 1) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 400 * (attempt + 1)),
      );
    }
  }

  throw lastError;
}
