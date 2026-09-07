import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("/api/monitor/limit-up-pressure", () => {
  it("returns a limit-up pressure snapshot with cache metadata", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=8, stale-while-revalidate=30");
    expect(payload).toMatchObject({
      source: "fallback",
      mode: "bundled-snapshot",
      summary: {
        rulePendingCount: 0,
      },
    });
    expect(payload.summary.totalQuotes).toBeGreaterThan(0);
    expect(Array.isArray(payload.items)).toBe(true);
  });
});
