'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useUser, SignUp } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api';

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const apiClient = useApiClient();
  const [synced, setSynced] = useState(false);

  const tenantId = searchParams?.get('tenantId');

  const syncMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await apiClient.post('/portal/auth/sync', { tenantId });
      return response.data;
    },
    onSuccess: () => {
      setSynced(true);
      // Redirect to portal dashboard after successful sync
      setTimeout(() => {
        router.push('/portal/dashboard');
      }, 1000);
    },
    onError: (error: any) => {
      console.error('Portal sync failed:', error.response?.data);
      alert('Failed to link your account. Please contact support.');
    },
  });

  // Auto-sync after sign-up
  useEffect(() => {
    if (authLoaded && userLoaded && isSignedIn && tenantId && !synced && !syncMutation.isPending) {
      syncMutation.mutate(tenantId);
    }
  }, [authLoaded, userLoaded, isSignedIn, tenantId, synced]);

  if (!authLoaded || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Invite</h1>
          <p className="text-gray-600">This invite link is missing required information.</p>
        </div>
      </div>
    );
  }

  if (isSignedIn && syncMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Linking Your Account...</h2>
          <p className="text-gray-600">Please wait while we set up your portal access.</p>
        </div>
      </div>
    );
  }

  if (isSignedIn && synced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Linked Successfully!</h2>
          <p className="text-gray-600">Redirecting to your portal dashboard...</p>
        </div>
      </div>
    );
  }

  // Show sign-up if not signed in
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white p-6 rounded-xl shadow-lg mb-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal Invitation</h1>
          <p className="text-gray-600">Create your account to access the customer portal</p>
        </div>
        
        <SignUp
          appearance={{
            elements: {
              card: 'shadow-xl rounded-xl',
              headerTitle: 'text-2xl font-bold text-gray-900',
            },
          }}
          afterSignUpUrl={`/portal/accept-invite?tenantId=${tenantId}`}
          redirectUrl={`/portal/accept-invite?tenantId=${tenantId}`}
        />
      </div>
    </div>
  );
}
