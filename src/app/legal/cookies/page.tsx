import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Information about the cookies used on Media Chief.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" updated="April 23, 2026">
      <h2 className="font-serif text-2xl font-bold text-brand-navy">What cookies are</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They let the
        site remember your actions and preferences.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">Which cookies we use</h2>
      <ul>
        <li>
          <strong>Strictly necessary cookies</strong> — for the forms and the admin session to
          work.
        </li>
        <li>
          <strong>Performance cookies</strong> — optional, to understand how the site is used (we
          do not use aggressive trackers).
        </li>
      </ul>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">How to control them</h2>
      <p>
        You can delete or block cookies from your browser settings. Note that disabling strictly
        necessary cookies may affect how the site works.
      </p>
    </LegalLayout>
  );
}
