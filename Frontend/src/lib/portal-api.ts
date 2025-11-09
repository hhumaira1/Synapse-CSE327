'use client';

import axios from 'axios';
import { useAuth } from '@clerk/nextjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance for portal API
export const portalApiClient = axios.create({
  baseURL: `${API_BASE_URL}/portal`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global flag to prevent multiple interceptor setup
let portalInterceptorSetup = false;

// Request interceptor to add Clerk token
export function setupPortalApiInterceptor(getToken: () => Promise<string | null>) {
  if (portalInterceptorSetup) return; // Prevent duplicate setup
  
  portalInterceptorSetup = true;
  
  portalApiClient.interceptors.request.use(
    async (config) => {
      console.log('Portal API Interceptor - Making request to:', config.url);
      
      try {
        const token = await getToken();
        console.log('Portal API Interceptor - Token retrieved:', token ? 'Yes' : 'No');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Portal API Interceptor - Authorization header set');
        } else {
          console.log('Portal API Interceptor - No token available');
        }
      } catch (error) {
        console.error('Portal API Interceptor - Error getting token:', error);
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
}

// Response interceptor for error handling
portalApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to sign-in if unauthorized
      if (typeof window !== 'undefined') {
        window.location.href = '/sign-in?redirect_url=' + window.location.pathname;
      }
    }
    return Promise.reject(error);
  }
);

// Hook to get Portal API client with authentication
export function usePortalApiClient() {
  const { getToken } = useAuth();
  
  // Set up interceptor when hook is used
  if (typeof window !== 'undefined') {
    setupPortalApiInterceptor(getToken);
  }
  
  return portalApiClient;
}
