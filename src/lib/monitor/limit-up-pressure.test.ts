import { describe, expect, it } from "vitest";

import { findLimitUpQuotes } from "./limit-up-pressure";
import type { MonitorQuote, QuoteSnapshot } from "../market/quote-provider";

function quote(overrides: Partial<MonitorQuote>): MonitorQuote {
  return {
    code: "600000.SH",
    symbol: "600000",
    exchange: "SH",
    name: "浦发银行",
    boardName: "银行",
    subBoardName: "股份制银行",
    currentPrice: 11,
    previousClose: 10,
    changePct: 10,
    turnoverAmount: 1_000_000,
    timestamp: "2026-09-07T01:30:00.000Z",
    ...overrides,
  };
}

function snapshot(quotes: MonitorQuote[]): QuoteSnapshot {
  return {
    updatedAt: "2026-09-07T01:30:00.000Z",
    source: "fallback",
    mode: "bundled-snapshot",
    quotes: Object.fromEntries(quotes.map((item) => [item.code, item])),
  };
}

describe("limit-up pressure monitor", () => {
  it("returns stocks whose current price reaches the calculated limit-up price", () => {
    const result = findLimitUpQuotes(
      snapshot([
        quote({ code: "600000.SH", symbol: "600000", currentPrice: 11, previousClose: 10 }),
        quote({ code: "000001.SZ", symbol: "000001", exchange: "SZ", currentPrice: 10.5, previousClose: 10 }),
      ])
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      code: "600000.SH",
      limitUpPrice: 11,
      ruleBoard: "main",
      ruleLimitPct: 10,
      conclusion: "price_reaches_limit_up",
    });
  });

  it("uses board-specific limit rules when detecting limit-up stocks", () => {
    const result = findLimitUpQuotes(
      snapshot([
        quote({ code: "300750.SZ", symbol: "300750", exchange: "SZ", currentPrice: 12, previousClose: 10 }),
        quote({ code: "430047.BJ", symbol: "430047", exchange: "BJ", currentPrice: 13, previousClose: 10 }),
      ])
    );

    expect(result.items.map((item) => item.code)).toEqual(["300750.SZ", "430047.BJ"]);
    expect(result.items.map((item) => item.ruleLimitPct)).toEqual([20, 30]);
  });

  it("uses ST limits before regular board limits", () => {
    const result = findLimitUpQuotes(
      snapshot([quote({ code: "300000.SZ", symbol: "300000", exchange: "SZ", name: "*ST测试", currentPrice: 10.5 })])
    );

    expect(result.items[0]).toMatchObject({
      ruleBoard: "st",
      ruleLimitPct: 5,
      limitUpPrice: 10.5,
    });
  });

  it("reports source metadata and summary counts", () => {
    const result = findLimitUpQuotes(snapshot([quote({ currentPrice: 11 }), quote({ code: "000001.SZ", currentPrice: 9 })]));

    expect(result.summary).toEqual({
      totalQuotes: 2,
      limitUpCount: 1,
      rulePendingCount: 0,
    });
    expect(result.updatedAt).toBe("2026-09-07T01:30:00.000Z");
    expect(result.source).toBe("fallback");
    expect(result.mode).toBe("bundled-snapshot");
  });
});
