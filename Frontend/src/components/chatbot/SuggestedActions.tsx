'use client';

import React from 'react';
import {
  UserPlus,
  DollarSign,
  ArrowRight,
  Ticket,
  List,
  BarChart,
  TrendingUp,
  Percent,
  Activity,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SuggestedAction {
  label: string;
  prompt: string;
  icon?: string;
  category?: 'create' | 'view' | 'update' | 'analyze';
}

interface SuggestedActionsProps {
  suggestions: SuggestedAction[];
  onAction: (prompt: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  UserPlus,
  DollarSign,
  ArrowRight,
  Ticket,
  List,
  BarChart,
  TrendingUp,
  Percent,
  Activity,
  LayoutDashboard,
  Sparkles,
};

const categoryColors = {
  create: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
  view: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
  update: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30',
  analyze: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30',
};

export function SuggestedActions({ suggestions, onAction }: SuggestedActionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-4 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
        <Sparkles className="w-4 h-4" />
        <span className="font-medium">Suggested Actions</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon ? iconMap[suggestion.icon] : Sparkles;
          const category = suggestion.category || 'view';
          
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => onAction(suggestion.prompt)}
              className={cn(
                'gap-2 text-sm font-medium transition-all',
                categoryColors[category],
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {suggestion.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
