"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PhotoUploader, type ExistingUpload } from "./PhotoUploader";

export interface EditorArticle {
  id: string | null;
  title: string;
  body: string;
  existingUrl: string;
  notes: string;
  status: string;
  rejectionReason?: string | null;
}

/**
 * One screen for writing, drafting with AI, attaching photos and sending the
 * article in. Photos need an article id, so a new article is saved as a draft
 * before the uploader appears.
 */
export function ArticleEditor({
  article,
  uploads,
  canGenerate,
}: {
  article: EditorArticle;
  uploads: ExistingUpload[];
  canGenerate: boolean;
}) {
  const router = useRouter();
  const [id, setId] = useState(article.id);
  const [title, setTitle] = useState(article.title);
  const [body, setBody] = useState(article.body);
  const [existingUrl, setExistingUrl] = useState(article.existingUrl);
  const [notes, setNotes] = useState(article.notes);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [status, setStatus] = useState(article.status);

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showAi, setShowAi] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiPoints, setAiPoints] = useState("");
  const [aiCompany, setAiCompany] = useState("");
  const [aiWebsite, setAiWebsite] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const locked = status === "submitted" || status === "published";
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  async function save(action: "save" | "submit"): Promise<string | null> {
    setError(null);
    if (title.trim().length < 3) {
      setError("Give the article a title first.");
      return null;
    }

    const payload = { title: title.trim(), body, existingUrl, notes, action };

    if (!id) {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body, existingUrl, notes, aiGenerated }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not save the article.");
        return null;
      }
      setId(data.id);
      if (action === "save") return data.id;
      // Created as a draft, now send it in.
      const sub = await fetch(`/api/articles/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const subData = await sub.json();
      if (!sub.ok || !subData.ok) {
        setError(subData.error || "Saved as a draft, but could not send it.");
        return data.id;
      }
      setStatus("submitted");
      return data.id;
    }

    const res = await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Could not save the article.");
      return null;
    }
    if (action === "submit") setStatus("submitted");
    return id;
  }

  async function onSave() {
    setSaving(true);
    const savedId = await save("save");
    setSaving(false);
    if (savedId) {
      setSavedAt(new Date().toLocaleTimeString());
      router.refresh();
    }
  }

  async function onSubmit() {
    if (!body.trim() && !existingUrl.trim()) {
      setError("Add the article text, or a link to it, before sending.");
      return;
    }
    setSending(true);
    const savedId = await save("submit");
    setSending(false);
    if (savedId && status !== "submitted") router.refresh();
    if (savedId) router.push("/account/articles");
  }

  async function onGenerate() {
    setError(null);
    if (aiTopic.trim().length < 10) {
      setError("Describe the topic in a sentence or two.");
      return;
    }
    setAiBusy(true);
    try {
      const res = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          keyPoints: aiPoints,
          companyName: aiCompany,
          website: aiWebsite,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not draft the article.");
      setTitle(data.title);
      setBody(data.body);
      setAiGenerated(true);
      setShowAi(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not draft the article.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {status === "rejected" && article.rejectionReason && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">We sent this one back</p>
            <p className="mt-1">{article.rejectionReason}</p>
            <p className="mt-1 text-amber-800">Fix it below and send it again.</p>
          </div>
        </div>
      )}

      {locked && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          This article is with our editors and can no longer be changed.
        </div>
      )}

      {!locked && canGenerate && (
        <div className="rounded-xl border border-brand-gold/40 bg-brand-ivory p-5">
          {!showAi ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-brand-navy">No text ready?</p>
                <p className="text-sm text-slate-600">
                  Give us the topic and we write the first draft for you.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowAi(true)}>
                <Sparkles className="h-4 w-4" /> Write it for me
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>What is the article about? *</Label>
              <Textarea
                rows={3}
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="A dental clinic in Austin opening a second location, with same-day emergency appointments."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Company name</Label>
                  <Input value={aiCompany} onChange={(e) => setAiCompany(e.target.value)} />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={aiWebsite} onChange={(e) => setAiWebsite(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Points we must mention</Label>
                <Textarea
                  rows={2}
                  value={aiPoints}
                  onChange={(e) => setAiPoints(e.target.value)}
                  placeholder="Opening date, address, phone number, the services offered."
                />
              </div>
              <p className="text-xs text-slate-500">
                We only write what you tell us. We never invent figures, awards or quotes, so read
                the draft before sending it.
              </p>
              <div className="flex gap-2">
                <Button variant="accent" onClick={onGenerate} disabled={aiBusy}>
                  {aiBusy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Writing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Write the draft
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowAi(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <Label>Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={locked}
            placeholder="Austin dental clinic opens a second location"
          />
        </div>

        <div>
          <Label>Article text</Label>
          <Textarea
            rows={16}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={locked}
            placeholder="Write or paste the article here…"
          />
          <p className="mt-1 text-xs text-slate-500">
            {words} words. Around 500 reads best. Leave this empty if you are sending a link
            instead.
          </p>
        </div>

        <div>
          <Label>Or a link to an article that is already online</Label>
          <Input
            type="url"
            value={existingUrl}
            onChange={(e) => setExistingUrl(e.target.value)}
            disabled={locked}
            placeholder="https://…"
          />
        </div>

        <div>
          <Label>Notes for our editors</Label>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={locked}
            placeholder="Preferred publication date, links that must stay exactly as written, anything else."
          />
        </div>

        <div>
          <Label>Photos</Label>
          {id ? (
            <PhotoUploader articleId={id} initial={uploads} disabled={locked} />
          ) : (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
              Save the draft first, then you can add photos.
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!locked && (
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
            <Button variant="accent" size="lg" onClick={onSubmit} disabled={sending || saving}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send it to us
                </>
              )}
            </Button>
            <Button variant="outline" size="lg" onClick={onSave} disabled={saving || sending}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save as draft"
              )}
            </Button>
            {savedAt && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <Check className="h-4 w-4" /> Saved at {savedAt}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
