import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  verifyPassword,
  createPasswordReset,
  consumeResetToken,
  ensureProfile,
  updateProfile,
  changePassword,
} from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function GET(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  return NextResponse.json({ ok: true, user });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");

  try {
    switch (action) {
      case "signup": {
        const name = str("name");
        const email = str("email").toLowerCase();
        const password = typeof body.password === "string" ? (body.password as string) : "";
        if (name.length < 2) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
        if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
        if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
        const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        if (existing.length) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
        const hash = await hashPassword(password);
        const [user] = await db.insert(users).values({ email, passwordHash: hash, name }).returning({ id: users.id });
        await ensureProfile(user.id, name);
        await createSession(user.id);
        return NextResponse.json({ ok: true, id: user.id });
      }
      case "login": {
        const email = str("email").toLowerCase();
        const password = typeof body.password === "string" ? (body.password as string) : "";
        if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
        const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!found.length) return NextResponse.json({ error: "No account found with this email." }, { status: 401 });
        const ok = await verifyPassword(password, found[0].passwordHash);
        if (!ok) return NextResponse.json({ error: "Incorrect password. Try again or reset it." }, { status: 401 });
        await createSession(found[0].id);
        return NextResponse.json({ ok: true, id: found[0].id });
      }
      case "logout": {
        await destroySession();
        return NextResponse.json({ ok: true });
      }
      case "forgot": {
        const email = str("email").toLowerCase();
        if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
        const res = await createPasswordReset(email);
        // Demo environment: no outbound email, so surface the link for testing.
        return NextResponse.json({ ok: true, resetUrl: res?.resetUrl ?? null });
      }
      case "reset": {
        const token = str("token");
        const password = typeof body.password === "string" ? (body.password as string) : "";
        if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
        const err = await consumeResetToken(token, password);
        if (err) return NextResponse.json({ error: err }, { status: 400 });
        return NextResponse.json({ ok: true });
      }
      case "profile": {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
        const displayName = str("displayName") || user.name;
        await updateProfile(user.id, { displayName, company: str("company"), role: str("role") });
        return NextResponse.json({ ok: true });
      }
      case "password": {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
        const current = typeof body.current === "string" ? (body.current as string) : "";
        const next = typeof body.next === "string" ? (body.next as string) : "";
        if (next.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
        const err = await changePassword(user.id, current, next);
        if (err) return NextResponse.json({ error: err }, { status: 400 });
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 404 });
    }
  } catch (e) {
    console.error(`auth/${action}`, e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
