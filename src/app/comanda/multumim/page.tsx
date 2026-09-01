import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStripe } from "@/lib/stripe";
import { PurchaseTracker } from "./PurchaseTracker";

export const metadata: Metadata = {
  title: "Mulțumim — plată primită",
  robots: { index: false, follow: false },
};

// Suma reala vine din Stripe, nu din URL — altfel oricine poate falsifica
// valoarea conversiei modificand query string-ul.
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { session_id?: string };
}

async function getPurchase(sessionId: string | undefined) {
  if (!sessionId) return null;
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return null;
    return {
      transactionId: session.id,
      value: (session.amount_total || 0) / 100,
      currency: (session.currency || "ron").toUpperCase(),
    };
  } catch (err) {
    console.error("[multumim] Stripe session retrieve failed:", err);
    return null;
  }
}

export default async function MultumimPage({ searchParams }: PageProps) {
  const purchase = await getPurchase(searchParams?.session_id);

  return (
    <section className="bg-white">
      {purchase && (
        <PurchaseTracker
          transactionId={purchase.transactionId}
          value={purchase.value}
          currency={purchase.currency}
        />
      )}
      <div className="container py-24 text-center">
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="h1 mt-6">Mulțumim — plata a fost primită!</h1>
        <p className="lead mt-4 mx-auto max-w-xl text-slate-600">
          Confirmarea a fost trimisă pe email-ul tău. Un membru al echipei te va
          contacta în maximum 2 ore (în timpul programului) cu detaliile de
          publicare.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="default" size="lg" asChild>
            <Link href="/">Înapoi acasă</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
