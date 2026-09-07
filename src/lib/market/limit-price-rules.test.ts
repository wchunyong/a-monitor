import { describe, expect, it } from "vitest";

import { calculateLimitUpPrice, getLimitPriceRule } from "./limit-price-rules";
import type { StockProfile } from "./stock-universe";

function stock(overrides: Partial<StockProfile>): StockProfile {
  return {
    code: "600000.SH",
    symbol: "600000",
    exchange: "SH",
    name: "浦发银行",
    boardName: "银行",
    subBoardName: "股份制银行",
    price: 10,
    changePct: 0,
    totalMarketCap: 1,
    floatMarketCap: 1,
    ...overrides,
  };
}

describe("limit price rules", () => {
  it("uses a 10 percent limit for regular Shanghai and Shenzhen main board stocks", () => {
    const rule = getLimitPriceRule(stock({ code: "600000.SH", symbol: "600000", exchange: "SH" }));

    expect(rule).toMatchObject({ status: "confirmed", limitPct: 10, board: "main" });
    expect(calculateLimitUpPrice(10.01, rule)).toBe(11.01);
  });

  it("uses a 20 percent limit for ChiNext and STAR Market stocks", () => {
    const cybRule = getLimitPriceRule(stock({ code: "300750.SZ", symbol: "300750", exchange: "SZ" }));
    const kcbRule = getLimitPriceRule(stock({ code: "688041.SH", symbol: "688041", exchange: "SH" }));

    expect(cybRule).toMatchObject({ status: "confirmed", limitPct: 20, board: "cyb" });
    expect(kcbRule).toMatchObject({ status: "confirmed", limitPct: 20, board: "kcb" });
    expect(calculateLimitUpPrice(25.03, cybRule)).toBe(30.04);
  });

  it("uses a 30 percent limit for Beijing Exchange stocks", () => {
    const rule = getLimitPriceRule(stock({ code: "430047.BJ", symbol: "430047", exchange: "BJ" }));

    expect(rule).toMatchObject({ status: "confirmed", limitPct: 30, board: "bj" });
    expect(calculateLimitUpPrice(7.77, rule)).toBe(10.1);
  });

  it("uses a 5 percent limit for ST stocks before board-specific regular limits", () => {
    const rule = getLimitPriceRule(stock({ code: "300000.SZ", symbol: "300000", exchange: "SZ", name: "*ST测试" }));

    expect(rule).toMatchObject({ status: "confirmed", limitPct: 5, board: "st" });
    expect(calculateLimitUpPrice(3.21, rule)).toBe(3.37);
  });

  it("marks invalid previous close values as rule pending", () => {
    const rule = getLimitPriceRule(stock({}));

    expect(calculateLimitUpPrice(0, rule)).toBeNull();
    expect(calculateLimitUpPrice(Number.NaN, rule)).toBeNull();
  });
});
