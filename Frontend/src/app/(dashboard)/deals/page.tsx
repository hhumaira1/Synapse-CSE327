"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, DollarSign } from "lucide-react";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { useUserStatus } from "@/hooks/useUserStatus";
import { Deal, PipelineWithStages, PipelineStats } from "@/types/deal";
import { DealKanbanColumn } from "@/components/deals/DealKanbanColumn";
import { CreateDealDialog } from "@/components/deals/CreateDealDialog";
import { EditDealDialog } from "@/components/deals/EditDealDialog";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

export default function DealsPage() {
  const { userExists } = useUserStatus();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelines, setPipelines] = useState<PipelineWithStages[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (userExists) {
      fetchPipelines();
    }
  }, [userExists]);

  useEffect(() => {
    if (selectedPipelineId) {
      fetchDeals();
      fetchStats();
    }
  }, [selectedPipelineId]);

  const fetchPipelines = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<PipelineWithStages[]>("/pipelines");
      setPipelines(response.data);
      if (response.data.length > 0) {
        setSelectedPipelineId(response.data[0].id);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch pipelines:", error);
      toast.error("Failed to load pipelines");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await apiClient.get<Deal[]>(`/deals?pipelineId=${selectedPipelineId}`);
      setDeals(response.data);
    } catch (error: unknown) {
      console.error("Failed to fetch deals:", error);
      toast.error("Failed to load deals");
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<PipelineStats>(`/deals/stats/${selectedPipelineId}`);
      setStats(response.data);
    } catch (error: unknown) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStageId = over.id as string;
    const deal = deals.find((d) => d.id === dealId);

    if (!deal || deal.stageId === newStageId) return;

    // Optimistic update
    const previousDeals = [...deals];
    setDeals(deals.map((d) => (d.id === dealId ? { ...d, stageId: newStageId } : d)));

    try {
      await apiClient.patch(`/deals/${dealId}/move`, { stageId: newStageId });
      toast.success("Deal moved successfully");
      fetchStats(); // Refresh stats
    } catch (error: unknown) {
      console.error("Failed to move deal:", error);
      toast.error("Failed to move deal");
      setDeals(previousDeals); // Revert on error
    }
  };

  const handleEdit = (deal: Deal) => {
    setSelectedDeal(deal);
    setEditDialogOpen(true);
  };

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);

  // Group deals by stage
  const dealsByStage = selectedPipeline?.stages.reduce(
    (acc, stage) => {
      acc[stage.id] = deals.filter((deal) => deal.stageId === stage.id);
      return acc;
    },
    {} as Record<string, Deal[]>
  ) || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading deals...</p>
        </div>
      </div>
    );
  }

  if (pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <DollarSign className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Pipelines Available</h3>
        <p className="text-gray-600 mb-6">Create a pipeline first to start managing deals</p>
        <Button onClick={() => window.location.href = '/pipelines'}>
          Go to Pipelines
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-600 mt-1">Manage your sales deals</p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-linear-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {/* Pipeline Selector & Stats */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Pipeline:</label>
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Deals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeals}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Badge className="text-lg">%</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Probability</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(stats.averageProbability * 100)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {selectedPipeline?.stages.map((stage) => (
            <DealKanbanColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage[stage.id] || []}
              onEdit={handleEdit}
              onDelete={() => {
                fetchDeals();
                fetchStats();
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-400 opacity-90 w-[280px]">
              <h4 className="font-semibold text-sm">{activeDeal.title}</h4>
              <p className="text-xs text-gray-600">
                {activeDeal.contact?.firstName} {activeDeal.contact?.lastName}
              </p>
              <p className="text-sm font-bold text-green-600 mt-1">
                ${activeDeal.value.toLocaleString()}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      <CreateDealDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          fetchDeals();
          fetchStats();
        }}
        preSelectedPipelineId={selectedPipelineId}
      />

      {selectedDeal && (
        <EditDealDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          deal={selectedDeal}
          onSuccess={() => {
            fetchDeals();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
