"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePortalApiClient } from "@/lib/portal-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket as TicketIcon, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PortalTicketDetailDialog } from "@/components/portal/PortalTicketDetailDialog";
import { CreatePortalTicketDialog } from "@/components/portal/CreatePortalTicketDialog";

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  externalSystem?: string;
  externalId?: string;
  _count: {
    comments: number;
  };
}

export default function PortalTicketsPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const portalApiClient = usePortalApiClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["portal-tickets"],
    queryFn: async () => {
      const response = await portalApiClient.get<Ticket[]>("/tickets");
      return response.data;
    },
  });



  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500";
      case "IN_PROGRESS":
        return "bg-yellow-500";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Support Tickets</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your support tickets
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>

          </div>
        </CardHeader>
      </Card>

      {/* Tickets List */}
      {(!tickets || tickets.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TicketIcon className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tickets yet
            </h3>
            <p className="text-gray-600 mb-6 text-center max-w-sm">
              Create your first support ticket to get help from our team
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>

          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTicketId(ticket.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Title and Badges */}
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{ticket.title}</h3>
                      {ticket.priority === "URGENT" && (
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Badge className={`${getStatusColor(ticket.status)} text-white`}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                      <Badge className={`${getPriorityColor(ticket.priority)} text-white`}>
                        {ticket.priority}
                      </Badge>
                      {ticket.externalSystem === "jira" && (
                        <Badge variant="outline" className="bg-blue-50">
                          🎫 {ticket.externalId}
                        </Badge>
                      )}
                    </div>

                    {/* Description preview */}
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDistanceToNow(new Date(ticket.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{ticket._count.comments} comments</span>
                      </div>
                    </div>
                  </div>


                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Ticket Dialog */}
      <CreatePortalTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => setCreateDialogOpen(false)}
      />

      {/* Ticket Detail Dialog */}
      <PortalTicketDetailDialog
        open={!!selectedTicketId}
        onOpenChange={(open) => !open && setSelectedTicketId(null)}
        ticketId={selectedTicketId}
      />


    </div>
  );
}
