import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, desc, eq, ilike, inArray as inArr, or as dOr, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { properties, propertyImages, savedProperties } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { parseFilters, buildWhere, fetchFacetDatasets } from "@/lib/stats";

type P = typeof properties;
const SORTS: Record<string, (p: P) => SQL<unknown>> = {
  "price-asc": (p) => asc(p.price),
  "price-desc": (p) => desc(p.price),
  "ppm2-asc": (p) => asc(p.pricePerSqm),
  "ppm2-desc": (p) => desc(p.pricePerSqm),
  "area-desc": (p) => desc(p.area),
  "area-asc": (p) => asc(p.area),
  newest: (p) => desc(p.listingDate),
  oldest: (p) => asc(p.listingDate),
  title: (p) => asc(p.title),
};

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const filters = parseFilters(sp);
  const q = (sp.get("q") ?? "").trim().slice(0, 80);
  const sortKey = sp.get("sort") ?? "newest";
  const page = Math.max(1, Math.min(500, parseInt(sp.get("page") ?? "1", 10) || 1));
  const pageSize = Math.max(1, Math.min(60, parseInt(sp.get("size") ?? "24", 10) || 24));

  const where = q
    ? and(buildWhere(user.id, filters), dOr(ilike(properties.title, `%${q}%`), ilike(properties.district, `%${q}%`), ilike(properties.city, `%${q}%`), ilike(properties.address, `%${q}%`), ilike(properties.propertyType, `%${q}%`)))
    : buildWhere(user.id, filters);

  const [totalRow, items] = await Promise.all([
    db.select({ n: count() }).from(properties).where(where),
    db
      .select()
      .from(properties)
      .where(where)
      .orderBy(SORTS[sortKey] ? SORTS[sortKey](properties) : desc(properties.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);
  const [cityRows, distRows, typeRows, statusRows, dsRows] = await Promise.all([
    db.select({ v: properties.city }).from(properties).where(where).groupBy(properties.city).limit(50),
    db.select({ v: properties.district }).from(properties).where(where).groupBy(properties.district).limit(80),
    db.select({ v: properties.propertyType }).from(properties).where(where).groupBy(properties.propertyType).limit(20),
    db.select({ v: properties.status }).from(properties).where(where).groupBy(properties.status).limit(20),
    fetchFacetDatasets(user.id),
  ]);
  const facets = {
    cities: cityRows.map((r) => r.v).filter((v): v is string => !!v).sort(),
    districts: distRows.map((r) => r.v).filter((v): v is string => !!v).sort(),
    types: typeRows.map((r) => r.v).filter((v): v is string => !!v).sort(),
    statuses: statusRows.map((r) => r.v).filter((v): v is string => !!v).sort(),
    datasets: dsRows,
  };

  if (!items.length) {
    return NextResponse.json({ ok: true, items: [], total: totalRow[0].n, page, pages: 1, facets, datasets: dsRows });
  }
  const ids = items.map((i) => i.id);
  const [images, saved] = await Promise.all([
    db.select({ propertyId: propertyImages.propertyId, url: propertyImages.url }).from(propertyImages).where(ids.length ? inArr(propertyImages.propertyId, ids) : eq(propertyImages.propertyId, "")),
    db.select({ propertyId: savedProperties.propertyId }).from(savedProperties).where(eq(savedProperties.userId, user.id)),
  ]);
  const imgMap = new Map<string, string[]>();
  for (const im of images) {
    const l = imgMap.get(im.propertyId) ?? [];
    l.push(im.url);
    imgMap.set(im.propertyId, l);
  }
  const savedSet = new Set(saved.map((s) => s.propertyId));
  return NextResponse.json({
    ok: true,
    items: items.map((i) => ({ ...i, image: imgMap.get(i.id)?.[0] ?? null, saved: savedSet.has(i.id) })),
    total: totalRow[0].n,
    page,
    pages: Math.max(1, Math.ceil(totalRow[0].n / pageSize)),
    facets,
    datasets: dsRows,
  });
}
