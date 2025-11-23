'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Bot, User, Wrench } from 'lucide-react';
import { DataTable } from './DataTable';
import { ChartMessage } from './ChartMessage';
import { QuickActions } from './QuickActions';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  toolsUsed?: string[];
  structuredData?: {
    type: 'table' | 'chart';
    entityType?: 'contacts' | 'deals' | 'leads' | 'tickets';
    data?: any[];
    chartData?: any;
  };
  entityContext?: {
    type: 'contact' | 'deal' | 'lead';
    data: any;
  };
}

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onSendMessage?: (message: string) => void;
}

export function MessageList({ messages, isLoading, onSendMessage }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleQuickAction = (action: string, data: any) => {
    if (onSendMessage && data.prompt) {
      onSendMessage(data.prompt);
    }
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <Bot className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">SynapseCRM Assistant</p>
          <p className="text-sm">Ask me anything about your CRM data</p>
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            'flex gap-3 animate-in fade-in slide-in-from-bottom-2',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {message.role === 'assistant' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
          )}

          <div
            className={cn(
              'max-w-[80%] rounded-lg px-4 py-2',
              message.role === 'user'
                ? 'bg-linear-to-r from-[#6366f1] to-[#a855f7] text-white'
                : 'bg-muted'
            )}
          >
            {/* Render structured data (tables/charts) if present */}
            {message.structuredData?.type === 'table' && message.structuredData.data && (
              <div className="mb-3">
                <DataTable
                  type={message.structuredData.entityType || 'contacts'}
                  data={message.structuredData.data}
                  onAction={(action, id) => {
                    console.log(`${action} on ${id}`);
                  }}
                />
              </div>
            )}

            {message.structuredData?.type === 'chart' && message.structuredData.chartData && (
              <div className="mb-3">
                <ChartMessage chartData={message.structuredData.chartData} />
              </div>
            )}

            {/* Regular markdown content */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>

            {message.toolsUsed && message.toolsUsed.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                <Wrench className="h-3 w-3" />
                <span>Used: {message.toolsUsed.join(', ')}</span>
              </div>
            )}

            {/* Quick Actions for entity context */}
            {message.entityContext && (
              <QuickActions
                entityType={message.entityContext.type}
                entityData={message.entityContext.data}
                onAction={handleQuickAction}
              />
            )}
          </div>

          {message.role === 'user' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3 animate-pulse">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="bg-muted rounded-lg px-4 py-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
