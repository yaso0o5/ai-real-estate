import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { marketInsights } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { parseFilters, fetchStatRows } from "@/lib/stats";
import { answerQuestion } from "@/lib/insights";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const rows = await db.select().from(marketInsights).where(eq(marketInsights.userId, user.id)).orderBy(desc(marketInsights.createdAt)).limit(20);
  return NextResponse.json({ ok: true, history: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  let body: { question?: string; filters?: Record<string, string | null> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 300) : "";
  if (!question) return NextResponse.json({ error: "Please ask a question." }, { status: 400 });

  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(body.filters ?? {})) {
    if (v != null && v !== "") sp.set(k, String(v));
  }
  const filters = parseFilters(sp);
  const rows = await fetchStatRows(user.id, filters);
  const answer = answerQuestion(question, rows);

  await db
    .insert(marketInsights)
    .values({ userId: user.id, question, answer: answer as unknown as Record<string, unknown> })
    .catch(() => {});

  return NextResponse.json({ ok: true, answer, sampleSize: rows.length });
}
