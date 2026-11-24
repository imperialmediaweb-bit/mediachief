import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createLimiter, ipFromRequest } from "@/lib/rate-limit";
import { sendEmail, wrapEmail, kv, ADMIN_EMAIL } from "@/lib/email";
import { sendNetworkList } from "@/lib/network-list-email";
import { STANDARD_PACKAGES, PROMO_PRICE, PICK_FIRST, PICK_EACH_MORE } from "@/data/packages";
import { TOTAL_NEWSPAPERS } from "@/data/newspapers";
import { sourceFromRequest, sourceLabel } from "@/lib/source";
import { SITE } from "@/data/site";
import { getThread, saveThread, type ChatMsg } from "@/lib/chat-store";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The site chat. Claude answers visitors straight away (they are in the US,
 * the owner is in Romania); when a visitor leaves an email, the newspaper list
 * goes to them and the whole conversation goes to the owner, who can reply in
 * person from their inbox.
 */
const limited = createLimiter(30, 10 * 60_000);

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1500),
        team: z.boolean().optional(),
      })
    )
    .min(1)
    .max(200),
  // 24.11.2026: the thread id kept in the visitor's browser (server copy, admin replies)
  thread: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
  // The email we already sent the list to, so it goes out once per chat.
  captured: z.string().max(200).optional(),
  // 24.11.2026: the visitor pressed "Talk to a real person"
  human: z.boolean().optional(),
});

const EMAIL_RE = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/i;

function systemPrompt(): string {
  const packages = STANDARD_PACKAGES.map(
    (p) => `- ${p.name}: $${p.price} — ${p.newspapers} newspaper${p.newspapers === 1 ? "" : "s"} (${p.reach})`
  ).join("\n");
  return `You are the Media Chief assistant on ${SITE.domain}. Answer visitors in short, friendly, plain American English (2 to 4 sentences, no markdown, no lists unless asked).

What Media Chief sells: an article (press release, sponsored or SEO article) published in a network of ${TOTAL_NEWSPAPERS} US local newspapers, one in every state.

Prices (USD, one-time):
- All ${TOTAL_NEWSPAPERS} newspapers: $${PROMO_PRICE} (the intro offer, ${SITE.url}/intro-offer)
${packages}
- Pick your own states: $${PICK_FIRST} for the first newspaper, $${PICK_EACH_MORE} for each extra one.
Casino / iGaming content costs more; point those visitors to ${SITE.url}/packages#casino.

How ordering works: the buyer sends the article first (or gives their website and we draft it on the spot, free — they read and edit it), then pays by card or PayPal. Links arrive within 24 hours with a PDF report listing every URL. Articles stay online.

Rules:
- Never invent facts: no traffic numbers, rankings, newspaper circulation, client names, discounts or guarantees that are not written above. If you do not know, say the team will confirm by email.
- Do not name individual newspapers in the chat. If someone wants the list or proof, ask for their email: the full list with live links is sent to them right away.
- Collect the visitor's email naturally when they are interested, so the team can follow up.
- Contact email: ${SITE.email}. The fastest way to reach us is this chat or email.
- To order, send them to ${SITE.url}/intro-offer (all ${TOTAL_NEWSPAPERS}) or ${SITE.url}/packages.`;
}

function transcriptHtml(messages: { role: string; content: string; team?: boolean }[]): string {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  return messages
    .map(
      (m) =>
        `<p style="margin:8px 0;"><strong>${m.role === "user" ? "Visitor" : m.team ? "Team" : "AI"}:</strong> ${esc(m.content)}</p>`
    )
    .join("");
}

type Turn = { role: "user" | "assistant"; content: string };

async function replyWithClaude(key: string, convo: Turn[]): Promise<string> {
  const client = new Anthropic({ apiKey: key });
  const res = await client.beta.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 1500,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: systemPrompt(),
    messages: convo,
  });
  return res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

// Used when only an OpenAI key is set on the service.
async function replyWithOpenAI(key: string, convo: Turn[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 400,
      messages: [{ role: "system", content: systemPrompt() }, ...convo],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content || "").trim();
}

