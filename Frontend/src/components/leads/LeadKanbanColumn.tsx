"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Lead, LeadStatus, LEAD_STATUS_CONFIG } from "@/types/lead";
import { LeadCard } from "./LeadCard";

interface LeadKanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onDelete: () => void;
}

export function LeadKanbanColumn({ status, leads, onEdit, onConvert, onDelete }: LeadKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const config = LEAD_STATUS_CONFIG[status];
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={`rounded-t-lg p-4 border-2 ${config.color}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm">{config.label}</h3>
          <span className="text-xs font-medium bg-white/50 px-2 py-1 rounded">
            {leads.length}
          </span>
        </div>
        <p className="text-xs opacity-75">{config.description}</p>
        <p className="text-xs font-medium mt-2">
          Total: ${totalValue.toLocaleString()}
        </p>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 bg-gray-50 border-2 border-t-0 rounded-b-lg min-h-[200px] transition-colors ${
          isOver ? "bg-blue-50 border-blue-300" : "border-gray-200"
        }`}
      >
        <SortableContext
          items={leads.map((lead) => lead.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No leads in {config.label.toLowerCase()}
            </div>
          ) : (
            leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEdit={onEdit}
                onConvert={onConvert}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
