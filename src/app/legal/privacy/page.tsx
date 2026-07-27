import type { Metadata } from "next";
import { SITE } from "@/data/site";
import { LegalLayout } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we collect, use and protect your personal data.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="April 23, 2026">
      <p>
        Media Chief respects the privacy of your personal data and processes it in accordance
        with applicable U.S. privacy laws, including the California Consumer Privacy Act (CCPA)
        where it applies.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">Data controller</h2>
      <p>
        Media Chief (&ldquo;we&rdquo;), based in {SITE.address}, email{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">What data we collect</h2>
      <ul>
        <li>First and last name</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Company name (optional)</li>
        <li>The content of messages sent through the forms on this site</li>
      </ul>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">Why we collect it</h2>
      <ul>
        <li>Processing orders</li>
        <li>Replying to contact messages</li>
        <li>Sending the newspaper list on request (lead magnet)</li>
        <li>Invoicing and accounting records</li>
        <li>Legal obligations</li>
      </ul>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">How long we keep it</h2>
      <p>
        Data is kept for as long as necessary to fulfill the purposes above, plus the legally
        required retention period for accounting records.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">Your rights</h2>
      <ul>
        <li>The right to know what data we hold about you</li>
        <li>The right to request a copy of your data</li>
        <li>The right to correct inaccurate data</li>
        <li>The right to request deletion of your data</li>
        <li>The right to opt out of the sale or sharing of your data (we do neither)</li>
        <li>The right not to be discriminated against for exercising these rights</li>
      </ul>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">Contact</h2>
      <p>
        To exercise any of the rights above, write to us at{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. We respond within 30 days.
      </p>
    </LegalLayout>
  );
}
