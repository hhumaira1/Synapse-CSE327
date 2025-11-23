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
          content: '👋 Hello! I\'m your AI assistant. I can help you manage your CRM:\n\n• View and search contacts, leads, deals, and tickets\n• Create new records with natural language\n• Get analytics and insights\n• Answer questions about your data\n\nWhat would you like to do today?',
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
      const response = await fetch(`/api/chat/${id}`);
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
      content: '👋 Hello! I\'m your AI assistant. I can help you manage your CRM:\n\n• View and search contacts, leads, deals, and tickets\n• Create new records with natural language\n• Get analytics and insights\n• Answer questions about your data\n\nWhat would you like to do today?',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const handleDeleteConversation = (deletedId: string) => {
    // If the deleted conversation was active, start a new chat
    if (conversationId === deletedId) {
      handleNewChat();
    }
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        toolsUsed: data.toolsUsed,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Update suggested actions
      if (data.suggestedActions) {
        setSuggestedActions(data.suggestedActions);
      }
      
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
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
