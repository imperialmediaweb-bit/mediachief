/** 26.10.2026 — hourly check of reserved card payments (lib/reserved-payment.ts), Node only. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // 26.10.2026 — the orders.source column (lib/source.ts) must exist before any order query.
    const { ensureSourceColumn } = await import("./lib/source-db");
    await ensureSourceColumn().catch((e) => console.error("[source] column:", e));
    const { startReservationScheduler } = await import("./lib/reserved-payment");
    startReservationScheduler();
  }
}
