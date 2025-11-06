"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Lead, LeadStatus, LEAD_STATUS_CONFIG } from "@/types/lead";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSuccess: () => void;
}

export function EditLeadDialog({ open, onOpenChange, lead, onSuccess }: EditLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [formData, setFormData] = useState({
    title: lead.title,
    contactId: lead.contactId,
    source: lead.source,
    value: lead.value.toString(),
    notes: lead.notes || "",
    status: lead.status,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        title: lead.title,
        contactId: lead.contactId,
        source: lead.source,
        value: lead.value.toString(),
        notes: lead.notes || "",
        status: lead.status,
      });
      fetchContacts();
    }
  }, [open, lead]);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await apiClient.get<Contact[]>("/contacts");
      setContacts(response.data);
    } catch (error: unknown) {
      console.error("Failed to fetch contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoadingContacts(false);
    }
  };

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

    setLoading(true);
    try {
      await apiClient.patch(`/leads/${lead.id}`, {
        title: formData.title.trim(),
        contactId: formData.contactId,
        source: formData.source.trim(),
        value,
        notes: formData.notes.trim() || undefined,
        status: formData.status,
      });

      toast.success("Lead updated successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to update lead:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update lead";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update lead information.
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
              placeholder="e.g., Enterprise Software Deal"
              required
              disabled={loading}
            />
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label htmlFor="edit-contactId">
              Contact <span className="text-red-500">*</span>
            </Label>
            {loadingContacts ? (
              <p className="text-sm text-gray-500">Loading contacts...</p>
            ) : (
              <select
                id="edit-contactId"
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
                disabled={loading}
              >
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                    {contact.email ? ` (${contact.email})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="edit-source">
              Source <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-source"
              value={formData.source}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, source: e.target.value })
              }
              placeholder="e.g., Website, Referral, Cold Call"
              required
              disabled={loading}
            />
          </div>

          {/* Value */}
          <div className="space-y-2">
            <Label htmlFor="edit-value">
              Potential Value ($) <span className="text-red-500">*</span>
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

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <select
              id="edit-status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              disabled={loading}
            >
              {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
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
