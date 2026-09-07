import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "./route";

describe("/api/monitor/auction-fixed-price", () => {
  it("returns the auction phase and sample mode metadata", async () => {
    const response = await GET(new NextRequest("http://localhost/api/monitor/auction-fixed-price?now=2026-09-07T09:14:59%2B08:00"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=8, stale-while-revalidate=30");
    expect(payload).toMatchObject({
      phase: "waiting",
      dataMode: "sample",
      summary: {
        candidateCount: 0,
        removedCount: 0,
        finalCount: 0,
      },
    });
    expect(Array.isArray(payload.items)).toBe(true);
  });

  it("collects fallback samples during the collection phase", async () => {
    const response = await GET(new NextRequest("http://localhost/api/monitor/auction-fixed-price?now=2026-09-07T09:15:00%2B08:00"));
    const payload = await response.json();

    expect(payload.phase).toBe("collecting");
    expect(payload.updatedAt).toBeTruthy();
  });
});
