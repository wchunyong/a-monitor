import type { StockProfile } from "./stock-universe";

export type LimitPriceBoard = "main" | "cyb" | "kcb" | "bj" | "st";

export type LimitPriceRule = {
  status: "confirmed";
  board: LimitPriceBoard;
  limitPct: number;
  reason: string;
};

export function getLimitPriceRule(stock: Pick<StockProfile, "exchange" | "symbol" | "name">): LimitPriceRule {
  if (isStStock(stock.name)) {
    return {
      status: "confirmed",
      board: "st",
      limitPct: 5,
      reason: "ST/*ST 股票按 5% 涨跌幅限制处理",
    };
  }

  if (stock.exchange === "BJ") {
    return {
      status: "confirmed",
      board: "bj",
      limitPct: 30,
      reason: "北交所股票按 30% 涨跌幅限制处理",
    };
  }

  if (stock.exchange === "SZ" && stock.symbol.startsWith("30")) {
    return {
      status: "confirmed",
      board: "cyb",
      limitPct: 20,
      reason: "创业板股票按 20% 涨跌幅限制处理",
    };
  }

  if (stock.exchange === "SH" && /^68[89]/.test(stock.symbol)) {
    return {
      status: "confirmed",
      board: "kcb",
      limitPct: 20,
      reason: "科创板股票按 20% 涨跌幅限制处理",
    };
  }

  return {
    status: "confirmed",
    board: "main",
    limitPct: 10,
    reason: "沪深主板股票按 10% 涨跌幅限制处理",
  };
}

export function calculateLimitUpPrice(previousClose: number, rule: LimitPriceRule) {
  if (!Number.isFinite(previousClose) || previousClose <= 0) {
    return null;
  }

  return roundToCent(previousClose * (1 + rule.limitPct / 100));
}

function isStStock(name: string) {
  return /(^|\s|\*)ST/i.test(name) || name.toUpperCase().includes("*ST");
}

function roundToCent(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
