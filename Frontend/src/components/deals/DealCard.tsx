"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, DollarSign, User, Calendar, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Deal, getProbabilityColor, getProbabilityLabel } from "@/types/deal";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: () => void;
}

export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  const [deleting, setDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Deal?",
      html: `
        <p>Are you sure you want to delete <strong>${deal.title}</strong>?</p>
        <p class="text-sm text-gray-600 mt-2">This will also delete all related interactions and tickets.</p>
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
        await apiClient.delete(`/deals/${deal.id}`);
        toast.success("Deal deleted successfully");
        onDelete();
      } catch (error: unknown) {
        console.error("Failed to delete deal:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete deal";
        toast.error(errorMessage);
      } finally {
        setDeleting(false);
      }
    }
  };

  const probabilityPercent = Math.round(deal.probability * 100);
  const probabilityColorClass = getProbabilityColor(deal.probability);
  const probabilityLabel = getProbabilityLabel(deal.probability);

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
          <h4 className="font-semibold text-sm line-clamp-1">{deal.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(deal)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} disabled={deleting} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact */}
        {deal.contact && (
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
            <User className="h-3 w-3" />
            <span className="line-clamp-1">
              {deal.contact.firstName} {deal.contact.lastName}
            </span>
          </div>
        )}

        {/* Value */}
        <div className="flex items-center gap-1 text-sm font-bold text-green-600 mb-2">
          <DollarSign className="h-4 w-4" />
          <span>${deal.value.toLocaleString()}</span>
        </div>

        {/* Probability */}
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-3 w-3 text-gray-500" />
          <Badge className={`text-xs ${probabilityColorClass}`}>
            {probabilityPercent}% - {probabilityLabel}
          </Badge>
        </div>

        {/* Expected Close Date */}
        {deal.expectedCloseDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <Calendar className="h-3 w-3" />
            <span>Close: {format(new Date(deal.expectedCloseDate), "MMM d, yyyy")}</span>
          </div>
        )}

        {/* Notes */}
        {deal.notes && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-2 pt-2 border-t">
            {deal.notes}
          </p>
        )}

        {/* Lead Source */}
        {deal.lead && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-blue-600">
              From Lead: {deal.lead.title}
            </p>
            <p className="text-xs text-gray-500">Source: {deal.lead.source}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
