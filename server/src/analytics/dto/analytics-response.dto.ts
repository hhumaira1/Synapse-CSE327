export class RevenueMetricsDto {
  totalPipelineValue: number;
  weightedPipelineValue: number; // Based on probability
  expectedRevenue: number; // This month/quarter
  actualRevenue: number; // Closed deals
  forecastAccuracy: number; // Percentage
}

export class WinLossMetricsDto {
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  activeDeals: number;
  winRate: number; // Percentage
  lossRate: number; // Percentage
  averageDealValue: number;
  averageWonValue: number;
  averageLostValue: number;
}

export class ConversionMetricsDto {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number; // Percentage
  leadsByStatus: {
    NEW: number;
    CONTACTED: number;
    QUALIFIED: number;
    UNQUALIFIED: number;
    CONVERTED: number;
  };
  averageTimeToConversion: number; // Days
}

export class SalesVelocityDto {
  averageDealCycle: number; // Days from creation to close
  dealsClosedThisMonth: number;
  dealsClosedLastMonth: number;
  monthOverMonthGrowth: number; // Percentage
  averageDealsPerMonth: number;
  projectedMonthlyDeals: number;
  velocity: number; // Deals per day
}

export class PipelineHealthDto {
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

export class TopPerformersDto {
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
    closedDate: Date;
  }[];
}

export class AnalyticsDashboardDto {
  revenueMetrics: RevenueMetricsDto;
  winLossMetrics: WinLossMetricsDto;
  conversionMetrics: ConversionMetricsDto;
  salesVelocity: SalesVelocityDto;
  pipelineHealth: PipelineHealthDto[];
  topPerformers: TopPerformersDto;
  lastUpdated: Date;
}

export class RevenueForecastDto {
  period: string; // e.g., "2025-11", "Q4 2025"
  expectedRevenue: number;
  optimisticRevenue: number; // All high-probability deals close
  pessimisticRevenue: number; // Only sure bets close
  dealCount: number;
  averageProbability: number;
  breakdown: {
    low: { count: number; value: number }; // 0-25%
    medium: { count: number; value: number }; // 26-50%
    high: { count: number; value: number }; // 51-75%
    veryHigh: { count: number; value: number }; // 76-100%
  };
}

export class TimeSeriesDataDto {
  date: string;
  dealsCreated: number;
  dealsClosed: number;
  revenue: number;
  averageDealValue: number;
}
