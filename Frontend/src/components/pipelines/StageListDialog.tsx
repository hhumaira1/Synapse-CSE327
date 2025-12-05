"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, Trash2, Edit2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Stage {
  id: string;
  name: string;
  order: number;
  _count?: {
    deals: number;
  };
}

interface Pipeline {
  id: string;
  name: string;
}

interface StageListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: Pipeline;
  onUpdate: () => void;
}

interface SortableStageItemProps {
  stage: Stage;
  onEdit: (stage: Stage) => void;
  onDelete: (stage: Stage) => void;
}

function SortableStageItem({ stage, onEdit, onDelete }: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-card p-3 hover:bg-accent/50"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{stage.name}</p>
        {stage._count && (
          <p className="text-xs text-muted-foreground">
            {stage._count.deals} {stage._count.deals === 1 ? "deal" : "deals"}
          </p>
        )}
      </div>
      <Badge variant="outline">Order: {stage.order}</Badge>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onEdit(stage)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onDelete(stage)}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function StageListDialog({ open, onOpenChange, pipeline, onUpdate }: StageListDialogProps) {
  const [addingStage, setAddingStage] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [deletingStage, setDeletingStage] = useState<Stage | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [editStageName, setEditStageName] = useState("");
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch stages with React Query caching
  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['stages', pipeline.id],
    queryFn: async () => {
      const response = await apiClient.get(`/stages?pipelineId=${pipeline.id}`);
      return response.data as Stage[];
    },
    enabled: open, // Only fetch when dialog is open
    staleTime: 0, // Always refetch for fresh data
    refetchOnMount: true,
  });

  // Add stage mutation
  const addStageMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiClient.post("/stages", {
        name: name.trim(),
        pipelineId: pipeline.id,
      });
    },
    onSuccess: async () => {
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ['stages', pipeline.id] });
      await queryClient.refetchQueries({ queryKey: ['stages', pipeline.id] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success("Stage added successfully");
      setNewStageName("");
      setAddingStage(false);
      onUpdate();
    },
    onError: (error: unknown) => {
      console.error("Failed to add stage:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add stage";
      toast.error(errorMessage);
    },
  });

  // Update stage mutation
  const updateStageMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return apiClient.patch(`/stages/${id}`, { name: name.trim() });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stages', pipeline.id] });
      await queryClient.refetchQueries({ queryKey: ['stages', pipeline.id] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success("Stage updated successfully");
      setEditingStage(null);
      setEditStageName("");
      onUpdate();
    },
    onError: (error: unknown) => {
      console.error("Failed to update stage:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update stage";
      toast.error(errorMessage);
    },
  });

  // Delete stage mutation
  const deleteStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      return apiClient.delete(`/stages/${stageId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stages', pipeline.id] });
      await queryClient.refetchQueries({ queryKey: ['stages', pipeline.id] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success("Stage deleted successfully");
      onUpdate();
    },
    onError: (error: unknown) => {
      console.error("Failed to delete stage:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete stage";
      toast.error(errorMessage);
    },
  });

  // Reorder stages mutation
  const reorderStagesMutation = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      return apiClient.patch("/stages/reorder", { stages: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages', pipeline.id] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success("Stages reordered successfully");
      onUpdate();
    },
    onError: (error: unknown) => {
      console.error("Failed to reorder stages:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reorder stages";
      toast.error(errorMessage);
      // Refetch to revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['stages', pipeline.id] });
    },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);

      const newStages = arrayMove(stages, oldIndex, newIndex);
      const updates = newStages.map((stage, index) => ({
        id: stage.id,
        order: index,
      }));

      // Optimistic update
      queryClient.setQueryData(['stages', pipeline.id], newStages);
      
      // Execute mutation
      reorderStagesMutation.mutate(updates);
    }
  };

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    addStageMutation.mutate(newStageName);
  };

  const handleEditStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage || !editStageName.trim()) return;
    updateStageMutation.mutate({ id: editingStage.id, name: editStageName });
  };

  const handleDeleteStage = (stage: Stage) => {
    setDeletingStage(stage);
  };

  const confirmDelete = () => {
    if (deletingStage) {
      deleteStageMutation.mutate(deletingStage.id);
      setDeletingStage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Stages - {pipeline.name}</DialogTitle>
          <DialogDescription>
            Add, edit, delete, or reorder stages by dragging them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading stages...</p>
          ) : stages.length === 0 ? (
            <p className="text-center text-muted-foreground">No stages yet. Add your first stage below.</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stages.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {stages.map((stage) => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      onEdit={(s) => {
                        setEditingStage(s);
                        setEditStageName(s.name);
                      }}
                      onDelete={handleDeleteStage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {editingStage && (
            <form onSubmit={handleEditStage} className="flex gap-2">
              <Input
                value={editStageName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditStageName(e.target.value)}
                placeholder="Stage name"
                required
              />
              <Button type="submit">Save</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingStage(null);
                  setEditStageName("");
                }}
              >
                Cancel
              </Button>
            </form>
          )}

          {addingStage ? (
            <form onSubmit={handleAddStage} className="space-y-2">
              <Label htmlFor="new-stage-name">New Stage Name</Label>
              <div className="flex gap-2">
                <Input
                  id="new-stage-name"
                  value={newStageName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStageName(e.target.value)}
                  placeholder="e.g., Prospecting, Proposal, Negotiation"
                  required
                />
                <Button type="submit">Add</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddingStage(false);
                    setNewStageName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={() => setAddingStage(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Stage
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={!!deletingStage} onOpenChange={() => setDeletingStage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingStage && (
                <>
                  Are you sure you want to delete <strong>{deletingStage.name}</strong>?
                  {deletingStage._count && deletingStage._count.deals > 0 && (
                    <p className="text-sm text-red-600 mt-2">
                      This stage has {deletingStage._count.deals} deal(s) that will be affected!
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    This action cannot be undone.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
