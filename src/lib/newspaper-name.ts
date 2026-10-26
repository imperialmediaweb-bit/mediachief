import { NEWSPAPERS } from "@/data/newspapers";

/**
 * The name of the newspaper a published address belongs to.
 *
 * The host alone does not give it: the domains are spelled inconsistently
 * (alaskaexpres.com, illinoiseexpres.com, florida-expres.com), so title-casing
 * the host produces "Alaskaexpres" — which is what the client used to read on
 * their report. The network data holds the real names, so match on the host and
 * only fall back to the host when a placement lands on a paper not listed here.
 */
const BY_HOST = new Map<string, string>();
for (const paper of NEWSPAPERS) {
  if (!paper.url) continue;
  try {
    BY_HOST.set(new URL(paper.url).hostname.replace(/^www\./, ""), paper.name);
  } catch {
    // A malformed url in the data file should not take the whole map down.
  }
}

export function newspaperNameFor(url: string): string {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }

  const known = BY_HOST.get(host);
  if (known) return known;

  return (host.split(".")[0] || host)
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
