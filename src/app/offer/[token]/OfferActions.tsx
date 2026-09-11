"use client";

import { useState } from "react";
import { Rocket, MessageCircle, Clock } from "lucide-react";
import Link from "next/link";

interface Props {
  token: string;
  firstName: string;
}

type View = "main" | "question" | "later" | "sent";

export function OfferActions({ token, firstName }: Props) {
  const [view, setView] = useState<View>("main");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendQuestion() {
    if (!question.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/fb-lead/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, question }),
      });
    } finally {
      setLoading(false);
      setView("sent");
    }
  }

  if (view === "sent") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-3xl">✅</p>
        <h3 className="mt-3 font-serif text-xl font-bold text-brand-navy">
          Your question is on its way, {firstName}!
        </h3>
        <p className="mt-2 text-slate-600">We&apos;ll reply by email within a few hours.</p>
      </div>
    );
  }

  if (view === "later") {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
        <p className="text-3xl">💙</p>
        <h3 className="mt-3 font-serif text-xl font-bold text-brand-navy">
          No problem, {firstName}!
        </h3>
        <p className="mt-2 text-slate-600">
          This page stays active for 90 days. Come back whenever you&apos;re ready.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          We&apos;ll send you a few useful notes by email over the next days.
        </p>
      </div>
    );
  }

  if (view === "question") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
        <h3 className="font-serif text-xl font-bold text-brand-navy">Ask your question</h3>
        <p className="mt-1 text-sm text-slate-500">We reply by email within a few hours.</p>
        <textarea
          className="mt-4 min-h-[120px] w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-brand-red focus:outline-none"
          placeholder="E.g. Can I target only Texas and Florida? Do you write the article? Can I pay by invoice?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={sendQuestion}
            disabled={loading || !question.trim()}
            className="flex-1 rounded-xl bg-brand-red py-3 text-sm font-semibold text-white transition hover:bg-brand-red/90 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send question"}
          </button>
          <button
            onClick={() => setView("main")}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="mb-6 text-center font-serif text-xl font-bold text-brand-navy">
        What&apos;s next?
      </h2>

      <Link
        href="/order?package=national"
        className="flex items-center gap-4 rounded-2xl border-2 border-brand-red bg-brand-red p-5 text-white shadow-lg transition hover:bg-brand-red/90"
      >
        <Rocket className="h-8 w-8 flex-shrink-0" />
        <div>
          <p className="text-lg font-bold">Publish NOW</p>
          <p className="text-sm text-red-100">
            Fill in your details + the article → we publish within 24h
          </p>
        </div>
      </Link>

      <button
        onClick={() => setView("question")}
        className="flex w-full items-center gap-4 rounded-2xl border-2 border-brand-navy bg-white p-5 text-brand-navy shadow transition hover:bg-slate-50"
      >
        <MessageCircle className="h-8 w-8 flex-shrink-0" />
        <div className="text-left">
          <p className="text-lg font-bold">I have a question</p>
          <p className="text-sm text-slate-500">Write to us and we reply by email</p>
        </div>
      </button>

      <button
        onClick={() => setView("later")}
        className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-slate-600 transition hover:bg-slate-50"
      >
        <Clock className="h-8 w-8 flex-shrink-0" />
        <div className="text-left">
          <p className="font-semibold">I&apos;ll think about it</p>
          <p className="text-sm text-slate-400">This page stays active for 90 days</p>
        </div>
      </button>
    </div>
  );
}
