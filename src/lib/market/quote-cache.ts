export type CachedSnapshot<T> = T & {
  stale: boolean;
  error?: string;
};

export type QuoteCacheOptions<T> = {
  ttlMs: number;
  load: () => Promise<T>;
  now?: () => number;
};

export function createQuoteCache<T extends object>(options: QuoteCacheOptions<T>) {
  let cached: { loadedAt: number; snapshot: T } | null = null;
  let pending: Promise<CachedSnapshot<T>> | null = null;
  const now = options.now ?? Date.now;

  async function refresh() {
    try {
      const snapshot = await options.load();
      cached = {
        loadedAt: now(),
        snapshot,
      };
      return markFresh(snapshot);
    } catch (error) {
      if (cached) {
        return {
          ...cached.snapshot,
          stale: true,
          error: error instanceof Error ? error.message : "Failed to refresh quote snapshot",
        };
      }

      throw error;
    }
  }

  return {
    async get() {
      const current = now();
      if (cached && current - cached.loadedAt < options.ttlMs) {
        return markFresh(cached.snapshot);
      }

      if (!pending) {
        pending = refresh().finally(() => {
          pending = null;
        });
      }

      return pending;
    },
  };
}

function markFresh<T extends object>(snapshot: T): CachedSnapshot<T> {
  return {
    ...snapshot,
    stale: false,
  };
}
