import type { Metadata } from "next";
import Link from "next/link";
import {
  Newspaper,
  Globe,
  Facebook,
  FileText,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Star,
  Award,
  CreditCard,
  Layers,
  Link as LinkIcon,
  Image as ImageIcon,
  XCircle,
  Users,
  Check,
} from "lucide-react";
import { PromoOffer } from "./PromoOffer";
import { ClientsStrip } from "@/components/ClientsStrip";
import { NewspaperDirectory } from "@/components/NewspaperDirectory";
import { CoverageMap } from "@/components/CoverageMap";
import { CompanyDetails } from "@/components/CompanyDetails";
import { PROMO_PRICE, PROMO_PRICE_CASINO, STANDARD_PACKAGES, promoDeadlineLabel } from "@/data/packages";
import { TOTAL_NEWSPAPERS, REGION_COUNTS } from "@/data/newspapers";
import { formatPrice } from "@/lib/utils";

/*
  One product: PRESS APPEARANCES. Every newspaper in the network, one price,
  permanent, and you get the list of every link. For businesses that need to
  show someone they were written about — a "Press" page, a funding file, a
  bank, a partner. No SEO promises: a link only counts if Google indexes the
  page it sits on, and Google decides that, not us.

  Figures carry a date and a source. A true number today is a false claim in
  three months, and the page stays online.
*/

const PRICE = `$${formatPrice(PROMO_PRICE)}`;
const LIST_PRICE = `$${formatPrice(STANDARD_PACKAGES.find((p) => p.id === "national")?.price ?? 1500)}`;
const N = TOTAL_NEWSPAPERS;
const deadline = promoDeadlineLabel();

export const metadata: Metadata = {
  title: `Your business in ${N} US newspapers — ${PRICE}`,
  description: `Your article published in ${N} US newspapers for ${PRICE}. Stays up permanently and you get the list of every link, ready for your "In the press" page.`,
  robots: { index: false, follow: false },
};

// Regenerates hourly so the deadline label rolls over on its own.
export const revalidate = 3600;

const INCLUDED = [
  {
    icon: Newspaper,
    title: `${N} publications, one order`,
    description: `One newspaper in every state we cover, across the Northeast, Midwest, South and West. One article, sent once.`,
  },
  {
    icon: Award,
    title: "Stays up permanently",
    description: "It does not expire like a paid ad. Two years from now the article is at the same address and the links still work. Nothing is deleted and you pay nothing extra.",
  },
  {
    icon: Layers,
    title: "Different text on every newspaper",
    description: `Not ${N} identical copies. Each publication gets its own wording and headline, with the same message and contact details. Open two links from the report and compare.`,
  },
  {
    icon: LinkIcon,
    title: `${N} links to your site`,
    description: "Up to 3 links per article to the pages you choose, with the anchor text you choose. Regular, permanent links.",
  },
  {
    icon: FileText,
    title: "The list of every link",
    description: `All ${N} addresses by email, in PDF and Excel. Put them on your site under "In the press" or forward them to partners and clients.`,
  },
  {
    icon: Facebook,
    title: "Shared on the newspapers' Facebook pages",
    description: "The publications post the article on their own Facebook pages at no extra cost. You can opt out at checkout if you only want the website placement.",
  },
  {
    icon: ImageIcon,
    title: "Up to 3 images",
    description: "Send up to 3 images; one becomes the article's featured image. No images? We publish without.",
  },
  {
    icon: Clock,
    title: "Published within 1 business day",
    description: "From payment confirmation to live links takes at most one business day, usually less. Orders placed in the evening or at the weekend go live the next business day.",
  },
  {
    icon: Globe,
    title: "Staggered publishing, not all at once",
    description: "Articles go up one after another through the day, not in the same second — the way any story appears across newsrooms.",
  },
];

const RECOMMENDED_FOR = [
  "Press releases",
  "PR campaigns",
  "Press coverage",
  "Promoting a company or brand",
  "Product and service launches",
  "Events and projects",
  "Building name recognition",
];

