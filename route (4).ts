import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { datasets } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid dataset id." }, { status: 400 });
  const found = await db
    .select({ id: datasets.id, userId: datasets.userId })
    .from(datasets)
    .where(eq(datasets.id, id))
    .limit(1);
  if (!found.length) return NextResponse.json({ error: "Dataset not found." }, { status: 404 });
  if (found[0].userId !== user.id) return NextResponse.json({ error: "You can only remove your own datasets." }, { status: 403 });
  await db.delete(datasets).where(eq(datasets.id, id)); // cascades to properties/images, nulls imports
  return NextResponse.json({ ok: true });
}
