// Super Admin API Client Types

export interface SuperAdmin {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  type: 'ORGANIZATION' | 'PERSONAL' | 'BUSINESS';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stats?: {
    users: number;
    contacts: number;
    leads: number;
    deals: number;
    tickets: number;
  };
}

export interface TenantDetails extends Tenant {
  users: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date;
  }>;
}

export interface SystemOverview {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  totalContacts: number;
  totalLeads: number;
  totalDeals: number;
  totalTickets: number;
  newTenantsThisMonth: number;
  newUsersThisMonth: number;
}

export interface TenantGrowth {
  month: string;
  count: number;
}

export interface UsageStats {
  tenantId: string;
  tenantName: string;
  slug: string;
  users: number;
  contacts: number;
  leads: number;
  deals: number;
  tickets: number;
  totalActivity: number;
}

export interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  superAdmin: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface CreateTenantDto {
  name: string;
  slug?: string;
  type?: 'ORGANIZATION' | 'PERSONAL' | 'BUSINESS';
  adminEmail: string;
  adminFirstName?: string;
  adminLastName?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
