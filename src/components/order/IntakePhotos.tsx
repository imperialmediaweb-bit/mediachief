"use client";

import { useState } from "react";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { MAX_IMAGES_PER_ARTICLE } from "@/lib/cloudinary";

/**
 * Photos on the order form, as files.
 *
 * The buyer used to be asked for links and told they could upload "from your
 * account right after payment" — which means the photo arrives after the
 * article is already in the queue, or never. The file goes straight from the
 * browser to Cloudinary and comes back as a URL, so the order carries the
 * photo the moment it is placed.
 */
export function IntakePhotos({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_IMAGES_PER_ARTICLE - urls.length;

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("That file is not an image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Photos have to be under 10 MB.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const signRes = await fetch("/api/upload/intake", { method: "POST" });
      const sign = await signRes.json();
      if (!signRes.ok || !sign.ok) throw new Error(sign.error || "Could not start the upload.");

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("folder", sign.folder);
      form.append("signature", sign.signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      const up = await res.json();
      if (!res.ok || !up.secure_url) {
        throw new Error(up?.error?.message || "The upload did not go through.");
      }
      onChange([...urls, up.secure_url as string]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The upload did not go through.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-brand-navy" />
        <span className="text-sm font-semibold text-brand-navy">
          Photos ({urls.length}/{MAX_IMAGES_PER_ARTICLE})
        </span>
      </div>

      {urls.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {urls.map((url) => (
            <div
              key={url}
              className="relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(urls.filter((u) => u !== url))}
                aria-label="Remove this photo"
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-600 shadow hover:text-brand-red"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600 hover:border-brand-red hover:bg-slate-50">
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Add a photo — {remaining} left
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
        </label>
      )}

      {error && (
        <p className="mt-2 flex items-start gap-1 text-xs text-red-600">
          <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
