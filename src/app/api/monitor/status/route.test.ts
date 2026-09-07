import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("/api/monitor/status", () => {
  it("returns monitor status for the current quote snapshot", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=8, stale-while-revalidate=30");
    expect(payload).toMatchObject({
      quote: {
        source: "fallback",
        mode: "bundled-snapshot",
        stale: false,
      },
      monitors: {
        auctionFixedPrice: "planned",
        limitUpPressure: "available",
      },
    });
    expect(payload.quote.stockCount).toBeGreaterThan(0);
    expect(payload.quote.updatedAt).toBeTruthy();
  });
});
