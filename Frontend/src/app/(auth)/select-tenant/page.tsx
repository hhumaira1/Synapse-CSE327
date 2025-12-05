/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@/hooks/useUser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Crown, Loader2 } from "lucide-react";

interface TenantAccess {
  id: string;
  name: string;
  slug: string;
  type: "internal" | "customer";
  role: string;
  userId?: string;
  portalCustomerId?: string;
}

export default function SelectTenantPage() {
  const router = useRouter();
  const { isSignedIn, isLoading } = useUser();
  const { getToken } = useAuth();
  const [tenants, setTenants] = useState<TenantAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectTenant = useCallback((tenant: TenantAccess) => {
    // Store selected tenant in localStorage
    localStorage.setItem("selectedTenantId", tenant.id);
    localStorage.setItem("selectedTenantName", tenant.name);
    localStorage.setItem("selectedTenantType", tenant.type);
    localStorage.setItem("selectedTenantRole", tenant.role);

    // Redirect based on tenant type
    if (tenant.type === "internal") {
      router.push("/dashboard");
    } else {
      router.push("/portal");
    }
  }, [router]);

  const fetchTenants = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/my-tenants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tenants");
      }

      const data = await response.json();
      
      // Backend returns array of tenants directly
      const tenantsList: TenantAccess[] = data.map((tenant: any) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
        role: tenant.role,
        userId: tenant.userId,
        portalCustomerId: tenant.portalCustomerId,
      }));
      
      setTenants(tenantsList);

      // If only one tenant, auto-select it
      if (tenantsList.length === 1) {
        selectTenant(tenantsList[0]);
      } else if (tenantsList.length === 0) {
        setError("You don't have access to any workspaces. Please contact your administrator.");
      }
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError("Failed to load workspaces. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getToken, selectTenant]);

  useEffect(() => {
    if (isLoading) return;

    if (!isSignedIn) {
      router.push("/auth/signin");
      return;
    }

    fetchTenants();
  }, [isLoading, isSignedIn, router, fetchTenants]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "MANAGER":
        return "default";
      case "CUSTOMER":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Crown className="h-4 w-4" />;
      case "MANAGER":
      case "MEMBER":
        return <Users className="h-4 w-4" />;
      case "CUSTOMER":
        return <Building2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Select Workspace
          </h1>
          <p className="text-gray-600">
            Choose which workspace you&apos;d like to access
          </p>
        </div>

        {error && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <p className="text-red-600 text-center">{error}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-indigo-200"
              onClick={() => selectTenant(tenant)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      tenant.type === "internal"
                        ? "bg-linear-to-br from-indigo-500 to-purple-500"
                        : "bg-linear-to-br from-blue-500 to-cyan-500"
                    }`}
                  >
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {tenant.name}
                    </h3>
                    <p className="text-sm text-gray-500">@{tenant.slug}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant={getRoleBadgeVariant(tenant.role)}>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(tenant.role)}
                    <span>{tenant.role}</span>
                  </div>
                </Badge>
                <Badge variant="outline">
                  {tenant.type === "internal" ? "Internal Team" : "Customer Portal"}
                </Badge>
              </div>

              <Button
                className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                onClick={() => selectTenant(tenant)}
              >
                Access Workspace
              </Button>
            </Card>
          ))}
        </div>

        {tenants.length > 0 && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              You have access to {tenants.length} workspace{tenants.length > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
