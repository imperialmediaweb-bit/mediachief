"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STANDARD_PACKAGES, CASINO_PACKAGES, PROMO_PRICE } from "@/data/packages";
import { TOTAL_NEWSPAPERS } from "@/data/newspapers";

/**
 * Records an order that did not come through Stripe — a bank transfer or an
 * invoice. The client then uses the site exactly as a card payer would.
 */
export function NewOrderForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [packageId, setPackageId] = useState("national");
  const [amount, setAmount] = useState(String(PROMO_PRICE));
  const [articles, setArticles] = useState("1");
  const [states, setStates] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const all = [...STANDARD_PACKAGES, ...CASINO_PACKAGES];

  function pick(id: string) {
    setPackageId(id);
    const pkg = all.find((p) => p.id === id);
    if (pkg) setAmount(String(pkg.price));
  }

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          packageId,
          // Stored in cents, like every Stripe order, so the totals add up.
          amount: Math.round(Number(amount) * 100),
          articlesIncluded: Number(articles) || 1,
          newspaperStates: states || undefined,
          notify,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not record the order.");
      setDone(email);
      setEmail("");
      setName("");
      setStates("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the order.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="mb-6">
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Record an order paid outside Stripe
        </Button>
        {done && (
          <p className="mt-3 flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" /> Order recorded for {done}. They can sign in and
            send the article.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold text-brand-navy">Order paid outside Stripe</h2>
      <p className="mt-1 text-sm text-slate-600">
        For a bank transfer or an invoice. The client gets the same account access as a card
        payment, so they can send the article themselves.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Client email *</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@company.com" />
        </div>
        <div>
          <Label>Client name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="optional" />
        </div>
        <div>
          <Label>Package</Label>
          <select
            value={packageId}
            onChange={(e) => pick(e.target.value)}
            className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {all.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ${p.price}
              </option>
            ))}
            <option value="pick">Chosen newspapers</option>
            <option value="custom">Custom / direct advertiser</option>
          </select>
        </div>
        <div>
          <Label>Amount paid, in dollars</Label>
          <Input
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <Label>Articles this order buys</Label>
          <Input
            type="number"
            min="1"
            max="50"
            value={articles}
            onChange={(e) => setArticles(e.target.value)}
          />
        </div>
        <div>
          <Label>Newspapers, if only some</Label>
          <Input
            value={states}
            onChange={(e) => setStates(e.target.value)}
            placeholder={`Texas, Florida — leave empty for all ${TOTAL_NEWSPAPERS}`}
          />
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#c1121f]"
        />
        <span>Email the client their sign-in instructions now</span>
      </label>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <Button variant="accent" onClick={submit} disabled={busy || !email}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Recording…
            </>
          ) : (
            "Record the order"
          )}
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
