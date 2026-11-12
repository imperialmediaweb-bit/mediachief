"use client";

import { useState } from "react";

/** Admin: add the proof of the 3-day Facebook promotion to the client's report. */
export function FbPromoProof({
  orderId,
  choice,
  proof,
  post,
  days,
  reportUrl,
}: {
  orderId: string;
  choice: string | null;
  proof: string | null;
  post: string | null;
  days: number | null;
  reportUrl: string;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [img, setImg] = useState(proof);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set("orderId", orderId);
    try {
      const r = await fetch("/api/admin/fb-promo", { method: "POST", body: fd });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string; proof?: string | null } | null;
      if (!r.ok || !j?.ok) setMsg(`Error ${r.status}: ${j?.error || "unknown"}`);
      else {
        if (j.proof) setImg(j.proof);
        setMsg("Saved — it is on the client's report now.");
      }
    } catch {
      setMsg("Could not reach the server.");
    }
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50/50 p-6">
      <h2 className="font-semibold text-brand-navy">Facebook promotion (3 days, by hand)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Client chose: <strong>{choice || "—"}</strong>. Check the article before promoting. After the ad
        runs, add the proof — it appears on the live report (no amounts).
      </p>
      <form onSubmit={save} className="mt-4 grid gap-3 text-sm">
        <label className="grid gap-1">
          Screenshot from Ads Manager
          <input type="file" name="proof" accept="image/*" className="text-xs" />
        </label>
        <label className="grid gap-1">
          Link to the promoted post
          <input name="post" defaultValue={post || ""} placeholder="https://www.facebook.com/..." className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="grid gap-1">
          Days
          <input name="days" type="number" min={1} max={30} defaultValue={days ?? 3} className="w-24 rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={busy} className="rounded-lg bg-brand-navy px-4 py-2 font-medium text-white disabled:opacity-50">
            {busy ? "Saving…" : "Save proof"}
          </button>
          <a href={reportUrl} target="_blank" rel="noreferrer" className="text-brand-red hover:underline">Open the report</a>
        </div>
        {msg && <p className="text-xs text-slate-600">{msg}</p>}
      </form>
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="Current proof" className="mt-4 max-h-64 rounded-lg border border-slate-200" />
      )}
    </div>
  );
}
