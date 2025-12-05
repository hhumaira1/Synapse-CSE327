"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Send, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePortalApiClient } from "@/lib/portal-api";

interface TicketComment {
  id: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
  authorName?: string;
}

interface TicketDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  comments: TicketComment[];
}

interface PortalTicketDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string | null;
}

export function PortalTicketDetailDialog({
  open,
  onOpenChange,
  ticketId,
}: PortalTicketDetailDialogProps) {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const portalApiClient = usePortalApiClient();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["portal-ticket", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const response = await portalApiClient.get<TicketDetail>(
        `/tickets/${ticketId}`
      );
      return response.data;
    },
    enabled: open && !!ticketId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!ticketId) throw new Error("No ticket ID");
      await portalApiClient.post(`/tickets/${ticketId}/comments`, { content });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["portal-ticket", ticketId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["portal-tickets"],
      });
      setComment("");
      toast.success("Reply added successfully");
    },
    onError: () => {
      toast.error("Failed to add reply");
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addCommentMutation.mutate(comment);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500";
      case "IN_PROGRESS":
        return "bg-purple-500";
      case "RESOLVED":
        return "bg-green-500";
      case "CLOSED":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading || !ticket) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Ticket...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Loading ticket details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ticket.title}
            {ticket.priority === "URGENT" && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Priority Badges */}
          <div className="flex gap-2">
            <Badge className={`${getStatusColor(ticket.status)} text-white`}>
              {ticket.status.replace("_", " ")}
            </Badge>
            <Badge className={`${getPriorityColor(ticket.priority)} text-white`}>
              {ticket.priority}
            </Badge>
          </div>

          {/* Description */}
          {ticket.description && (
            <Card className="p-4 space-y-2">
              <h3 className="font-semibold text-sm">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </Card>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
          </div>

          {/* Status Info */}
          {ticket.status === "RESOLVED" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Ticket Resolved</p>
                  <p className="text-sm text-green-700 mt-1">
                    This ticket has been marked as resolved. If you&apos;re still
                    experiencing issues, please reply below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {ticket.status === "CLOSED" && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Ticket Closed</p>
                  <p className="text-sm text-gray-700 mt-1">
                    This ticket has been closed. If you need further assistance,
                    please submit a new ticket.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="font-semibold">
              Conversation ({ticket.comments?.length || 0})
            </h3>

            {/* Comment Thread */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {!ticket.comments || ticket.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No replies yet. Our support team will respond soon.
                </p>
              ) : (
                ticket.comments.map((comment) => {
                  // Use authorName from backend (fetched from Supabase)
                  const displayName = comment.authorName || (comment.isInternal ? "Support Member" : "Customer");
                  const initials = displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || (comment.isInternal ? "SM" : "C");

                  return (
                    <div
                      key={comment.id}
                      className="p-4 bg-muted/50 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            comment.isInternal 
                              ? "bg-linear-to-r from-[#6366f1] to-[#a855f7]" 
                              : "bg-linear-to-r from-[#3b82f6] to-[#06b6d4]"
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {displayName}
                              {comment.isInternal && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Support Team
                                </Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap pl-10">
                        {comment.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Reply Form */}
            {ticket.status !== "CLOSED" && (
              <form onSubmit={handleAddComment} className="flex gap-2 pt-4 border-t">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!comment.trim() || addCommentMutation.isPending}
                  className="bg-linear-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
