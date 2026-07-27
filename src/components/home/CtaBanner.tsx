import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderModal } from "@/components/forms/OrderModal";

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-cta-gradient py-20 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="mx-auto h-10 w-10 text-brand-gold" />
          <h2 className="mt-6 font-serif text-4xl font-bold leading-tight sm:text-5xl">
            Ready to publish your article?
          </h2>
          <p className="mt-6 text-lg text-white/90">
            Pick a package, send us your article, and within 24h you&apos;re in 50 newspapers.
            You don&apos;t pay anything until we confirm publishing capacity.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button variant="gold" size="lg" asChild>
              <Link href="/packages">
                View packages <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <OrderModal
              trigger={
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-brand-navy"
                >
                  Order now
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
