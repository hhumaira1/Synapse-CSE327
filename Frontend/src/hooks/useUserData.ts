'use client';

import { useState, useEffect } from 'react';
import { useApiClient } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

interface UserData {
  id: string;
  clerkId: string;
  tenantId: string;
  name: string | null;
  email: string;
  role: string;
}

export function useUserData() {
  const { isLoaded, isSignedIn } = useAuth();
  const apiClient = useApiClient();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        setUserData(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoaded, isSignedIn, apiClient]);

  return { userData, loading, error };
}
