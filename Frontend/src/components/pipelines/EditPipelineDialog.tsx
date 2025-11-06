"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
}

interface EditPipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: Pipeline;
  onSuccess: () => void;
}

export function EditPipelineDialog({ open, onOpenChange, pipeline, onSuccess }: EditPipelineDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: pipeline.name,
    description: pipeline.description || "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: pipeline.name,
        description: pipeline.description || "",
      });
    }
  }, [open, pipeline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.name.trim().length < 2) {
      toast.error("Pipeline name must be at least 2 characters");
      return;
    }
    
    if (formData.name.trim().length > 100) {
      toast.error("Pipeline name must be less than 100 characters");
      return;
    }
    
    if (formData.description && formData.description.length > 500) {
      toast.error("Description must be less than 500 characters");
      return;
    }

    setLoading(true);
    try {
      await apiClient.patch(`/pipelines/${pipeline.id}`, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      toast.success("Pipeline updated successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to update pipeline:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update pipeline";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Pipeline</DialogTitle>
          <DialogDescription>
            Update the pipeline name and description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sales Pipeline, Enterprise Deals"
              required
              minLength={2}
              maxLength={100}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              {formData.name.length}/100 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the purpose of this pipeline..."
              maxLength={500}
              rows={3}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              {formData.description.length}/500 characters
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
