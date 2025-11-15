"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useApiClient } from '@/lib/api';

/**
 * WorkspaceRedirect component checks if a user has both tenant workspace
 * and portal customer access. If they do, and they're trying to access
 * /dashboard or /portal/dashboard directly (e.g., from sign-in), redirect 
 * them to the workspace selector page ONLY ONCE on initial navigation.
 */
export function WorkspaceRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, isLoading } = useUser();
  const apiClient = useApiClient();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkWorkspaceAccess = async () => {
      // Only run once, when auth is loaded
      if (isLoading || !isSignedIn || checked) return;

      // Only redirect if user is going directly to a dashboard from sign-in
      // Check if this is likely a direct navigation (not from workspace selector)
      const fromWorkspaceSelector = document.referrer.includes('/select-workspace');
      
      if (fromWorkspaceSelector) {
        setChecked(true);
        return;
      }

      // Only check on root dashboard paths
      if (pathname !== '/dashboard' && pathname !== '/portal/dashboard') {
        setChecked(true);
        return;
      }

      try {
        // Check both workspace types in parallel
        const [workspaceCheck, portalCheck] = await Promise.allSettled([
          apiClient.get('/auth/me'),
          apiClient.get('/portal/customers/my-access'),
        ]);

        const hasWorkspace = workspaceCheck.status === 'fulfilled' && workspaceCheck.value?.data;
        const hasPortalAccess = 
          portalCheck.status === 'fulfilled' && 
          portalCheck.value?.data && 
          Array.isArray(portalCheck.value.data) &&
          portalCheck.value.data.length > 0;

        // If user has both, redirect to workspace selector ONLY ONCE
        if (hasWorkspace && hasPortalAccess) {
          router.push('/select-workspace');
        }

        setChecked(true);
      } catch (error) {
        console.error('Failed to check workspace access:', error);
        setChecked(true);
      }
    };

    checkWorkspaceAccess();
  }, [isLoading, isSignedIn, pathname, checked, router, apiClient]);

  // This component doesn't render anything
  return null;
}
