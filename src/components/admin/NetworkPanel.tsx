"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Mail, RefreshCw, Send, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paceLabel } from "@/data/publishing-pace";

type Action = "create" | "publish" | "refresh" | "identical" | "email" | "preview";

/**
 * The publishing network, from the admin.
 *
 * The order goes out, the articles get placed, and the client is told — all
 * from here. Everything this panel does is also safe to repeat: publishing
 * resumes where it stopped, and the client is emailed once on its own.
 */
export function NetworkPanel({
  articleId,
  inNetwork,
  publishedCount,
  perRun,
  everyMinutes,
}: {
  articleId: string;
  inNetwork: boolean;
  publishedCount: number;
  /** The pace the buyer chose: newspapers per run, minutes between runs. */
  perRun: number | null;
  everyMinutes: number | null;
}) {
  const router = useRouter();
  const [clientUrl, setClientUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  // What is about to go out, shown before it does. Nothing leaves this panel
  // without the operator having read it first.
  const [preview, setPreview] = useState<{ to: string; subject: string; html: string } | null>(
    null
  );

  async function run(action: Action) {
    setError(null);
    setNote(null);
    setBusy(action);
    try {
      const res = await fetch("/api/admin/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          action,
          ...(action === "create"
            ? { clientUrl: clientUrl.trim(), ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}) }
            : {}),
          // Fifty sites in one request outlives the edge timeout whatever the
          // buyer chose, so a fast order still goes out in runs — it just takes
          // bigger ones.
          ...(action === "publish" ? { perRun: Math.min(perRun || 12, 12) } : {}),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "That did not work.");

      if (action === "preview") {
        setPreview(data.preview);
        return;
      }
      if (action === "create") setNote("Campaign created. Publish it in runs.");
      else if (action === "identical") setNote("The client's own words go out from now on, unchanged.");
      else if (action === "email") {
        setPreview(null);
        setNote(
          `Sent to ${data.emailed} — "${data.subject}"` +
            (data.messageId ? ` · id ${data.messageId}` : "")
        );
      }
      else {
        setNote(
          `${data.placed} of 50 placed.` + (data.emailed ? ` Publication email sent to ${data.emailed}.` : "")
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  }

  function label(action: Action, idle: string, running: string) {
    return busy === action ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" /> {running}
      </>
    ) : (
      idle
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold text-brand-navy">Publishing network</h2>
      <p className="mt-1 text-sm text-slate-600">
        {inNetwork
          ? `In the network — ${publishedCount} of 50 newspapers placed.`
          : "Not in the network yet."}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {paceLabel(perRun, everyMinutes)}
        {inNetwork && perRun && everyMinutes ? " — the network advances this on its own" : ""}
      </p>

      {!inNetwork && (
        <div className="mt-4 space-y-3">
          <div>
            <Label>Client link — every placement points at it</Label>
            <Input
              value={clientUrl}
              onChange={(e) => setClientUrl(e.target.value)}
              placeholder="https://www.amazon.com/dp/…"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Image for the placements — optional</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…/cover.jpg"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave it empty to use the photos the client uploaded.
            </p>
          </div>
          <Button
            variant="accent"
            className="w-full"
            onClick={() => run("create")}
            disabled={busy !== null || !clientUrl.trim()}
          >
            <Upload className="h-4 w-4" /> {label("create", "Create the campaign", "Creating…")}
          </Button>
        </div>
      )}

      {inNetwork && (
        <div className="mt-4 space-y-2">
          <Button
            variant="accent"
            className="w-full"
            onClick={() => run("publish")}
            disabled={busy !== null}
          >
            <Send className="h-4 w-4" /> {label("publish", "Publish the next run", "Publishing…")}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => run("refresh")} disabled={busy !== null}>
            <RefreshCw className="h-4 w-4" /> {label("refresh", "Read the links back", "Reading…")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => run("preview")}
            disabled={busy !== null}
          >
            <Mail className="h-4 w-4" />{" "}
            {label("preview", "Read the publication email", "Loading…")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => run("identical")}
            disabled={busy !== null}
          >
            {label("identical", "Use the client's text as-is", "Saving…")}
          </Button>
          <p className="text-xs text-slate-500">
            The network keeps going at the pace above without anyone here. Press{" "}
            <strong>Publish the next run</strong> only to push it along — each run picks up where
            the last one stopped.
          </p>
        </div>
      )}

      {preview && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">This is what goes out</p>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="shrink-0 text-slate-500">To</dt>
              <dd className="break-all font-medium text-brand-navy">{preview.to}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-slate-500">Subject</dt>
              <dd className="font-medium text-brand-navy">{preview.subject}</dd>
            </div>
          </dl>
          <iframe
            title="Publication email"
            srcDoc={preview.html}
            className="mt-3 h-80 w-full rounded-lg border border-slate-200 bg-white"
          />
          <div className="mt-3 flex gap-2">
            <Button
              variant="accent"
              className="flex-1"
              onClick={() => run("email")}
              disabled={busy !== null}
            >
              {label("email", `Send it to ${preview.to}`, "Sending…")}
            </Button>
            <Button variant="outline" onClick={() => setPreview(null)} disabled={busy !== null}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {note && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{note}</span>
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
