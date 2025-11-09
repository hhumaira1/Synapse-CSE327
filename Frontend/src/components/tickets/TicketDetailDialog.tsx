"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Send, User, Calendar, Tag, AlertCircle, Trash2 } from "lucide-react";

interface TicketDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string | null;
}

interface TicketComment {
  id: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
  authorName?: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  source: string;
  externalSystem?: string | null;
  externalId?: string | null;
  createdAt: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
  };
  comments: TicketComment[];
}

export function TicketDetailDialog({
  open,
  onOpenChange,
  ticketId,
}: TicketDetailDialogProps) {
  const [comment, setComment] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const response = await apiClient.get<Ticket>(`/tickets/${ticketId}`);
      return response.data;
    },
    enabled: open && !!ticketId,
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (data: { status?: string; priority?: string }) => {
      if (!ticketId) throw new Error("No ticket ID");
      await apiClient.patch(`/tickets/${ticketId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Ticket updated successfully");
    },
    onError: () => {
      toast.error("Failed to update ticket");
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!ticketId) throw new Error("No ticket ID");
      await apiClient.post(`/tickets/${ticketId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      setComment("");
      toast.success("Comment added successfully");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      if (!ticketId) throw new Error("No ticket ID");
      await apiClient.delete(`/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket deleted successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to delete ticket");
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateTicketMutation.mutate({ status: newStatus });
  };

  const handlePriorityChange = (newPriority: string) => {
    updateTicketMutation.mutate({ priority: newPriority });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addCommentMutation.mutate(comment);
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

  if (!ticket || isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="flex items-center gap-2">
              {ticket.title}
              {ticket.priority === "URGENT" && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </DialogTitle>
            {ticket.externalSystem === "osticket" && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                  🎫 osTicket #{ticket.externalId}
                </Badge>
                {ticket.externalId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => {
                      // Open osTicket in new tab - will be configured from settings
                      toast("Configure osTicket URL in Settings → Integrations");
                    }}
                  >
                    View in osTicket →
                  </Button>
                )}
              </div>
            )}
          </div>
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
            <Badge variant="outline">{ticket.source}</Badge>
          </div>

          {/* Description */}
          {ticket.description && (
            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          )}

          {/* Contact & Creation Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Contact</span>
              </div>
              <p className="font-medium">
                {ticket.contact.firstName} {ticket.contact.lastName}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created</span>
              </div>
              <p className="text-sm">
                {formatDistanceToNow(new Date(ticket.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          {/* Status & Priority Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Status
              </label>
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Priority
              </label>
              <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="font-semibold">Comments ({ticket.comments?.length || 0})</h3>

            {/* Comment Thread */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {!ticket.comments || ticket.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                ticket.comments.map((comment) => {
                  // Use authorName from backend (fetched from Clerk)
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
                      className="p-3 bg-muted/50 rounded-lg space-y-2"
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
                              {!comment.isInternal && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Customer
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

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
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
          </div>

          {/* Close Button */}
          <div className="flex justify-between pt-4">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteTicketMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Ticket
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this ticket and all its comments.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteTicketMutation.mutate();
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
