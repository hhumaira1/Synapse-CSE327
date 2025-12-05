"use client";

import { useEffect, useState } from "react";
import { superAdminApi } from "@/lib/super-admin/api";
import type { AuditLog } from "@/lib/super-admin/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Target,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_TYPES = [
  "all",
  "CREATE_TENANT",
  "UPDATE_TENANT",
  "DELETE_TENANT",
  "ACTIVATE_TENANT",
  "DEACTIVATE_TENANT",
  "CREATE_USER",
  "UPDATE_USER",
  "DELETE_USER",
];

const TARGET_TYPES = ["all", "TENANT", "USER", "SETTING"];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [actionFilter, setActionFilter] = useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    loadLogs();
  }, [actionFilter, targetTypeFilter, searchQuery, startDate, endDate, page]);

  async function loadLogs() {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (actionFilter !== "all") params.action = actionFilter;
      if (targetTypeFilter !== "all") params.targetType = targetTypeFilter;
      if (searchQuery) params.superAdminId = searchQuery;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await superAdminApi.getAuditLogs(params);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: "csv" | "json") {
    try {
      setExporting(true);
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.format = format;

      const blob = await superAdminApi.exportAuditLogs(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export audit logs:", error);
    } finally {
      setExporting(false);
    }
  }

  function getActionBadgeColor(action: string) {
    if (action.includes("CREATE")) return "bg-green-100 text-green-700";
    if (action.includes("DELETE")) return "bg-red-100 text-red-700";
    if (action.includes("UPDATE")) return "bg-blue-100 text-blue-700";
    if (action.includes("ACTIVATE")) return "bg-emerald-100 text-emerald-700";
    if (action.includes("DEACTIVATE")) return "bg-orange-100 text-orange-700";
    return "bg-gray-100 text-gray-700";
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Audit Logs
          </h1>
          <p className="mt-2 text-gray-600">
            Track all super admin actions for security and compliance
          </p>
        </div>
        <Button
          onClick={() => handleExport("csv")}
          disabled={exporting}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Action Type
              </label>
              <Select
                value={actionFilter}
                onValueChange={(value) => {
                  setActionFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action === "all" ? "All Actions" : action.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              {total} Log{total !== 1 ? "s" : ""}
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
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No audit logs found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {startDate || endDate || actionFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Audit logs will appear here as actions are performed"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-purple-50/50">
                      <TableCell className="font-mono text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {log.superAdmin.firstName || log.superAdmin.lastName
                              ? `${log.superAdmin.firstName || ""} ${log.superAdmin.lastName || ""}`.trim()
                              : "Admin"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.superAdmin.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.targetType}</div>
                          {log.targetId && (
                            <div className="text-xs text-gray-500 font-mono">
                              {log.targetId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-gray-600">
                          {log.ipAddress || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.metadata && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-purple-600 hover:text-purple-700">
                              View
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-w-xs">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
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
    </div>
  );
}
