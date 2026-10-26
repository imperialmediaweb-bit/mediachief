"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Template {
  id: string;
  label: string;
  subject: string;
  body: string;
}

/**
 * Write to the client, from the order.
 *
 * The message is already written and fits the state the order is in — pick
 * one, change what needs changing, attach the receipt or the report, send.
 * The address is the order's own and is never typed by hand, which is how the
 * wrong client gets told the right thing.
 */
export function ClientMessage({ articleId }: { articleId: string }) {
  const [to, setTo] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<{ filename: string; content: string; size: number } | null>(null);
  const [sendAt, setSendAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/articles/${articleId}/message`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d.ok) return;
        setTo(d.to || "");
        setTemplates(d.templates || []);
        // Open on the one that fits most orders at this point.
        const first = (d.templates || [])[0];
        if (first) {
          setPicked(first.id);
          setSubject(first.subject);
          setBody(first.body);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [articleId]);

  function pick(t: Template) {
    setPicked(t.id);
    setSubject(t.subject);
    setBody(t.body);
    setSent(null);
  }

  function attach(f: File) {
    setError(null);
    if (f.size > 5 * 1024 * 1024) {
      setError("Attachments have to be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setFile({ filename: f.name, content: result.split(",")[1] || "", size: f.size });
    };
    reader.onerror = () => setError("That file could not be read.");
    reader.readAsDataURL(f);
  }

  async function send() {
    setError(null);
    setSent(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          ...(file ? { attachment: { filename: file.filename, content: file.content } } : {}),
          // The picker gives local time; the server and Resend want an instant.
          ...(sendAt ? { scheduledAt: new Date(sendAt).toISOString() } : {}),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "That did not send.");
      setSent(
        data.scheduledAt
          ? `Scheduled for ${new Date(data.scheduledAt).toLocaleString("en-US")} — ${data.to}`
          : `Sent to ${data.to}${data.messageId ? ` · id ${data.messageId}` : ""}`
      );
      setFile(null);
      setSendAt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-serif text-lg font-bold text-brand-navy">Write to the client</h2>
      <p className="mt-1 text-sm text-slate-600">
        The message is already written for the state this order is in. Change what you like, attach
        the receipt or the report, send — all from here.
      </p>

      <div className="mt-4 rounded-lg bg-brand-ivory px-3 py-2 text-sm">
        <span className="text-slate-500">To </span>
        <span className="font-semibold text-brand-navy">{to || "— no address on this order"}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pick(t)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              picked === t.id
                ? "border-brand-red bg-brand-red text-white"
                : "border-slate-300 bg-white text-brand-navy hover:border-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Message</Label>
          <Textarea
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-brand-navy hover:bg-slate-50">
            <Paperclip className="h-4 w-4" />
            Attach a receipt or report (PDF, max 5 MB)
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) attach(f);
                e.target.value = "";
              }}
            />
          </label>
          {file && (
            <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
              {file.filename} · {(file.size / 1024).toFixed(0)} KB
              <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment">
                <X className="h-3.5 w-3.5 hover:text-brand-red" />
              </button>
            </span>
          )}
        </div>

        <div>
          <Label>Send later — leave empty to send now</Label>
          <Input
            type="datetime-local"
            value={sendAt}
            onChange={(e) => setSendAt(e.target.value)}
            className="mt-1 w-auto"
          />
        </div>

        <Button
          variant="accent"
          size="lg"
          className="w-full"
          onClick={send}
          disabled={busy || !to || !subject.trim() || !body.trim()}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" /> {sendAt ? "Schedule it" : "Send"} to {to || "the client"}
            </>
          )}
        </Button>
      </div>

      {sent && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="break-all">{sent}</span>
        </div>
      )}
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
