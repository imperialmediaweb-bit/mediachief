/** 26.10.2026 — hourly check of reserved card payments (lib/reserved-payment.ts), Node only. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startReservationScheduler } = await import("./lib/reserved-payment");
    startReservationScheduler();
  }
}
