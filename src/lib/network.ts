/**
 * The link to the publishing network — the NEWS application that actually runs
 * the 50 U.S. newspapers.
 *
 * Media Chief is the shop: it takes the order, the article and the money. The
 * articles go live over there, where each campaign owns a token and a public
 * page at /report/<token> the client can open without a password. Until now an
 * operator published by hand and pasted fifty addresses back into this admin,
 * which is both an hour of work and the one step where a link gets lost.
 *
 * The network counts progress from its own `order_placements` — one row per
 * site an article actually went live on, written the moment it is inserted. So
 * "31 of 50" here is a counted fact, not a status field anyone had to update.
 *
 * Configure in Railway, on this service:
 *   NETWORK_URL = https://alabama-express.com   (any newspaper — same app)
 *   NETWORK_KEY = the CRON_SECRET of the NEWS service
 * Without NETWORK_KEY every call returns `not-configured` and the admin says
 * so rather than failing.
 */

export const NETWORK_URL = (process.env.NETWORK_URL || "").replace(/\/$/, "");
const NETWORK_KEY = process.env.NETWORK_KEY || "";

export function networkConfigured(): boolean {
  return Boolean(NETWORK_URL && NETWORK_KEY);
}

export interface Placement {
  site_slug: string;
  article_id: number | null;
  url: string | null;
  placed_at: string | null;
}

export interface Campaign {
  id: number;
  client: string;
  email: string | null;
  client_url: string;
  title: string | null;
  status: string;
  paid: boolean;
  token: string | null;
  published_at: string | null;
}

export type NetworkResult<T> =
  | { state: "ok"; data: T }
  | { state: "not-configured" }
  | { state: "error"; message: string };

/**
 * Reads are quick. Publishing is not: the network rewrites the article for
 * every paper it places, so a batch of ten is minutes, not seconds. Twenty
 * seconds for all of it meant the publish call was abandoned while the
 * network was still working — reported here as "did not answer in time"
 * while placements kept landing on the other side.
 */
const TIMEOUT_MS = 20_000;
const PUBLISH_TIMEOUT_MS = 280_000;

async function call<T>(
  path: string,
  init: RequestInit & { body?: string } = {},
  timeoutMs: number = TIMEOUT_MS
): Promise<NetworkResult<T>> {
  if (!networkConfigured()) return { state: "not-configured" };

  // The key travels three ways on purpose. The network checks the body first,
  // then the query string, then the Authorization header — and a CDN in front
  // of it is free to drop or rewrite that header, which looks from here
  // exactly like a wrong key. Belt and braces costs nothing and removes a
  // whole class of "Unauthorized" that is not about the key at all.
  const url = new URL(`${NETWORK_URL}${path}`);
  url.searchParams.set("key", NETWORK_KEY);

  let body = init.body;
  if (body) {
    try {
      body = JSON.stringify({ ...JSON.parse(body), key: NETWORK_KEY });
    } catch {
      // Not JSON: leave it, the query string and the header still carry it.
    }
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      ...init,
      body,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NETWORK_KEY}`,
        ...(init.headers || {}),
      },
      cache: "no-store",
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { state: "error", message: `Network replied with ${res.status}` };
    }
    if (!res.ok) {
      const msg = (json as { error?: string })?.error || `HTTP ${res.status}`;
      return { state: "error", message: msg };
    }
    return { state: "ok", data: json as T };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return { state: "error", message: aborted ? "The network did not answer in time." : "Could not reach the network." };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hands a paid order to the network. The reference is our own order id, which
 * the network stores as external_ref with a unique index — so a second call
 * for the same order is refused rather than creating a twin campaign.
 *
 * clientUrl is not optional over there: every placement links back to it, with
 * rel="sponsored nofollow noopener". No link, no campaign.
 */
export async function createCampaign(args: {
  externalRef: string;
  client: string;
  clientUrl: string;
  email?: string | null;
  phone?: string | null;
  packageId?: string | null;
  price?: number | null;
  title?: string | null;
  material: string;
  images?: string[];
  notes?: string | null;
}): Promise<NetworkResult<{ ok: true; orderId: number; reportUrl: string }>> {
  return call("/api/admin/orders", {
    method: "POST",
    body: JSON.stringify({
      externalRef: args.externalRef,
      client: args.client,
      clientUrl: args.clientUrl,
      email: args.email || null,
      phone: args.phone || null,
      package: args.packageId || null,
      price: args.price ?? null,
      currency: "USD",
      paid: true,
      title: args.title || null,
      material: args.material,
      images: args.images?.length ? args.images : undefined,
      notes: args.notes || null,
    }),
  });
}

/** One campaign and every site it has gone live on so far. */
export async function getCampaign(
  networkOrderId: number
): Promise<NetworkResult<{ order: Campaign; placements: Placement[] }>> {
  return call(`/api/admin/orders?id=${encodeURIComponent(String(networkOrderId))}`);
}

/**
 * Publishes the next batch. The network skips sites already placed, so calling
 * this again after a timeout continues rather than duplicating.
 */
export async function publishCampaign(
  networkOrderId: number,
  perRun?: number
): Promise<NetworkResult<Record<string, unknown>>> {
  return call(
    "/api/admin/orders/publish",
    {
      method: "POST",
      body: JSON.stringify({ orderId: networkOrderId, ...(perRun ? { perRun } : {}) }),
    },
    PUBLISH_TIMEOUT_MS
  );
}

/**
 * Changes fields on an existing campaign. identicalText is the one that
 * matters here: with it set, the network stops rewriting and publishes the
 * client's own words on every paper — which is what a client who wrote the
 * text themselves is buying.
 */
export async function patchCampaign(
  networkOrderId: number,
  fields: Record<string, unknown>
): Promise<NetworkResult<Record<string, unknown>>> {
  return call("/api/admin/orders", {
    method: "PATCH",
    body: JSON.stringify({ id: networkOrderId, ...fields }),
  });
}

/** The client's report page — public, no password. */
export function reportUrlFor(token: string | null | undefined): string | null {
  return token && NETWORK_URL ? `${NETWORK_URL}/report/${token}` : null;
}

/** Live addresses out of a placement list, for our own PDF and Excel report. */
export function urlsFrom(placements: Placement[]): string[] {
  return placements
    .map((p) => p.url)
    .filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u));
}
