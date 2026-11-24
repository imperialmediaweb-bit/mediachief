import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { addTeamReply, getThread, listThreads, markSeen } from "@/lib/chat-store";
import { sendEmail, wrapEmail } from "@/lib/email";
import { SITE } from "@/data/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 24.11.2026 — the chat inbox: list (GET), one chat (GET ?id=), answer (POST). Owner or colleague. */
export async function GET(req: NextRequest) {
  if (!getSession({ allowTeam: true })) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const t = await getThread(id);
    if (!t) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    await markSeen(id).catch(() => undefined);
    return NextResponse.json({ ok: true, thread: t });
  }
  const threads = await listThreads(150);
  return NextResponse.json({
    ok: true,
    threads: threads.map((t) => {
      const last = t.messages.at(-1);
      return {
        id: t.id,
        email: t.email,
        human: t.human,
        source: t.source,
        updated_at: t.updated_at,
        count: t.messages.filter((m) => m.role === "user").length,
        last: last ? `${last.role === "user" ? "Visitor" : last.team ? "Team" : "AI"}: ${last.content.slice(0, 120)}` : "",
        waiting: last?.role === "user",
      };
    }),
  });
}

const schema = z.object({ id: z.string().min(8).max(64), text: z.string().trim().min(1).max(3000) });

export async function POST(req: NextRequest) {
  const s = getSession({ allowTeam: true });
  if (!s) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Write a message" }, { status: 400 });
  const t = await addTeamReply(parsed.data.id, parsed.data.text);
  if (!t) return NextResponse.json({ ok: false, error: "Chat not found" }, { status: 404 });
  // The visitor may have closed the site: if they left an email, the answer goes there too.
  if (t.email) {
    await sendEmail({
      to: t.email,
      subject: "Media Chief — reply to your question",
      html: wrapEmail(
        "Reply from the Media Chief team",
        `<p style="white-space:pre-wrap;">${parsed.data.text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</p>
        <p style="margin-top:18px;">You can answer by replying to this email, or continue in the chat on <a href="${SITE.url}">${SITE.url.replace(/^https?:\/\//, "")}</a>.</p>`
      ),
    }).catch((e: unknown) => console.error("[admin chats] email:", e));
  }
  return NextResponse.json({ ok: true, thread: t });
}
