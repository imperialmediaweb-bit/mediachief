import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms and conditions for using Media Chief services.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" updated="April 23, 2026">
      <h2 className="font-serif text-2xl font-bold text-brand-navy">1. Scope of the agreement</h2>
      <p>
        Media Chief provides press release distribution services across a network of partner
        newspapers and Facebook pages, according to the package chosen by the client.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">2. Orders and payment</h2>
      <p>
        Orders are placed through the online form. After the order is confirmed, the client
        receives an invoice and pays by card or bank transfer. Publication starts once payment is
        confirmed.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">3. Delivery time</h2>
      <p>
        Media Chief commits to publishing the article on every site in the chosen package within
        24 hours of payment confirmation and receipt of the text.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">4. Prohibited content</h2>
      <p>
        We do not publish content that: breaks U.S. federal or state law, contains defamation,
        incites hatred, promotes illegal substances, or is pornographic. Media Chief reserves the
        right to refuse publication.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">5. Permanence of publication</h2>
      <p>
        Articles remain published on the partner sites indefinitely, provided those sites remain
        active. We do not guarantee the indefinite operation of each individual partner site.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">6. Publication report</h2>
      <p>
        The PDF report includes the URLs and screenshots of the published articles. Facebook
        distribution is automatically included, but Facebook page statistics cannot be collected
        in the report.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">7. Subscriptions</h2>
      <p>
        Monthly subscriptions are invoiced at the start of each month. The client may cancel the
        subscription at least 15 days before the end of the current month by emailing{" "}
        {SITE.email}.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">8. Liability</h2>
      <p>
        Media Chief is not responsible for the editorial content of articles supplied by the
        client. The client warrants that they hold all necessary rights to the text and images
        they submit.
      </p>

      <h2 className="font-serif text-2xl font-bold text-brand-navy">9. Governing law</h2>
      <p>
        This agreement is governed by the laws of the United States and the State of New York.
        Any dispute will be resolved amicably or, failing that, by the competent courts.
      </p>
    </LegalLayout>
  );
}
