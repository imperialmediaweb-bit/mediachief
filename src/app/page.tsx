import { Hero } from "@/components/home/Hero";
import { CoverageBanner } from "@/components/home/CoverageBanner";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Features } from "@/components/home/Features";
import { Stats } from "@/components/home/Stats";
import { PricingTeaser } from "@/components/home/PricingTeaser";
import { FAQ } from "@/components/home/FAQ";
import { CtaBanner } from "@/components/home/CtaBanner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CoverageBanner />
      <HowItWorks />
      <Features />
      <Stats />
      <PricingTeaser />
      <FAQ />
      <CtaBanner />
    </>
  );
}
