import { redirect } from "next/navigation";
import { verifyFbLeadToken } from "@/lib/fb-lead-token";
import { STANDARD_PACKAGES } from "@/data/packages";
import { REGION_COUNTS, TOTAL_NEWSPAPERS } from "@/data/newspapers";
import { formatPrice } from "@/lib/utils";
import { OfferActions } from "./OfferActions";
import { CheckCircle, Newspaper, TrendingUp, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const REGIONS = [
  { name: "Northeast", count: REGION_COUNTS.Northeast },
  { name: "Midwest", count: REGION_COUNTS.Midwest },
  { name: "South", count: REGION_COUNTS.South },
  { name: "West", count: REGION_COUNTS.West },
];

interface Props {
  params: { token: string };
}

export default async function OfferPage({ params }: Props) {
  const lead = verifyFbLeadToken(params.token);
  if (!lead) redirect("/offer-fb");

  const firstName = lead.name.trim().split(/\s+/)[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F5F0] to-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
            Personalized offer for {lead.name}
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold text-brand-navy md:text-4xl">
            Hi {firstName}! Here&apos;s how you get into{" "}
            <span className="text-brand-red">{TOTAL_NEWSPAPERS} newspapers</span>
          </h1>
          <p className="mt-3 text-slate-600">
            Pick the right package, send us your material — we publish within 24h.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {STANDARD_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl border-2 bg-white p-6 ${
                pkg.featured ? "border-brand-red shadow-xl" : "border-slate-200 shadow"
              }`}
            >
              {pkg.badge && (
                <span className="mb-3 inline-block rounded-full bg-brand-red px-3 py-1 text-xs font-semibold text-white">
                  {pkg.badge}
                </span>
              )}
              <h3 className="font-serif text-xl font-bold text-brand-navy">{pkg.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{pkg.tagline}</p>
              <p className="mt-4 text-3xl font-bold text-brand-red">
                ${formatPrice(pkg.price)}
              </p>
              <p className="mt-1 text-sm text-slate-600">{pkg.reach}</p>
              <ul className="mt-4 space-y-2">
                {pkg.highlights.slice(0, 4).map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-bold text-brand-navy">
            <Newspaper className="h-5 w-5 text-brand-red" />
            Our network — {TOTAL_NEWSPAPERS} newspapers
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {REGIONS.map((r) => (
              <div key={r.name} className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-brand-red">{r.count}</p>
                <p className="mt-0.5 text-xs text-slate-600">{r.name}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            The full list is sent after confirmation. Every newspaper runs on its own domain,
            indexed by Google.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-3 gap-4 text-center">
          <div>
            <TrendingUp className="mx-auto mb-1 h-6 w-6 text-brand-red" />
            <p className="text-sm font-semibold text-brand-navy">Nationwide reach</p>
            <p className="text-xs text-slate-500">one newspaper per state</p>
          </div>
          <div>
            <Clock className="mx-auto mb-1 h-6 w-6 text-brand-red" />
            <p className="text-sm font-semibold text-brand-navy">Published in 24h</p>
            <p className="text-xs text-slate-500">PDF report included</p>
          </div>
          <div>
            <Newspaper className="mx-auto mb-1 h-6 w-6 text-brand-red" />
            <p className="text-sm font-semibold text-brand-navy">2 years live</p>
            <p className="text-xs text-slate-500">aged, indexed domains</p>
          </div>
        </div>

        <OfferActions token={params.token} firstName={firstName} />
      </div>
    </div>
  );
}
