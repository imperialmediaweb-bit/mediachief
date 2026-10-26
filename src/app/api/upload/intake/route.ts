import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { CLOUDINARY_FOLDER, cloudinaryConfigured, signUpload } from "@/lib/cloudinary";
import { createLimiter, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * A signature for a photo on an order that does not exist yet.
 *
 * The route next door signs uploads for an article a signed-in client already
 * owns. On the order form there is no article and no account — the buyer is
 * filling in the form — so the photos have to go up before either exists. They
 * land in their own intake folder and travel to the order as plain URLs, which
 * is what the submit route already accepts.
 *
 * Nothing here can be aimed at someone else's images: the folder is a fresh
 * random name on every call, and the signature only ever covers that folder.
 */
const tooMany = createLimiter(20, 10 * 60 * 1000);

export async function POST(req: NextRequest) {
  if (tooMany(ipFromRequest(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many uploads from this connection. Try again in a few minutes." },
      { status: 429 }
    );
  }
  if (!cloudinaryConfigured()) {
    return NextResponse.json({ ok: false, error: "Uploads are not configured" }, { status: 503 });
  }

  const signed = signUpload(`${CLOUDINARY_FOLDER}/intake/${crypto.randomUUID()}`);
  if (!signed) {
    return NextResponse.json({ ok: false, error: "Uploads are not configured" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, ...signed });
}
