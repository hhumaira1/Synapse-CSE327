"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePortalApiClient } from "@/lib/portal-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CreatePortalTicketDialog } from "@/components/portal/CreatePortalTicketDialog";
import { PortalTicketDetailDialog } from "@/components/portal/PortalTicketDetailDialog";

interface PortalTicket {
  id: string;
  title: string;
  description: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdAt: string;
  _count?: {
    comments: number;
  };
}

export default function PortalTicketsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const portalApiClient = usePortalApiClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["portal-tickets"],
    queryFn: async () => {
      const response = await portalApiClient.get<PortalTicket[]>("/tickets");
      return response.data;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500";
      case "IN_PROGRESS":
        return "bg-purple-500";
      case "RESOLVED":
        return "bg-green-500";
      case "CLOSED":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
            Support Tickets
          </h1>
          <p className="text-gray-600 mt-1">
            Submit and track your support requests
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-linear-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your tickets...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tickets.length === 0 && (
        <Card className="p-12 text-center border-2 border-dashed">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 rounded-full bg-linear-to-r from-[#6366f1] to-[#a855f7] flex items-center justify-center mx-auto">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">No tickets yet</h3>
            <p className="text-muted-foreground">
              Need help? Submit your first support ticket and we&apos;ll get back to
              you as soon as possible.
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-linear-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Ticket
            </Button>
          </div>
        </Card>
      )}

      {/* Tickets List */}
      {!isLoading && tickets.length > 0 && (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedTicketId(ticket.id)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {ticket.title}
                    </h3>
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {ticket.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      className={`${getStatusColor(ticket.status)} text-white`}
                    >
                      {ticket.status.replace("_", " ")}
                    </Badge>
                    <Badge
                      className={`${getPriorityColor(ticket.priority)} text-white`}
                    >
                      {ticket.priority}
                    </Badge>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{ticket._count?.comments || 0} replies</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(ticket.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreatePortalTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
        }}
      />

      {/* Ticket Detail Dialog */}
      <PortalTicketDetailDialog
        open={selectedTicketId !== null}
        onOpenChange={(open) => !open && setSelectedTicketId(null)}
        ticketId={selectedTicketId}
      />
    </div>
  );
}
