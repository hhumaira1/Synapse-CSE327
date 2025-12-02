'use client';

import { useEffect, useState } from 'react';
import { MessageSquarePlus, MessageSquare, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
  messages: Array<{ content: string }>;
}

interface ChatSidebarProps {
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (id: string) => void;
  refreshTrigger?: number; // Trigger re-fetch when this changes
}

export function ChatSidebar({
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  refreshTrigger,
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadConversations();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  const loadConversations = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch('http://localhost:3001/api/chatbot/conversations', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getConversationTitle = (conv: Conversation) => {
    if (conv.title) return conv.title;
    if (conv.messages && conv.messages.length > 0) {
      const firstMessage = conv.messages[0].content;
      return firstMessage.length > 40
        ? firstMessage.substring(0, 40) + '...'
        : firstMessage;
    }
    return 'New Conversation';
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the conversation
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(`http://localhost:3001/api/chatbot/conversations/${conversationToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        // Remove from local state
        setConversations(conversations.filter(conv => conv.id !== conversationToDelete));
        
        // Notify parent if this was the active conversation
        if (activeConversationId === conversationToDelete && onDeleteConversation) {
          onDeleteConversation(conversationToDelete);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-sm font-semibold">Chats</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start a new chat to get started
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group flex w-full flex-col items-start gap-1 rounded-md p-3 text-left transition-colors hover:bg-accent cursor-pointer ${
                  activeConversationId === conv.id
                    ? 'bg-accent'
                    : 'bg-transparent'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="line-clamp-1 text-sm font-medium flex-1">
                    {getConversationTitle(conv)}
                  </span>
                  <div className="flex items-center gap-1">
                    {activeConversationId === conv.id && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                    <button
                      className="h-6 w-6 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive rounded"
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(conv.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
