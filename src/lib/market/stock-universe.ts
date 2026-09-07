import fallbackMarketSnapshot from "../data/market-heatmap-fallback.json";
import subboardSnapshot from "../data/market-heatmap-subboards.json";

export const marketKeys = ["all", "sse", "szse", "main", "cyb", "kcb", "bj"] as const;

export type MarketKey = (typeof marketKeys)[number];
export type ExchangeCode = "SH" | "SZ" | "BJ";

export type StockProfile = {
  code: string;
  symbol: string;
  exchange: ExchangeCode;
  name: string;
  boardName: string;
  subBoardName: string;
  price: number;
  changePct: number;
  totalMarketCap: number;
  floatMarketCap: number;
};

type FallbackSnapshot = {
  stocks: Array<{
    code: string;
    exchange: ExchangeCode;
    name: string;
    boardName: string;
    price: number;
    changePct: number;
    totalMarketCap: number;
    floatMarketCap: number;
  }>;
};

type SubboardSnapshot = {
  subboards: Record<string, { sectorName: string; subBoardName: string }>;
};

const fallbackSeed = fallbackMarketSnapshot as FallbackSnapshot;
const subboardSeed = subboardSnapshot as SubboardSnapshot;

const stocks: StockProfile[] = fallbackSeed.stocks.map((stock) => {
  const symbol = stock.code.split(".")[0] ?? stock.code;
  const mapped = subboardSeed.subboards[stock.code];

  return {
    ...stock,
    symbol,
    boardName: mapped?.sectorName ?? stock.boardName,
    subBoardName: mapped?.subBoardName ?? stock.boardName,
  };
});

const stocksByCode = new Map(stocks.map((stock) => [stock.code, stock]));
const stocksBySymbol = new Map<string, StockProfile[]>();

for (const stock of stocks) {
  const current = stocksBySymbol.get(stock.symbol) ?? [];
  current.push(stock);
  stocksBySymbol.set(stock.symbol, current);
}

export function isMarketKey(value: string): value is MarketKey {
  return marketKeys.includes(value as MarketKey);
}

export function getAllStocks() {
  return stocks;
}

export function normalizeStockToken(raw: string) {
  return raw.trim().toUpperCase().replace(/[\s_-]+/g, "");
}

export function parseStockCodeList(raw: string | null | undefined, maxCount = 80) {
  if (!raw) {
    return [];
  }

  return raw
    .split(/[,;|\s]+/)
    .map((token) => normalizeStockToken(token))
    .filter(Boolean)
    .slice(0, maxCount);
}

export function resolveStocksByCodes(rawCodes: string[]) {
  const resolved: StockProfile[] = [];
  const seen = new Set<string>();

  for (const raw of rawCodes) {
    const token = normalizeStockToken(raw);
    const matches = resolveToken(token);

    for (const stock of matches) {
      if (seen.has(stock.code)) {
        continue;
      }

      seen.add(stock.code);
      resolved.push(stock);
    }
  }

  return resolved;
}

function resolveToken(token: string) {
  if (!token) {
    return [];
  }

  const dotted = token.match(/^(\d{6})\.(SH|SZ|BJ)$/);
  if (dotted) {
    const stock = stocksByCode.get(`${dotted[1]}.${dotted[2]}`);
    return stock ? [stock] : [];
  }

  const prefixed = token.match(/^(SH|SZ|BJ)(\d{6})$/);
  if (prefixed) {
    const stock = stocksByCode.get(`${prefixed[2]}.${prefixed[1]}`);
    return stock ? [stock] : [];
  }

  if (/^\d{6}$/.test(token)) {
    return stocksBySymbol.get(token) ?? [];
  }

  const exact = stocksByCode.get(token);
  return exact ? [exact] : [];
}

export function searchStocks(query: string, limit = 12) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const token = normalizeStockToken(trimmed);
  const matches: Array<{ stock: StockProfile; rank: number }> = [];

  for (const stock of stocks) {
    const rank = rankStockSearchMatch(stock, trimmed, token);
    if (rank > 0) {
      matches.push({ stock, rank });
    }
  }

  matches.sort((left, right) => {
    if (left.rank !== right.rank) {
      return left.rank - right.rank;
    }

    return right.stock.floatMarketCap - left.stock.floatMarketCap;
  });

  return matches.slice(0, limit).map((match) => match.stock);
}

function rankStockSearchMatch(stock: StockProfile, query: string, token: string) {
  const codeUpper = stock.code.toUpperCase();
  const prefixed = `${stock.exchange}${stock.symbol}`;

  if (codeUpper === token || stock.symbol === token || prefixed === token) {
    return 1;
  }

  if (/^\d+$/.test(token) && stock.symbol.startsWith(token)) {
    return 2;
  }

  if (stock.name === query) {
    return 3;
  }

  if (stock.name.startsWith(query)) {
    return 4;
  }

  if (stock.name.includes(query)) {
    return 5;
  }

  return 0;
}

export function filterStocksByMarket(sourceStocks: StockProfile[], market: MarketKey) {
  if (market === "all") {
    return sourceStocks;
  }

  return sourceStocks.filter((stock) => stockMatchesMarket(stock, market));
}

function stockMatchesMarket(stock: StockProfile, market: Exclude<MarketKey, "all">) {
  if (market === "sse") {
    return stock.exchange === "SH";
  }

  if (market === "szse") {
    return stock.exchange === "SZ";
  }

  if (market === "bj") {
    return stock.exchange === "BJ";
  }

  if (market === "cyb") {
    return stock.exchange === "SZ" && stock.symbol.startsWith("30");
  }

  if (market === "kcb") {
    return stock.exchange === "SH" && /^68[89]/.test(stock.symbol);
  }

  if (stock.exchange === "BJ") {
    return false;
  }

  if (stock.exchange === "SZ" && stock.symbol.startsWith("30")) {
    return false;
  }

  if (stock.exchange === "SH" && /^68[89]/.test(stock.symbol)) {
    return false;
  }

  return stock.exchange === "SH" || stock.exchange === "SZ";
}
