export interface RevenueMetrics {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  expectedRevenue: number;
  actualRevenue: number;
  forecastAccuracy: number;
}

export interface WinLossMetrics {
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  activeDeals: number;
  winRate: number;
  lossRate: number;
  averageDealValue: number;
  averageWonValue: number;
  averageLostValue: number;
}

export interface ConversionMetrics {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  leadsByStatus: {
    NEW: number;
    CONTACTED: number;
    QUALIFIED: number;
    UNQUALIFIED: number;
    CONVERTED: number;
  };
  averageTimeToConversion: number;
}

export interface SalesVelocity {
  averageDealCycle: number;
  dealsClosedThisMonth: number;
  dealsClosedLastMonth: number;
  monthOverMonthGrowth: number;
  averageDealsPerMonth: number;
  projectedMonthlyDeals: number;
  velocity: number;
}

export interface PipelineHealth {
  pipelineId: string;
  pipelineName: string;
  totalDeals: number;
  totalValue: number;
  averageProbability: number;
  stageDistribution: {
    stageId: string;
    stageName: string;
    dealCount: number;
    totalValue: number;
    avgProbability: number;
    avgDaysInStage: number;
  }[];
  bottlenecks: {
    stageId: string;
    stageName: string;
    avgDaysInStage: number;
    dealCount: number;
  }[];
}

export interface TopPerformers {
  topDealsByValue: {
    id: string;
    title: string;
    value: number;
    probability: number;
    contactName: string;
    stageName: string;
  }[];
  topContacts: {
    id: string;
    name: string;
    totalDeals: number;
    totalValue: number;
    avgDealValue: number;
  }[];
  recentWins: {
    id: string;
    title: string;
    value: number;
    contactName: string;
    closedDate: string;
  }[];
}

export interface AnalyticsDashboard {
  revenueMetrics: RevenueMetrics;
  winLossMetrics: WinLossMetrics;
  conversionMetrics: ConversionMetrics;
  salesVelocity: SalesVelocity;
  pipelineHealth: PipelineHealth[];
  topPerformers: TopPerformers;
  lastUpdated: string;
}

export interface RevenueForecast {
  period: string;
  expectedRevenue: number;
  optimisticRevenue: number;
  pessimisticRevenue: number;
  dealCount: number;
  averageProbability: number;
  breakdown: {
    low: { count: number; value: number };
    medium: { count: number; value: number };
    high: { count: number; value: number };
    veryHigh: { count: number; value: number };
  };
}

export interface TimeSeriesData {
  date: string;
  dealsCreated: number;
  dealsClosed: number;
  revenue: number;
  averageDealValue: number;
}
