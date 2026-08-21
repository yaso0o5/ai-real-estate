import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { parseFilters, fetchStatRows, computeStats, fetchFacetDatasets } from "@/lib/stats";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const filters = parseFilters(req.nextUrl.searchParams);
  const rows = await fetchStatRows(user.id, filters);
  const stats = computeStats(rows, rows.length >= 5000);
  stats.facet.datasets = await fetchFacetDatasets(user.id);
  return NextResponse.json({ ok: true, stats });
}
