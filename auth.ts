import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, profiles, sessions, passwordResets } from "@/db/schema";

export const SESSION_COOKIE = "piq_session";
const SESSION_DAYS = 30;

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  displayName: string | null;
  company: string | null;
  role: string | null;
  createdAt: Date;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" ? false : undefined,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token)).catch(() => {});
  }
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      uid: sessions.userId,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
      expiresAt: sessions.expiresAt,
      displayName: profiles.displayName,
      company: profiles.company,
      role: profiles.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.token, token)).catch(() => {});
    return null;
  }
  return {
    id: row.uid,
    email: row.email,
    name: row.name,
    displayName: row.displayName,
    company: row.company,
    role: row.role,
    createdAt: row.createdAt,
  };
}

export async function createPasswordReset(email: string): Promise<{ resetUrl: string } | null> {
  const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!found.length) return null;
  const user = found[0];
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.insert(passwordResets).values({ userId: user.id, token, expiresAt });
  return { resetUrl: `/reset-password/${token}` };
}

export async function consumeResetToken(token: string, newPassword: string): Promise<string | null> {
  const rows = await db.select().from(passwordResets).where(eq(passwordResets.token, token)).limit(1);
  const row = rows[0];
  if (!row) return "This reset link is invalid or has already been used.";
  if (row.expiresAt.getTime() < Date.now()) return "This reset link has expired. Request a new one.";
  const hash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, row.userId));
  await db.delete(passwordResets).where(eq(passwordResets.token, token));
  return null;
}

export async function ensureProfile(userId: string, name: string) {
  const existing = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!existing.length) {
    await db.insert(profiles).values({ userId, displayName: name }).catch(() => {});
  }
}

export async function updateProfile(userId: string, data: { displayName: string; company: string; role: string }) {
  await db
    .update(profiles)
    .set({ displayName: data.displayName, company: data.company || null, role: data.role || null })
    .where(eq(profiles.userId, userId));
}

export async function changePassword(userId: string, current: string, next: string): Promise<string | null> {
  const found = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!found.length) return "User not found.";
  const ok = await verifyPassword(current, found[0].passwordHash);
  if (!ok) return "Your current password is incorrect.";
  const hash = await hashPassword(next);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, userId));
  return null;
}
