'use client';

import axios from 'axios';
import { useAuth } from '@clerk/nextjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global flag to prevent multiple interceptor setup
let interceptorSetup = false;

// Request interceptor to add Clerk token
export function setupApiInterceptor(getToken: () => Promise<string | null>) {
  if (interceptorSetup) return; // Prevent duplicate setup
  
  interceptorSetup = true;
  
  apiClient.interceptors.request.use(
    async (config) => {
      console.log('API Interceptor - Making request to:', config.url);
      
      try {
        const token = await getToken();
        console.log('API Interceptor - Token retrieved:', token ? 'Yes' : 'No');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('API Interceptor - Authorization header set');
        } else {
          console.log('API Interceptor - No token available');
        }
      } catch (error) {
        console.error('API Interceptor - Error getting token:', error);
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
}

// Hook to get API client with authentication
export function useApiClient() {
  const { getToken } = useAuth();
  
  // Set up interceptor when hook is used
  if (typeof window !== 'undefined') {
    setupApiInterceptor(getToken);
  }
  
  return apiClient;
}
