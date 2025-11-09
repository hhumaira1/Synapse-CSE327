"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Ticket as TicketIcon } from "lucide-react";
import toast from "react-hot-toast";
import { CreateTicketDialog } from "@/components/tickets/CreateTicketDialog";
import { TicketKanbanColumn } from "@/components/tickets/TicketKanbanColumn";
import { TicketDetailDialog } from "@/components/tickets/TicketDetailDialog";

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  source: string;
  externalSystem?: string | null;
  externalId?: string | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
  assignedUser: {
    id: string;
    name: string | null;
  } | null;
  deal: {
    id: string;
    title: string;
  } | null;
  _count: {
    comments: number;
  };
  createdAt: string;
}

const STATUS_COLUMNS = [
  { id: "OPEN", label: "Open", color: "bg-blue-500" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-500" },
  { id: "RESOLVED", label: "Resolved", color: "bg-green-500" },
  { id: "CLOSED", label: "Closed", color: "bg-gray-500" },
] as const;

export default function TicketsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const response = await apiClient.get<Ticket[]>("/tickets");
      return response.data;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiClient.patch(`/tickets/${id}`, { status });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
      await queryClient.refetchQueries({ queryKey: ["tickets"] });
      toast.success("Ticket updated successfully");
    },
    onError: (error: unknown) => {
      console.error("Failed to update ticket:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update ticket";
      toast.error(errorMessage);
    },
  });

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    updateTicketMutation.mutate({ id: ticketId, status: newStatus });
  };

  const handleTicketCreated = async () => {
    await queryClient.refetchQueries({ queryKey: ["tickets"] });
    setCreateDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-1">Manage customer support tickets</p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-linear-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Kanban Board */}
      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <TicketIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No tickets yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first ticket to start tracking customer issues
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-linear-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((column) => (
            <TicketKanbanColumn
              key={column.id}
              status={column.id}
              label={column.label}
              color={column.color}
              tickets={tickets.filter((t) => t.status === column.id)}
              onStatusChange={handleStatusChange}
              onTicketClick={(ticket) => setSelectedTicketId(ticket.id)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleTicketCreated}
      />

      <TicketDetailDialog
        open={!!selectedTicketId}
        onOpenChange={(open: boolean) => !open && setSelectedTicketId(null)}
        ticketId={selectedTicketId}
      />
    </div>
  );
}
