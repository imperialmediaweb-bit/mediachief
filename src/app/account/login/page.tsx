import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  return (
    <section className="container py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="eyebrow text-brand-red">Media Chief account</p>
        <h1 className="font-serif text-3xl font-bold text-brand-navy mt-2">
          Sign in
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          We email you a magic link. Click it and you&apos;re signed in — no
          passwords.
        </p>

        <form
          action={async (formData) => {
            "use server";
            const email = String(formData.get("email") || "").trim();
            if (!email) return;
            await signIn("resend", {
              email,
              redirectTo: "/account",
            });
          }}
          className="mt-8 space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              name="email"
              type="email"
              required
              placeholder="you@company.com"
            />
          </div>
          <Button type="submit" variant="accent" size="lg" className="w-full">
            <Mail className="h-4 w-4" /> Send magic link
          </Button>
        </form>

        <p className="mt-6 text-xs text-slate-500 text-center">
          No account yet? We create one automatically on your first sign-in.{" "}
          <Link href="/packages" className="text-brand-red underline">
            View packages
          </Link>
        </p>
      </div>
    </section>
  );
}
