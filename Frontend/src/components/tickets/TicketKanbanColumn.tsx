"use client";

import { Badge } from "@/components/ui/badge";
import { TicketCard } from "./TicketCard";

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  source: string;
  contact: {
    firstName: string;
    lastName: string;
    email: string | null;
  };
  assignedUser: {
    name: string | null;
  } | null;
  _count: {
    comments: number;
  };
  createdAt: string;
}

interface TicketKanbanColumnProps {
  status: string;
  label: string;
  color: string;
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: string) => void;
  onTicketClick: (ticket: Ticket) => void;
}

export function TicketKanbanColumn({
  status,
  label,
  color,
  tickets,
  onTicketClick,
}: TicketKanbanColumnProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          <h3 className="font-semibold text-gray-900">{label}</h3>
        </div>
        <Badge variant="outline" className="bg-white">
          {tickets.length}
        </Badge>
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">
            No tickets in {label.toLowerCase()}
          </p>
        ) : (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick(ticket)}
            />
          ))
        )}
      </div>
    </div>
  );
}
