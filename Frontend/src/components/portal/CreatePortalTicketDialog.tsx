"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePortalApiClient } from "@/lib/portal-api";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CreatePortalTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePortalTicketDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePortalTicketDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const portalApiClient = usePortalApiClient();

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a ticket subject");
      return;
    }

    if (!description.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    setLoading(true);

    try {
      await portalApiClient.post("/tickets", {
        title: title.trim(),
        description: description.trim(),
      });

      toast.success("Ticket submitted successfully! We'll get back to you soon.");
      await queryClient.invalidateQueries({ queryKey: ["portal-tickets"] });
      await queryClient.refetchQueries({ queryKey: ["portal-tickets"] });
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to create ticket:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit ticket";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Submit Support Ticket</DialogTitle>
          <DialogDescription>
            Describe your issue and our support team will assist you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="title">Subject *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your issue"
              required
              minLength={5}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 5 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible about your issue..."
              rows={6}
              required
              minLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters. Include steps to reproduce the issue if applicable.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Our support team will review your ticket and respond within 24 hours. 
              You&apos;ll receive email notifications for any updates.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-linear-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
