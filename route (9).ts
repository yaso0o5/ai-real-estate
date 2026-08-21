import { NextRequest, NextResponse } from "next/server";
import { and, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { parseFilters, buildWhere } from "@/lib/stats";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const filters = parseFilters(req.nextUrl.searchParams);
  const where = buildWhere(user.id, filters);

  const [points, grouped] = await Promise.all([
    db
      .select({
        id: properties.id,
        title: properties.title,
        price: properties.price,
        area: properties.area,
        pricePerSqm: properties.pricePerSqm,
        propertyType: properties.propertyType,
        district: properties.district,
        latitude: properties.latitude,
        longitude: properties.longitude,
      })
      .from(properties)
      .where(and(where, isNotNull(properties.latitude), isNotNull(properties.longitude)))
      .limit(2500),
    db.select().from(properties).where(where).limit(5000),
  ]);

  const withCoords = points.length;
  const districts: Record<string, { count: number; sumPrice: number; nPrice: number; sumPpm2: number; nPpm2: number }> = {};
  for (const r of grouped) {
    if (!r.district) continue;
    const d = (districts[r.district] ??= { count: 0, sumPrice: 0, nPrice: 0, sumPpm2: 0, nPpm2: 0 });
    d.count++;
    if (r.price != null) {
      d.sumPrice += r.price;
      d.nPrice++;
    }
    if (r.pricePerSqm != null) {
      d.sumPpm2 += r.pricePerSqm;
      d.nPpm2++;
    }
  }
  return NextResponse.json({
    ok: true,
    points,
    totals: { withCoords, withoutCoords: grouped.length - withCoords },
    districts: Object.entries(districts)
      .map(([district, d]) => ({
        district,
        count: d.count,
        avgPrice: d.nPrice ? d.sumPrice / d.nPrice : null,
        avgPpm2: d.nPpm2 ? d.sumPpm2 / d.nPpm2 : null,
      }))
      .sort((a, b) => b.count - a.count),
  });
}
