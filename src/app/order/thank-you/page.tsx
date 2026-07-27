import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Thank you — payment received",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <section className="bg-white">
      <div className="container py-24 text-center">
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="h1 mt-6">Thank you — your payment went through!</h1>
        <p className="lead mt-4 mx-auto max-w-xl text-slate-600">
          A confirmation has been sent to your email. A member of our team will
          contact you within 2 hours (during business hours) with the publishing
          details.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="default" size="lg" asChild>
            <Link href="/">Back home</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
