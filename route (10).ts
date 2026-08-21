import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { properties, propertyImages, savedProperties } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

function medianOf(arr: number[]): number | null {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function avgOf(arr: number[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid property id." }, { status: 400 });

  const rows = await db.select().from(properties).where(and(eq(properties.id, id), eq(properties.userId, user.id))).limit(1);
  const p = rows[0];
  if (!p) return NextResponse.json({ error: "Property not found." }, { status: 404 });

  const [images, savedRow, districtRows, poolRows] = await Promise.all([
    db.select({ url: propertyImages.url, position: propertyImages.position }).from(propertyImages).where(eq(propertyImages.propertyId, p.id)).orderBy(asc(propertyImages.position)),
    db.select({ id: savedProperties.id }).from(savedProperties).where(and(eq(savedProperties.userId, user.id), eq(savedProperties.propertyId, p.id))).limit(1),
    db
      .select({ price: properties.price, ppm2: properties.pricePerSqm })
      .from(properties)
      .where(and(eq(properties.userId, user.id), eq(properties.district, p.district ?? ""))),
    db.select().from(properties).where(
      p.district && p.propertyType
        ? and(eq(properties.userId, user.id), or(eq(properties.district, p.district), eq(properties.propertyType, p.propertyType)))
        : p.district
          ? and(eq(properties.userId, user.id), eq(properties.district, p.district))
          : p.propertyType
            ? and(eq(properties.userId, user.id), eq(properties.propertyType, p.propertyType))
            : eq(properties.userId, user.id)
    ).limit(400),
  ]);

  const sims = poolRows
    .filter((r) => r.id !== p.id)
    .map((r) => {
      const sameDistrict = p.district != null && r.district === p.district ? 0 : 1;
      const priceGap = p.price != null && r.price != null ? Math.abs(r.price - p.price) : 1e12;
      return { r, score: sameDistrict * 1e6 + priceGap };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((x) => x.r);

  const prices = districtRows.filter((r) => r.price != null).map((r) => r.price as number);
  const ppm2s = districtRows.filter((r) => r.ppm2 != null).map((r) => r.ppm2 as number);

  return NextResponse.json({
    ok: true,
    property: { ...p, images: images.map((i) => i.url), saved: !!savedRow.length },
    similar: sims,
    market: {
      district: p.district,
      count: districtRows.length,
      avgPrice: avgOf(prices),
      medianPpm2: medianOf(ppm2s),
      avgPpm2: avgOf(ppm2s),
    },
  });
}
