"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Deal } from "@/types/deal";

interface EditDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal;
  onSuccess: () => void;
}

export function EditDealDialog({ open, onOpenChange, deal, onSuccess }: EditDealDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: deal.title,
    value: deal.value.toString(),
    probability: Math.round(deal.probability * 100).toString(),
    expectedCloseDate: deal.expectedCloseDate 
      ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
      : "",
    notes: deal.notes || "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        title: deal.title,
        value: deal.value.toString(),
        probability: Math.round(deal.probability * 100).toString(),
        expectedCloseDate: deal.expectedCloseDate 
          ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
          : "",
        notes: deal.notes || "",
      });
    }
  }, [open, deal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const value = parseFloat(formData.value);
    if (isNaN(value) || value < 0) {
      toast.error("Please enter a valid value");
      return;
    }

    const probability = parseInt(formData.probability);
    if (isNaN(probability) || probability < 0 || probability > 100) {
      toast.error("Probability must be between 0 and 100");
      return;
    }

    setLoading(true);
    try {
      await apiClient.patch(`/deals/${deal.id}`, {
        title: formData.title.trim(),
        value,
        probability,
        expectedCloseDate: formData.expectedCloseDate || undefined,
        notes: formData.notes.trim() || undefined,
      });

      toast.success("Deal updated successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to update deal:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update deal";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
          <DialogDescription>
            Update deal information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Enterprise License Deal"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Value */}
            <div className="space-y-2">
              <Label htmlFor="edit-value">
                Value ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-value"
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            {/* Probability */}
            <div className="space-y-2">
              <Label htmlFor="edit-probability">
                Probability (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, probability: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Expected Close Date */}
          <div className="space-y-2">
            <Label htmlFor="edit-expectedCloseDate">Expected Close Date</Label>
            <Input
              id="edit-expectedCloseDate"
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, expectedCloseDate: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional information..."
              rows={3}
              disabled={loading}
            />
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
