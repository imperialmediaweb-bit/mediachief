"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { trackPixelEvent } from "@/components/analytics/MetaPixel";

interface Msg {
  role: "user" | "assistant";
  content: string;
  /** an answer written by a person from /admin/chats */
  team?: boolean;
}

function newThreadId(): string {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi! Ask me anything about publishing in our 50 newspapers — prices, timing, how it works. Want the full newspaper list? Just leave your email. Want to talk with a real person from our team? Tap “Talk with a real person” below.",
};

/** Site chat, answered by AI; conversations with an email reach the owner. */
export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  // 24.11.2026: "Talk to a real person" — the next message goes to the owner, not the AI.
  const [human, setHuman] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [thread, setThread] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  busyRef.current = busy;

  // The thread id stays in the browser; the server keeps the conversation, so a
  // person can answer from the admin and the answer shows up here.
  useEffect(() => {
    try {
      let id = localStorage.getItem("mc-chat-thread");
      if (!id) {
        id = newThreadId();
        localStorage.setItem("mc-chat-thread", id);
      }
      setThread(id);
      if (localStorage.getItem("mc-chat-human") === "1") setHuman(true);
    } catch {
      setThread(newThreadId());
    }
  }, []);

  // While a person is handling the chat, fetch their answers (every 5 s open, 20 s closed).
  useEffect(() => {
    if (!thread || !human) return;
    let stop = false;
    const tick = async () => {
      if (busyRef.current) return;
      try {
        const r = await fetch(`/api/chat?thread=${thread}`, { cache: "no-store" });
        const d = (await r.json()) as { messages?: Msg[] };
        const server = d.messages || [];
        if (stop || !server.length) return;
        setMessages((cur) => {
          if (server.length <= cur.length - 1) return cur;
          const fresh = server.slice(cur.length - 1);
          if (fresh.some((m) => m.team)) {
            setOpen(true);
            setTeaser(false);
          }
          return [GREETING, ...server];
        });
      } catch {}
    };
    const iv = setInterval(tick, open ? 5_000 : 20_000);
    void tick();
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, [thread, human, open]);

  // 24.11.2026: the conversation stays when the visitor comes back, like WhatsApp.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mc-chat") || "null") as { messages?: Msg[]; captured?: string | null } | null;
      if (saved?.messages?.length) setMessages(saved.messages.slice(-60));
      if (saved?.captured) setCaptured(saved.captured);
    } catch {}
  }, []);
  useEffect(() => {
    if (messages.length < 2) return;
    try {
      localStorage.setItem("mc-chat", JSON.stringify({ messages: messages.slice(-60), captured }));
    } catch {}
  }, [messages, captured]);

  // Other parts of the page (offer, order form) open the chat with this event.
  useEffect(() => {
    const openChat = () => {
      setOpen(true);
      setTeaser(false);
    };
    window.addEventListener("mc-open-chat", openChat);
    return () => window.removeEventListener("mc-open-chat", openChat);
  }, []);

  // A small bubble after 15 s, once per visit. The chat itself never opens alone.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("mc-chat-teaser") === "1";
    } catch {}
    if (seen) return;
    const t = setTimeout(() => {
      setTeaser(true);
      try {
        sessionStorage.setItem("mc-chat-teaser", "1");
      } catch {}
    }, 15_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!pathname || pathname.startsWith("/admin")) return null;

  async function send(preset?: string, askHuman?: boolean) {
    const text = (preset ?? input).trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The greeting is ours, not the model's; the API wants the user first.
        body: JSON.stringify({
          messages: next.slice(1).slice(-200),
          captured: captured || undefined,
          human: askHuman || undefined,
          thread: thread || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      if (data.captured) setCaptured(data.captured);
      // From now on a person handles this chat (the server remembers it too).
      if (askHuman) {
        setHuman(true);
        try {
          localStorage.setItem("mc-chat-human", "1");
        } catch {}
      }
      if (data.leadCaptured) trackPixelEvent("Lead", { content_name: "chat" });
      setMessages(data.reply ? [...next, { role: "assistant", content: data.reply }] : next);
    } catch (e) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            e instanceof Error && e.message
              ? e.message
              : "Sorry, something went wrong. Email us at contact@media-chief.com.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 lg:bottom-6 lg:right-6">
      {open && (
        <div className="mb-3 flex h-[min(520px,70vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand-navy px-4 py-3 text-white">
            <div>
              <p className="font-serif text-sm font-bold">Media Chief</p>
              <p className="text-xs text-white/70">{human ? "You're talking with our team" : "Usually answers instantly"}</p>
            </div>
            <button type="button" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[#c1121f] text-white"
                    : m.team
                      ? "border border-emerald-200 bg-emerald-50 text-slate-800 shadow-sm"
                      : "bg-white text-slate-800 shadow-sm"
                }`}
              >
                {m.team && <span className="mb-0.5 block text-[11px] font-semibold text-emerald-700">Media Chief team</span>}
                {m.content}
              </div>
            ))}
            {!busy && !human && messages.at(-1)?.role === "assistant" && (
              <button
                type="button"
                onClick={() => send("I'd like to talk with a real person.", true)}
                className="mx-auto block rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-brand-navy shadow-sm hover:bg-slate-100"
              >
                💬 Talk with a real person
              </button>
            )}
            {busy && (
              <div className="flex w-fit items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> typing…
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            className="flex items-center gap-2 border-t border-slate-200 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1500}
              placeholder={human ? "Your email and question…" : "Type your question…"}
              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-400"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={busy || !input.trim()}
              className="rounded-full bg-[#c1121f] p-2 text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
      {teaser && !open && (
        <div className="mb-3 ml-auto flex w-[min(260px,calc(100vw-2rem))] items-start gap-2 rounded-2xl bg-white p-3 text-sm text-slate-800 shadow-2xl">
          <button
            type="button"
            className="flex-1 text-left"
            onClick={() => {
              setOpen(true);
              setTeaser(false);
            }}
          >
            <strong className="block text-brand-navy">Questions before ordering?</strong>
            Ask me — I reply in seconds, or a real person from our team does.
          </button>
          <button type="button" aria-label="Dismiss" onClick={() => setTeaser(false)} className="text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <button
        type="button"
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => {
          setOpen((o) => !o);
          setTeaser(false);
        }}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#c1121f] text-white shadow-xl transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
