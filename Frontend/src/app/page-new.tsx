"use client"

import { useState } from "react";
import { useUser, useAuth } from "@/hooks/useUser";
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
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const [apiState, setApiState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; payload: unknown }
  >({ status: "idle" });

  const handleTestApi = async () => {
    setApiState({ status: "loading" });
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("No token returned. Please sign in again.");
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
      const response = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Request failed (${response.status}): ${errorBody}`);
      }

      const payload = await response.json();
      setApiState({ status: "success", payload });
    } catch (error) {
      setApiState({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

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