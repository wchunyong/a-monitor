import { NextResponse } from "next/server";

import { getFallbackQuoteSnapshot } from "@/lib/market/quote-provider";
import { findLimitUpQuotes } from "@/lib/monitor/limit-up-pressure";

export const maxDuration = 60;

export async function GET() {
  try {
    const quoteSnapshot = await getFallbackQuoteSnapshot();
    const data = findLimitUpQuotes(quoteSnapshot);
    const response = NextResponse.json(data);
    response.headers.set("Cache-Control", "public, s-maxage=8, stale-while-revalidate=30");

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load limit-up pressure data",
      },
      { status: 502 }
    );
  }
}
