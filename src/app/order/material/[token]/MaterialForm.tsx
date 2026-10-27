"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IntakePhotos } from "@/components/order/IntakePhotos";
import { CONTENT_DECLARATION, CONTENT_DECLARATION_WARNING } from "@/lib/content-policy";

/**
 * The article, sent after payment, from the link in the client's email.
 *
 * No account and no password: they have already paid, and asking a paying
 * customer to go and prove who they are before they can give us the thing we
 * are waiting for is how an order sits unfinished for a week.
 */
export function MaterialForm({
  token,
  initialTitle,
  initialBody,
}: {
  token: string;
  initialTitle: string;
  initialBody: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/order/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          title: title.trim(),
          body: body.trim(),
          imageUrls: photos.length ? photos : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "That did not send.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not send.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <h2 className="mt-4 font-serif text-2xl font-bold text-brand-navy">We have your article</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-700">
          It is with our editors now. We publish within one business day and email you every
          newspaper with its link, plus the report as a PDF and a spreadsheet.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Spotted a mistake? Open this same link again and send a corrected version — it replaces
          what you just sent, as long as we have not published yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <Label>Headline *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="The headline you want on every newspaper"
          className="mt-1"
        />

        <div className="mt-5 flex items-end justify-between gap-3">
          <Label>Your article *</Label>
          <span className="text-xs text-slate-500">{words} words</span>
        </div>
        <Textarea
          rows={16}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Paste your text here. Leave a blank line between paragraphs — that is how it will be laid out."
          className="mt-1"
        />
        <p className="mt-2 text-xs text-slate-500">
          300 to 800 words reads best. No text ready? Write the facts in any order and tell us
          below — we shape it and send it back before anything is published.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <IntakePhotos urls={photos} onChange={setPhotos} />
        <p className="mt-3 text-xs text-slate-500">
          A photo of your own beats a stock one on every newspaper — your product, your cover,
          your logo, you.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <Label>Anything we should know?</Label>
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="A date it must not go out before, a link to include, a name spelled a particular way…"
          className="mt-1"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand-red"
        />
        <span>{CONTENT_DECLARATION}</span>
      </label>
      {!agreed && <p className="text-xs text-slate-500">{CONTENT_DECLARATION_WARNING}</p>}

      <Button
        variant="accent"
        size="lg"
        className="w-full"
        onClick={submit}
        disabled={busy || !agreed || title.trim().length < 3 || body.trim().length < 50}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Send it to the editors
          </>
        )}
      </Button>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
