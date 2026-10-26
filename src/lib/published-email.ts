import { SITE } from "@/data/site";
import { sendEmail, wrapEmail } from "@/lib/email";
import { newspaperNameFor } from "@/lib/newspaper-name";
import { reportToken, reportUrl } from "@/lib/report-link";
import { buildCsv, buildPdf } from "@/lib/report";

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
  /** For the attached report. */
  publishedAt?: Date | null;
  company?: string | null;
}

/**
 * The one email the client gets when their article goes live: what was
 * published, every newspaper it ran in by name, and the report link.
 *
 * It lives here rather than inside a route because the article can be marked
 * published two ways — by hand in the admin, or by the network once it has
 * placed the article itself — and a client who is never told is a client who
 * paid and heard nothing.
 *
 * Building and sending are separate so the admin can show the operator exactly
 * what is about to go out, and to whom, before it goes.
 */
export function buildPublishedEmail(args: PublishedEmailArgs): {
  to: string;
  subject: string;
  html: string;
  slug: string;
} {
  const first = (args.name || "").trim().split(" ")[0];
  const token = reportToken(args.articleId);

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

  return {
    slug: slugFor(args.title),
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
      <p style="font-size:13px;color:#64748b;margin-top:-12px;">The report is attached to this email as a PDF and a spreadsheet. The link above needs no sign-in and never expires — share it with your team. You can also download it as
        <a href="${SITE.url}/api/report/${token}?format=pdf" style="color:#c1121f;">PDF</a> or
        <a href="${SITE.url}/api/report/${token}?format=csv" style="color:#c1121f;">Excel</a>.</p>

      <h3 style="margin:28px 0 4px 0;font-family:Georgia,serif;color:#0B2545;font-size:17px;">Where it was published</h3>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>

      <p style="margin-top:28px;color:#64748b;font-size:13px;">We publish the article and give you the links. Whether it brings visitors or customers is not something we promise.</p>
    `
    ),
  };
}

/** A filename a client can keep: the headline, not an id. */
function slugFor(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "report"
  );
}

/**
 * Builds it, attaches the report and sends it.
 *
 * The report goes as files, not only as a link. A link is a promise that a
 * server will still be there; the PDF in somebody's inbox is the thing they
 * forward to a publisher two years from now.
 */
export async function sendPublishedEmail(args: PublishedEmailArgs) {
  const mail = buildPublishedEmail(args);
  const data = {
    articleTitle: args.title,
    clientName: args.company || args.name || null,
    publishedAt: args.publishedAt ?? null,
    urls: args.urls,
  };

  const attachments: { filename: string; content: Buffer }[] = [];
  try {
    attachments.push({
      filename: `media-chief-${mail.slug}.pdf`,
      content: Buffer.from(await buildPdf(data)),
    });
    attachments.push({
      filename: `media-chief-${mail.slug}.csv`,
      // The BOM is what makes Excel read the UTF-8 correctly on Windows.
      content: Buffer.from("\ufeff" + buildCsv(data), "utf8"),
    });
  } catch (err) {
    // A report that will not render is not a reason to withhold the links.
    console.error("[published-email] could not build the report:", err);
  }

  return sendEmail({
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    ...(attachments.length ? { attachments } : {}),
  });
}
