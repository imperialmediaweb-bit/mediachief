import crypto from "crypto";

/**
 * A screenshot of the buyer's website, used as the article image when they
 * send no photos — same as MediaExpres. Free services, tried in order; the
 * image is copied to Cloudinary so it does not disappear. If all fail the
 * article simply goes without an image and the admin sees that.
 */

const TIMEOUT_MS = 30_000;

function cleanUrl(site: string): string | null {
  const t = (site || "").trim();
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (!/\./.test(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function screenshotSources(site: string): string[] {
  return [
    // microlink waits 4s so animated sites show their text, not an empty background.
    `https://api.microlink.io/?url=${encodeURIComponent(site)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1200&viewport.height=675&viewport.deviceScaleFactor=1&screenshot.type=jpeg&waitForTimeout=4000`,
    `https://image.thum.io/get/width/1200/crop/675/noanimate/${site}`,
    `https://s0.wp.com/mshots/v1/${encodeURIComponent(site)}?w=1200&h=675`,
  ];
}

async function download(url: string): Promise<{ bytes: Buffer; type: string } | null> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "MediaChief/1.0 (+https://media-chief.com)" },
    });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !/^image\/(png|jpe?g|webp)/i.test(type)) return null;
    const bytes = Buffer.from(await r.arrayBuffer());
    // Under 10KB it is a placeholder, not a screenshot.
    if (bytes.length < 10_000) return null;
    return { bytes, type: type.split(";")[0] };
  } catch {
    return null;
  }
}

export interface Screenshot {
  url: string;
  publicId: string;
  bytes: number;
}

export async function screenshotSite(siteUrl: string, folder: string): Promise<Screenshot | null> {
  const site = cleanUrl(siteUrl);
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!site || !cloudName || !apiKey || !apiSecret) return null;

  let image: { bytes: Buffer; type: string } | null = null;
  for (const src of screenshotSources(site)) {
    image = await download(src);
    if (image) break;
  }
  if (!image) return null;

  const publicId = "site-screenshot";
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

  const fd = new FormData();
  fd.set("file", `data:${image.type};base64,${image.bytes.toString("base64")}`);
  fd.set("folder", folder);
  fd.set("public_id", publicId);
  fd.set("timestamp", String(timestamp));
  fd.set("signature", signature);
  fd.set("api_key", apiKey);
  try {
    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: fd,
    });
    if (!r.ok) {
      console.warn("[site-screenshot] cloudinary", r.status, (await r.text()).slice(0, 200));
      return null;
    }
    const j = (await r.json()) as { secure_url?: string; public_id?: string };
    if (!j.secure_url) return null;
    return { url: j.secure_url, publicId: j.public_id || `${folder}/${publicId}`, bytes: image.bytes.length };
  } catch (e) {
    console.warn("[site-screenshot]", e instanceof Error ? e.message : e);
    return null;
  }
}

