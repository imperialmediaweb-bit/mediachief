import { sendEmail, wrapEmail } from "@/lib/email";
import { NEWSPAPERS, TOTAL_NEWSPAPERS } from "@/data/newspapers";
import { PROMO_PRICE } from "@/data/packages";
import { SITE } from "@/data/site";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/**
 * Sends the full newspaper list to someone who asked for it — straight away,
 * by email only. Buyers wanted proof before paying and were told "we'll
 * contact you within 24h"; they left. The list still never appears on a public
 * page, so it stays out of search indexes.
 */
export async function sendNetworkList(to: string, name?: string) {
  const firstName = name?.trim().split(" ")[0] || "there";
  const rows = NEWSPAPERS.map(
    (n) => `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;color:#64748b;font-size:13px;">${escapeHtml(n.state || n.region)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:13px;">${
        n.url
          ? `<a href="${escapeHtml(n.url)}" style="color:#0B2545;">${escapeHtml(n.name)}</a>`
          : escapeHtml(n.name)
      }</td>
    </tr>`
  ).join("");

  return sendEmail({
    to,
    subject: `The full list of our ${TOTAL_NEWSPAPERS} newspapers`,
    replyTo: process.env.CONTACT_EMAIL || SITE.email,
    html: wrapEmail(
      `Our ${TOTAL_NEWSPAPERS} newspapers, one in every state`,
      `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Here is the full network. Click any name to see the newspaper live.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>
      <p>One article in all ${TOTAL_NEWSPAPERS} costs <strong>$${PROMO_PRICE}</strong>. You send the text (or we write it from your website), pay by card, and get every link within 24h, with a PDF report.</p>
      <p style="margin:24px 0;"><a href="${SITE.url}/intro-offer" style="display:inline-block;background:#c1121f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Publish in all ${TOTAL_NEWSPAPERS} — $${PROMO_PRICE}</a></p>
      <p>Questions? Just reply to this email.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The Media Chief Team</strong></p>
      `
    ),
  });
}
