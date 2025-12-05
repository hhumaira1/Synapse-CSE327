"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { superAdminApi } from "@/lib/super-admin/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
  { name: "Tenants", href: "/super-admin/tenants", icon: Building2 },
  { name: "Audit Logs", href: "/super-admin/audit-logs", icon: FileText },
];

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [superAdmin, setSuperAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  async function checkSuperAdminAccess() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No user found, redirecting to login");
        router.push("/login");
        return;
      }

      console.log("✅ User authenticated:", user.email);
      setUser(user);

      // Check if user is super admin
      try {
        const superAdminData = await superAdminApi.getMe();
        console.log("✅ Super admin verified:", superAdminData);
        setSuperAdmin(superAdminData);
        setLoading(false);
      } catch (apiError: any) {
        console.error("❌ Super admin check failed:", apiError);
        console.error("User ID:", user.id);
        console.error("User email:", user.email);
        
        // Give more specific error feedback
        if (apiError.message?.includes('Not authorized')) {
          alert(`Super admin access denied for ${user.email}. Please contact support.`);
        }
        
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("❌ Authentication error:", error);
      router.push("/login");
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 animate-pulse text-purple-600" />
          <p className="mt-4 text-sm text-gray-600">Verifying super admin access...</p>
        </div>
      </div>
    );
  }

  if (!superAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 shadow-2xl">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-purple-700/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Super Admin</h1>
              <p className="text-xs text-purple-300">System Control</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-white shadow-lg shadow-purple-900/50 border border-white/20"
                      : "text-purple-200 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-purple-700/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">
                  <Avatar className="h-9 w-9 border-2 border-purple-400">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-semibold">
                      {superAdmin?.firstName?.[0] || superAdmin?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white">
                      {superAdmin?.firstName || "Admin"}
                    </p>
                    <p className="text-xs text-purple-300 truncate">
                      {superAdmin?.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Super Admin</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 shadow-2xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-6 border-b border-purple-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-pink-500">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">Super Admin</h1>
                    <p className="text-xs text-purple-300">System Control</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-purple-300 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-white/10 text-white shadow-lg"
                          : "text-purple-200 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-lg border-b border-purple-100 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            <span className="font-bold text-purple-900">Super Admin</span>
          </div>
          <div className="w-6" />
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
