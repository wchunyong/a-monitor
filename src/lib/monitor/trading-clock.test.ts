import { describe, expect, it } from "vitest";

import { getAuctionPhase } from "./trading-clock";

describe("trading clock", () => {
  it("reports waiting before auction collection starts", () => {
    expect(getAuctionPhase(new Date("2026-09-07T09:14:59+08:00"))).toBe("waiting");
  });

  it("reports collecting from 09:15 inclusive to before 09:20", () => {
    expect(getAuctionPhase(new Date("2026-09-07T09:15:00+08:00"))).toBe("collecting");
    expect(getAuctionPhase(new Date("2026-09-07T09:19:59+08:00"))).toBe("collecting");
  });

  it("reports monitoring from 09:20 inclusive to before 09:30", () => {
    expect(getAuctionPhase(new Date("2026-09-07T09:20:00+08:00"))).toBe("monitoring");
    expect(getAuctionPhase(new Date("2026-09-07T09:29:59+08:00"))).toBe("monitoring");
  });

  it("reports finished at and after 09:30 on a trading day", () => {
    expect(getAuctionPhase(new Date("2026-09-07T09:30:00+08:00"))).toBe("finished");
    expect(getAuctionPhase(new Date("2026-09-07T15:00:00+08:00"))).toBe("finished");
  });

  it("reports closed on weekends", () => {
    expect(getAuctionPhase(new Date("2026-09-06T09:20:00+08:00"))).toBe("closed");
  });
});
