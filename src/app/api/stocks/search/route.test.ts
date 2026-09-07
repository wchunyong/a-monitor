import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "./route";

describe("/api/stocks/search", () => {
  it("returns matching stocks by query", async () => {
    const response = await GET(new NextRequest("http://localhost/api/stocks/search?q=海光&limit=1"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=30, stale-while-revalidate=120");
    expect(payload.items).toEqual([
      expect.objectContaining({
        code: "688041.SH",
        name: "海光信息",
      }),
    ]);
  });

  it("returns an empty list for blank queries", async () => {
    const response = await GET(new NextRequest("http://localhost/api/stocks/search?q="));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.items).toEqual([]);
  });
});
