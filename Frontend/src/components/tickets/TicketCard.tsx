"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MessageSquare, User, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

const PRIORITY_STYLES = {
  URGENT: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LOW: "bg-green-100 text-green-700 border-green-200",
};

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4"
      style={{
        borderLeftColor:
          ticket.priority === "URGENT"
            ? "#ef4444"
            : ticket.priority === "HIGH"
            ? "#f97316"
            : ticket.priority === "MEDIUM"
            ? "#eab308"
            : "#22c55e",
      }}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Priority Badge */}
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className={PRIORITY_STYLES[ticket.priority]}
          >
            {ticket.priority === "URGENT" && (
              <AlertCircle className="h-3 w-3 mr-1" />
            )}
            {ticket.priority}
          </Badge>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-gray-900 line-clamp-2">
          {ticket.title}
        </h4>

        {/* Description */}
        {ticket.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {ticket.description}
          </p>
        )}

        {/* Contact */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User className="h-4 w-4" />
          <span className="truncate">
            {ticket.contact.firstName} {ticket.contact.lastName}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(ticket.createdAt), {
              addSuffix: true,
            })}
          </div>

          {ticket._count.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {ticket._count.comments}
            </div>
          )}
        </div>

        {/* Assigned User */}
        {ticket.assignedUser && (
          <div className="text-xs text-gray-500">
            Assigned to: {ticket.assignedUser.name || "Unassigned"}
          </div>
        )}
      </div>
    </Card>
  );
}
