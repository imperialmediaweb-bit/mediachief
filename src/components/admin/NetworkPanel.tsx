"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Mail, RefreshCw, Send, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Action = "create" | "publish" | "refresh" | "identical" | "email";

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
}: {
  articleId: string;
  inNetwork: boolean;
  publishedCount: number;
}) {
  const router = useRouter();
  const [clientUrl, setClientUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

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
          // Publishing fifty sites in one request outlives the edge timeout,
          // so take them in runs and press it again.
          ...(action === "publish" ? { perRun: 12 } : {}),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "That did not work.");

      if (action === "create") setNote("Campaign created. Publish it in runs.");
      else if (action === "identical") setNote("The client's own words go out from now on, unchanged.");
      else if (action === "email") setNote(`Publication email sent to ${data.emailed}.`);
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
          <Button variant="outline" className="w-full" onClick={() => run("email")} disabled={busy !== null}>
            <Mail className="h-4 w-4" />{" "}
            {label("email", "Send the publication email", "Sending…")}
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
            Press <strong>Publish the next run</strong> again until it reads 50 of 50 — each run picks up
            where the last one stopped.
          </p>
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
