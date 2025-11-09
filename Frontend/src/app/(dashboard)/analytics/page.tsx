"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Clock,
  BarChart3,
  Activity,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import { useApiClient } from "@/lib/api";
import type {
  AnalyticsDashboard,
  RevenueForecast,
} from "@/types/analytics";

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [forecast, setForecast] = useState<RevenueForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [forecastPeriod, setForecastPeriod] = useState<"month" | "quarter">("month");
  const apiClient = useApiClient();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardRes, forecastRes] = await Promise.all([
        apiClient.get("/analytics/dashboard"),
        apiClient.get(`/analytics/forecast?period=${forecastPeriod}`),
      ]);

      setDashboard(dashboardRes.data);
      setForecast(forecastRes.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [apiClient, forecastPeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Sales insights and revenue forecasting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">
            Last updated: {new Date(dashboard.lastUpdated).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pipeline</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboard.revenueMetrics.totalPipelineValue)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weighted Pipeline</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboard.revenueMetrics.weightedPipelineValue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Based on probability</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expected Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboard.revenueMetrics.expectedRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Forecast Accuracy</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatPercent(dashboard.revenueMetrics.forecastAccuracy)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Historical accuracy</p>
              </div>
              <div className="p-3 rounded-full bg-indigo-100">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Forecast */}
      {forecast && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Forecast - {forecast.period}</CardTitle>
                <CardDescription>Projected revenue scenarios</CardDescription>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setForecastPeriod("month")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    forecastPeriod === "month"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setForecastPeriod("quarter")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    forecastPeriod === "quarter"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Quarterly
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm font-medium text-red-900">Pessimistic</p>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  {formatCurrency(forecast.pessimisticRevenue)}
                </p>
                <p className="text-xs text-red-600 mt-1">High probability deals only</p>
              </div>

              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-900">Expected</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {formatCurrency(forecast.expectedRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1">Weighted by probability</p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm font-medium text-blue-900">Optimistic</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {formatCurrency(forecast.optimisticRevenue)}
                </p>
                <p className="text-xs text-blue-600 mt-1">If all likely deals close</p>
              </div>
            </div>

            {/* Probability Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-600">Low (0-25%)</p>
                <p className="font-semibold text-gray-900">
                  {forecast.breakdown.low.count} deals
                </p>
                <p className="text-sm text-gray-700">
                  {formatCurrency(forecast.breakdown.low.value)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-yellow-50">
                <p className="text-xs text-yellow-700">Medium (26-50%)</p>
                <p className="font-semibold text-yellow-900">
                  {forecast.breakdown.medium.count} deals
                </p>
                <p className="text-sm text-yellow-800">
                  {formatCurrency(forecast.breakdown.medium.value)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-orange-50">
                <p className="text-xs text-orange-700">High (51-75%)</p>
                <p className="font-semibold text-orange-900">
                  {forecast.breakdown.high.count} deals
                </p>
                <p className="text-sm text-orange-800">
                  {formatCurrency(forecast.breakdown.high.value)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-green-50">
                <p className="text-xs text-green-700">Very High (76-100%)</p>
                <p className="font-semibold text-green-900">
                  {forecast.breakdown.veryHigh.count} deals
                </p>
                <p className="text-sm text-green-800">
                  {formatCurrency(forecast.breakdown.veryHigh.value)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Win/Loss and Conversion Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win/Loss Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Analysis</CardTitle>
            <CardDescription>Deal outcomes and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Won Deals</p>
                    <p className="text-2xl font-bold text-green-700">
                      {dashboard.winLossMetrics.wonDeals}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-600">
                    {formatPercent(dashboard.winLossMetrics.winRate)}
                  </Badge>
                  <p className="text-xs text-green-600 mt-1">
                    Avg: {formatCurrency(dashboard.winLossMetrics.averageWonValue)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-100">
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-900">Lost Deals</p>
                    <p className="text-2xl font-bold text-red-700">
                      {dashboard.winLossMetrics.lostDeals}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">
                    {formatPercent(dashboard.winLossMetrics.lossRate)}
                  </Badge>
                  <p className="text-xs text-red-600 mt-1">
                    Avg: {formatCurrency(dashboard.winLossMetrics.averageLostValue)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Active Deals</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {dashboard.winLossMetrics.activeDeals}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600">
                    Avg Value: {formatCurrency(dashboard.winLossMetrics.averageDealValue)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion</CardTitle>
            <CardDescription>Pipeline conversion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Conversion Rate</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {formatPercent(dashboard.conversionMetrics.conversionRate)}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-indigo-600 to-purple-600"
                  style={{ width: `${dashboard.conversionMetrics.conversionRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                <span>{dashboard.conversionMetrics.convertedLeads} converted</span>
                <span>{dashboard.conversionMetrics.totalLeads} total leads</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New</span>
                <Badge variant="secondary">
                  {dashboard.conversionMetrics.leadsByStatus.NEW}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Contacted</span>
                <Badge variant="secondary">
                  {dashboard.conversionMetrics.leadsByStatus.CONTACTED}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Qualified</span>
                <Badge className="bg-blue-600">
                  {dashboard.conversionMetrics.leadsByStatus.QUALIFIED}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Unqualified</span>
                <Badge variant="destructive">
                  {dashboard.conversionMetrics.leadsByStatus.UNQUALIFIED}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Converted</span>
                <Badge className="bg-green-600">
                  {dashboard.conversionMetrics.leadsByStatus.CONVERTED}
                </Badge>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-indigo-50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <p className="text-sm text-indigo-900">
                  Avg. time to conversion:{" "}
                  <span className="font-semibold">
                    {dashboard.conversionMetrics.averageTimeToConversion} days
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Velocity */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Velocity</CardTitle>
          <CardDescription>Deal cycle time and momentum</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-lg bg-linear-to-br from-indigo-50 to-purple-50">
              <p className="text-sm font-medium text-gray-700">Avg. Deal Cycle</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {dashboard.salesVelocity.averageDealCycle}
                <span className="text-lg text-gray-600 ml-1">days</span>
              </p>
            </div>

            <div className="p-4 rounded-lg bg-linear-to-br from-green-50 to-emerald-50">
              <p className="text-sm font-medium text-gray-700">This Month</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {dashboard.salesVelocity.dealsClosedThisMonth}
                <span className="text-lg text-gray-600 ml-1">deals</span>
              </p>
            </div>

            <div className="p-4 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50">
              <p className="text-sm font-medium text-gray-700">MoM Growth</p>
              <div className="flex items-center gap-2 mt-2">
                {dashboard.salesVelocity.monthOverMonthGrowth >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
                <p className={`text-3xl font-bold ${
                  dashboard.salesVelocity.monthOverMonthGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
                  {formatPercent(Math.abs(dashboard.salesVelocity.monthOverMonthGrowth))}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-linear-to-br from-orange-50 to-amber-50">
              <p className="text-sm font-medium text-gray-700">Velocity</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {dashboard.salesVelocity.velocity}
                <span className="text-lg text-gray-600 ml-1">deals/day</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Health */}
      {dashboard.pipelineHealth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Health</CardTitle>
            <CardDescription>Stage distribution and bottlenecks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {dashboard.pipelineHealth.map((pipeline) => (
                <div key={pipeline.pipelineId} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pipeline.pipelineName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {pipeline.totalDeals} deals • {formatCurrency(pipeline.totalValue)} •
                        Avg. {formatPercent(pipeline.averageProbability * 100)} probability
                      </p>
                    </div>
                  </div>

                  {/* Stage Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {pipeline.stageDistribution.map((stage) => (
                      <div
                        key={stage.stageId}
                        className="p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          {stage.stageName}
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {stage.dealCount}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(stage.totalValue)}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>{formatPercent(stage.avgProbability * 100)}</span>
                          <span>{stage.avgDaysInStage}d</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottlenecks */}
                  {pipeline.bottlenecks.length > 0 && (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <p className="font-semibold text-amber-900">
                          Bottlenecks Detected
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pipeline.bottlenecks.map((bottleneck) => (
                          <div
                            key={bottleneck.stageId}
                            className="p-3 rounded-lg bg-white"
                          >
                            <p className="font-medium text-gray-900">
                              {bottleneck.stageName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {bottleneck.dealCount} deals stuck for avg.{" "}
                              {bottleneck.avgDaysInStage} days
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Deals */}
        <Card>
          <CardHeader>
            <CardTitle>Top Deals by Value</CardTitle>
            <CardDescription>Highest value opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.topPerformers.topDealsByValue.slice(0, 5).map((deal, index) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{deal.title}</p>
                      <p className="text-sm text-gray-600">{deal.contactName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(deal.value)}
                    </p>
                    <Badge className="mt-1">
                      {formatPercent(deal.probability * 100)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contacts</CardTitle>
            <CardDescription>Highest value relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.topPerformers.topContacts.slice(0, 5).map((contact, index) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-600">
                        {contact.totalDeals} deals
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(contact.totalValue)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Avg: {formatCurrency(contact.avgDealValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Wins */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Wins</CardTitle>
          <CardDescription>Recently closed high-probability deals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.topPerformers.recentWins.slice(0, 6).map((deal) => (
              <div
                key={deal.id}
                className="p-4 rounded-lg border border-green-200 bg-green-50 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900">{deal.title}</p>
                  <div className="p-1 rounded-full bg-green-100">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{deal.contactName}</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(deal.value)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(deal.closedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
