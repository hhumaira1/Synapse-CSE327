/**
 * osTicket API Type Definitions
 * Based on osTicket REST API Plugin
 * Docs: https://github.com/osTicket/plugin-api
 */

export interface OsTicketConfig {
  baseUrl: string; // e.g., https://support.example.com
  apiKey: string; // osTicket API key
  isActive: boolean;
}

export interface OsTicketTicket {
  id: number; // osTicket ticket ID
  number: string; // Ticket number (e.g., "123456")
  created: string; // ISO date
  updated: string; // ISO date
  subject: string;
  message: string; // Initial message
  priority: {
    id: number;
    priority: string; // "Low", "Normal", "High", "Emergency"
  };
  status: {
    id: number;
    name: string; // "Open", "Resolved", "Closed"
    state: string; // "open", "closed", "archived"
  };
  source: string; // "Web", "Email", "API"
  user: {
    name: string;
    email: string;
  };
  assignee?: {
    staff_id: number;
    name: string;
  };
  thread?: OsTicketThreadEntry[];
}

export interface OsTicketThreadEntry {
  id: number;
  type: 'M' | 'R' | 'N'; // M=Message, R=Response, N=Note
  poster: string; // Name of poster
  source: string; // "Web", "Email", "API"
  title: string;
  body: string;
  created: string; // ISO date
  attachments?: any[];
}

export interface CreateOsTicketRequest {
  name: string; // Customer name
  email: string; // Customer email
  phone?: string;
  subject: string;
  message: string;
  priority?: number; // Priority ID (1-4)
  topicId?: number; // Help topic ID
  source?: string;
  ip?: string; // Optional IP address
  autorespond?: boolean;
}

export interface CreateOsTicketResponse {
  ticket_id: number;
  number: string;
}

export interface OsTicketReplyRequest {
  message: string;
  alert?: boolean; // Send email alert
  autorespond?: boolean;
}

export interface OsTicketUpdateRequest {
  status?: number; // Status ID
  priority?: number; // Priority ID
  topic?: number; // Topic ID
  assignee?: number; // Staff ID
  message?: string; // Optional message with update
}

export interface OsTicketWebhookEvent {
  event:
    | 'ticket.created'
    | 'ticket.updated'
    | 'ticket.closed'
    | 'message.posted';
  timestamp: string;
  ticket: {
    id: number;
    number: string;
    subject: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface OsTicketSyncResult {
  success: boolean;
  ticketId?: string; // Internal ticket ID
  externalId?: string; // osTicket ticket number
  error?: string;
  syncedAt: Date;
}

export enum OsTicketPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  EMERGENCY = 4,
}

export enum OsTicketStatus {
  OPEN = 1,
  RESOLVED = 2,
  CLOSED = 3,
}

// Mapping between internal TicketPriority and osTicket priorities
export const PRIORITY_MAP = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
} as const;

// Mapping between internal TicketStatus and osTicket status
export const STATUS_MAP = {
  OPEN: 1,
  IN_PROGRESS: 1, // osTicket doesn't have "In Progress", use Open
  RESOLVED: 2,
  CLOSED: 3,
} as const;

// Reverse mapping: osTicket status ID to internal TicketStatus
export const OSTICKET_TO_INTERNAL_STATUS: Record<number, string> = {
  1: 'OPEN',
  2: 'RESOLVED',
  3: 'CLOSED',
};

// Reverse mapping: osTicket priority to internal TicketPriority
export const OSTICKET_TO_INTERNAL_PRIORITY: Record<number, string> = {
  1: 'LOW',
  2: 'MEDIUM',
  3: 'HIGH',
  4: 'URGENT',
};
