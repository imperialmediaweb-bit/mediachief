import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Check your email",
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <section className="container py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="mt-5 font-serif text-2xl font-bold text-brand-navy">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          We sent you a magic link. Open the email and click the link to sign
          in. The link expires in 24 hours.
        </p>
        <p className="mt-4 text-xs text-slate-500">
          Didn&apos;t arrive? Check your spam folder or try again with another
          address.
        </p>
        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link href="/account/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
