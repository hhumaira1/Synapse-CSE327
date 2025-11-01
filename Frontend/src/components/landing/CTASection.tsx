"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { ArrowRight, CheckCircle } from "lucide-react";

export function CTASection() {
  return (
    <section className="container mx-auto px-6 py-24">
      <Card className="relative overflow-hidden border-none bg-linear-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] shadow-2xl shadow-[#6366f1]/30">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <CardContent className="relative p-12 text-center">
          <h2 className="mb-4 text-4xl font-black text-white md:text-5xl">
            Ready to transform your sales process?
          </h2>
          <p className="mb-8 text-lg text-white/90 max-w-2xl mx-auto">
            Join thousands of teams already using SynapseCRM to close more deals and grow faster.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-white text-[#6366f1] hover:bg-white/90 font-semibold px-8 py-6 shadow-xl">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button 
                size="lg" 
                className="bg-white text-[#6366f1] hover:bg-white/90 font-semibold px-8 py-6 shadow-xl"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SignedIn>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6">
              Schedule a Demo
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Full features
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              14-day trial
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}