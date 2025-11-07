"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Sparkles, Menu, X, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserStatus } from "@/hooks/useUserStatus";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const router = useRouter();
  const { isLoaded, userExists } = useUserStatus();

  const handleDashboardClick = async () => {
    setIsCheckingAccess(true);
    
    try {
      // Get Clerk token
      const clerk = (window as { Clerk?: { session?: { getToken: () => Promise<string> } } }).Clerk;
      const token = await clerk?.session?.getToken();
      
      // Check if user has portal access
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/portal/customers/my-access`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const hasPortalAccess = response.ok && (await response.json()).length > 0;

      // Route based on access type
      if (userExists && hasPortalAccess) {
        // Has both - route to workspace selector
        router.push('/select-workspace');
      } else if (userExists) {
        // Only has workspace
        router.push('/dashboard');
      } else if (hasPortalAccess) {
        // Only has portal access
        router.push('/portal/dashboard');
      } else {
        // No access - needs onboarding
        router.push('/onboard');
      }
    } catch (error) {
      console.error('Error checking access:', error);
      // Default to onboarding on error
      router.push('/onboard');
    } finally {
      setIsCheckingAccess(false);
      setIsMenuOpen(false);
    }
  };

  const navigationLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Testimonials" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e5e7eb]/50 bg-white/70 backdrop-blur-xl dark:border-[#1f2937]/50 dark:bg-[#0a0b14]/70 transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#6366f1] to-[#a855f7] shadow-lg shadow-[#6366f1]/30">
            <Sparkles className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-linear-to-br from-[#6366f1] to-[#a855f7] opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
          </div>
          <span className="text-xl font-black bg-linear-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
            Synapse
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navigationLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm font-semibold text-[#1e293b] transition-all hover:text-[#6366f1] dark:text-[#cbd5e1] dark:hover:text-white group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-linear-to-r from-[#6366f1] to-[#a855f7] transition-all group-hover:w-full"></span>
            </a>
          ))}

          {/* Authentication Section */}
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" className="border-[#6366f1]/30 text-[#1e293b] hover:bg-[#6366f1]/10 dark:text-white font-semibold">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="bg-linear-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9848e8] shadow-lg shadow-[#6366f1]/30 font-semibold">
                Get Started
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <Button
              onClick={handleDashboardClick}
              disabled={!isLoaded || isCheckingAccess}
              variant="outline"
              size="sm"
              className="border-[#6366f1]/30 text-[#1e293b] hover:bg-[#6366f1]/10 dark:text-white font-semibold gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              {isCheckingAccess ? 'Loading...' : 'Dashboard'}
            </Button>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonPopoverCard: "shadow-xl border border-gray-200",
                  userButtonPopoverActions: "gap-2",
                }
              }}
            />
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[#1e293b] dark:text-[#cbd5e1]"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="absolute left-0 right-0 top-full bg-white/95 backdrop-blur-xl dark:bg-[#0a0b14]/95 md:hidden border-b border-[#e5e7eb]/50 dark:border-[#1f2937]/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex flex-col space-y-4">
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="py-2 font-semibold text-[#1e293b] dark:text-[#cbd5e1]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}

              {/* Mobile Authentication Section */}
              <SignedOut>
                <div className="flex gap-2 pt-2">
                  <SignInButton mode="modal">
                    <Button variant="outline" className="flex-1 border-[#6366f1]/30 text-[#1e293b] dark:text-white">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button className="flex-1 bg-linear-to-r from-[#6366f1] to-[#a855f7]">
                      Get Started
                    </Button>
                  </SignUpButton>
                </div>
              </SignedOut>

              <SignedIn>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleDashboardClick}
                    disabled={!isLoaded || isCheckingAccess}
                    variant="outline"
                    className="w-full border-[#6366f1]/30 text-[#1e293b] dark:text-white gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {isCheckingAccess ? 'Loading...' : 'Dashboard'}
                  </Button>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">Signed in</span>
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "h-8 w-8",
                          userButtonPopoverCard: "shadow-xl border border-gray-200",
                        }
                      }}
                    />
                  </div>
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}