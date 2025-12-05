"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, List } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { EditPipelineDialog } from "./EditPipelineDialog";
import { StageListDialog } from "./StageListDialog";

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  stages: { id: string }[];
  _count: {
    deals: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface PipelineCardProps {
  pipeline: Pipeline;
  onUpdate: () => void;
  onDelete: () => void;
}

export function PipelineCard({ pipeline, onUpdate, onDelete }: PipelineCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Pipeline?",
      html: `
        <p>Are you sure you want to delete <strong>${pipeline.name}</strong>?</p>
        <p class="text-sm text-gray-600 mt-2">
          This pipeline has ${pipeline.stages.length} stage(s) and ${pipeline._count.deals} deal(s).
        </p>
        ${pipeline._count.deals > 0 ? '<p class="text-sm text-red-600 mt-2">Deleting this pipeline will also delete all associated deals!</p>' : ''}
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/pipelines/${pipeline.id}`);
        toast.success("Pipeline deleted successfully");
        onDelete();
      } catch (error: unknown) {
        console.error("Failed to delete pipeline:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete pipeline";
        toast.error(errorMessage);
      }
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{pipeline.name}</CardTitle>
              <CardDescription className="mt-1">
                {pipeline.description || "No description"}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStageDialogOpen(true)}>
                  <List className="mr-2 h-4 w-4" />
                  Manage Stages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {pipeline.stages.length} {pipeline.stages.length === 1 ? "Stage" : "Stages"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {pipeline._count.deals} {pipeline._count.deals === 1 ? "Deal" : "Deals"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditPipelineDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        pipeline={pipeline}
        onSuccess={onUpdate}
      />

      <StageListDialog
        open={stageDialogOpen}
        onOpenChange={setStageDialogOpen}
        pipeline={pipeline}
        onUpdate={onUpdate}
      />
    </>
  );
}
