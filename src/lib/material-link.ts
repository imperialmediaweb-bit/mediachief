import crypto from "crypto";
import { SITE } from "@/data/site";

/**
 * The link a client gets when they paid before writing their article.
 *
 * They used to be told to go and sign in: open the account page, type the
 * address, wait for a second email, follow that, find "New article". Four
 * steps and two inboxes between a paying customer and the thing we need from
 * them — and the ones who did not have their text ready at checkout are
 * exactly the ones most likely to give up on that.
 *
 * This opens straight onto their own order. It is an HMAC over the order id,
 * so it cannot be guessed, and it carries no more than that order.
 */
function secret(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-in-production-please-32-chars";
}

function sign(orderId: string): string {
  return crypto.createHmac("sha256", secret()).update(`material:${orderId}`).digest("hex").slice(0, 20);
}

export function materialToken(orderId: string): string {
  return `${orderId}.${sign(orderId)}`;
}

export function materialUrl(orderId: string): string {
  return `${SITE.url}/order/material/${materialToken(orderId)}`;
}

export function orderIdFromMaterialToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(id);
  if (sig.length !== expected.length) return null;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? id : null;
}
