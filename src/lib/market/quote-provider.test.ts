import { describe, expect, it } from "vitest";

import { getFallbackQuoteSnapshot } from "./quote-provider";
import { getAllStocks } from "./stock-universe";

describe("quote provider", () => {
  it("builds a fallback quote snapshot for the full stock universe", async () => {
    const snapshot = await getFallbackQuoteSnapshot();

    expect(snapshot.source).toBe("fallback");
    expect(snapshot.mode).toBe("bundled-snapshot");
    expect(Object.keys(snapshot.quotes)).toHaveLength(getAllStocks().length);
  });

  it("includes monitoring fields required by limit-up and auction workflows", async () => {
    const snapshot = await getFallbackQuoteSnapshot();
    const quote = snapshot.quotes["688041.SH"];

    expect(quote).toMatchObject({
      code: "688041.SH",
      symbol: "688041",
      exchange: "SH",
      name: "海光信息",
      boardName: "电子",
      currentPrice: 258,
      changePct: 1.98,
    });
    expect(quote.previousClose).toBeGreaterThan(0);
    expect(quote.timestamp).toBe(snapshot.updatedAt);
  });

  it("can return a subset when stock codes are provided", async () => {
    const snapshot = await getFallbackQuoteSnapshot(["688041.SH", "SZ002371"]);

    expect(Object.keys(snapshot.quotes)).toEqual(["688041.SH", "002371.SZ"]);
  });
});
