"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { osTicketApi, type OsTicketConfig } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  RefreshCw, 
  Settings,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function OsTicketSettings() {
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch osTicket status
  const { data: status, isLoading } = useQuery({
    queryKey: ["osticket-status"],
    queryFn: osTicketApi.getStatus,
    retry: 1,
  });

  // Setup mutation
  const setupMutation = useMutation({
    mutationFn: (config: OsTicketConfig) => osTicketApi.setup(config),
    onSuccess: () => {
      toast.success("osTicket integration configured successfully!");
      queryClient.invalidateQueries({ queryKey: ["osticket-status"] });
      setBaseUrl("");
      setApiKey("");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to setup osTicket");
    },
  });

  // Disable mutation
  const disableMutation = useMutation({
    mutationFn: osTicketApi.disable,
    onSuccess: () => {
      toast.success("osTicket integration disabled");
      queryClient.invalidateQueries({ queryKey: ["osticket-status"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to disable osTicket");
    },
  });

  // Sync all mutation
  const syncAllMutation = useMutation({
    mutationFn: osTicketApi.syncAll,
    onSuccess: (data) => {
      toast.success(`Successfully synced ${data.synced} tickets from osTicket`);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["osticket-status"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync tickets");
    },
  });

  // Test connection
  const handleTestConnection = async () => {
    if (!baseUrl || !apiKey) {
      toast.error("Please enter both Base URL and API Key");
      return;
    }

    setIsTesting(true);
    try {
      const result = await osTicketApi.testConnection(baseUrl, apiKey);
      if (result.success) {
        toast.success("Connection successful! ✓");
      } else {
        toast.error(result.message || "Connection failed");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to test connection");
    } finally {
      setIsTesting(false);
    }
  };

  // Setup osTicket
  const handleSetup = () => {
    if (!baseUrl || !apiKey) {
      toast.error("Please enter both Base URL and API Key");
      return;
    }

    setupMutation.mutate({
      baseUrl,
      apiKey,
      syncExistingTickets: true,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#a855f7] flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>osTicket Integration</CardTitle>
              <CardDescription>
                Connect your osTicket instance for ticket management
              </CardDescription>
            </div>
          </div>
          {status?.isConfigured && (
            <Badge
              variant={status.isEnabled ? "default" : "secondary"}
              className={
                status.isEnabled
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-500 hover:bg-gray-600"
              }
            >
              {status.isEnabled ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Disabled
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        {status?.isConfigured && (
          <div className="rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50">
            <h4 className="font-semibold text-sm text-gray-900">Current Configuration</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Base URL</p>
                <p className="font-mono text-gray-900 mt-1">{status.baseUrl}</p>
              </div>
              <div>
                <p className="text-gray-600">Synced Tickets</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {status.ticketCount || 0} tickets
                </p>
              </div>
              {status.lastSyncedAt && (
                <div className="col-span-2">
                  <p className="text-gray-600">Last Synced</p>
                  <p className="text-gray-900 mt-1">
                    {new Date(status.lastSyncedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => syncAllMutation.mutate()}
                disabled={syncAllMutation.isPending}
              >
                {syncAllMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync All Tickets
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(status.baseUrl?.replace('/api', ''), '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open osTicket
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => disableMutation.mutate()}
                disabled={disableMutation.isPending}
              >
                {disableMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Disable
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Setup Form */}
        {!status?.isConfigured && (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Setup Instructions</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Deploy osTicket using Docker (see documentation below)</li>
                  <li>Access osTicket admin panel and navigate to: <strong>Admin Panel → Manage → API Keys</strong></li>
                  <li>Create a new API key with permissions: <strong>Create Ticket, View Ticket, Update Ticket</strong></li>
                  <li>Copy the API key and paste it below</li>
                </ol>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">osTicket Base URL</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  placeholder="http://localhost:8080/api"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Include the /api path (e.g., http://your-domain.com/api)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your osTicket API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Generated from osTicket Admin Panel → Manage → API Keys
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !baseUrl || !apiKey}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSetup}
                  disabled={setupMutation.isPending || !baseUrl || !apiKey}
                  className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
                >
                  {setupMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Setup Integration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">
            How It Works
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• All new tickets are created in osTicket first, then cached locally</li>
            <li>• Comments and updates are synced bidirectionally</li>
            <li>• Local cache provides fast reads and offline access</li>
            <li>• osTicket remains the source of truth for all ticket data</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
