import { NextResponse } from "next/server";

import { getFallbackQuoteSnapshot } from "@/lib/market/quote-provider";

export const maxDuration = 60;

export async function GET() {
  try {
    const quoteSnapshot = await getFallbackQuoteSnapshot();
    const response = NextResponse.json({
      quote: {
        source: quoteSnapshot.source,
        mode: quoteSnapshot.mode,
        stale: false,
        updatedAt: quoteSnapshot.updatedAt,
        stockCount: Object.keys(quoteSnapshot.quotes).length,
      },
      monitors: {
        auctionFixedPrice: "planned",
        limitUpPressure: "available",
      },
    });
    response.headers.set("Cache-Control", "public, s-maxage=8, stale-while-revalidate=30");

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load monitor status",
      },
      { status: 502 }
    );
  }
}
