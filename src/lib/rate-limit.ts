import type { NextRequest } from "next/server";

/**
 * In-memory per-IP limiter for the public endpoints in the order flow. The
 * order form is reachable without signing in, so without this one script can
 * fill the orders table. Each caller keeps its own window.
 */
export function ipFromRequest(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function createLimiter(max: number, windowMs: number) {
  const log = new Map<string, number[]>();
  return function exceeded(key: string): boolean {
    const now = Date.now();
    // Keep the map from growing without bound on a long-lived instance.
    if (log.size > 5000) {
      for (const [k, v] of log) {
        if (v.every((t) => now - t >= windowMs)) log.delete(k);
      }
    }
    const recent = (log.get(key) || []).filter((t) => now - t < windowMs);
    recent.push(now);
    log.set(key, recent);
    return recent.length > max;
  };
}
