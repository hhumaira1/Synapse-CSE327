'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

/**
 * Available CRM agent for portal customers to call
 */
export interface AvailableAgent {
  id: string;
  supabaseUserId: string;
  name: string;
  email: string;
  role: string;
  isOnline: boolean;
}

/**
 * Hook to fetch available CRM agents for portal customers to call
 * 
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with list of available agents
 */
export function useAvailableAgents(enabled: boolean = true) {
  return useQuery({
    queryKey: ['available-agents'],
    queryFn: async () => {
      const response = await apiClient.get<AvailableAgent[]>('/voip/available-agents');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled, // Only fetch when enabled
  });
}