const USES = [
  {
    title: "Funding applications, grants and tenders",
    text: `Where "press coverage" is asked for, you have ${N} appearances, each with a link to the article.`,
  },
  {
    title: 'Your "In the press" page',
    text: `${N} appearances to put on your own site. It carries differently from what you write about yourself.`,
  },
  {
    title: "Credibility with banks, investors and partners",
    text: "When someone looks up your company before signing, they find articles in publications, not only your website.",
  },
  {
    title: "Launches, openings, anniversaries, announcements",
    text: "An announcement that stays on record somewhere, not a post that sinks in the feed.",
  },
];

// Order matters: the old version opened with "You pay" — asking for money
// before offering anything, the hardest possible framing for an unknown
// seller from an ad. Same facts, in the order that feels safe.
const STEPS = [
  {
    n: "1",
    title: "You send the article",
    text: "Your text and images — or just the topic, and we write it, included in the price. You pay by card on Stripe's secure page.",
  },
  {
    n: "2",
    title: "We check it and confirm",
    text: "We read the article the same business day and confirm publication by email. If we cannot publish it, you get a full refund.",
  },
  {
    n: "3",
    title: "We publish and you get the list",
    text: `Within one business day of confirmation the article is live on all ${N} newspapers. You receive the list of every link, in PDF and Excel.`,
  },
];

const CONDITIONS = [
  {
    title: "Permanent article on each site",
    detail: "Once published, the article stays online. It is not removed after a period and does not expire.",
  },
  {
    title: "Front page for a day",
    detail: "The article sits on each publication's front page for a day, then moves to its permanent section at the same address.",
  },
  {
    title: "3 images included",
    detail: "Send up to 3 images; you pick the one used as the article's featured image.",
  },
  {
    title: "Facebook sharing — included, optional",
    detail: "The article is shared on the publications' Facebook pages at no extra cost. If you prefer the website placement only, untick it at checkout.",
  },
  {
    title: "Published as an article, not a banner",
    detail: "It appears as an article inside the publication, with your links in the text, not as a display ad.",
  },
  {
    title: "If we miss the deadline, you get your money back",
    detail: "Not published within one business day of confirmation and receipt of your material? Full refund. The risk is ours.",
  },
];

const FAQ = [
  {
    q: `Why ${PRICE} and not ${LIST_PRICE}?`,
    a: `It is an introductory offer for new clients who have not worked with us yet${deadline ? `, valid until ${deadline}` : ""}. The National package normally costs ${LIST_PRICE}. We want you to test the network at minimal risk — if you like the result, you stay.`,
  },
  {
    q: "How do I pay, and do I get a receipt?",
    a: `By card, through Stripe. You get a receipt by email right after payment, and the report with every link once the article is live. ${PRICE} is the final price.`,
  },
  {
    q: "Is it the same article copied onto every newspaper?",
    a: "No. Each newspaper gets a unique version: a different headline, different wording, a different address — the same message, the same contact details and the same links to your site. Open two links from the report and compare. If you need your text identical everywhere (an official statement, legally approved copy), say so at checkout and we publish it unchanged.",
  },
  {
    q: "Are these printed newspapers or websites?",
    a: `Online — ${N} news sites, one per state. The advantage over print: a printed article is read for a day and gone, while yours stays online permanently, at the same address, and can be shown any time.`,
  },
  {
    q: "Are these real newspapers or empty shells?",
    a: `Each one publishes local news for its state every day — several hundred articles a day across the network — and shares them on its own Facebook page. The easiest check is your own: the full list is above; open any newspaper, read what came out today, and look at its Facebook page.`,
  },
  {
    q: "Will it bring visitors to my site?",
    a: "Few, and we tell you that upfront. An advertorial does not bring traffic — not with us, and not with a national outlet charging $5,000. It brings presence: you appear, you stay, you can show it. If what you need is strictly visitors on your site, you need an ad campaign, not this.",
  },
  {
    q: "Do I get backlinks? Will it help my SEO?",
    a: `You get ${N} links to your site from ${N} different news publications — permanent, regular links. What we do not promise is rankings: a link only counts if the page it sits on is indexed, and Google decides that, not us. Anyone who guarantees you a ranking is not telling the truth.`,
  },
  {
    q: "Do the articles show up in Google?",
    a: "We submit every article for indexing on the day it is published, through the search engines' official channels. Whether and when it enters the index is Google's decision, and we promise no rankings. What we guarantee is that the article is published, has its own address, and stays there.",
  },
  {
    q: "Why does casino and betting content cost double?",
    a: `iGaming content carries extra compliance work — state-by-state gambling rules, responsible-gaming notices — and a higher editorial risk for the publications. That is why the rate is $${formatPrice(PROMO_PRICE_CASINO)} instead of ${PRICE}. You tick the declaration at checkout. If a casino article is submitted undeclared, publication stops and the amount is not refunded.`,
  },
  {
    q: "What kind of content do you accept?",
    a: "Legal commercial content: product launches, announcements, advertorials, brand stories. We do not publish articles about the causes or treatment of diseases — including cancer and serious conditions — nor products or therapies presented as an alternative to medical treatment, nor personal attacks. At checkout you tick a declaration that the article is none of these: if it turns out to be false, the order is cancelled, the article is taken down and the amount is not refunded. If we decline for any other reason, you get a full refund within 3 business days.",
  },
  {
    q: "Can I write the article myself?",
    a: "Yes, and that is the recommended option. Send your text, up to 3 images and up to 3 links. If you prefer, we write it from your brief at no extra cost — you read it and can change it before publication.",
  },
  {
    q: "What if the article cannot be published?",
    a: "If we decline it at review for any reason other than a false declaration, you get a full refund within 3 business days. If an already published article has to come down at the request of an authority or a person concerned, we take it down and tell you from which publications.",
  },
  {
    q: "Do the articles stay online permanently?",
    a: "Yes. They are not removed after a period, they do not expire, and you pay nothing to keep them up. The links in the report still work years later.",
  },
];

