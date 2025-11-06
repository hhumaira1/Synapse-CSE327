"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Lead } from "@/types/lead";
import { Calendar } from "lucide-react";

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

interface Stage {
  id: string;
  name: string;
  order: number;
}

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSuccess: () => void;
}

export function ConvertLeadDialog({ open, onOpenChange, lead, onSuccess }: ConvertLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<string>("");
  const [formData, setFormData] = useState({
    pipelineId: "",
    stageId: "",
    probability: "50",
    expectedCloseDate: "",
  });

  useEffect(() => {
    if (open) {
      fetchPipelines();
      setFormData({
        pipelineId: "",
        stageId: "",
        probability: "50",
        expectedCloseDate: "",
      });
    }
  }, [open]);

  const fetchPipelines = async () => {
    setLoadingPipelines(true);
    try {
      const response = await apiClient.get<Pipeline[]>("/pipelines");
      setPipelines(response.data);
      if (response.data.length > 0) {
        const firstPipeline = response.data[0];
        setSelectedPipeline(firstPipeline.id);
        setFormData((prev) => ({
          ...prev,
          pipelineId: firstPipeline.id,
          stageId: firstPipeline.stages[0]?.id || "",
        }));
      }
    } catch (error: unknown) {
      console.error("Failed to fetch pipelines:", error);
      toast.error("Failed to load pipelines");
    } finally {
      setLoadingPipelines(false);
    }
  };

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipeline(pipelineId);
    const pipeline = pipelines.find((p) => p.id === pipelineId);
    setFormData({
      ...formData,
      pipelineId,
      stageId: pipeline?.stages[0]?.id || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pipelineId || !formData.stageId) {
      toast.error("Please select a pipeline and stage");
      return;
    }

    const probability = parseInt(formData.probability);
    if (isNaN(probability) || probability < 0 || probability > 100) {
      toast.error("Probability must be between 0 and 100");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/leads/${lead.id}/convert`, {
        pipelineId: formData.pipelineId,
        stageId: formData.stageId,
        probability,
        expectedCloseDate: formData.expectedCloseDate || undefined,
      });

      toast.success("Lead converted to deal successfully!");
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to convert lead:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to convert lead";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedPipelineData = pipelines.find((p) => p.id === selectedPipeline);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convert Lead to Deal</DialogTitle>
          <DialogDescription>
            Convert <strong>{lead.title}</strong> into a deal and add it to a sales pipeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingPipelines ? (
            <p className="text-sm text-gray-500">Loading pipelines...</p>
          ) : pipelines.length === 0 ? (
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800">
                No pipelines available. Please create a pipeline first before converting leads.
              </p>
            </div>
          ) : (
            <>
              {/* Pipeline Selection */}
              <div className="space-y-2">
                <Label htmlFor="pipeline">
                  Pipeline <span className="text-red-500">*</span>
                </Label>
                <select
                  id="pipeline"
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

              {/* Stage Selection */}
              <div className="space-y-2">
                <Label htmlFor="stage">
                  Initial Stage <span className="text-red-500">*</span>
                </Label>
                <select
                  id="stage"
                  value={formData.stageId}
                  onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                  disabled={loading}
                >
                  {selectedPipelineData?.stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
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
                <p className="text-xs text-gray-500">
                  Likelihood of closing this deal (0-100%)
                </p>
              </div>

              {/* Expected Close Date */}
              <div className="space-y-2">
                <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                <div className="relative">
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, expectedCloseDate: e.target.value })
                    }
                    disabled={loading}
                    className="pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Deal Preview */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">Deal Preview</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Title:</dt>
                    <dd className="font-medium">{lead.title}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Value:</dt>
                    <dd className="font-medium text-green-600">${lead.value.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Contact:</dt>
                    <dd className="font-medium">
                      {lead.contact?.firstName} {lead.contact?.lastName}
                    </dd>
                  </div>
                </dl>
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
            <Button type="submit" disabled={loading || pipelines.length === 0}>
              {loading ? "Converting..." : "Convert to Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
