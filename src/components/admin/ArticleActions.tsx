"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * What the operator does with a submitted article: paste the links it went
 * live on, or send it back with a reason. Both email the client.
 */
export function ArticleActions({
  articleId,
  status,
  publishedUrls,
}: {
  articleId: string;
  status: string;
  publishedUrls: string[];
}) {
  const router = useRouter();
  const [urls, setUrls] = useState(publishedUrls.join("\n"));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"publish" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "publish" | "reject") {
    setError(null);
    setBusy(action);
    try {
      const list = urls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);

      if (action === "publish" && list.length === 0) {
        throw new Error("Paste at least one link, one per line.");
      }

      const res = await fetch(`/api/admin/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "publish"
            ? { action, publishedUrls: list }
            : { action, rejectionReason: reason }
        ),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "That did not work.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  }

  if (status === "published") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="flex items-center gap-2 font-semibold text-green-800">
          <CheckCircle2 className="h-5 w-5" /> Published and the client has the links
        </p>
        <ul className="mt-3 space-y-1 font-mono text-xs text-slate-600">
          {publishedUrls.map((u) => (
            <li key={u} className="break-all">
              {u}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <Label>Published links — one per line</Label>
        <Textarea
          rows={8}
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={"https://texasexpres.com/business/…\nhttps://newyork-express.com/business/…"}
          className="mt-2 font-mono text-xs"
        />
        <Button
          variant="accent"
          size="lg"
          className="mt-4 w-full"
          onClick={() => run("publish")}
          disabled={busy !== null}
        >
          {busy === "publish" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Mark published and email the client
            </>
          )}
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <Label>Send it back — reason for the client</Label>
        <Textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="The text promises guaranteed results, which the newspapers will not run."
          className="mt-2"
        />
        <p className="mt-2 text-xs text-slate-500">
          The client keeps their article slot and can edit and resend.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="mt-4 w-full"
          onClick={() => run("reject")}
          disabled={busy !== null}
        >
          {busy === "reject" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending back…
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" /> Send back and email the client
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
