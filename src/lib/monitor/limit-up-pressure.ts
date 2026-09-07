import { calculateLimitUpPrice, getLimitPriceRule, type LimitPriceBoard } from "../market/limit-price-rules";
import type { MonitorQuote, QuoteMode, QuoteSnapshot, QuoteSource } from "../market/quote-provider";

export type LimitUpConclusion = "price_reaches_limit_up";

export type LimitUpItem = {
  code: string;
  symbol: string;
  exchange: MonitorQuote["exchange"];
  name: string;
  boardName: string;
  subBoardName: string;
  currentPrice: number;
  previousClose: number;
  changePct: number;
  turnoverAmount: number;
  limitUpPrice: number;
  ruleBoard: LimitPriceBoard;
  ruleLimitPct: number;
  ruleReason: string;
  conclusion: LimitUpConclusion;
  quoteTimestamp: string;
};

export type LimitUpPressureSnapshot = {
  updatedAt: string;
  source: QuoteSource;
  mode: QuoteMode;
  summary: {
    totalQuotes: number;
    limitUpCount: number;
    rulePendingCount: number;
  };
  items: LimitUpItem[];
};

export function findLimitUpQuotes(snapshot: QuoteSnapshot): LimitUpPressureSnapshot {
  const items: LimitUpItem[] = [];

  for (const quote of Object.values(snapshot.quotes)) {
    const rule = getLimitPriceRule(quote);
    const limitUpPrice = calculateLimitUpPrice(quote.previousClose, rule);

    if (limitUpPrice === null || !reachesLimitUp(quote.currentPrice, limitUpPrice)) {
      continue;
    }

    items.push({
      code: quote.code,
      symbol: quote.symbol,
      exchange: quote.exchange,
      name: quote.name,
      boardName: quote.boardName,
      subBoardName: quote.subBoardName,
      currentPrice: quote.currentPrice,
      previousClose: quote.previousClose,
      changePct: quote.changePct,
      turnoverAmount: quote.turnoverAmount,
      limitUpPrice,
      ruleBoard: rule.board,
      ruleLimitPct: rule.limitPct,
      ruleReason: rule.reason,
      conclusion: "price_reaches_limit_up",
      quoteTimestamp: quote.timestamp,
    });
  }

  items.sort((left, right) => right.turnoverAmount - left.turnoverAmount);

  return {
    updatedAt: snapshot.updatedAt,
    source: snapshot.source,
    mode: snapshot.mode,
    summary: {
      totalQuotes: Object.keys(snapshot.quotes).length,
      limitUpCount: items.length,
      rulePendingCount: 0,
    },
    items,
  };
}

function reachesLimitUp(currentPrice: number, limitUpPrice: number) {
  return currentPrice + 0.001 >= limitUpPrice;
}
