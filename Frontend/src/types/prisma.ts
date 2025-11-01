/**
 * TypeScript types mirroring Prisma schema
 * These should match server/prisma/schema.prisma exactly
 * 
 * NOTE: Keep this file in sync with backend schema!
 */

// ==================== ENUMS ====================

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  MEMBER = "MEMBER",
}

export enum TenantType {
  ORGANIZATION = "ORGANIZATION",
  PERSONAL = "PERSONAL",
}

export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  QUALIFIED = "QUALIFIED",
  UNQUALIFIED = "UNQUALIFIED",
  CONVERTED = "CONVERTED",
}

export enum TicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum TicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TicketSource {
  INTERNAL = "INTERNAL",
  PORTAL = "PORTAL",
  EMAIL = "EMAIL",
  API = "API",
}

export enum InteractionType {
  EMAIL = "EMAIL",
  CALL = "CALL",
  MEETING = "MEETING",
  NOTE = "NOTE",
  TICKET = "TICKET",
}

// ==================== INTERFACES ====================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  clerkId: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  tenant?: Tenant;
}

export interface Contact {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  tenant?: Tenant;
  leads?: Lead[];
  deals?: Deal[];
  tickets?: Ticket[];
}

export interface Lead {
  id: string;
  tenantId: string;
  contactId?: string;
  source: string;
  status: LeadStatus;
  value?: number;
  convertedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tenant?: Tenant;
  contact?: Contact;
  deals?: Deal[];
}

export interface Pipeline {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenant?: Tenant;
  stages?: Stage[];
  deals?: Deal[];
}

export interface Stage {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  pipeline?: Pipeline;
  deals?: Deal[];
}

export interface Deal {
  id: string;
  tenantId: string;
  contactId: string;
  leadId?: string;
  pipelineId: string;
  stageId: string;
  title: string;
  description?: string;
  value?: number;
  probability?: number; // 0.0 to 1.0
  expectedCloseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tenant?: Tenant;
  contact?: Contact;
  lead?: Lead;
  pipeline?: Pipeline;
  stage?: Stage;
  interactions?: Interaction[];
  tickets?: Ticket[];
}

export interface Interaction {
  id: string;
  tenantId: string;
  contactId: string;
  dealId?: string;
  userId?: string;
  type: InteractionType;
  subject?: string;
  content: string;
  dateTime: Date;
  createdAt: Date;
  updatedAt: Date;
  tenant?: Tenant;
  contact?: Contact;
  deal?: Deal;
  user?: User;
}

export interface Ticket {
  id: string;
  tenantId: string;
  contactId: string;
  portalCustomerId?: string;
  dealId?: string;
  externalId?: string;
  externalSystem?: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  source: TicketSource;
  submittedByPortalCustomer: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignedUserId?: string;
  tenant?: Tenant;
  contact?: Contact;
  portalCustomer?: PortalCustomer;
  deal?: Deal;
  assignedUser?: User;
}

export interface Integration {
  id: string;
  tenantId: string;
  serviceName: string; // gmail, calendar, voip, osticket
  isActive: boolean;
  config?: Record<string, unknown>; // OAuth tokens, API keys, scopes
  lastSyncAt?: Date;
  syncStatus?: string; // success, failed, in_progress
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  tenant?: Tenant;
}

export interface CallLog {
  id: string;
  tenantId: string;
  contactId: string;
  dealId?: string;
  fromNumber: string;
  toNumber: string;
  duration?: number; // seconds
  outcome?: string; // completed, missed, voicemail
  recordingUrl?: string;
  transcription?: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
  tenant?: Tenant;
  contact?: Contact;
  deal?: Deal;
}

export interface PortalCustomer {
  id: string;
  tenantId: string;
  contactId?: string;
  clerkId?: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  tenant?: Tenant;
  contact?: Contact;
  tickets?: Ticket[];
}

// ==================== UTILITY TYPES ====================

// For creating new entities (without auto-generated fields)
export type CreateContact = Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'tenant' | 'leads' | 'deals' | 'tickets'>;
export type CreateLead = Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'tenant' | 'contact' | 'deals'>;
export type CreateDeal = Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'tenant' | 'contact' | 'lead' | 'pipeline' | 'stage' | 'interactions' | 'tickets'>;
export type CreateTicket = Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'tenant' | 'contact' | 'portalCustomer' | 'deal' | 'assignedUser'>;

// For updating entities (all fields optional except ID)
export type UpdateContact = Partial<CreateContact>;
export type UpdateLead = Partial<CreateLead>;
export type UpdateDeal = Partial<CreateDeal>;
export type UpdateTicket = Partial<CreateTicket>;

// API Response types with relations
export interface ContactWithRelations extends Contact {
  leads: Lead[];
  deals: Deal[];
  tickets: Ticket[];
}

export interface LeadWithRelations extends Lead {
  contact: Contact;
  deals: Deal[];
}

export interface DealWithRelations extends Deal {
  contact: Contact;
  lead?: Lead;
  pipeline: Pipeline;
  stage: Stage;
}

export interface TicketWithRelations extends Ticket {
  contact: Contact;
  assignedUser?: User;
  portalCustomer?: PortalCustomer;
}
