"use client";

import { useState } from "react";
import { AlertCircle, FileText, Loader2, PenLine, Clock, ArrowRight, Sparkles } from "lucide-react";
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
import { IntakePhotos } from "@/components/order/IntakePhotos";
import { DEFAULT_PACE, PACES } from "@/data/publishing-pace";

type ArticleMode = "have" | "write" | "later";
type ArticleKind = "press_release" | "sponsored" | "seo";

const KINDS: { id: ArticleKind; label: string }[] = [
  { id: "press_release", label: "Press release" },
  { id: "sponsored", label: "Sponsored article" },
  { id: "seo", label: "SEO article" },
];

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
    text: "Give us your website — we draft it on the spot, you read and edit it. Included, no extra cost.",
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [pace, setPace] = useState(DEFAULT_PACE);
  const [kind, setKind] = useState<ArticleKind>("press_release");
  const [keyword, setKeyword] = useState("");
  const [links, setLinks] = useState("");
  const [drafting, setDrafting] = useState(false);
  // Once a draft is on screen the order goes out as a ready article, like "have".
  const [drafted, setDrafted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const sendsArticle = mode === "have" || (mode === "write" && drafted && body.trim().length > 0);

  // Without an instant draft the team writes it, so pass on everything given.
  function briefWithExtras(): string {
    return [
      brief,
      `Type: ${KINDS.find((k) => k.id === kind)?.label}`,
      keyword ? `Keyword: ${keyword}` : "",
      links ? `Links:\n${links}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function draft() {
    setError(null);
    setDrafting(true);
    try {
      const res = await fetch("/api/order/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, brief, companyName: company, kind, keyword, links }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not draft the article.");
      setTitle(data.title);
      setBody(data.body);
      setDrafted(true);
      trackPixelEvent("ViewContent", { content_name: "article_draft" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setDrafting(false);
    }
  }

  async function submit() {
    setError(null);
    setBusy(true);
    trackPixelEvent("InitiateCheckout", { content_name: label, value: price, currency: "USD" });
    trackGaEvent("begin_checkout", { value: price, currency: "USD", items: 1 });

    try {
      const pasted = images
        .split(/[\s,]+/)
        .map((u) => u.trim())
        .filter((u) => /^https?:\/\//.test(u));
      // The files they uploaded come first: those are the ones they chose.
      const imageUrls = [...photos, ...pasted].slice(0, 3);

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
          articleMode: sendsArticle ? "have" : mode,
          title: title || undefined,
          body: sendsArticle ? body : undefined,
          brief: mode === "write" && !drafted ? briefWithExtras() : undefined,
          imageUrls: imageUrls.length ? imageUrls : undefined,
          publishingPace: pace,
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
      (sendsArticle && body.trim().length > 0) ||
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
            <Label>What kind of article?</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    kind === k.id
                      ? "border-[#c1121f] bg-red-50/60 text-brand-navy ring-1 ring-[#c1121f]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Your website *</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="yourcompany.com"
            />
            <p className="mt-1 text-xs text-slate-500">We read it so the article uses your real facts.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Keywords</Label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. roofing contractor Dallas — optional"
              />
            </div>
            <div>
              <Label>Company name</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="optional"
              />
            </div>
          </div>
          <div>
            <Label>Links in the article</Label>
            <Textarea
              rows={2}
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder={"phrase -> https://… (one per line) — optional"}
            />
          </div>
          <div>
            <Label>Anything specific to say?</Label>
            <Textarea
              rows={3}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="A launch, an offer, what makes you different — optional, the website is enough."
            />
          </div>

          <Button
            type="button"
            variant={drafted ? "outline" : "accent"}
            className="w-full"
            disabled={drafting || (!website.trim() && brief.trim().length < 10)}
            onClick={draft}
          >
            {drafting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Writing your article… about 30 seconds
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> {drafted ? "Write another version" : "Write my article now"}
              </>
            )}
          </Button>

          {drafted ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#c1121f]">
                Your draft — edit anything you like
              </p>
              <div>
                <Label>Headline</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Article text</Label>
                <Textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
                <p className="mt-1 text-xs text-slate-500">
                  {words} word{words === 1 ? "" : "s"}. This exact text is what we publish.
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              Prefer not to wait? Continue without a draft — we write it and email it to you
              before anything is published. Nothing goes out without your approval.
            </p>
          )}
        </div>
      )}

      {mode === "later" && (
        <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
          Fine. After payment you get a sign-in link by email — open <em>New article</em>, paste
          your text and add photos whenever it suits you. Your order waits for you.
        </p>
      )}

      {mode !== "later" && (
        <div className="space-y-3">
          <IntakePhotos urls={photos} onChange={setPhotos} />
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer hover:text-brand-navy">
              Rather paste links than upload files?
            </summary>
            <Textarea
              rows={2}
              value={images}
              onChange={(e) => setImages(e.target.value)}
              placeholder="https://… one per line"
              className="mt-2"
            />
          </details>
          <p className="text-xs text-slate-500">
            Up to 3 photos. A photo of your own beats a stock one on every newspaper — leave it
            empty and we pick something that fits.
          </p>
        </div>
      )}

      {/* ---- how fast it goes out */}
      <div>
        <h2 className="font-serif text-lg font-bold text-brand-navy">Publishing pace</h2>
        <p className="mt-1 text-sm text-slate-600">
          Same 50 newspapers either way — this is only how the days are spread.
        </p>
        <div className="mt-4 space-y-2">
          {PACES.map((option) => (
            <label
              key={option.perDay}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                pace === option.perDay
                  ? "border-brand-red bg-red-50/40"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="pace"
                className="mt-1 h-4 w-4 shrink-0 accent-brand-red"
                checked={pace === option.perDay}
                onChange={() => setPace(option.perDay)}
              />
              <span>
                <span className="block text-sm font-semibold text-brand-navy">{option.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">
                  {option.text}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

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
          {mode !== "write" && (
            <>
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
            </>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          You pay on the next page, by card. The receipt comes by email.
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
