import crypto from "crypto";
import { SITE } from "@/data/site";

function getSecret(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-in-production-please-32-chars";
}

function sign(articleId: string): string {
  return crypto.createHmac("sha256", getSecret()).update(`report:${articleId}`).digest("hex").slice(0, 20);
}

/**
 * The live report link the client gets by email: no sign-in, never expires,
 * and it cannot be guessed from the article id alone.
 */
export function reportToken(articleId: string): string {
  return `${articleId}.${sign(articleId)}`;
}

export function reportUrl(articleId: string): string {
  return `${SITE.url}/report/${reportToken(articleId)}`;
}

export function articleIdFromToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(id);
  if (sig.length !== expected.length) return null;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? id : null;
}
