"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser, useAuth } from "@/hooks/useUser";
import { Sparkles, Menu, X, LayoutDashboard, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserStatus } from "@/hooks/useUserStatus";
import Link from "next/link";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const { isLoaded } = useUserStatus();
  const { user, isSignedIn } = useUser();
  const { signOut } = useAuth();

  const handleDashboardClick = () => {
    // Simply navigate - the dashboard layout will handle routing based on access
    router.push('/dashboard');
    setIsMenuOpen(false);
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
          {!isSignedIn ? (
            <>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm" className="border-[#6366f1]/30 text-[#1e293b] hover:bg-[#6366f1]/10 dark:text-white font-semibold">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-linear-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9848e8] shadow-lg shadow-[#6366f1]/30 font-semibold">
                  Get Started
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button
                onClick={handleDashboardClick}
                disabled={!isLoaded}
                variant="outline"
                size="sm"
                className="border-[#6366f1]/30 text-[#1e293b] hover:bg-[#6366f1]/10 dark:text-white font-semibold gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>

              {/* Custom User Button */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-8 w-8 rounded-full overflow-hidden bg-linear-to-r from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white font-semibold text-sm hover:shadow-lg transition-shadow"
                >
                  {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                    <img
                      src={user.user_metadata.avatar_url || user.user_metadata.picture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (user?.user_metadata?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-2">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.user_metadata?.firstName && user?.user_metadata?.lastName
                            ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
                            : user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          router.push('/profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <User className="h-4 w-4" />
                        View Profile
                      </button>
                      <button
                        onClick={async () => {
                          await signOut();
                          router.push('/');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
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
              {!isSignedIn ? (
                <div className="flex gap-2 pt-2">
                  <Link href="/auth/signin" className="flex-1">
                    <Button variant="outline" className="w-full border-[#6366f1]/30 text-[#1e293b] dark:text-white">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="flex-1">
                    <Button className="w-full bg-linear-to-r from-[#6366f1] to-[#a855f7]">
                      Get Started
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={handleDashboardClick}
                    disabled={!isLoaded}
                    variant="outline"
                    className="w-full border-[#6366f1]/30 text-[#1e293b] dark:text-white gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                  <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-linear-to-r from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white font-semibold text-sm">
                        {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                          <img
                            src={user.user_metadata.avatar_url || user.user_metadata.picture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (user?.user_metadata?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.user_metadata?.firstName && user?.user_metadata?.lastName
                            ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
                            : user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">Signed in</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await signOut();
                        router.push('/');
                        setIsMenuOpen(false);
                      }}
                      className="text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}