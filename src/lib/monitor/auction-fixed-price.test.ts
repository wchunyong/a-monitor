import { describe, expect, it } from "vitest";

import { AuctionFixedPriceMonitor } from "./auction-fixed-price";
import type { MonitorQuote, QuoteSnapshot } from "../market/quote-provider";

function quote(code: string, currentPrice: number): MonitorQuote {
  const [symbol, exchange] = code.split(".") as [string, "SH" | "SZ" | "BJ"];

  return {
    code,
    symbol,
    exchange,
    name: code,
    boardName: "测试板块",
    subBoardName: "测试子板块",
    currentPrice,
    previousClose: currentPrice,
    changePct: 0,
    turnoverAmount: 1,
    timestamp: "2026-09-07T01:15:00.000Z",
  };
}

function snapshot(updatedAt: string, quotes: MonitorQuote[]): QuoteSnapshot {
  return {
    updatedAt,
    source: "fallback",
    mode: "bundled-snapshot",
    quotes: Object.fromEntries(quotes.map((item) => [item.code, { ...item, timestamp: updatedAt }])),
  };
}

describe("auction fixed price monitor", () => {
  it("creates candidates from stocks whose collection samples stay fixed", () => {
    const monitor = new AuctionFixedPriceMonitor();

    monitor.ingestCollectionSample(snapshot("2026-09-07T01:15:00.000Z", [quote("600000.SH", 10), quote("000001.SZ", 11)]));
    monitor.ingestCollectionSample(snapshot("2026-09-07T01:19:50.000Z", [quote("600000.SH", 10), quote("000001.SZ", 11.01)]));

    const result = monitor.openMonitoring("2026-09-07T01:20:00.000Z");

    expect(result.summary.candidateCount).toBe(1);
    expect(result.items[0]).toMatchObject({
      code: "600000.SH",
      fixedPrice: 10,
      status: "candidate",
      dataMode: "sample",
    });
  });

  it("removes candidates when monitoring samples change price", () => {
    const monitor = new AuctionFixedPriceMonitor();

    monitor.ingestCollectionSample(snapshot("2026-09-07T01:15:00.000Z", [quote("600000.SH", 10)]));
    monitor.openMonitoring("2026-09-07T01:20:00.000Z");
    const result = monitor.ingestMonitoringSample(snapshot("2026-09-07T01:20:10.000Z", [quote("600000.SH", 10.01)]));

    expect(result.summary.removedCount).toBe(1);
    expect(result.items[0]).toMatchObject({
      code: "600000.SH",
      status: "removed",
      firstChangedPrice: 10.01,
      removedAt: "2026-09-07T01:20:10.000Z",
    });
  });

  it("marks unchanged candidates as stable during monitoring and finished after 09:30", () => {
    const monitor = new AuctionFixedPriceMonitor();

    monitor.ingestCollectionSample(snapshot("2026-09-07T01:15:00.000Z", [quote("600000.SH", 10)]));
    monitor.openMonitoring("2026-09-07T01:20:00.000Z");
    monitor.ingestMonitoringSample(snapshot("2026-09-07T01:20:10.000Z", [quote("600000.SH", 10)]));
    const result = monitor.finish("2026-09-07T01:30:00.000Z");

    expect(result.summary.finalCount).toBe(1);
    expect(result.items[0]).toMatchObject({
      code: "600000.SH",
      status: "finished",
      lastCheckedAt: "2026-09-07T01:30:00.000Z",
    });
  });

  it("does not create candidates for stocks without valid collection samples", () => {
    const monitor = new AuctionFixedPriceMonitor();

    monitor.ingestCollectionSample(snapshot("2026-09-07T01:15:00.000Z", [quote("600000.SH", 0)]));
    const result = monitor.openMonitoring("2026-09-07T01:20:00.000Z");

    expect(result.summary.candidateCount).toBe(0);
    expect(result.summary.noDataCount).toBe(1);
  });
});
