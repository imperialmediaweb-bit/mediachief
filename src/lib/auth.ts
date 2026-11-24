import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "mc_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function getSecret(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-in-production-please-32-chars";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionToken(username: string): string {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${username}.${expires}`;
  const signature = sign(payload);
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifySessionToken(token: string | undefined): { username: string } | null {
  if (!token) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString();
  } catch {
    return null;
  }
  const expected = sign(payload);
  if (expected !== signature) return null;
  const [username, expiresStr] = payload.split(".");
  if (!username || !expiresStr) return null;
  const expires = parseInt(expiresStr, 10);
  if (!Number.isFinite(expires) || Date.now() > expires) return null;
  return { username };
}

function same(x: string, y: string): boolean {
  const a = Buffer.from(x);
  const b = Buffer.from(y);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** 24.11.2026: a colleague who answers the chat (TEAM_USER / TEAM_PASSWORD). They see only /admin/chats. */
export function isTeamUser(username: string | undefined | null): boolean {
  const u = process.env.TEAM_USER;
  return Boolean(u && username && same(username, u));
}

export function checkAdminCredentials(username: string, password: string): boolean {
  const tu = process.env.TEAM_USER;
  const tp = process.env.TEAM_PASSWORD;
  if (tu && tp && same(username, tu) && same(password, tp)) return true;
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "";
  if (!expectedPass) return false;
  const a = Buffer.from(username);
  const b = Buffer.from(expectedUser);
  const c = Buffer.from(password);
  const d = Buffer.from(expectedPass);
  if (a.length !== b.length || c.length !== d.length) return false;
  return crypto.timingSafeEqual(a, b) && crypto.timingSafeEqual(c, d);
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

/** The owner's session. A colleague's session counts only where `allowTeam` is set (the chat inbox). */
export function getSession(opts?: { allowTeam?: boolean }): { username: string } | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  const s = verifySessionToken(token);
  if (s && !opts?.allowTeam && isTeamUser(s.username)) return null;
  return s;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
