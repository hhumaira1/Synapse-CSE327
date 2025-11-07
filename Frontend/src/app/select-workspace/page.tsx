"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building,
  Users,
  Loader2,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import toast from "react-hot-toast";

interface WorkspaceOption {
  type: "tenant" | "portal";
  id: string;
  name: string;
  description: string;
  path: string;
}

export default function SelectWorkspacePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const apiClient = useApiClient();

  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);

  const fetchWorkspaceOptions = useCallback(async () => {
    try {
      setLoading(true);
      const options: WorkspaceOption[] = [];

      // Check for tenant workspace (CRM access)
      try {
        const userResponse = await apiClient.get("/auth/me");
        if (userResponse.data) {
          options.push({
            type: "tenant",
            id: userResponse.data.tenantId,
            name: "My Workspace",
            description: "Manage your business, contacts, deals, and team",
            path: "/dashboard",
          });
        }
      } catch {
        console.log("No tenant workspace found");
      }

      // Check for portal customer access
      try {
        const portalResponse = await apiClient.get("/portal/customers/my-access");
        if (portalResponse.data && portalResponse.data.length > 0) {
          options.push({
            type: "portal",
            id: "portal",
            name: "Customer Portal",
            description: `Access to ${portalResponse.data.length} vendor portal${portalResponse.data.length > 1 ? "s" : ""}`,
            path: "/portal/dashboard",
          });
        }
      } catch {
        console.log("No portal access found");
      }

      setWorkspaces(options);

      // Auto-redirect if only one option
      if (options.length === 1) {
        router.push(options[0].path);
      } else if (options.length === 0) {
        router.push("/onboard");
      }
    } catch {
      console.error("Failed to fetch workspace options");
      toast.error("Failed to load workspace options");
    } finally {
      setLoading(false);
    }
  }, [apiClient, router]);

  useEffect(() => {
    const checkAccess = async () => {
      if (isLoaded && !isSignedIn) {
        router.push("/sign-in?redirect_url=/select-workspace");
        return;
      }

      if (isLoaded && isSignedIn) {
        await fetchWorkspaceOptions();
      }
    };

    checkAccess();
  }, [isLoaded, isSignedIn, router, fetchWorkspaceOptions]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back! 👋
          </h1>
          <p className="text-gray-600">
            Choose which workspace you&apos;d like to access
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workspaces.map((workspace) => (
            <Card
              key={workspace.id}
              className="hover:shadow-xl transition-all duration-200 cursor-pointer border-2 hover:border-indigo-500"
              onClick={() => router.push(workspace.path)}
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  {workspace.type === "tenant" ? (
                    <div className="p-4 bg-linear-to-r from-indigo-100 to-purple-100 rounded-full">
                      <Building className="h-12 w-12 text-indigo-600" />
                    </div>
                  ) : (
                    <div className="p-4 bg-linear-to-r from-green-100 to-blue-100 rounded-full">
                      <Users className="h-12 w-12 text-green-600" />
                    </div>
                  )}

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {workspace.name}
                    </h2>
                    <p className="text-gray-600">{workspace.description}</p>
                  </div>

                  <Button
                    className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(workspace.path);
                    }}
                  >
                    {workspace.type === "tenant" ? (
                      <>
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Go to Dashboard
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Go to Portal
                      </>
                    )}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
