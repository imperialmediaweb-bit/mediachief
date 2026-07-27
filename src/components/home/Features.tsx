import {
  Newspaper,
  Facebook,
  Clock,
  FileText,
  Link2,
  Headphones,
} from "lucide-react";

const FEATURES = [
  {
    icon: Newspaper,
    title: "50 partner newspapers",
    description: "One newspaper in every U.S. state — coverage across all 4 regions.",
  },
  {
    icon: Facebook,
    title: "37 Facebook pages",
    description: "Automatic distribution on the associated pages. Included in every package.",
  },
  {
    icon: Clock,
    title: "24h delivery",
    description: "Fast publication on every site. The links reach you right away.",
  },
  {
    icon: FileText,
    title: "Complete PDF report",
    description: "URLs + screenshots for every published article.",
  },
  {
    icon: Link2,
    title: "Permanent links",
    description: "Articles stay online indefinitely. On-page SEO + earned backlinks.",
  },
  {
    icon: Headphones,
    title: "Dedicated support",
    description: "A PR team you can talk to directly by email, phone or WhatsApp.",
  },
];

export function Features() {
  return (
    <section className="section bg-newsprint">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Why Media Chief</p>
          <h2 className="h2 mt-2">Everything you get, in every package</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-red/30 hover:shadow-xl"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red transition-colors group-hover:bg-brand-red group-hover:text-white">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-lg font-semibold text-brand-navy">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
