import type { MonitorQuote, QuoteSnapshot } from "../market/quote-provider";

export type AuctionFixedPriceStatus = "candidate" | "stable" | "removed" | "no_data" | "finished";
export type AuctionDataMode = "sample";

export type AuctionFixedPriceItem = {
  code: string;
  symbol: string;
  exchange: MonitorQuote["exchange"];
  name: string;
  boardName: string;
  subBoardName: string;
  fixedPrice: number;
  changePct: number;
  dataMode: AuctionDataMode;
  enteredAt: string;
  lastCheckedAt: string;
  status: AuctionFixedPriceStatus;
  removedAt?: string;
  firstChangedPrice?: number;
};

export type AuctionFixedPriceSnapshot = {
  updatedAt: string;
  dataMode: AuctionDataMode;
  summary: {
    candidateCount: number;
    stableCount: number;
    removedCount: number;
    noDataCount: number;
    finalCount: number;
  };
  items: AuctionFixedPriceItem[];
};

type CollectedStock = {
  quote: MonitorQuote;
  prices: Set<number>;
  hasValidSample: boolean;
};

export class AuctionFixedPriceMonitor {
  private collected = new Map<string, CollectedStock>();
  private items = new Map<string, AuctionFixedPriceItem>();
  private noDataCount = 0;
  private updatedAt = "";

  ingestCollectionSample(snapshot: QuoteSnapshot) {
    this.updatedAt = snapshot.updatedAt;

    for (const quote of Object.values(snapshot.quotes)) {
      const current = this.collected.get(quote.code) ?? {
        quote,
        prices: new Set<number>(),
        hasValidSample: false,
      };

      current.quote = quote;
      if (isValidPrice(quote.currentPrice)) {
        current.prices.add(quote.currentPrice);
        current.hasValidSample = true;
      }

      this.collected.set(quote.code, current);
    }

    return this.snapshot();
  }

  openMonitoring(now: string) {
    this.updatedAt = now;
    this.items.clear();
    this.noDataCount = 0;

    for (const collected of this.collected.values()) {
      if (!collected.hasValidSample) {
        this.noDataCount += 1;
        continue;
      }

      if (collected.prices.size !== 1) {
        continue;
      }

      const fixedPrice = [...collected.prices][0];
      this.items.set(collected.quote.code, {
        code: collected.quote.code,
        symbol: collected.quote.symbol,
        exchange: collected.quote.exchange,
        name: collected.quote.name,
        boardName: collected.quote.boardName,
        subBoardName: collected.quote.subBoardName,
        fixedPrice,
        changePct: collected.quote.changePct,
        dataMode: "sample",
        enteredAt: now,
        lastCheckedAt: now,
        status: "candidate",
      });
    }

    return this.snapshot();
  }

  ingestMonitoringSample(snapshot: QuoteSnapshot) {
    this.updatedAt = snapshot.updatedAt;

    for (const item of this.items.values()) {
      if (item.status === "removed" || item.status === "finished") {
        continue;
      }

      const quote = snapshot.quotes[item.code];
      if (!quote || !isValidPrice(quote.currentPrice)) {
        item.lastCheckedAt = snapshot.updatedAt;
        item.status = "stable";
        continue;
      }

      item.lastCheckedAt = snapshot.updatedAt;
      if (quote.currentPrice !== item.fixedPrice) {
        item.status = "removed";
        item.removedAt = snapshot.updatedAt;
        item.firstChangedPrice = quote.currentPrice;
      } else {
        item.status = "stable";
      }
    }

    return this.snapshot();
  }

  finish(now: string) {
    this.updatedAt = now;

    for (const item of this.items.values()) {
      if (item.status !== "removed") {
        item.status = "finished";
        item.lastCheckedAt = now;
      }
    }

    return this.snapshot();
  }

  snapshot(): AuctionFixedPriceSnapshot {
    const items = [...this.items.values()].sort((left, right) => left.code.localeCompare(right.code));

    return {
      updatedAt: this.updatedAt,
      dataMode: "sample",
      summary: {
        candidateCount: items.filter((item) => item.status === "candidate").length,
        stableCount: items.filter((item) => item.status === "stable").length,
        removedCount: items.filter((item) => item.status === "removed").length,
        noDataCount: this.noDataCount,
        finalCount: items.filter((item) => item.status === "finished").length,
      },
      items,
    };
  }
}

function isValidPrice(value: number) {
  return Number.isFinite(value) && value > 0;
}
