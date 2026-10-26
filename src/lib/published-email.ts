import { SITE } from "@/data/site";
import { sendEmail, wrapEmail } from "@/lib/email";
import { newspaperNameFor } from "@/lib/newspaper-name";
import { reportToken, reportUrl } from "@/lib/report-link";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface PublishedEmailArgs {
  to: string;
  /** The client's full name; only the first word is used. */
  name?: string | null;
  articleId: string;
  title: string;
  /** Every address the article went live on, as the network recorded them. */
  urls: string[];
}

/**
 * The one email the client gets when their article goes live: what was
 * published, every newspaper it ran in by name, and the report link.
 *
 * It lives here rather than inside a route because the article can be marked
 * published two ways — by hand in the admin, or by the network once it has
 * placed the article itself — and a client who is never told is a client who
 * paid and heard nothing.
 */
export async function sendPublishedEmail(args: PublishedEmailArgs) {
  const first = (args.name || "").trim().split(" ")[0];
  const rows = args.urls
    .map((url) => {
      const paper = newspaperNameFor(url);
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
            <div style="font-weight:600;color:#0B2545;">${escapeHtml(paper)}</div>
            <a href="${url}" style="color:#c1121f;font-size:13px;word-break:break-all;">${escapeHtml(url)}</a>
          </td>
        </tr>`;
    })
    .join("");

  const token = reportToken(args.articleId);

  return sendEmail({
    to: args.to,
    subject: `Your article is live on ${args.urls.length} newspaper${args.urls.length === 1 ? "" : "s"} — ${args.title}`,
    html: wrapEmail(
      "Your article is published",
      `
      <p>Hi${first ? " " + escapeHtml(first) : ""},</p>
      <p><strong>${escapeHtml(args.title)}</strong> is now live on <strong>${args.urls.length} newspaper${args.urls.length === 1 ? "" : "s"}</strong>. Every link below is permanent.</p>

      <p style="margin:24px 0;">
        <a href="${reportUrl(args.articleId)}" style="background:#c1121f;color:#fff;padding:13px 22px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Open your publication report</a>
      </p>
      <p style="font-size:13px;color:#64748b;margin-top:-12px;">No sign-in needed and the link never expires — share it with your team. Download it as
        <a href="${SITE.url}/api/report/${token}?format=pdf" style="color:#c1121f;">PDF</a> or
        <a href="${SITE.url}/api/report/${token}?format=csv" style="color:#c1121f;">Excel</a>.</p>

      <h3 style="margin:28px 0 4px 0;font-family:Georgia,serif;color:#0B2545;font-size:17px;">Where it was published</h3>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>

      <p style="margin-top:28px;color:#64748b;font-size:13px;">We publish the article and give you the links. Whether it brings visitors or customers is not something we promise.</p>
    `
    ),
  });
}
