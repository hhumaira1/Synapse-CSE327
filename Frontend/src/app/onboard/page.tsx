'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api';
import { useUser } from '@clerk/nextjs';
import { useUserStatus } from '@/hooks/useUserStatus';

export default function OnboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [tenantName, setTenantName] = useState('');
  const userStatus = useUserStatus();

  // Redirect to dashboard if user already exists and doesn't need onboarding
  useEffect(() => {
    console.log('OnboardPage - User status changed:', {
      isLoaded: userStatus.isLoaded,
      userExists: userStatus.userExists,
      needsOnboarding: userStatus.needsOnboarding,
      error: userStatus.error
    });

    if (userStatus.isLoaded && userStatus.userExists && !userStatus.needsOnboarding) {
      console.log('User already exists, redirecting to dashboard...');
      router.push('/dashboard');
    }
  }, [userStatus.isLoaded, userStatus.userExists, userStatus.needsOnboarding, userStatus.error, router]);

  const mutation = useMutation({
    mutationFn: async (data: { tenantName: string }) => {
      console.log('Starting onboarding with data:', data);
      const response = await apiClient.post('/auth/onboard', data);
      console.log('Onboarding response:', response.data);
      return response.data;
    },
    onSuccess: async (data) => {
      console.log('Onboarding successful:', data);
      
      try {
        // Force refetch user status query and wait for it to complete
        await queryClient.refetchQueries({ 
          queryKey: ['user-status'],
          type: 'active' 
        });
        
        console.log('User status refetched successfully, redirecting to dashboard...');
        
        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Failed to refetch user status:', error);
        // Still redirect even if refetch fails
        router.push('/dashboard');
      }
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } };
      console.error('Onboarding failed:', apiError.response?.data);
      
      const errorMessage = apiError.response?.data?.message || 'Onboarding failed. Please try again.';
      alert(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) {
      alert('Please enter a workspace name');
      return;
    }
    mutation.mutate({ tenantName });
  };

  if (!isLoaded || !user || !userStatus.isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">
            {!isLoaded ? 'Loading user...' : 
             !userStatus.isLoaded ? 'Checking account status...' : 
             'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // If user exists and doesn't need onboarding, don't show the form
  if (userStatus.userExists && !userStatus.needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
            <strong>Debug:</strong> userExists: {userStatus.userExists ? 'true' : 'false'}, 
            needsOnboarding: {userStatus.needsOnboarding ? 'true' : 'false'}, 
            error: {userStatus.error || 'none'}
          </div>
        )}

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Synapse CRM</h1>
          <p className="text-gray-600">Let&apos;s set up your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="My Company Inc."
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              This will be your organization&apos;s workspace name
            </p>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
          >
            {mutation.isPending ? 'Setting up...' : 'Create Workspace'}
          </button>

          {mutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              Failed to create workspace. Please try again.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
