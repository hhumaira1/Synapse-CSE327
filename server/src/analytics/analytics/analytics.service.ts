import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { LeadStatus } from 'prisma/generated/client';
import {
  AnalyticsDashboardDto,
  RevenueMetricsDto,
  WinLossMetricsDto,
  ConversionMetricsDto,
  SalesVelocityDto,
  PipelineHealthDto,
  TopPerformersDto,
  RevenueForecastDto,
  TimeSeriesDataDto,
} from '../dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive analytics dashboard
   */
  async getDashboard(tenantId: string): Promise<AnalyticsDashboardDto> {
    const [
      revenueMetrics,
      winLossMetrics,
      conversionMetrics,
      salesVelocity,
      pipelineHealth,
      topPerformers,
    ] = await Promise.all([
      this.getRevenueMetrics(tenantId),
      this.getWinLossMetrics(tenantId),
      this.getConversionMetrics(tenantId),
      this.getSalesVelocity(tenantId),
      this.getPipelineHealth(tenantId),
      this.getTopPerformers(tenantId),
    ]);

    return {
      revenueMetrics,
      winLossMetrics,
      conversionMetrics,
      salesVelocity,
      pipelineHealth,
      topPerformers,
      lastUpdated: new Date(),
    };
  }

  /**
   * Revenue Metrics - Forecasting based on Deal.value + Deal.probability
   */
  async getRevenueMetrics(tenantId: string): Promise<RevenueMetricsDto> {
    const deals = await this.prisma.deal.findMany({
      where: { tenantId },
      include: { stage: true },
    });

    // Total pipeline value (all deals)
    const totalPipelineValue = deals.reduce(
      (sum, deal) => sum + (deal.value ? Number(deal.value) : 0),
      0,
    );

    // Weighted pipeline value (value * probability)
    const weightedPipelineValue = deals.reduce(
      (sum, deal) =>
        sum +
        (deal.value && deal.probability
          ? Number(deal.value) * Number(deal.probability)
          : 0),
      0,
    );

    // Expected revenue this month (deals with expectedCloseDate this month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expectedRevenue = deals
      .filter(
        (deal) =>
          deal.expectedCloseDate &&
          deal.expectedCloseDate >= monthStart &&
          deal.expectedCloseDate <= monthEnd,
      )
      .reduce(
        (sum, deal) =>
          sum +
          (deal.value && deal.probability
            ? Number(deal.value) * Number(deal.probability)
            : 0),
        0,
      );

    // Actual revenue (deals in final stage - we'll approximate by high probability deals)
    // In a real scenario, you'd have a "Won" status or final stage tracking
    const actualRevenue = deals
      .filter((deal) => deal.probability && Number(deal.probability) >= 0.9)
      .reduce((sum, deal) => sum + (deal.value ? Number(deal.value) : 0), 0);

    // Forecast accuracy (simplified - comparing weighted vs actual)
    const forecastAccuracy =
      weightedPipelineValue > 0
        ? (actualRevenue / weightedPipelineValue) * 100
        : 0;

    return {
      totalPipelineValue: Math.round(totalPipelineValue),
      weightedPipelineValue: Math.round(weightedPipelineValue),
      expectedRevenue: Math.round(expectedRevenue),
      actualRevenue: Math.round(actualRevenue),
      forecastAccuracy: Math.round(forecastAccuracy * 100) / 100,
    };
  }

  /**
   * Win/Loss Metrics
   */
  async getWinLossMetrics(tenantId: string): Promise<WinLossMetricsDto> {
    const deals = await this.prisma.deal.findMany({
      where: { tenantId },
    });

    const totalDeals = deals.length;

    // Won deals (probability >= 90%)
    const wonDeals = deals.filter(
      (deal) => deal.probability && Number(deal.probability) >= 0.9,
    ).length;

    // Lost deals (probability <= 10% or explicitly marked)
    const lostDeals = deals.filter(
      (deal) => deal.probability && Number(deal.probability) <= 0.1,
    ).length;

    const activeDeals = totalDeals - wonDeals - lostDeals;

    const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
    const lossRate = totalDeals > 0 ? (lostDeals / totalDeals) * 100 : 0;

    const averageDealValue =
      totalDeals > 0
        ? deals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0) /
          totalDeals
        : 0;

    const wonDealsList = deals.filter(
      (d) => d.probability && Number(d.probability) >= 0.9,
    );
    const averageWonValue =
      wonDealsList.length > 0
        ? wonDealsList.reduce(
            (sum, d) => sum + (d.value ? Number(d.value) : 0),
            0,
          ) / wonDealsList.length
        : 0;

    const lostDealsList = deals.filter(
      (d) => d.probability && Number(d.probability) <= 0.1,
    );
    const averageLostValue =
      lostDealsList.length > 0
        ? lostDealsList.reduce(
            (sum, d) => sum + (d.value ? Number(d.value) : 0),
            0,
          ) / lostDealsList.length
        : 0;

    return {
      totalDeals,
      wonDeals,
      lostDeals,
      activeDeals,
      winRate: Math.round(winRate * 100) / 100,
      lossRate: Math.round(lossRate * 100) / 100,
      averageDealValue: Math.round(averageDealValue),
      averageWonValue: Math.round(averageWonValue),
      averageLostValue: Math.round(averageLostValue),
    };
  }

  /**
   * Lead Conversion Metrics
   */
  async getConversionMetrics(tenantId: string): Promise<ConversionMetricsDto> {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId },
    });

    const totalLeads = leads.length;
    const convertedLeads = leads.filter(
      (lead) => lead.status === LeadStatus.CONVERTED,
    ).length;
    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const leadsByStatus = {
      NEW: leads.filter((l) => l.status === LeadStatus.NEW).length,
      CONTACTED: leads.filter((l) => l.status === LeadStatus.CONTACTED).length,
      QUALIFIED: leads.filter((l) => l.status === LeadStatus.QUALIFIED).length,
      UNQUALIFIED: leads.filter((l) => l.status === LeadStatus.UNQUALIFIED)
        .length,
      CONVERTED: convertedLeads,
    };

    // Average time to conversion (for converted leads)
    const convertedLeadsList = leads.filter(
      (l) => l.status === LeadStatus.CONVERTED && l.convertedAt,
    );
    const averageTimeToConversion =
      convertedLeadsList.length > 0
        ? convertedLeadsList.reduce((sum, lead) => {
            const daysToConvert = lead.convertedAt
              ? Math.floor(
                  (lead.convertedAt.getTime() - lead.createdAt.getTime()) /
                    (1000 * 60 * 60 * 24),
                )
              : 0;
            return sum + daysToConvert;
          }, 0) / convertedLeadsList.length
        : 0;

    return {
      totalLeads,
      convertedLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      leadsByStatus,
      averageTimeToConversion: Math.round(averageTimeToConversion * 10) / 10,
    };
  }

  /**
   * Sales Velocity Metrics
   */
  async getSalesVelocity(tenantId: string): Promise<SalesVelocityDto> {
    const deals = await this.prisma.deal.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Average deal cycle (creation to expected close for deals with expected close date)
    const dealsWithCloseDate = deals.filter((d) => d.expectedCloseDate);
    const averageDealCycle =
      dealsWithCloseDate.length > 0
        ? dealsWithCloseDate.reduce((sum, deal) => {
            const cycle = deal.expectedCloseDate
              ? Math.floor(
                  (deal.expectedCloseDate.getTime() -
                    deal.createdAt.getTime()) /
                    (1000 * 60 * 60 * 24),
                )
              : 0;
            return sum + cycle;
          }, 0) / dealsWithCloseDate.length
        : 0;

    // Deals closed this month (high probability deals)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const dealsClosedThisMonth = deals.filter(
      (d) =>
        d.probability &&
        Number(d.probability) >= 0.9 &&
        d.updatedAt >= monthStart,
    ).length;

    // Deals closed last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const dealsClosedLastMonth = deals.filter(
      (d) =>
        d.probability &&
        Number(d.probability) >= 0.9 &&
        d.updatedAt >= lastMonthStart &&
        d.updatedAt <= lastMonthEnd,
    ).length;

    const monthOverMonthGrowth =
      dealsClosedLastMonth > 0
        ? ((dealsClosedThisMonth - dealsClosedLastMonth) /
            dealsClosedLastMonth) *
          100
        : 0;

    // Average deals per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentDeals = deals.filter((d) => d.createdAt >= sixMonthsAgo);
    const averageDealsPerMonth = recentDeals.length / 6;

    // Velocity (deals per day)
    const velocity = averageDealsPerMonth / 30;

    return {
      averageDealCycle: Math.round(averageDealCycle),
      dealsClosedThisMonth,
      dealsClosedLastMonth,
      monthOverMonthGrowth: Math.round(monthOverMonthGrowth * 100) / 100,
      averageDealsPerMonth: Math.round(averageDealsPerMonth * 10) / 10,
      projectedMonthlyDeals: Math.round(averageDealsPerMonth),
      velocity: Math.round(velocity * 100) / 100,
    };
  }

  /**
   * Pipeline Health Analysis
   */
  async getPipelineHealth(tenantId: string): Promise<PipelineHealthDto[]> {
    const pipelines = await this.prisma.pipeline.findMany({
      where: { tenantId, isActive: true },
      include: {
        stages: {
          include: {
            deals: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return pipelines.map((pipeline) => {
      const allDeals = pipeline.stages.flatMap((stage) => stage.deals);

      const stageDistribution = pipeline.stages.map((stage) => {
        const stageDealCount = stage.deals.length;
        const stageTotalValue = stage.deals.reduce(
          (sum, d) => sum + (d.value ? Number(d.value) : 0),
          0,
        );
        const avgProbability =
          stageDealCount > 0
            ? stage.deals.reduce(
                (sum, d) => sum + (d.probability ? Number(d.probability) : 0),
                0,
              ) / stageDealCount
            : 0;

        // Average days in stage
        const avgDaysInStage =
          stageDealCount > 0
            ? stage.deals.reduce((sum, deal) => {
                const days = Math.floor(
                  (new Date().getTime() - deal.updatedAt.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                return sum + days;
              }, 0) / stageDealCount
            : 0;

        return {
          stageId: stage.id,
          stageName: stage.name,
          dealCount: stageDealCount,
          totalValue: Math.round(stageTotalValue),
          avgProbability: Math.round(avgProbability * 100) / 100,
          avgDaysInStage: Math.round(avgDaysInStage),
        };
      });

      // Identify bottlenecks (stages with high average days and multiple deals)
      const bottlenecks = stageDistribution
        .filter((stage) => stage.avgDaysInStage > 14 && stage.dealCount > 2)
        .map((stage) => ({
          stageId: stage.stageId,
          stageName: stage.stageName,
          avgDaysInStage: stage.avgDaysInStage,
          dealCount: stage.dealCount,
        }));

      const totalValue = allDeals.reduce(
        (sum, d) => sum + (d.value ? Number(d.value) : 0),
        0,
      );
      const averageProbability =
        allDeals.length > 0
          ? allDeals.reduce(
              (sum, d) => sum + (d.probability ? Number(d.probability) : 0),
              0,
            ) / allDeals.length
          : 0;

      return {
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        totalDeals: allDeals.length,
        totalValue: Math.round(totalValue),
        averageProbability: Math.round(averageProbability * 100) / 100,
        stageDistribution,
        bottlenecks,
      };
    });
  }

  /**
   * Top Performers (Deals and Contacts)
   */
  async getTopPerformers(tenantId: string): Promise<TopPerformersDto> {
    // Top deals by value
    const topDealsByValue = await this.prisma.deal.findMany({
      where: { tenantId },
      include: {
        contact: true,
        stage: true,
      },
      orderBy: { value: 'desc' },
      take: 10,
    });

    // Top contacts by deal value
    const contactDeals = await this.prisma.contact.findMany({
      where: { tenantId },
      include: {
        deals: true,
      },
    });

    const topContacts = contactDeals
      .map((contact) => {
        const totalDeals = contact.deals.length;
        const totalValue = contact.deals.reduce(
          (sum, d) => sum + (d.value ? Number(d.value) : 0),
          0,
        );
        const avgDealValue = totalDeals > 0 ? totalValue / totalDeals : 0;

        return {
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
          totalDeals,
          totalValue: Math.round(totalValue),
          avgDealValue: Math.round(avgDealValue),
        };
      })
      .filter((c) => c.totalDeals > 0)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    // Recent wins (high probability deals updated recently)
    const recentWins = await this.prisma.deal.findMany({
      where: {
        tenantId,
        probability: { gte: 0.9 },
      },
      include: {
        contact: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return {
      topDealsByValue: topDealsByValue.map((deal) => ({
        id: deal.id,
        title: deal.title,
        value: deal.value ? Number(deal.value) : 0,
        probability: deal.probability ? Number(deal.probability) : 0,
        contactName: `${deal.contact.firstName} ${deal.contact.lastName}`,
        stageName: deal.stage.name,
      })),
      topContacts,
      recentWins: recentWins.map((deal) => ({
        id: deal.id,
        title: deal.title,
        value: deal.value ? Number(deal.value) : 0,
        contactName: `${deal.contact.firstName} ${deal.contact.lastName}`,
        closedDate: deal.updatedAt,
      })),
    };
  }

  /**
   * Revenue Forecast (Monthly/Quarterly)
   */
  async getRevenueForecast(
    tenantId: string,
    period: 'month' | 'quarter',
  ): Promise<RevenueForecastDto> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    } else {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      periodLabel = `Q${quarter + 1} ${now.getFullYear()}`;
    }

    const deals = await this.prisma.deal.findMany({
      where: {
        tenantId,
        OR: [
          {
            expectedCloseDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            expectedCloseDate: null, // Include deals without close date
          },
        ],
      },
    });

    // Expected revenue (weighted by probability)
    const expectedRevenue = deals.reduce(
      (sum, deal) =>
        sum +
        (deal.value && deal.probability
          ? Number(deal.value) * Number(deal.probability)
          : 0),
      0,
    );

    // Optimistic (all deals with probability > 50% close at full value)
    const optimisticRevenue = deals
      .filter((d) => d.probability && Number(d.probability) > 0.5)
      .reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);

    // Pessimistic (only deals with probability > 80% close)
    const pessimisticRevenue = deals
      .filter((d) => d.probability && Number(d.probability) > 0.8)
      .reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0);

    const dealCount = deals.length;
    const averageProbability =
      dealCount > 0
        ? deals.reduce(
            (sum, d) => sum + (d.probability ? Number(d.probability) : 0),
            0,
          ) / dealCount
        : 0;

    // Breakdown by probability ranges
    const breakdown = {
      low: {
        count: deals.filter(
          (d) => d.probability && Number(d.probability) <= 0.25,
        ).length,
        value: deals
          .filter((d) => d.probability && Number(d.probability) <= 0.25)
          .reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0),
      },
      medium: {
        count: deals.filter(
          (d) =>
            d.probability &&
            Number(d.probability) > 0.25 &&
            Number(d.probability) <= 0.5,
        ).length,
        value: deals
          .filter(
            (d) =>
              d.probability &&
              Number(d.probability) > 0.25 &&
              Number(d.probability) <= 0.5,
          )
          .reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0),
      },
      high: {
        count: deals.filter(
          (d) =>
            d.probability &&
            Number(d.probability) > 0.5 &&
            Number(d.probability) <= 0.75,
        ).length,
        value: deals
          .filter(
            (d) =>
              d.probability &&
              Number(d.probability) > 0.5 &&
              Number(d.probability) <= 0.75,
          )
          .reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0),
      },
      veryHigh: {
        count: deals.filter(
          (d) => d.probability && Number(d.probability) > 0.75,
        ).length,
        value: deals
          .filter((d) => d.probability && Number(d.probability) > 0.75)
          .reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0),
      },
    };

    return {
      period: periodLabel,
      expectedRevenue: Math.round(expectedRevenue),
      optimisticRevenue: Math.round(optimisticRevenue),
      pessimisticRevenue: Math.round(pessimisticRevenue),
      dealCount,
      averageProbability: Math.round(averageProbability * 100) / 100,
      breakdown: {
        low: {
          count: breakdown.low.count,
          value: Math.round(breakdown.low.value),
        },
        medium: {
          count: breakdown.medium.count,
          value: Math.round(breakdown.medium.value),
        },
        high: {
          count: breakdown.high.count,
          value: Math.round(breakdown.high.value),
        },
        veryHigh: {
          count: breakdown.veryHigh.count,
          value: Math.round(breakdown.veryHigh.value),
        },
      },
    };
  }

  /**
   * Time Series Data (Last 6 months)
   */
  async getTimeSeriesData(tenantId: string): Promise<TimeSeriesDataDto[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const deals = await this.prisma.deal.findMany({
      where: {
        tenantId,
        createdAt: { gte: sixMonthsAgo },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month
    const monthlyData = new Map<string, TimeSeriesDataDto>();

    deals.forEach((deal) => {
      const monthKey = `${deal.createdAt.getFullYear()}-${String(deal.createdAt.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          date: monthKey,
          dealsCreated: 0,
          dealsClosed: 0,
          revenue: 0,
          averageDealValue: 0,
        });
      }

      const data = monthlyData.get(monthKey)!;
      data.dealsCreated++;

      if (deal.probability && Number(deal.probability) >= 0.9) {
        data.dealsClosed++;
        data.revenue += deal.value ? Number(deal.value) : 0;
      }
    });

    // Calculate averages
    monthlyData.forEach((data) => {
      data.averageDealValue =
        data.dealsClosed > 0
          ? Math.round(data.revenue / data.dealsClosed)
          : 0;
      data.revenue = Math.round(data.revenue);
    });

    return Array.from(monthlyData.values());
  }
}
