'use client';

import { useState, useEffect } from 'react';
import { useApiClient } from '@/lib/api';
import { useUser } from '@/hooks/useUser';

interface UserData {
  id: string;
  supabaseUserId: string;
  tenantId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
}

export function useUserData() {
  const { user: authUser, isLoading: authLoading, isSignedIn } = useUser();
  const isLoaded = !authLoading;
  const apiClient = useApiClient();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      console.log('⏸️ useUserData waiting for auth...', { isLoaded, isSignedIn });
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        console.log('📞 Calling /auth/me...');
        const response = await apiClient.get('/auth/me');
        console.log('🔍 Raw /auth/me response:', response.data);
        
        // Backend returns { supabaseUser, dbUser } - we need dbUser
        let extractedData = response.data.dbUser || response.data;
        
        // Ensure we have the required fields
        if (!extractedData.supabaseUserId || !extractedData.tenantId) {
          console.error('❌ Invalid user data structure:', extractedData);
          throw new Error('Invalid user data - missing supabaseUserId or tenantId');
        }
        
        console.log('✅ Extracted user data:', extractedData);
        
        setUserData(extractedData);
        setError(null);
      } catch (err: any) {
        console.error('❌ Failed to fetch user data:', err);
        setError(err?.message || 'Failed to load user data');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoaded, isSignedIn, apiClient]);

  return { userData, loading, error };
}
