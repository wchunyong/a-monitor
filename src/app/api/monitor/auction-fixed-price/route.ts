import { NextRequest, NextResponse } from "next/server";

import { getFallbackQuoteSnapshot } from "@/lib/market/quote-provider";
import { AuctionFixedPriceMonitor } from "@/lib/monitor/auction-fixed-price";
import { getAuctionPhase } from "@/lib/monitor/trading-clock";

export const maxDuration = 60;

const monitor = new AuctionFixedPriceMonitor();
let monitoringOpened = false;
let finished = false;

export async function GET(request: NextRequest) {
  try {
    const now = parseNow(request.nextUrl.searchParams.get("now"));
    const phase = getAuctionPhase(now);
    const nowText = now.toISOString();
    let data = monitor.snapshot();

    if (phase === "collecting") {
      monitoringOpened = false;
      finished = false;
      data = monitor.ingestCollectionSample(await getFallbackQuoteSnapshot());
    }

    if (phase === "monitoring") {
      if (!monitoringOpened) {
        data = monitor.openMonitoring(nowText);
        monitoringOpened = true;
      }
      data = monitor.ingestMonitoringSample(await getFallbackQuoteSnapshot());
    }

    if (phase === "finished" && monitoringOpened && !finished) {
      data = monitor.finish(nowText);
      finished = true;
    }

    const response = NextResponse.json({
      phase,
      ...data,
    });
    response.headers.set("Cache-Control", "public, s-maxage=8, stale-while-revalidate=30");

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load auction fixed price data",
      },
      { status: 502 }
    );
  }
}

function parseNow(raw: string | null) {
  if (!raw) {
    return new Date();
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
