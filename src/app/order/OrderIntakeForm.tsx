"use client";

import { useState } from "react";
import { AlertCircle, FileText, Loader2, PenLine, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trackPixelEvent } from "@/components/analytics/MetaPixel";
import { trackGaEvent } from "@/components/analytics/GoogleAnalytics";
import {
  CONTENT_DECLARATION,
  CONTENT_DECLARATION_WARNING,
} from "@/lib/content-policy";

type ArticleMode = "have" | "write" | "later";

const MODES: { id: ArticleMode; icon: typeof FileText; title: string; text: string }[] = [
  {
    id: "have",
    icon: FileText,
    title: "I have the article",
    text: "Paste your text below. We adapt it into a unique version for each newspaper.",
  },
  {
    id: "write",
    icon: PenLine,
    title: "Write it for me",
    text: "Tell us what it should say, or just give us your website. Included, no extra cost.",
  },
  {
    id: "later",
    icon: Clock,
    title: "I'll send it later",
    text: "Pay now and send the article from your account whenever you're ready.",
  },
];

interface Props {
  packageId: string;
  label: string;
  price: number;
  /** Full state names, for a "pick your own newspapers" order. */
  states?: string[];
  casino?: boolean;
}

/**
 * Step one of the order: what gets published. Nothing is charged here — on
 * submit the order is saved and the buyer moves to the card payment page.
 */
export function OrderIntakeForm({ packageId, label, price, states, casino }: Props) {
  const [mode, setMode] = useState<ArticleMode>("have");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [brief, setBrief] = useState("");
  const [images, setImages] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  async function submit() {
    setError(null);
    setBusy(true);
    trackPixelEvent("InitiateCheckout", { content_name: label, value: price, currency: "USD" });
    trackGaEvent("begin_checkout", { value: price, currency: "USD", items: 1 });

    try {
      const imageUrls = images
        .split(/[\s,]+/)
        .map((u) => u.trim())
        .filter((u) => /^https?:\/\//.test(u))
        .slice(0, 3);

      const res = await fetch("/api/order/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          states,
          casino,
          email,
          name: name || undefined,
          company: company || undefined,
          website: website || undefined,
          articleMode: mode,
          title: title || undefined,
          body: mode === "have" ? body : undefined,
          brief: mode === "write" ? brief : undefined,
          imageUrls: imageUrls.length ? imageUrls : undefined,
          agreed,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || "Could not save your order.");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  const ready =
    Boolean(email) &&
    agreed &&
    (mode === "later" ||
      (mode === "have" && body.trim().length > 0) ||
      (mode === "write" && (brief.trim().length > 0 || website.trim().length > 0)));

  return (
    <div className="space-y-8">
      {/* ---- what we publish */}
      <div>
        <h2 className="font-serif text-lg font-bold text-brand-navy">What should we publish?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {MODES.map(({ id, icon: Icon, title: t, text }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`rounded-xl border p-4 text-left transition ${
                mode === id
                  ? "border-[#c1121f] bg-red-50/60 ring-1 ring-[#c1121f]"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <Icon className={`h-5 w-5 ${mode === id ? "text-[#c1121f]" : "text-slate-400"}`} />
              <p className="mt-2 text-sm font-semibold text-brand-navy">{t}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p>
            </button>
          ))}
        </div>
      </div>

      {mode === "have" && (
        <div className="space-y-4">
          <div>
            <Label>Headline</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The headline you want on the article"
            />
          </div>
          <div>
            <Label>Article text *</Label>
            <Textarea
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste the full text here."
            />
            <p className="mt-1 text-xs text-slate-500">
              {words} word{words === 1 ? "" : "s"}. Around 400 words works best.
            </p>
          </div>
        </div>
      )}

      {mode === "write" && (
        <div className="space-y-4">
          <div>
            <Label>What should the article say? *</Label>
            <Textarea
              rows={6}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="What you do, what you want announced, what makes you different. A few lines are enough."
            />
          </div>
          <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            We write the draft and email it to you before anything is published. Nothing goes out
            without your approval.
          </p>
        </div>
      )}

      {mode === "later" && (
        <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
          Fine. After payment you get a sign-in link by email — open <em>New article</em>, paste
          your text and add photos whenever it suits you. Your order waits for you.
        </p>
      )}

      {mode !== "later" && (
        <div>
          <Label>Photo links</Label>
          <Textarea
            rows={2}
            value={images}
            onChange={(e) => setImages(e.target.value)}
            placeholder="https://… (up to 3, one per line) — optional"
          />
          <p className="mt-1 text-xs text-slate-500">
            Prefer to upload files? You can do that from your account right after payment.
          </p>
        </div>
      )}

      {/* ---- where to reach you */}
      <div>
        <h2 className="font-serif text-lg font-bold text-brand-navy">Where do we reach you?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
            <p className="mt-1 text-xs text-slate-500">
              Your links and report go here. Use the same address when you pay.
            </p>
          </div>
          <div>
            <Label>Your name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="optional" />
          </div>
          <div>
            <Label>Company</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="optional"
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://… optional"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Billing details and your tax ID are collected on the payment page, so the invoice comes
          out right.
        </p>
      </div>

      {/* ---- declaration. One shared text, so it cannot drift between pages. */}
      <div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#c1121f]"
          />
          <span>
            {CONTENT_DECLARATION} I hold the rights to the text and photos, and the content is not
            defamatory, misleading or otherwise unlawful.
          </span>
        </label>
        <p className="mt-2 px-1 text-xs leading-relaxed text-slate-500">
          {CONTENT_DECLARATION_WARNING} We publish the article and give you the links — we do not
          promise traffic, rankings or customers.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <Button variant="accent" size="lg" className="w-full" disabled={busy || !ready} onClick={submit}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving your order…
            </>
          ) : (
            <>
              Continue to payment — ${price} <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <p className="mt-2 text-center text-xs text-slate-500">
          Nothing is charged yet. You pay by card on the next page.
        </p>
      </div>
    </div>
  );
}
