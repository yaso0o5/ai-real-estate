import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { datasets, imports, properties, propertyImages } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { generateDemoProperties, demoImageFor } from "@/lib/demo";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const ds = await db
    .select()
    .from(datasets)
    .where(eq(datasets.userId, user.id))
    .orderBy(desc(datasets.createdAt));
  const imp = await db
    .select()
    .from(imports)
    .where(eq(imports.userId, user.id))
    .orderBy(desc(imports.createdAt))
    .limit(30);
  return NextResponse.json({ ok: true, datasets: ds, imports: imp });
}

/* POST — create the demo dataset (idempotent per user) */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "demo") {
    const existing = await db
      .select()
      .from(datasets)
      .where(and(eq(datasets.userId, user.id), eq(datasets.isDemo, true)))
      .limit(1);
    if (existing.length) return NextResponse.json({ ok: true, datasetId: existing[0].id, alreadyExists: true });

    const props = generateDemoProperties(160);
    const [ds] = await db
      .insert(datasets)
      .values({ userId: user.id, name: "Demo Market — Greater Cairo", sourceFile: "demo-dataset.xlsx", fileSize: 0, rowCount: props.length, isDemo: true, status: "completed" })
      .returning({ id: datasets.id });

    const propRows = props.map((p) => ({
      userId: user.id,
      datasetId: ds.id,
      title: p.title,
      price: p.price,
      area: p.area,
      pricePerSqm: Math.round(p.price / p.area),
      propertyType: p.propertyType,
      city: p.city,
      district: p.district,
      address: p.address,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      floor: p.floor,
      furnished: p.furnished,
      status: p.status,
      listingDate: p.listingDate,
      latitude: p.latitude,
      longitude: p.longitude,
      description: p.description,
      sourceFile: "demo-dataset.xlsx",
    }));
    const inserted = await db.insert(properties).values(propRows).returning({ id: properties.id });
    const images = inserted.flatMap((p, i) => demoImageFor(props[i].propertyType, i).map((url, pos) => ({ propertyId: p.id, url, position: pos })));
    if (images.length) await db.insert(propertyImages).values(images);
    await db.insert(imports).values({
      userId: user.id,
      datasetId: ds.id,
      fileName: "demo-dataset.xlsx",
      fileSize: 0,
      rowsDetected: props.length,
      rowsImported: props.length,
      rowsSkipped: 0,
      status: "completed",
      summary: { demo: 1 },
    });
    return NextResponse.json({ ok: true, datasetId: ds.id, count: props.length });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
