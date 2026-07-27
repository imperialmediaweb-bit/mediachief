import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How fast is my article published?",
    a: "Within 24h of payment confirmation and receiving your text. Publication usually happens the same day, links are delivered by email with a partial report, followed by the complete PDF report.",
  },
  {
    q: "Can I send a ready-written article, or do you write it?",
    a: "Both. You can send finished copy (we publish it as-is), or just give us the key points and we write a professional, SEO-optimized article ready for the press.",
  },
  {
    q: "Can I choose which newspapers I appear in?",
    a: "For the Local package, yes — you pick the state newspaper you want from a list. For Regional you choose the region (Northeast / Midwest / South / West). For National 50, your article appears in all 50 partner newspapers — one in every state.",
  },
  {
    q: "How long does the article stay online?",
    a: "Permanently. Articles remain online on the partner sites for as long as those sites operate — typically several years at minimum.",
  },
  {
    q: "Why are the casino packages more expensive?",
    a: "Publishing iGaming/betting/casino content involves extra legal responsibility, compliance checks and editor acceptance. The price reflects that additional effort.",
  },
  {
    q: "Can I see the full list of the 50 newspapers?",
    a: "Yes — we send you the full list as a PDF by email, free. Fill in the form on the packages page and you'll receive it within 2 minutes.",
  },
];

export function FAQ() {
  return (
    <section className="section bg-white">
      <div className="container max-w-3xl">
        <div className="text-center">
          <p className="eyebrow">Frequently asked questions</p>
          <h2 className="h2 mt-2">Quick answers</h2>
        </div>
        <div className="mt-10">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
