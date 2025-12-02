"use client";

import { useEffect, useState } from "react";
import { superAdminApi } from "@/lib/super-admin/api";
import type { SystemOverview, TenantGrowth } from "@/lib/super-admin/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  Contact,
  TrendingUp,
  Ticket,
  Briefcase,
  UserCheck,
  Activity,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SuperAdminDashboard() {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [growth, setGrowth] = useState<TenantGrowth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [overviewData, growthData] = await Promise.all([
        superAdminApi.getOverview(),
        superAdminApi.getTenantGrowth(6),
      ]);
      setOverview(overviewData);
      setGrowth(growthData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Tenants",
      value: overview?.totalTenants || 0,
      change: overview?.newTenantsThisMonth || 0,
      icon: Building2,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Active Tenants",
      value: overview?.activeTenants || 0,
      subtitle: `${overview?.inactiveTenants || 0} inactive`,
      icon: Activity,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Total Users",
      value: overview?.totalUsers || 0,
      change: overview?.newUsersThisMonth || 0,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Contacts",
      value: overview?.totalContacts || 0,
      icon: Contact,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      title: "Leads",
      value: overview?.totalLeads || 0,
      icon: TrendingUp,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600",
    },
    {
      title: "Deals",
      value: overview?.totalDeals || 0,
      icon: Briefcase,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      title: "Tickets",
      value: overview?.totalTickets || 0,
      icon: Ticket,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      title: "Growth Rate",
      value: calculateGrowthRate(growth),
      subtitle: "Last 6 months",
      icon: ArrowUp,
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      textColor: "text-teal-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          System Overview
        </h1>
        <p className="mt-2 text-gray-600">
          Monitor platform-wide metrics and tenant activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stat.value.toLocaleString()}
              </div>
              {stat.change !== undefined && stat.change > 0 && (
                <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                  <ArrowUp className="h-4 w-4" />
                  <span>+{stat.change} this month</span>
                </div>
              )}
              {stat.subtitle && (
                <p className="mt-2 text-sm text-gray-500">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tenant Growth Chart */}
      {growth.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">
              Tenant Growth (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4 h-64">
              {growth.map((item, index) => {
                const maxCount = Math.max(...growth.map((g) => g.count));
                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500 hover:from-purple-600 hover:to-purple-500"
                        style={{ height: `${height}%`, minHeight: item.count > 0 ? "20px" : "0px" }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-900">
                        {item.count}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      {new Date(item.month + "-01").toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <a
            href="/super-admin/tenants/create"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
          >
            Create New Tenant
          </a>
          <a
            href="/super-admin/tenants"
            className="px-6 py-3 bg-white text-purple-600 border-2 border-purple-200 rounded-lg font-semibold hover:bg-purple-50 transition-all"
          >
            View All Tenants
          </a>
          <a
            href="/super-admin/audit-logs"
            className="px-6 py-3 bg-white text-purple-600 border-2 border-purple-200 rounded-lg font-semibold hover:bg-purple-50 transition-all"
          >
            View Audit Logs
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateGrowthRate(growth: TenantGrowth[]): string {
  if (growth.length < 2) return "N/A";
  const total = growth.reduce((sum, item) => sum + item.count, 0);
  const avg = total / growth.length;
  return `+${Math.round(avg)}`;
}
