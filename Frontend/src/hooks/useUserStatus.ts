'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import { useApiClient } from '@/lib/api';

export interface UserStatus {
  isLoaded: boolean;
  isSignedIn: boolean;
  needsOnboarding: boolean;
  userExists: boolean;
  user: Record<string, unknown> | null;
  error: string | null;
}

export function useUserStatus(): UserStatus {
  const { user: authUser, isLoading: authLoading, isSignedIn } = useUser();
  const authLoaded = !authLoading;
  const apiClient = useApiClient();

  const { 
    data: userCheck, 
    isLoading: isCheckingUser,
    error: userError 
  } = useQuery<{
    exists: boolean;
    user: Record<string, unknown> | null;
    needsOnboarding: boolean;
  }>({
    queryKey: ['user-status'],
    queryFn: async () => {
      try {
        console.log('useUserStatus - Checking user status...');
        const response = await apiClient.get('/auth/me');
        console.log('useUserStatus - Full response:', response.data);
        
        // Extract dbUser from response (backend returns { supabaseUser, dbUser })
        const dbUser = response.data.dbUser || response.data;
        console.log('useUserStatus - Extracted dbUser:', dbUser);
        
        return { 
          exists: true, 
          user: dbUser, // Return only dbUser which has role, tenantId, etc.
          needsOnboarding: false 
        };
      } catch (error: unknown) {
        const apiError = error as { response?: { status?: number; data?: unknown } };
        console.log('useUserStatus - User check failed:', apiError.response?.status, apiError.response?.data);
        
        // If user doesn't exist in database (404 or similar), they need onboarding
        if (apiError.response?.status === 400 || apiError.response?.status === 404) {
          console.log('useUserStatus - User needs onboarding');
          return { 
            exists: false, 
            user: null,
            needsOnboarding: true 
          };
        }
        
        // For other errors, throw to trigger error state
        console.error('useUserStatus - Unexpected error:', error);
        throw error;
      }
    },
    enabled: authLoaded && isSignedIn, // Only run when user is authenticated
    retry: false, // Don't retry on 404/400 errors
    staleTime: 0, // Always refetch to get latest status
  });

  return {
    isLoaded: authLoaded && !isCheckingUser,
    isSignedIn: isSignedIn ?? false,
    needsOnboarding: userCheck?.needsOnboarding ?? false,
    userExists: userCheck?.exists ?? false,
    user: userCheck?.user ?? null,
    error: userError ? (userError as Error).message : null,
  };
}