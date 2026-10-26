/**
 * The messages an operator sends a client, already written.
 *
 * Ported from the Romanian admin, where every order has them under the client's
 * address: you pick the one that fits the state the order is in, change what
 * needs changing, attach the invoice or the report, and send. The point is not
 * saving keystrokes — it is that the same thing gets said the same way every
 * time, instead of being improvised at eleven at night.
 *
 * Each one is plain text. The route turns the blank lines into paragraphs.
 */
export interface MessageContext {
  firstName: string;
  title: string;
  reportUrl: string;
  /** How many newspapers are live so far. */
  placed: number;
  total: number;
  amount: string;
}

export interface MessageTemplate {
  id: string;
  /** The word on the button. */
  label: string;
  subject: (c: MessageContext) => string;
  body: (c: MessageContext) => string;
}

const hi = (c: MessageContext) => `Hi${c.firstName ? " " + c.firstName : ""},`;

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "published",
    label: "Published",
    subject: (c) => `Your campaign is published — ${c.title}`,
    body: (c) => `${hi(c)}

Your campaign is published. "${c.title}" is going out across our network of ${c.total} US newspapers.

You can watch it happen in real time here:
${c.reportUrl}

That page updates itself — every newspaper appears on it the moment the article is live, with a direct link to it. It opens without a sign-in, it never expires, and you can share it with anyone. You can also download it as a PDF or a spreadsheet from the same page.

Every link is permanent and indexed by search engines.

If anything in the article needs correcting, reply to this email and we will fix it across the network.

Best regards,
Media Chief`,
  },
  {
    id: "started",
    label: "Campaign started",
    subject: (c) => `Your campaign has started — ${c.title}`,
    body: (c) => `${hi(c)}

Your campaign has started. "${c.title}" is being published across our ${c.total} newspapers right now.

Follow it live here:
${c.reportUrl}

Each newspaper appears on that page as soon as the article is live on it, with the link. Nothing else is needed from you — we will email you again when all ${c.total} are done.

Best regards,
Media Chief`,
  },
  {
    id: "photos",
    label: "Need photos",
    subject: (c) => `A photo for your article — ${c.title}`,
    body: (c) => `${hi(c)}

We are ready to publish "${c.title}" and would like one photo to run with it.

Anything of your own works better than a stock image: a product shot, your book cover, a photo of you, your logo. Just reply to this email with the file attached.

If you would rather we choose something that fits, say so and we will.

Best regards,
Media Chief`,
  },
  {
    id: "payment",
    label: "Waiting for payment",
    subject: (c) => `Your order is waiting — ${c.title}`,
    body: (c) => `${hi(c)}

Your article is with us and ready to go. The order is waiting on payment of ${c.amount}.

Once the card goes through, publication starts straight away and you get a link where you can watch it happen newspaper by newspaper.

If anything about the order needs changing first, reply here and we will sort it out before you pay.

Best regards,
Media Chief`,
  },
  {
    id: "invoice",
    label: "Invoice",
    subject: (c) => `Your receipt — ${c.title}`,
    body: (c) => `${hi(c)}

Your receipt for ${c.amount} is attached.

The campaign for "${c.title}" is on our network of ${c.total} US newspapers. Your report, with every link, is here:
${c.reportUrl}

Reply to this email if you need the receipt made out differently — a company name, a VAT number, a different address.

Best regards,
Media Chief`,
  },
];

export function templateById(id: string): MessageTemplate | undefined {
  return MESSAGE_TEMPLATES.find((t) => t.id === id);
}
