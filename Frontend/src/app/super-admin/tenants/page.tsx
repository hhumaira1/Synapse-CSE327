"use client";

import { useEffect, useState } from "react";
import { superAdminApi } from "@/lib/super-admin/api";
import type { Tenant } from "@/lib/super-admin/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Eye,
  Building2,
  Users,
  Contact,
  TrendingUp,
  Briefcase,
  Ticket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [toggleDialog, setToggleDialog] = useState<Tenant | null>(null);
  const limit = 20;

  useEffect(() => {
    loadTenants();
  }, [search, typeFilter, statusFilter, page]);

  async function loadTenants() {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (search) params.search = search;
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.isActive = statusFilter === "active";

      const data = await superAdminApi.getTenants(params);
      setTenants(data.tenants);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to load tenants:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(tenant: Tenant) {
    try {
      await superAdminApi.toggleTenantStatus(tenant.id);
      setToggleDialog(null);
      loadTenants();
    } catch (error) {
      console.error("Failed to toggle tenant status:", error);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Tenants
          </h1>
          <p className="mt-2 text-gray-600">
            Manage all tenants across the platform
          </p>
        </div>
        <Link href="/super-admin/tenants/create">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Create Tenant
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or slug..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tenant Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ORGANIZATION">Organization</SelectItem>
                <SelectItem value="PERSONAL">Personal</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {total} Tenant{total !== 1 ? "s" : ""}
            </span>
            <Badge variant="outline" className="text-sm font-normal">
              Page {page} of {totalPages || 1}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No tenants found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {search || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first tenant"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-center">Contacts</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead className="text-center">Deals</TableHead>
                    <TableHead className="text-center">Tickets</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id} className="hover:bg-purple-50/50">
                      <TableCell>
                        <div>
                          <div className="font-semibold text-gray-900">{tenant.name}</div>
                          <div className="text-sm text-gray-500">{tenant.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {tenant.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tenant.isActive ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="font-semibold">{tenant.stats?.users || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Contact className="h-3 w-3 text-gray-400" />
                          <span className="font-semibold">{tenant.stats?.contacts || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3 text-gray-400" />
                          <span className="font-semibold">{tenant.stats?.leads || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Briefcase className="h-3 w-3 text-gray-400" />
                          <span className="font-semibold">{tenant.stats?.deals || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Ticket className="h-3 w-3 text-gray-400" />
                          <span className="font-semibold">{tenant.stats?.tickets || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={tenant.isActive}
                          onCheckedChange={() => setToggleDialog(tenant)}
                        />
                      </TableCell>
                      <TableCell>
                        <Link href={`/super-admin/tenants/${tenant.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toggle Confirmation Dialog */}
      <Dialog open={!!toggleDialog} onOpenChange={() => setToggleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toggleDialog?.isActive ? "Deactivate" : "Activate"} Tenant
            </DialogTitle>
            <DialogDescription>
              {toggleDialog?.isActive
                ? "This will prevent all users in this tenant from accessing the system."
                : "This will restore access for all users in this tenant."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-semibold text-gray-900">
              Tenant: {toggleDialog?.name}
            </p>
            <p className="text-sm text-gray-500">Slug: {toggleDialog?.slug}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => toggleDialog && handleToggleStatus(toggleDialog)}
              className={
                toggleDialog?.isActive
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {toggleDialog?.isActive ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
