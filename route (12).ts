import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { parseFilters, fetchStatRows, computeStats, type Filters } from "@/lib/stats";
import { fmtMoney, fmtPpm2 } from "@/lib/format";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const rows = await db.select().from(reports).where(eq(reports.userId, user.id)).orderBy(desc(reports.createdAt)).limit(10);
  return NextResponse.json({ ok: true, reports: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const sp = new URLSearchParams();
  const f: Partial<Filters> = {};
  if (typeof body.datasetId === "string" && body.datasetId) {
    sp.set("ds", body.datasetId);
    f.ds = body.datasetId;
  }
  const filters = parseFilters(sp);
  const rows = await fetchStatRows(user.id, filters);
  if (rows.length < 3) return NextResponse.json({ error: "Not enough data to generate a report (minimum 3 properties). Import a dataset first." }, { status: 422 });
  const stats = computeStats(rows, false);
  const m = stats.metrics;
  const topDistricts = stats.byDistrict.slice(0, 5);
  const topType = stats.byType[0];

  const summary: string[] = [];
  summary.push(`This report covers ${rows.length} property listings${filters.ds ? " from the selected dataset" : ""}. The average listing price is ${fmtMoney(m.avgPrice)} with a median of ${fmtMoney(m.medianPrice)}, indicating a ${m.avgPrice! > (m.medianPrice ?? 0) * 1.1 ? "distribution skewed by a smaller number of premium listings" : "relatively balanced price distribution"}. Average price per square meter stands at ${fmtPpm2(m.avgPpm2)}.`);
  if (topDistricts.length) {
    summary.push(`${topDistricts[0].district} is the deepest market in this selection with ${topDistricts[0].count} listings (avg ${fmtMoney(topDistricts[0].avgPrice)}), followed by ${topDistricts.slice(1, 3).map((d) => `${d.district} (${d.count})`).join(" and ")}. The most represented property type is ${topType ? `${topType.type} (${topType.count}, ${Math.round(topType.share * 100)}%)` : "n/a"}.`);
  }
  if (stats.opportunities.length) {
    summary.push(`Signal engine detected ${stats.opportunities.length} data-based opportunities, including ${stats.opportunities.filter((o) => o.kind === "below-market").length} listing(s) priced below the average of similar properties and ${stats.opportunities.filter((o) => o.kind === "low-ppm2").length} in the bottom 10% of their district's price/m². These are statistical signals, not investment advice.`);
  }
  if (stats.outliers.length) {
    summary.push(`${stats.outliers.length} outlier(s) were flagged — typically listings whose price/m² deviates materially from the district median. They may reflect exceptional specifications, data-entry issues, or negotiated positions.`);
  }

  const report = {
    title: `Market Intelligence Report — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    generatedAt: new Date().toISOString(),
    scope: filters.ds ? "Selected dataset" : "All datasets",
    metrics: m,
    byDistrict: stats.byDistrict,
    byType: stats.byType,
    histogram: stats.histogram,
    opportunities: stats.opportunities,
    outliers: stats.outliers,
    summary,
  };

  await db.insert(reports).values({
    userId: user.id,
    datasetId: filters.ds ?? undefined,
    title: report.title,
    content: report as unknown as Record<string, unknown>,
  });

  return NextResponse.json({ ok: true, report });
}
