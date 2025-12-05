'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, MessageSquare, Trash2 } from 'lucide-react';
import { ChatInput } from './ChatInput';
import { MessageList, ChatMessage } from './MessageList';
import { ChatSidebar } from './ChatSidebar';
import { SuggestedActions } from './SuggestedActions';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { GeminiMCPClient } from '@/lib/gemini/client';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SuggestedAction {
  label: string;
  prompt: string;
  icon?: string;
  category?: 'create' | 'view' | 'update' | 'analyze';
}

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  const { user } = useUser();

  // Load conversation from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('chatbot_conversation');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setMessages(data.messages || []);
          setConversationId(data.conversationId);
        } catch (e) {
          console.error('Failed to load conversation:', e);
        }
      } else {
        // Show welcome message for new chat
        const welcomeMessage: ChatMessage = {
          role: 'assistant',
          content: '👋 Hello! I\'m your **SynapseCRM AI Assistant** powered by **Gemini 2.0 Flash** + **MCP Tools**.\n\nI can help you with:\n\n📇 **Contacts** (6 operations) - List, create, update, search, view details\n💼 **Deals** (6 operations) - Create, move through pipeline, track revenue\n🎯 **Leads** (5 operations) - Qualify, convert to deals, manage status\n🎫 **Tickets** (7 operations) - Create, assign, comment, resolve\n📊 **Analytics** (5 dashboards) - Revenue forecasts, pipeline metrics, team performance\n👥 **Users** (5 operations) - Invite, manage roles (ADMIN only)\n🔄 **Pipelines** - Configure sales workflows\n\n**Ask me in natural language!** Examples:\n• "Show all my contacts"\n• "Create a $50k deal with Acme Corp"\n• "What\'s my revenue forecast?"\n• "Convert lead ABC to a deal"\n• "Create a high-priority support ticket"\n\n💡 **Tip**: I have access to 56 specialized CRM tools and can handle complex multi-step operations.\n\nWhat would you like to do today?',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [isOpen]);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatbot_conversation', JSON.stringify({
        messages,
        conversationId,
        timestamp: new Date().toISOString(),
      }));
    }
  }, [messages, conversationId]);

  const handleSelectConversation = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('Not authenticated');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/chatbot/conversations/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(id);
        setMessages(
          data.messages.map((msg: { role: string; content: string; createdAt: string }) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setSuggestedActions([]);
    localStorage.removeItem('chatbot_conversation');

    // Show welcome message
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: '👋 Hello! I\'m your **SynapseCRM AI Assistant** powered by **Gemini 2.0 Flash** + **MCP Tools**.\n\nI can help you with:\n\n📇 **Contacts** - List, create, update, search\n💼 **Deals** - Create, move through pipeline, track revenue\n🎯 **Leads** - Qualify, convert to deals\n🎫 **Tickets** - Create, assign, resolve\n📊 **Analytics** - Revenue forecasts, pipeline metrics\n\n**Ask me in natural language!** Examples:\n• "Show all my contacts"\n• "Create a deal for Acme Corp"\n• "What\'s my revenue this month?"\n\nWhat would you like to do today?',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const handleDeleteConversation = (deletedId: string) => {
    // If the deleted conversation was active, start a new chat
    if (conversationId === deletedId) {
      handleNewChat();
    }
    // Trigger sidebar refresh after deletion
    setSidebarRefreshTrigger((prev) => prev + 1);
  };

  const handleSend = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get Supabase session for JWT
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Call backend chatbot API (which uses MCP server and stores messages)
      const response = await fetch('http://localhost:3001/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message,
          conversationId: conversationId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Update conversation ID if this is a new conversation
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        // Trigger sidebar refresh when new conversation is created
        setSidebarRefreshTrigger((prev) => prev + 1);
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update suggested actions if provided
      if (data.suggestedActions) {
        setSuggestedActions(data.suggestedActions);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please make sure the backend server is running and you are authenticated.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 w-[900px] h-[650px] flex overflow-hidden shadow-2xl rounded-lg',
        'animate-in slide-in-from-bottom-4 fade-in duration-200',
        'border border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80'
      )}
    >
      {/* Sidebar */}
      <ChatSidebar
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        refreshTrigger={sidebarRefreshTrigger}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">AI Assistant</h3>
              <p className="text-xs opacity-90">
                {user?.email || 'Powered by Gemini 2.0'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Clear Chat Button */}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="text-white hover:bg-white/20 h-8 w-8"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8"
              title="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSend}
        />

        {/* Suggested Actions */}
        <SuggestedActions
          suggestions={suggestedActions}
          onAction={handleSend}
        />

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
