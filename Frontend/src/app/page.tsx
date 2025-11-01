"use client";

import { Navbar, Footer } from "@/components/layout";
import {
  HeroSection,
  StatsSection,
  FeaturesSection,
  TestimonialsSection,
  PricingSection,
  CTASection
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#fafbff] via-[#f5f7ff] to-[#eff2ff] dark:from-[#0a0b14] dark:via-[#0f1117] dark:to-[#14151f]">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}