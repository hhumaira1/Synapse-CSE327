// Lead Status Enum matching Prisma schema
export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  QUALIFIED = "QUALIFIED",
  UNQUALIFIED = "UNQUALIFIED",
  CONVERTED = "CONVERTED",
}

// Lead interface matching backend response
export interface Lead {
  id: string;
  title: string;
  source: string;
  value: number;
  notes: string | null;
  status: LeadStatus;
  contactId: string;
  tenantId: string;
  convertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  deals?: Array<{
    id: string;
    title: string;
    value: number;
    stage: {
      id: string;
      name: string;
      pipeline: {
        id: string;
        name: string;
      };
    };
  }>;
}

// Form data for creating a lead
export interface CreateLeadFormData {
  title: string;
  contactId: string;
  source: string;
  value: number;
  notes: string;
  status: LeadStatus;
}

// Form data for converting a lead
export interface ConvertLeadFormData {
  pipelineId: string;
  stageId: string;
  probability?: number;
  expectedCloseDate?: Date;
}

// Lead status display configuration
export const LEAD_STATUS_CONFIG = {
  [LeadStatus.NEW]: {
    label: "New",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Fresh leads that haven't been contacted yet",
  },
  [LeadStatus.CONTACTED]: {
    label: "Contacted",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Leads that have been reached out to",
  },
  [LeadStatus.QUALIFIED]: {
    label: "Qualified",
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Leads that meet criteria for conversion",
  },
  [LeadStatus.UNQUALIFIED]: {
    label: "Unqualified",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Leads that don't meet conversion criteria",
  },
  [LeadStatus.CONVERTED]: {
    label: "Converted",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Leads successfully converted to deals",
  },
};
