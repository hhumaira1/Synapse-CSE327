"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Deal, Stage } from "@/types/deal";
import { DealCard } from "./DealCard";

interface DealKanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: () => void;
}

export function DealKanbanColumn({ stage, deals, onEdit, onDelete }: DealKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const avgProbability = deals.length > 0
    ? deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length
    : 0;

  return (
    <div className="flex flex-col h-full min-w-[300px]">
      {/* Column Header */}
      <div className="rounded-t-lg p-4 border-2 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm text-gray-900">{stage.name}</h3>
          <span className="text-xs font-medium bg-white px-2 py-1 rounded shadow-sm">
            {deals.length}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-green-700">
            ${totalValue.toLocaleString()}
          </p>
          {deals.length > 0 && (
            <p className="text-xs text-gray-600">
              Avg: {Math.round(avgProbability * 100)}%
            </p>
          )}
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 bg-gray-50 border-2 border-t-0 rounded-b-lg min-h-[400px] transition-colors ${
          isOver ? "bg-blue-50 border-blue-300" : "border-gray-200"
        }`}
      >
        <SortableContext
          items={deals.map((deal) => deal.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No deals in {stage.name.toLowerCase()}
            </div>
          ) : (
            deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
