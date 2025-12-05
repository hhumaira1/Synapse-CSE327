"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { superAdminApi } from "@/lib/super-admin/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Users,
  Contact,
  TrendingUp,
  Briefcase,
  Ticket,
  Phone,
  MessageSquare,
  Building2,
  Calendar,
  Globe,
  Shield,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function TenantDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenantDetails();
  }, [id]);

  async function loadTenantDetails() {
    try {
      const result = await superAdminApi.getTenantStats(id);
      setData(result);
    } catch (error) {
      console.error("Failed to load tenant details:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Tenant not found
        </h3>
        <Link href="/super-admin/tenants">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenants
          </Button>
        </Link>
      </div>
    );
  }

  const { tenant, stats, recentUsers } = data;

  const statCards = [
    {
      title: "Users",
      value: stats.users,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Contacts",
      value: stats.contacts,
      icon: Contact,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      title: "Leads",
      value: stats.leads,
      icon: TrendingUp,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600",
    },
    {
      title: "Deals",
      value: stats.deals,
      icon: Briefcase,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      title: "Tickets",
      value: stats.tickets,
      icon: Ticket,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/super-admin/tenants">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {tenant.name}
            </h1>
            {tenant.isActive ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                Inactive
              </Badge>
            )}
          </div>
          <p className="mt-2 text-gray-600">/{tenant.slug}</p>
        </div>
      </div>

      {/* Tenant Info Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Tenant Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Type</p>
              <Badge variant="outline" className="font-normal">
                {tenant.type}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="font-semibold">
                {tenant.isActive ? "Active" : "Inactive"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Created</p>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="font-semibold">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {tenant.domain && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Domain</p>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <p className="font-semibold">{tenant.domain}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}
            />
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Users */}
      {recentUsers && recentUsers.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Recent Users ({recentUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user: any) => (
                  <TableRow key={user.id} className="hover:bg-purple-50/50">
                    <TableCell>
                      <div className="font-semibold text-gray-900">
                        {user.firstName || user.lastName
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">{user.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
