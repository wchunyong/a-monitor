import fallbackMarketSnapshot from "../data/market-heatmap-fallback.json";
import { getAllStocks, resolveStocksByCodes, type ExchangeCode, type StockProfile } from "./stock-universe";

export type QuoteSource = "direct" | "fallback";
export type QuoteMode = "remote-snapshot" | "bundled-snapshot";

export type MonitorQuote = {
  code: string;
  symbol: string;
  exchange: ExchangeCode;
  name: string;
  boardName: string;
  subBoardName: string;
  currentPrice: number;
  previousClose: number;
  changePct: number;
  turnoverAmount: number;
  timestamp: string;
};

export type QuoteSnapshot = {
  updatedAt: string;
  source: QuoteSource;
  mode: QuoteMode;
  quotes: Record<string, MonitorQuote>;
};

type FallbackSnapshot = {
  updatedAt: string;
};

const fallbackSeed = fallbackMarketSnapshot as FallbackSnapshot;

export async function getFallbackQuoteSnapshot(rawCodes?: string[]): Promise<QuoteSnapshot> {
  const selectedStocks = rawCodes && rawCodes.length > 0 ? resolveStocksByCodes(rawCodes) : getAllStocks();
  const quotes: Record<string, MonitorQuote> = {};

  for (const stock of selectedStocks) {
    quotes[stock.code] = toFallbackQuote(stock, fallbackSeed.updatedAt);
  }

  return {
    updatedAt: fallbackSeed.updatedAt,
    source: "fallback",
    mode: "bundled-snapshot",
    quotes,
  };
}

function toFallbackQuote(stock: StockProfile, timestamp: string): MonitorQuote {
  return {
    code: stock.code,
    symbol: stock.symbol,
    exchange: stock.exchange,
    name: stock.name,
    boardName: stock.boardName,
    subBoardName: stock.subBoardName,
    currentPrice: stock.price,
    previousClose: estimatePreviousClose(stock.price, stock.changePct),
    changePct: stock.changePct,
    turnoverAmount: estimateTurnoverAmount(stock),
    timestamp,
  };
}

function estimatePreviousClose(currentPrice: number, changePct: number) {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return 0;
  }

  const divisor = 1 + changePct / 100;
  if (!Number.isFinite(divisor) || divisor <= 0) {
    return currentPrice;
  }

  return roundToCent(currentPrice / divisor);
}

function estimateTurnoverAmount(stock: StockProfile) {
  const cap = stock.floatMarketCap || stock.totalMarketCap || stock.price * 1_000_000;
  const activityRatio = 0.012 + Math.min(Math.abs(stock.changePct), 10) * 0.002;
  return Math.round(cap * activityRatio);
}

function roundToCent(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
