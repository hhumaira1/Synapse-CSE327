"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApiClient } from "@/lib/api";
import { useUser } from "@/hooks/useUser";

/**
 * Checks if user is super admin and enforces routing:
 * - Super admins can ONLY access /super-admin routes
 * - Regular users cannot access /super-admin routes
 */
export function SuperAdminRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, isLoading } = useUser();
  const apiClient = useApiClient();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoading || !isSignedIn || checked) {
      return;
    }

    // Skip check for auth and public pages
    if (pathname.startsWith('/auth') || pathname === '/') {
      return;
    }

    const checkSuperAdmin = async () => {
      try {
        const response = await apiClient.get("/super-admin/auth/me");
        const isSuperAdmin = !!response.data;

        if (isSuperAdmin) {
          // Super admin trying to access regular tenant pages - redirect to super admin
          if (!pathname.startsWith('/super-admin')) {
            console.log("🔒 Super admin cannot access tenant pages. Redirecting to /super-admin");
            router.push("/super-admin");
          }
        } else {
          // Regular user trying to access super admin pages - redirect to dashboard
          if (pathname.startsWith('/super-admin')) {
            console.log("🔒 Regular user cannot access super admin. Redirecting to /dashboard");
            router.push("/dashboard");
          }
        }
        
        setChecked(true);
      } catch {
        // Not a super admin - allow normal access to tenant pages
        if (pathname.startsWith('/super-admin')) {
          console.log("🔒 Not authenticated as super admin. Redirecting to /dashboard");
          router.push("/dashboard");
        }
        setChecked(true);
      }
    };

    checkSuperAdmin();
  }, [pathname, isSignedIn, isLoading, checked, apiClient, router]);

  return null;
}
