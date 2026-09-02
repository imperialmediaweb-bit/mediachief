import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackageCard } from "@/components/pricing/PackageCard";
import { STANDARD_PACKAGES } from "@/data/packages";

export function PricingTeaser() {
  return (
    <section className="section bg-white">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Transparent pricing</p>
          <h2 className="h2 mt-2">Packages for every budget</h2>
          <p className="lead mt-4">
            Three standard options + a dedicated casino/iGaming variant + discounted monthly
            subscriptions.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {STANDARD_PACKAGES.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/packages">
              View all packages (Casino + Subscriptions)
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
