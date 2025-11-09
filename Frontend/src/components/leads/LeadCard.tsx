"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, TrendingUp, DollarSign, User, Tag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lead, LEAD_STATUS_CONFIG } from "@/types/lead";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onDelete: () => void;
}

export function LeadCard({ lead, onEdit, onConvert, onDelete }: LeadCardProps) {
  const [deleting, setDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Lead?",
      html: `
        <p>Are you sure you want to delete the lead <strong>${lead.title}</strong>?</p>
        <p class="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setDeleting(true);
      try {
        await apiClient.delete(`/leads/${lead.id}`);
        toast.success("Lead deleted successfully");
        onDelete();
      } catch (error: unknown) {
        console.error("Failed to delete lead:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete lead";
        toast.error(errorMessage);
      } finally {
        setDeleting(false);
      }
    }
  };

  const statusConfig = LEAD_STATUS_CONFIG[lead.status];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-3 cursor-move hover:shadow-md transition-shadow"
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-sm line-clamp-1">{lead.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(lead)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {lead.status !== "CONVERTED" && (
                <DropdownMenuItem onClick={() => onConvert(lead)}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Convert to Deal
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDelete} disabled={deleting} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact */}
        {lead.contact && (
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
            <User className="h-3 w-3" />
            <span className="line-clamp-1">
              {lead.contact.firstName} {lead.contact.lastName}
            </span>
          </div>
        )}

        {/* Value */}
        <div className="flex items-center gap-1 text-sm font-medium text-green-600 mb-2">
          <DollarSign className="h-4 w-4" />
          <span>${lead.value.toLocaleString()}</span>
        </div>

        {/* Source */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <Tag className="h-3 w-3" />
          <span className="line-clamp-1">{lead.source}</span>
        </div>

        {/* Notes */}
        {lead.notes && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{lead.notes}</p>
        )}

        {/* Converted info */}
        {lead.status === "CONVERTED" && lead.deals && lead.deals.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-emerald-600 font-medium">
              Converted to: {lead.deals[0].title}
            </p>
            <p className="text-xs text-gray-500">
              {lead.deals[0].stage.pipeline.name} → {lead.deals[0].stage.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
