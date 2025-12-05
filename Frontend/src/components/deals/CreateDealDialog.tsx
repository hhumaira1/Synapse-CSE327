"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { PipelineWithStages } from "@/types/deal";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preSelectedPipelineId?: string;
}

export function CreateDealDialog({ open, onOpenChange, onSuccess, preSelectedPipelineId }: CreateDealDialogProps) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pipelines, setPipelines] = useState<PipelineWithStages[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    contactId: "",
    pipelineId: preSelectedPipelineId || "",
    stageId: "",
    value: "",
    probability: "50",
    expectedCloseDate: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (preSelectedPipelineId && pipelines.length > 0) {
      const pipeline = pipelines.find((p) => p.id === preSelectedPipelineId);
      if (pipeline && pipeline.stages.length > 0) {
        setFormData((prev) => ({
          ...prev,
          pipelineId: preSelectedPipelineId,
          stageId: pipeline.stages[0].id,
        }));
      }
    }
  }, [preSelectedPipelineId, pipelines]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [contactsRes, pipelinesRes] = await Promise.all([
        apiClient.get<Contact[]>("/contacts"),
        apiClient.get<PipelineWithStages[]>("/pipelines"),
      ]);
      setContacts(contactsRes.data);
      setPipelines(pipelinesRes.data);

      // Auto-select first pipeline and stage if not pre-selected
      if (!preSelectedPipelineId && pipelinesRes.data.length > 0) {
        const firstPipeline = pipelinesRes.data[0];
        setFormData((prev) => ({
          ...prev,
          pipelineId: firstPipeline.id,
          stageId: firstPipeline.stages[0]?.id || "",
        }));
      }
    } catch (error: unknown) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const handlePipelineChange = (pipelineId: string) => {
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    setFormData({
      ...formData,
      pipelineId,
      stageId: pipeline?.stages[0]?.id || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.contactId) {
      toast.error("Please select a contact");
      return;
    }

    if (!formData.pipelineId || !formData.stageId) {
      toast.error("Please select a pipeline and stage");
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
      await apiClient.post("/deals", {
        title: formData.title.trim(),
        contactId: formData.contactId,
        pipelineId: formData.pipelineId,
        stageId: formData.stageId,
        value,
        probability,
        expectedCloseDate: formData.expectedCloseDate || undefined,
        notes: formData.notes.trim() || undefined,
      });

      toast.success("Deal created successfully");
      setFormData({
        title: "",
        contactId: "",
        pipelineId: preSelectedPipelineId || pipelines[0]?.id || "",
        stageId: pipelines.find((p) => p.id === (preSelectedPipelineId || pipelines[0]?.id))?.stages[0]?.id || "",
        value: "",
        probability: "50",
        expectedCloseDate: "",
        notes: "",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to create deal:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create deal";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedPipeline = pipelines.find((p) => p.id === formData.pipelineId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription>
            Add a new deal to your sales pipeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingData ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <>
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Enterprise License Deal"
                  required
                  disabled={loading}
                />
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <Label htmlFor="contactId">
                  Contact <span className="text-red-500">*</span>
                </Label>
                <select
                  id="contactId"
                  value={formData.contactId}
                  onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                  disabled={loading}
                >
                  <option value="">Select a contact...</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                      {contact.email ? ` (${contact.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pipeline */}
              <div className="space-y-2">
                <Label htmlFor="pipelineId">
                  Pipeline <span className="text-red-500">*</span>
                </Label>
                <select
                  id="pipelineId"
                  value={formData.pipelineId}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                  disabled={loading}
                >
                  {pipelines.map((pipeline) => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage */}
              <div className="space-y-2">
                <Label htmlFor="stageId">
                  Initial Stage <span className="text-red-500">*</span>
                </Label>
                <select
                  id="stageId"
                  value={formData.stageId}
                  onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                  disabled={loading}
                >
                  {selectedPipeline?.stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Value */}
                <div className="space-y-2">
                  <Label htmlFor="value">
                    Value ($) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    placeholder="10000"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Probability */}
                <div className="space-y-2">
                  <Label htmlFor="probability">
                    Probability (%) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, probability: e.target.value })
                    }
                    placeholder="50"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Expected Close Date */}
              <div className="space-y-2">
                <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                <Input
                  id="expectedCloseDate"
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
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional information about this deal..."
                  rows={3}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingData}>
              {loading ? "Creating..." : "Create Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
