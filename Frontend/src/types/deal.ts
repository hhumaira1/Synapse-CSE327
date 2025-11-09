// Deal interface matching backend response
export interface Deal {
  id: string;
  title: string;
  value: number;
  probability: number; // 0.0 to 1.0 (backend stores as decimal)
  expectedCloseDate: Date | null;
  notes: string | null;
  contactId: string;
  pipelineId: string;
  stageId: string;
  leadId: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  pipeline?: {
    id: string;
    name: string;
  };
  stage?: {
    id: string;
    name: string;
    order: number;
  };
  lead?: {
    id: string;
    title: string;
    source: string;
  };
}

// Pipeline with stages for selector
export interface PipelineWithStages {
  id: string;
  name: string;
  description: string | null;
  stages: Stage[];
  _count?: {
    deals: number;
  };
}

// Stage interface
export interface Stage {
  id: string;
  name: string;
  order: number;
  pipelineId: string;
  _count?: {
    deals: number;
  };
}

// Form data for creating a deal
export interface CreateDealFormData {
  title: string;
  contactId: string;
  pipelineId: string;
  stageId: string;
  value: number;
  probability: number; // 0-100 (converted to 0.0-1.0 for backend)
  expectedCloseDate: string; // ISO date string
  notes: string;
  leadId?: string;
}

// Pipeline statistics from backend
export interface PipelineStats {
  totalDeals: number;
  totalValue: number;
  averageProbability: number;
  dealsByStage: Array<{
    stageId: string;
    stageName: string;
    count: number;
    totalValue: number;
  }>;
}

// Probability color helpers
export function getProbabilityColor(probability: number): string {
  if (probability >= 0.75) return "text-green-600 bg-green-50";
  if (probability >= 0.5) return "text-blue-600 bg-blue-50";
  if (probability >= 0.25) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
}

export function getProbabilityLabel(probability: number): string {
  if (probability >= 0.75) return "High";
  if (probability >= 0.5) return "Medium";
  if (probability >= 0.25) return "Low";
  return "Very Low";
}
