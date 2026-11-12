import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { CLOUDINARY_FOLDER, signUpload } from "@/lib/cloudinary";
import { setFbPromoProof } from "@/lib/fb-promo-db";

export const runtime = "nodejs";

/**
 * Proof of the 3-day Facebook promotion, added by hand after the ad has run:
 * the screenshot from the ads account (uploaded to Cloudinary here), the post
 * and the number of days. It shows up at once on the client's live report.
 */
export async function POST(req: NextRequest) {
  if (!getSession()) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form" }, { status: 400 });
  }
  const orderId = String(form.get("orderId") || "").trim();
  if (!orderId) return NextResponse.json({ ok: false, error: "Missing order" }, { status: 400 });

  const postRaw = String(form.get("post") ?? "").trim();
  if (postRaw && !/^https:\/\/(www\.|m\.)?facebook\.com\//.test(postRaw)) {
    return NextResponse.json({ ok: false, error: "The post link must be a facebook.com address" }, { status: 400 });
  }
  const daysRaw = Number(form.get("days") || 0);
  const days = Number.isFinite(daysRaw) && daysRaw > 0 && daysRaw < 60 ? Math.round(daysRaw) : null;

  let proof: string | undefined;
  const file = form.get("proof");
  if (file && typeof file !== "string" && file.size > 0) {
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "The screenshot must be an image under 8 MB" }, { status: 400 });
    }
    const s = signUpload(`${CLOUDINARY_FOLDER}/fb-promo`);
    if (!s) return NextResponse.json({ ok: false, error: "Cloudinary is not configured" }, { status: 500 });
    const up = new FormData();
    up.set("file", file);
    up.set("api_key", s.apiKey);
    up.set("timestamp", String(s.timestamp));
    up.set("folder", s.folder);
    up.set("signature", s.signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, { method: "POST", body: up });
    const j = (await res.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
    if (!res.ok || !j?.secure_url) {
      return NextResponse.json({ ok: false, error: `Upload failed: ${j?.error?.message || res.status}` }, { status: 502 });
    }
    proof = j.secure_url;
  }

  await setFbPromoProof(orderId, {
    ...(proof ? { proof } : {}),
    post: postRaw || null,
    days,
  });
  return NextResponse.json({ ok: true, proof: proof ?? null });
}
