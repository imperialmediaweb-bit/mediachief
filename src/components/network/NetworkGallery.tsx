import Image from "next/image";
import { CheckCircle2, Clock } from "lucide-react";
import { timeAgo, type PaperStatus } from "@/lib/network-status";

/**
 * Card per newspaper: real homepage screenshot, name, state, latest story
 * with its time, and sitemap status. Links are nofollow (the page itself is
 * noindex) so the network is shown to buyers without tying the papers to
 * Media Chief for search engines.
 */
export function NetworkGallery({ papers, now }: { papers: PaperStatus[]; now: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {papers.map((p) => {
        const ago = timeAgo(p.latestAt, now);
        return (
          <article key={p.host || p.name} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <a href={p.url} target="_blank" rel="nofollow noopener noreferrer" className="block">
              <Image
                src={p.shot}
                alt={`${p.name} homepage`}
                width={640}
                height={400}
                className="aspect-[16/10] w-full object-cover object-top"
                loading="lazy"
              />
            </a>
            <div className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-serif text-lg font-bold text-brand-navy">{p.name}</h3>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.state}</span>
              </div>
              {p.latestTitle ? (
                <p className="mt-2 line-clamp-2 text-sm text-slate-700">
                  <Clock className="mr-1 inline h-3.5 w-3.5 text-brand-red" />
                  <strong>Latest story{ago ? `, ${ago}` : ""}:</strong> {p.latestTitle}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Latest story: not available right now</p>
              )}
              {p.sitemapOk && (
                <p className="mt-2 text-xs text-emerald-700">
                  <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                  Sitemap live · new stories sent to search engines (IndexNow)
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
