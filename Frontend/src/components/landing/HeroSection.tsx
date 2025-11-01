"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { ArrowRight, Sparkles, CheckCircle, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative container mx-auto px-6 py-20 md:py-32 overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-linear-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full blur-3xl animate-pulse" />
      <div 
        className="absolute bottom-0 right-1/4 w-80 h-80 bg-linear-to-br from-[#a855f7]/20 to-[#ec4899]/20 rounded-full blur-3xl animate-pulse" 
        style={{animationDelay: '700ms'}} 
      />
      
      <div className="relative mx-auto max-w-4xl text-center">
        <Badge variant="secondary" className="mb-6 bg-linear-to-r from-[#6366f1] to-[#8b5cf6] text-white border-0 px-4 py-1.5 shadow-lg shadow-[#6366f1]/20">
          <Sparkles className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
          AI-Powered CRM
        </Badge>
        
        <h1 className="mb-6 bg-linear-to-br from-[#0f172a] via-[#6366f1] to-[#8b5cf6] bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-white dark:via-[#a78bfa] dark:to-[#c084fc] md:text-7xl lg:text-8xl">
          Transform Your Customer Relationships
        </h1>
        
        <p className="mb-10 text-lg text-[#475569] dark:text-[#cbd5e1] md:text-xl leading-relaxed max-w-3xl mx-auto">
          SynapseCRM helps you manage contacts, close deals faster, and grow your business with intelligent automation and insights. Experience the future of customer relationship management.
        </p>
        
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" className="group w-full bg-linear-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] hover:from-[#5558e3] hover:via-[#7c4fe5] hover:to-[#9848e8] sm:w-auto shadow-2xl shadow-[#6366f1]/50 px-8 py-6 text-lg font-semibold">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </SignUpButton>
          </SignedOut>
          
          <SignedIn>
            <Button 
              size="lg" 
              className="group w-full bg-linear-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] hover:from-[#5558e3] hover:via-[#7c4fe5] hover:to-[#9848e8] sm:w-auto shadow-2xl shadow-[#6366f1]/50 px-8 py-6 text-lg font-semibold"
              onClick={() => window.location.href = '/dashboard'}
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </SignedIn>
          
          <Button size="lg" variant="outline" className="group w-full border-2 border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1] hover:text-white sm:w-auto px-8 py-6 text-lg font-semibold transition-all duration-300">
            <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
            Watch Demo
          </Button>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[#64748b] dark:text-[#94a3b8]">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-[#10b981]" />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-[#10b981]" />
            <span>14-day trial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-[#10b981]" />
            <span>5-min setup</span>
          </div>
        </div>
      </div>
    </section>
  );
}