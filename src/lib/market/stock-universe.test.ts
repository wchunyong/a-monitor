import { describe, expect, it } from "vitest";

import {
  filterStocksByMarket,
  getAllStocks,
  parseStockCodeList,
  resolveStocksByCodes,
  searchStocks,
} from "./stock-universe";

describe("stock universe", () => {
  it("parses user supplied stock code lists into normalized tokens", () => {
    expect(parseStockCodeList(" sh688041, 002371 ; sz300750 | bad ", 3)).toEqual([
      "SH688041",
      "002371",
      "SZ300750",
    ]);
  });

  it("resolves dotted, prefixed, and plain six digit stock codes", () => {
    const stocks = resolveStocksByCodes(["688041.SH", "SZ002371", "300750"]);

    expect(stocks.map((stock) => stock.code)).toEqual(["688041.SH", "002371.SZ", "300750.SZ"]);
  });

  it("searches stocks by code prefix and Chinese name", () => {
    const byCode = searchStocks("688041", 1);
    const byName = searchStocks("海光", 1);

    expect(byCode[0]).toMatchObject({ code: "688041.SH", name: "海光信息" });
    expect(byName[0]).toMatchObject({ code: "688041.SH", name: "海光信息" });
  });

  it("filters main board without ChiNext, STAR Market, or Beijing Exchange stocks", () => {
    const mainStocks = filterStocksByMarket(getAllStocks(), "main");

    expect(mainStocks.length).toBeGreaterThan(0);
    expect(mainStocks.every((stock) => stock.exchange !== "BJ")).toBe(true);
    expect(mainStocks.every((stock) => !(stock.exchange === "SH" && /^68[89]/.test(stock.symbol)))).toBe(true);
    expect(mainStocks.every((stock) => !(stock.exchange === "SZ" && stock.symbol.startsWith("30")))).toBe(true);
  });

  it("adds sub-board names from the migrated heatmap mapping", () => {
    const stock = resolveStocksByCodes(["688041.SH"])[0];

    expect(stock.boardName).toBe("电子");
    expect(stock.subBoardName).toBeTruthy();
  });
});
