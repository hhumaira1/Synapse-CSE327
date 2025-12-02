// Super Admin API Client

import { createClient } from '@/lib/supabase/client';
import type {
  SuperAdmin,
  Tenant,
  TenantDetails,
  SystemOverview,
  TenantGrowth,
  UsageStats,
  AuditLog,
  CreateTenantDto,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export const superAdminApi = {
  // Authentication
  async getMe(): Promise<SuperAdmin> {
    const headers = await getAuthHeaders();
    console.log('🔍 Calling super admin API:', `${API_BASE}/super-admin/auth/me`);
    
    const response = await fetch(`${API_BASE}/super-admin/auth/me`, {
      headers,
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error('Not authorized as super admin');
    }
    
    const data = await response.json();
    console.log('✅ Super admin data:', data);
    return data;
  },

  // Tenants
  async getTenants(params?: {
    search?: string;
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ tenants: Tenant[]; total: number }> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    
    const response = await fetch(`${API_BASE}/super-admin/tenants?${queryParams}`, {
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to fetch tenants');
    return response.json();
  },

  async getTenant(id: string): Promise<TenantDetails> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/super-admin/tenants/${id}`, {
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to fetch tenant');
    return response.json();
  },

  async getTenantStats(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/super-admin/tenants/${id}/stats`, {
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to fetch tenant stats');
    return response.json();
  },

  async createTenant(data: CreateTenantDto): Promise<{ tenant: Tenant; invitation: any; invitationLink: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/super-admin/tenants`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Failed to create tenant');
    return response.json();
  },

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/super-admin/tenants/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Failed to update tenant');
    return response.json();
  },

  async toggleTenantStatus(id: string): Promise<Tenant> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/super-admin/tenants/${id}/toggle-status`, {
      method: 'PATCH',
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to toggle tenant status');
    return response.json();
  },

  async deleteTenant(id: string): Promise<Tenant> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/super-admin/tenants/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to delete tenant');
    return response.json();
  },

  // Analytics
  async getOverview(): Promise<SystemOverview> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/super-admin/analytics/overview`, {
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to fetch overview');
    return response.json();
  },

  async getTenantGrowth(months: number = 6): Promise<TenantGrowth[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/super-admin/analytics/tenant-growth?months=${months}`, {
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to fetch tenant growth');
    return response.json();
  },

  async getUsageStats(): Promise<UsageStats[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/super-admin/analytics/usage`, {
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to fetch usage stats');
    return response.json();
  },

  async getActiveUsers(days: number = 30) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/super-admin/analytics/active-users?days=${days}`, {
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to fetch active users');
    return response.json();
  },

  // Audit Logs
  async getAuditLogs(params?: {
    superAdminId?: string;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params?.superAdminId) queryParams.append('superAdminId', params.superAdminId);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.targetType) queryParams.append('targetType', params.targetType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    
    const response = await fetch(`${API_BASE}/super-admin/audit-logs?${queryParams}`, {
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
  },

  async exportAuditLogs(params?: {
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'json';
  }): Promise<Blob> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.format) queryParams.append('format', params.format);
    
    const response = await fetch(`${API_BASE}/super-admin/audit-logs/export?${queryParams}`, {
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to export audit logs');
    return response.blob();
  },
};