export async function POST(req: NextRequest) {
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!claudeKey && !openaiKey) {
    return NextResponse.json(
      { ok: false, error: `Chat is offline — email us at ${SITE.email}.` },
      { status: 503 }
    );
  }
  if (limited(ipFromRequest(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many messages. Wait a few minutes, or email us." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
  }
  const { messages } = parsed.data;
  let captured = parsed.data.captured;

  const last = messages[messages.length - 1].content;
  const email = last.match(EMAIL_RE)?.[0];
  let note = "";
  if (email && email.toLowerCase() !== captured?.toLowerCase()) {
    await sendNetworkList(email);
    captured = email;
    note = `\n\n[System note: the full newspaper list was just emailed to ${email}. Confirm this to the visitor in one sentence.]`;
  }

  const thread = parsed.data.thread;
  const stored = thread ? await getThread(thread).catch(() => null) : null;
  const src = sourceLabel(sourceFromRequest(req));
  const adminLink = thread ? `${SITE.url}/admin/chats?id=${thread}` : `${SITE.url}/admin/chats`;
  const save = (all: ChatMsg[], human: boolean) =>
    thread
      ? saveThread(thread, all, { email: captured || null, human, source: src }).catch((e: unknown) => {
          console.error("[chat] save:", e);
          return all;
        })
      : Promise.resolve(all);
  const alert = (subject: string, title: string, all: ChatMsg[]) =>
    sendEmail({
      to: ADMIN_EMAIL,
      subject,
      ...(captured ? { replyTo: captured } : {}),
      html: wrapEmail(
        title,
        `<table style="width:100%;border-collapse:collapse;">${kv("Visitor email", captured || "not given yet")}${kv("Came from", src)}</table>
        <p style="margin:18px 0;"><a href="${adminLink}" style="background:#c1121f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Answer in the chat →</a></p>
        <div style="margin-top:16px;">${transcriptHtml(all)}</div>
        <p style="margin-top:20px;color:#64748b;">Your answer from the admin appears in the visitor's chat at once${captured ? "; replying to this email reaches them by email" : ""}.</p>`
      ),
    }).catch((e: unknown) => console.error("[chat] alert:", e));

  // 24.11.2026 (owner: "să fiu anunțat rapid, pe email"): the first message of
  // every chat reaches the owner at once.
  if (!stored && messages.filter((m) => m.role === "user").length === 1) {
    void alert(`[Chat] Someone is chatting NOW: "${last.slice(0, 60)}"`, "A visitor just wrote in the chat", messages);
  }

  // 24.11.2026 (owner: "să vorbească și cu noi"): a real person answers. From
  // the moment the visitor asks, the AI stays quiet in this chat; every message
  // reaches the owner, who answers from /admin/chats (it shows up in the chat).
  if (parsed.data.human || stored?.human) {
    const reply = parsed.data.human
      ? `Got it! A real person from our team will answer you right here in the chat in a moment.${captured ? "" : " If you leave your email, we can also write to you there."}`
      : null;
    const all: ChatMsg[] = reply ? [...messages, { role: "assistant", content: reply }] : messages;
    const savedAll = await save(all, true);
    await alert(
      parsed.data.human ? `[Chat] WANTS A REAL PERSON${captured ? ` — ${captured}` : ""}` : `[Chat] New message${captured ? ` from ${captured}` : ""}: "${last.slice(0, 60)}"`,
      parsed.data.human ? "A visitor wants to talk with a real person" : "New message in a chat you are handling",
      savedAll
    );
    return NextResponse.json({ ok: true, reply, captured: captured || null, leadCaptured: Boolean(note) });
  }

  const convo = messages.slice(-30).map((m, i, arr) =>
    i === arr.length - 1 ? { role: m.role, content: m.content + note } : { role: m.role, content: m.content }
  );
  while (convo.length && convo[0].role !== "user") convo.shift();
  let reply: string;
  try {
    reply = claudeKey
      ? await replyWithClaude(claudeKey, convo)
      : await replyWithOpenAI(openaiKey!, convo);
  } catch (err) {
    console.error("[chat]", err);
    return NextResponse.json(
      { ok: false, error: `Sorry, the chat hiccuped. Email us at ${SITE.email}.` },
      { status: 502 }
    );
  }
  if (!reply) reply = `Thanks! The team will get back to you by email — or write to ${SITE.email}.`;

  // Every reply after the visitor has left an email updates the owner, so they
  // see the whole conversation and can answer in person.
  if (captured) {
    const all = [...messages, { role: "assistant" as const, content: reply }];
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Chat] ${captured}`,
      replyTo: captured,
      html: wrapEmail(
        "New chat conversation",
        `<table style="width:100%;border-collapse:collapse;">${kv("Visitor email", captured)}${kv("Came from", sourceLabel(sourceFromRequest(req)))}${kv(
          "Newspaper list",
          "sent automatically"
        )}</table>
        <div style="margin-top:16px;">${transcriptHtml(all)}</div>
        <p style="margin-top:20px;color:#64748b;">Reply to this email to answer the visitor directly.</p>`
      ),
    });
  }

  await save([...messages, { role: "assistant", content: reply }], false);
  return NextResponse.json({ ok: true, reply, captured: captured || null, leadCaptured: Boolean(note) });
}

/** The visitor's chat asks for the server copy, to show the team's answers. */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("thread") || "";
  const t = await getThread(id).catch(() => null);
  return NextResponse.json({ ok: true, messages: t?.messages || [], human: t?.human || false });
}
