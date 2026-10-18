"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { trackPixelEvent } from "@/components/analytics/MetaPixel";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi! Ask me anything about publishing in our 50 newspapers — prices, timing, how it works. Want the full newspaper list? Just leave your email.",
};

/** Site chat, answered by AI; conversations with an email reach the owner. */
export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!pathname || pathname.startsWith("/admin")) return null;

  async function send() {
    const text = input.trim();
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
        body: JSON.stringify({ messages: next.slice(1), captured: captured || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      if (data.captured) setCaptured(data.captured);
      if (data.leadCaptured) trackPixelEvent("Lead", { content_name: "chat" });
      setMessages([...next, { role: "assistant", content: data.reply }]);
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
              <p className="text-xs text-white/70">Usually answers instantly</p>
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
                    : "bg-white text-slate-800 shadow-sm"
                }`}
              >
                {m.content}
              </div>
            ))}
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
              placeholder="Type your question…"
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
      <button
        type="button"
        aria-label={open ? "Close chat" : "Open chat"}
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#c1121f] text-white shadow-xl transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
