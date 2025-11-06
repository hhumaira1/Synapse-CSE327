"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";

interface CreatePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePipelineDialog({ open, onOpenChange, onSuccess }: CreatePipelineDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

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
      await apiClient.post("/pipelines", {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      toast.success("Pipeline created successfully");
      setFormData({ name: "", description: "" });
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to create pipeline:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create pipeline";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Pipeline</DialogTitle>
          <DialogDescription>
            Add a new sales pipeline to organize your deals by stages.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
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
              {loading ? "Creating..." : "Create Pipeline"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
