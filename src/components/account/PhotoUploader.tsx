"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

export interface ExistingUpload {
  id: string;
  url: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Uploads straight from the browser to Cloudinary using a signature this server
 * hands out, then registers the result. Images never pass through our server.
 */
export function PhotoUploader({
  articleId,
  initial,
  max = 3,
  disabled = false,
}: {
  articleId: string;
  initial: ExistingUpload[];
  max?: number;
  disabled?: boolean;
}) {
  const [images, setImages] = useState<ExistingUpload[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const full = images.length >= max;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    if (!file.type.startsWith("image/")) return setError("That file is not an image.");
    if (file.size > MAX_BYTES) return setError("Images must be under 10 MB.");

    setBusy(true);
    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const signed = await signRes.json();
      if (!signRes.ok || !signed.ok) throw new Error(signed.error || "Could not start the upload.");

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signed.apiKey);
      form.append("timestamp", String(signed.timestamp));
      form.append("folder", signed.folder);
      form.append("signature", signed.signature);

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
        { method: "POST", body: form }
      );
      const uploaded = await upRes.json();
      if (!upRes.ok || !uploaded.secure_url) {
        throw new Error(uploaded?.error?.message || "Cloudinary refused the upload.");
      }

      const regRes = await fetch(`/api/articles/${articleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloudinaryPublicId: uploaded.public_id,
          url: uploaded.secure_url,
          width: uploaded.width,
          height: uploaded.height,
          bytes: uploaded.bytes,
        }),
      });
      const registered = await regRes.json();
      if (!regRes.ok || !registered.ok) throw new Error(registered.error || "Could not save the image.");

      setImages((prev) => [...prev, registered.upload]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/articles/${articleId}?uploadId=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) setImages((prev) => prev.filter((i) => i.id !== id));
    else setError("Could not remove that image.");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {images.map((img) => (
          <div key={img.id} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt=""
              className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(img.id)}
                className="absolute -right-2 -top-2 rounded-full bg-white p-1.5 shadow-md ring-1 ring-slate-200 hover:bg-red-50"
                aria-label="Remove image"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
              </button>
            )}
          </div>
        ))}

        {!disabled && !full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-brand-red hover:text-brand-red disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                Add photo
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />

      <p className="mt-2 text-xs text-slate-500">
        {full
          ? `Maximum of ${max} photos reached.`
          : `Up to ${max} photos, 10 MB each. One becomes the article's main image.`}
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
