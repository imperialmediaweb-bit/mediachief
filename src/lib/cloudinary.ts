import crypto from "crypto";

/**
 * Signed direct uploads: the browser sends the file straight to Cloudinary, so
 * images never pass through this server. We only sign the parameters, which is
 * what proves the upload was authorised by us.
 */

export const MAX_IMAGES_PER_ARTICLE = 3;

export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "mediachief";

export function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export function signUpload(folder: string): SignedUpload | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = { folder, timestamp };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

  return { cloudName, apiKey, timestamp, folder, signature };
}

/** Where one client's images for one article live. */
export function folderFor(userId: string, articleId: string): string {
  return `${CLOUDINARY_FOLDER}/u_${userId}/a_${articleId}`;
}

/**
 * Guards against a client registering someone else's image: the returned URL
 * has to sit inside the folder we signed for.
 */
export function urlIsInFolder(url: string, folder: string): boolean {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("cloudinary.com")) return false;
    return u.pathname.includes(folder);
  } catch {
    return false;
  }
}
