import { describe, expect, it } from "vitest";

import { createQuoteCache } from "./quote-cache";

describe("quote cache", () => {
  it("reuses snapshots within the ttl window", async () => {
    let calls = 0;
    let now = 1_000;
    const cache = createQuoteCache({
      ttlMs: 8_000,
      now: () => now,
      load: async () => ({ updatedAt: "t1", value: ++calls }),
    });

    await expect(cache.get()).resolves.toMatchObject({ value: 1, stale: false });
    now += 7_999;
    await expect(cache.get()).resolves.toMatchObject({ value: 1, stale: false });
    expect(calls).toBe(1);
  });

  it("refreshes snapshots after ttl expires", async () => {
    let calls = 0;
    let now = 1_000;
    const cache = createQuoteCache({
      ttlMs: 8_000,
      now: () => now,
      load: async () => ({ updatedAt: `t${calls + 1}`, value: ++calls }),
    });

    await cache.get();
    now += 8_001;

    await expect(cache.get()).resolves.toMatchObject({ value: 2, stale: false });
    expect(calls).toBe(2);
  });

  it("coalesces concurrent refreshes into one loader call", async () => {
    let calls = 0;
    const cache = createQuoteCache({
      ttlMs: 8_000,
      load: async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { updatedAt: "t1", value: calls };
      },
    });

    const [left, right] = await Promise.all([cache.get(), cache.get()]);

    expect(left).toMatchObject({ value: 1, stale: false });
    expect(right).toMatchObject({ value: 1, stale: false });
    expect(calls).toBe(1);
  });

  it("returns the last successful snapshot as stale when refresh fails", async () => {
    let calls = 0;
    let now = 1_000;
    const cache = createQuoteCache({
      ttlMs: 8_000,
      now: () => now,
      load: async () => {
        calls += 1;
        if (calls > 1) {
          throw new Error("remote down");
        }
        return { updatedAt: "t1", value: 1 };
      },
    });

    await cache.get();
    now += 8_001;

    await expect(cache.get()).resolves.toMatchObject({
      value: 1,
      stale: true,
      error: "remote down",
    });
  });

  it("throws when the first load fails and no fallback exists", async () => {
    const cache = createQuoteCache({
      ttlMs: 8_000,
      load: async () => {
        throw new Error("first load failed");
      },
    });

    await expect(cache.get()).rejects.toThrow("first load failed");
  });
});
