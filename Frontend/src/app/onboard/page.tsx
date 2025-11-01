'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api';
import { useUser } from '@clerk/nextjs';

export default function OnboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const apiClient = useApiClient();
  const [tenantName, setTenantName] = useState('');

  const mutation = useMutation({
    mutationFn: async (data: { tenantName: string }) => {
      const response = await apiClient.post('/auth/onboard', data);
      return response.data;
    },
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: (error: any) => {
      console.error('Onboarding failed:', error.response?.data);
      alert('Onboarding failed. Please try again.');
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

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
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
