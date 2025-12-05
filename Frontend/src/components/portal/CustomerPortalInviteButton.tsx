"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useApiClient } from "@/lib/api";

interface Contact {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
}

interface CustomerPortalInviteButtonProps {
  contact: Contact;
  onSuccess?: () => void;
}

export function CustomerPortalInviteButton({
  contact,
  onSuccess,
}: CustomerPortalInviteButtonProps) {
  const apiClient = useApiClient(); // Use the hook to get authenticated client
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const handleInvite = async () => {
    if (!contact.email) {
      setError("This contact doesn't have an email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.post("/portal/customers/invite", {
        contactId: contact.id,
        email: contact.email,
        message: customMessage || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setCustomMessage("");
        onSuccess?.();
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Error sending portal invitation:", err);
      setError(
        error.response?.data?.message || "Failed to send portal invitation"
      );
    } finally {
      setLoading(false);
    }
  };

  const fullName = `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ""}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
          <Mail className="h-4 w-4 mr-2" />
          Create Customer Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Customer Contract</DialogTitle>
          <DialogDescription>
            Send {fullName} an invitation to activate their customer portal account and create their contract
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Customer Contract Created!
            </h3>
            <p className="text-gray-600">
              {fullName} will receive an email to activate their customer portal account.
              Once activated, they will have an active customer contract.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{fullName}</p>
                  <p className="text-sm text-gray-600">{contact.email}</p>
                </div>
                <Badge variant="secondary">Customer</Badge>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Message (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Add a personal message to the invitation email..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Customer Contract Includes:</strong> Portal access to view
                and manage their support tickets, submit new requests, and
                communicate with your team. This creates an active customer relationship.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                onClick={handleInvite}
                disabled={loading || !contact.email}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
