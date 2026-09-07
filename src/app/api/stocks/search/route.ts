import { NextRequest, NextResponse } from "next/server";

import { searchStocks } from "@/lib/market/stock-universe";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const items = query.trim() ? searchStocks(query, limit) : [];
  const response = NextResponse.json({ items });
  response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");

  return response;
}

function parseLimit(raw: string | null) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return 12;
  }

  return Math.min(50, Math.max(1, Math.floor(parsed)));
}
