import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { properties, savedProperties } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const rows = await db
    .select({ p: properties, savedAt: savedProperties.createdAt })
    .from(savedProperties)
    .innerJoin(properties, eq(savedProperties.propertyId, properties.id))
    .where(eq(savedProperties.userId, user.id))
    .orderBy(savedProperties.createdAt)
    .execute()
    .then((r) => r);
  return NextResponse.json({ ok: true, items: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const propertyId = typeof body.propertyId === "string" ? body.propertyId : "";
  if (!/^[0-9a-f-]{36}$/i.test(propertyId)) return NextResponse.json({ error: "Invalid property id." }, { status: 400 });
  const owned = await db.select({ id: properties.id }).from(properties).where(and(eq(properties.id, propertyId), eq(properties.userId, user.id))).limit(1);
  if (!owned.length) return NextResponse.json({ error: "Property not found." }, { status: 404 });
  const existing = await db.select({ id: savedProperties.id }).from(savedProperties).where(and(eq(savedProperties.userId, user.id), eq(savedProperties.propertyId, propertyId))).limit(1);
  if (existing.length) {
    await db.delete(savedProperties).where(eq(savedProperties.id, existing[0].id));
    return NextResponse.json({ ok: true, saved: false });
  }
  await db.insert(savedProperties).values({ userId: user.id, propertyId });
  return NextResponse.json({ ok: true, saved: true });
}
