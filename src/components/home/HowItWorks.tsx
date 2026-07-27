import { PackageOpen, FileText, Send, FileCheck2 } from "lucide-react";

const STEPS = [
  {
    icon: PackageOpen,
    title: "Pick a package",
    description:
      "Local, Regional, National or a monthly subscription. Choose based on your goal.",
  },
  {
    icon: FileText,
    title: "Send your article",
    description:
      "Title, text, (optional) images. We accept ready-to-publish copy or ideas we write up for you.",
  },
  {
    icon: Send,
    title: "We publish on 50 newspapers",
    description:
      "Within 24h we publish across our network + automatically distribute on 37 Facebook pages.",
  },
  {
    icon: FileCheck2,
    title: "You get a PDF report",
    description:
      "Complete report with the URLs and screenshots of every publication. Permanently online.",
  },
];

export function HowItWorks() {
  return (
    <section className="section bg-white">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">As simple as 1-2-3-4</p>
          <h2 className="h2 mt-2">How it works</h2>
          <p className="lead mt-4">
            Simple process, big results. In under 24h you&apos;re on the front page of newspapers
            across all 50 states.
          </p>
        </div>

        <div className="relative mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div
            aria-hidden="true"
            className="absolute left-8 right-8 top-10 hidden h-px bg-gradient-to-r from-brand-gold via-brand-red to-brand-gold lg:block"
          />
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white ring-4 ring-brand-red/20 shadow-lg">
                <step.icon className="h-8 w-8 text-brand-red" />
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-6 font-serif text-xl font-semibold text-brand-navy">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
