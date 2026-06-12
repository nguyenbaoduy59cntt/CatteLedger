import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "./supabase";
import type { User } from "@/types";

const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function hashSessionToken(token: string): string {
  const secret = process.env.SESSION_SECRET ?? "dev-secret";
  return createHash("sha256").update(`${token}:${secret}`).digest("hex");
}

function getCookieName(): string {
  return process.env.SESSION_COOKIE_NAME ?? "catte_session";
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("sessions").insert({
    user_id: userId,
    session_token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error(error.message);
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  cookieStore.set(getCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(getCookieName());
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(getCookieName())?.value ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const supabase = getSupabaseAdmin();

  const { data: session, error } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("session_token_hash", tokenHash)
    .maybeSingle();

  if (error || !session) return null;

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("sessions").delete().eq("session_token_hash", tokenHash);
    return null;
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, username, display_name, created_at")
    .eq("id", session.user_id)
    .maybeSingle();

  if (userError || !user) return null;
  return user;
}

export async function destroySession(): Promise<void> {
  const token = await getSessionToken();
  if (!token) return;

  const tokenHash = hashSessionToken(token);
  const supabase = getSupabaseAdmin();
  await supabase.from("sessions").delete().eq("session_token_hash", tokenHash);
  await clearSessionCookie();
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