export default function IntroOfferPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section id="offer" className="bg-brand-navy text-white">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-gold">
              <Star className="h-3 w-3 fill-current" />
              {deadline ? `Limited offer — valid until ${deadline}` : "Limited offer"}
            </span>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight md:text-6xl">
              Your business, in <span className="text-brand-gold">{N} newspapers</span>. {PRICE}.
            </h1>
            <p className="mt-6 text-lg text-white/85 md:text-xl">
              Published within one business day. Stays up permanently. You get the list of all {N}{" "}
              links — ready for your site, under &ldquo;In the press&rdquo;.
            </p>

            <p className="mx-auto mt-4 max-w-2xl">
              <a
                href="#newspapers"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-2 text-sm font-semibold text-white/85 transition hover:border-white/50 hover:text-white"
              >
                See the {N} newspapers before you order →
              </a>
            </p>

            <div className="mt-10">
              <PromoOffer />
            </div>
            <p className="mt-4 text-sm text-white/60">Card payment • receipt by email • {PRICE}, final price</p>
          </div>
        </div>
      </section>

      {/* Four things the buyer receives */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container py-12">
          <div className="grid gap-8 text-center md:grid-cols-4">
            <Stat value={`${N}`} label="online newspapers" />
            <Stat value="permanent" label="how long it stays up" />
            <Stat value="PDF + Excel" label="the list of links" />
            <Stat value="1 business day" label="to publication" />
          </div>
        </div>
      </section>

      <ClientsStrip />

      {/* What you get */}
      <section className="section">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">What the offer includes</p>
            <h2 className="h2 mt-2">Everything you get for {PRICE}</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <item.icon className="h-8 w-8 text-brand-red" />
                <h3 className="mt-4 font-serif text-lg font-bold text-brand-navy">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What it is for */}
      <section className="section bg-slate-50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">What it is for</p>
            <h2 className="h2 mt-2">What people buy this for</h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
            {USES.map((u) => (
              <div key={u.title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
                <span>
                  <strong className="text-brand-navy">{u.title}</strong>
                  <span className="mt-1 block text-sm text-slate-600">{u.text}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-4xl rounded-2xl border-2 border-brand-red/20 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 shrink-0 text-brand-red" />
              <h3 className="font-serif text-xl font-bold text-brand-navy">Recommended for</h3>
            </div>
            <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {RECOMMENDED_FOR.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-slate-700">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The newspapers — proof before price */}
      <section id="newspapers" className="section scroll-mt-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Check for yourself</p>
            <h2 className="h2 mt-2">These are real newspapers</h2>
            <p className="mt-4 text-slate-600">
              Each one publishes local news for its state every day: city hall, schools, hospitals,
              sports, events. Your article appears among those stories, and the newspaper shares it
              on its Facebook page like any other.
            </p>
            <p className="mt-3 font-semibold text-brand-navy">
              Don&apos;t take our word for it. The list is below — open any newspaper and read what
              came out today.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-brand-red">
              Where your article goes
            </p>
            <h3 className="mt-2 text-center font-serif text-2xl font-bold text-brand-navy">
              One newspaper in {TOTAL_NEWSPAPERS} states
            </h3>
            <CoverageMap className="mt-8" />
          </div>

          <div className="mt-10">
            <NewspaperDirectory />
          </div>

          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-brand-red">The network, in figures</p>
            <h3 className="mt-2 text-center font-serif text-2xl font-bold text-brand-navy">Publishing daily for two years</h3>
            <div className="mt-6 grid gap-4 text-center sm:grid-cols-4">
              <Figure value={`${N}`} label="news sites, one per state" />
              <Figure value="4" label={`regions: NE ${REGION_COUNTS.Northeast} · MW ${REGION_COUNTS.Midwest} · S ${REGION_COUNTS.South} · W ${REGION_COUNTS.West}`} />
              <Figure value="500–750" label="new articles a day across the network" />
              <Figure value="37 / 30" label="Domain Authority / Page Authority (Moz)" />
            </div>
            <p className="mt-5 text-center text-sm text-slate-600">
              Figures as of September 2026. The Moz score is public — you can check it yourself for
              any domain in the list.
            </p>
          </div>

          <div className="mt-10 text-center">
            <a
              href="#offer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-8 py-4 text-lg font-bold text-white shadow-xl shadow-brand-red/20 transition hover:bg-brand-red/90 sm:w-auto"
            >
              <CreditCard className="h-5 w-5" />
              Order now — {PRICE}
            </a>
            <p className="mt-3 text-sm text-slate-500">
              Published in 1 business day · different text on every newspaper · receipt by email
            </p>
          </div>
        </div>
      </section>

      {/* Why it is worth it */}
      <section className="section bg-slate-50">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-2xl border-2 border-brand-red/20 bg-white p-8 md:p-12">
            <p className="eyebrow">Why it is worth it</p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-brand-navy md:text-3xl">
              Why {PRICE} and not $5,000
            </h2>
            <div className="mt-4 space-y-3 text-slate-600">
              <p>
                A sponsored article on one large national outlet runs $3,000 to $8,000. A handful of
                people come through.
              </p>
              <p>
                Not because the outlet is weak — because an advertorial does not bring traffic,
                anywhere. Not there, not here, not with anyone.{" "}
                <strong className="text-brand-navy">It brings presence: you appear, you stay, you can show it.</strong>{" "}
                The difference is what you pay for that.
              </p>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2 pr-4 font-semibold text-slate-500"></th>
                    <th className="py-2 pr-4 font-semibold text-slate-600">One national outlet</th>
                    <th className="py-2 font-semibold text-brand-navy">The Express network</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {[
                    ["Price", "$3,000 – $8,000", PRICE],
                    ["Publications", "1", `${N}`],
                    ["How long it stays", "permanent", "permanent"],
                    ["Traffic", "little", "little"],
                  ].map(([k, a, b]) => (
                    <tr key={k} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 pr-4 font-medium text-slate-500">{k}</td>
                      <td className="py-2.5 pr-4">{a}</td>
                      <td className="py-2.5 font-semibold text-brand-navy">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-slate-600">
              We say it plainly: they and we deliver the same thing. With us you appear in {N} places,
              for a fraction of the money.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "No subscription, no follow-up obligations",
                `No hidden costs — ${PRICE} is the final price`,
                "Receipt by email from Stripe",
                `Different text on every newspaper, not ${N} copies`,
              ].map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
                  <span className="text-slate-700">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What we do NOT promise — sells hardest precisely because it does not sell */}
      <section id="details" className="section scroll-mt-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="eyebrow">No surprises</p>
              <h2 className="h2 mt-2">What we do NOT promise</h2>
              <p className="mt-4 text-slate-600">We would rather you know what you are buying before, not after.</p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-brand-red/20 bg-white p-6">
                <XCircle className="h-7 w-7 text-brand-red" />
                <h3 className="mt-3 font-serif text-lg font-bold text-brand-navy">We do not promise page one on Google</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  We submit the articles for indexing the day they go live, but whether and when
                  they appear in search is Google&apos;s call. Anyone who guarantees you rankings is
                  not telling the truth.
                </p>
              </div>
              <div className="rounded-2xl border-2 border-brand-red/20 bg-white p-6">
                <XCircle className="h-7 w-7 text-brand-red" />
                <h3 className="mt-3 font-serif text-lg font-bold text-brand-navy">We do not promise thousands of visitors</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  A press article brings recognition, not traffic — the same is true at outlets
                  charging $5,000. If what you need is visitors on your site, you need an ad
                  campaign, and we tell you so from the start.
                </p>
              </div>
              <div className="rounded-2xl border-2 border-brand-red/20 bg-white p-6 md:col-span-2">
                <XCircle className="h-7 w-7 text-brand-red" />
                <h3 className="mt-3 font-serif text-lg font-bold text-brand-navy">We do not promise clients, sales or leads</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  We commit to publishing the article on the {N} publications and to giving you the
                  list of every link — that is it. What you do with the appearances, how good the
                  text is and how sought-after your product is do not depend on us. We promise no
                  Google rankings, no growth in any SEO metric, no particular number of Facebook
                  impressions. Every limit is spelled out in the{" "}
                  <Link href="/legal/terms" className="font-semibold text-brand-red hover:underline">
                    terms and conditions
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-brand-navy p-6 text-center md:p-8">
              <p className="font-serif text-xl font-bold text-white">What we do promise:</p>
              <p className="mx-auto mt-2 max-w-lg text-sm text-white/75">
                {N} publications, within one business day. They stay up permanently. You get the list
                of every link. If we miss the deadline, you get your money back.
              </p>
              <a
                href="#offer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-8 py-4 text-lg font-bold text-white shadow-xl shadow-brand-red/20 transition hover:bg-brand-red/90 sm:w-auto"
              >
                <CreditCard className="h-5 w-5" />
                Order now — {PRICE}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section bg-slate-50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="h2 mt-2">Three steps to {N} publications</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-slate-200 bg-white p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-red font-serif text-xl font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-5 font-serif text-xl font-bold text-brand-navy">{s.title}</h3>
                <p className="mt-3 text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Publishing conditions */}
      <section className="section">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Publishing conditions</p>
            <h2 className="h2 mt-2">Exactly what happens to your article</h2>
          </div>
          <ul className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
            {CONDITIONS.map((c) => (
              <li key={c.title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
                <span>
                  <strong className="text-brand-navy">{c.title}</strong>
                  <span className="mt-1 block text-sm text-slate-600">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section scroll-mt-20 bg-slate-50">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="h2 text-center">Frequently asked questions</h2>
            <div className="mt-10 space-y-4">
              {FAQ.map((f) => (
                <details key={f.q} className="group rounded-xl border border-slate-200 bg-white p-5">
                  <summary className="cursor-pointer list-none font-semibold text-brand-navy marker:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {f.q}
                      <span className="text-xl text-brand-red transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-navy text-white">
        <div className="container py-16 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-brand-gold" />
          <h2 className="h2 mt-5 text-white">
            {N} newspapers. One business day. {PRICE}.
          </h2>
          <p className="lead mx-auto mt-4 max-w-2xl text-white/85">
            Limited offer for new clients. Order now, send the article, and within one business day
            you have the list of all {N} links.
          </p>
          <div className="mt-8">
            <PromoOffer showPrice={false} />
          </div>
          <div className="mx-auto mt-10 max-w-md text-left">
            <CompanyDetails dark />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-serif text-4xl font-bold text-brand-red">{value}</p>
      <p className="mt-1 text-sm uppercase tracking-wider text-brand-navy">{label}</p>
    </div>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="font-serif text-2xl font-bold text-brand-navy">{value}</div>
      <div className="mt-1 text-xs text-slate-600">{label}</div>
    </div>
  );
}
