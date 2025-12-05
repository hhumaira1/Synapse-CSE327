"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Ticket, Phone, Calendar, UserPlus } from 'lucide-react';

interface QuickActionsProps {
  entityType: 'contact' | 'deal' | 'lead';
  entityData: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  onAction: (action: string, data: any) => void;
}

export function QuickActions({ entityType, entityData, onAction }: QuickActionsProps) {
  const entityName = entityData.name || `${entityData.firstName || ''} ${entityData.lastName || ''}`.trim();

  const actions = {
    contact: [
      {
        icon: Mail,
        label: 'Send Email',
        action: 'email',
        disabled: !entityData.email,
        prompt: `send email to ${entityData.email || entityName}`,
      },
      {
        icon: Phone,
        label: 'Call',
        action: 'call',
        disabled: !entityData.phone,
        prompt: `call ${entityData.phone || entityName}`,
      },
      {
        icon: Ticket,
        label: 'Create Ticket',
        action: 'ticket',
        disabled: false,
        prompt: `create ticket for ${entityName}`,
      },
      {
        icon: Calendar,
        label: 'Schedule',
        action: 'schedule',
        disabled: false,
        prompt: `schedule meeting with ${entityName}`,
      },
    ],
    deal: [
      {
        icon: UserPlus,
        label: 'Add Contact',
        action: 'add_contact',
        disabled: false,
        prompt: `add contact to deal ${entityName}`,
      },
      {
        icon: Mail,
        label: 'Send Update',
        action: 'email',
        disabled: false,
        prompt: `send deal update for ${entityName}`,
      },
      {
        icon: Calendar,
        label: 'Schedule Follow-up',
        action: 'schedule',
        disabled: false,
        prompt: `schedule follow-up for deal ${entityName}`,
      },
    ],
    lead: [
      {
        icon: Mail,
        label: 'Send Email',
        action: 'email',
        disabled: !entityData.email,
        prompt: `send email to lead ${entityData.email || entityName}`,
      },
      {
        icon: Phone,
        label: 'Call Lead',
        action: 'call',
        disabled: !entityData.phone,
        prompt: `call lead ${entityData.phone || entityName}`,
      },
      {
        icon: UserPlus,
        label: 'Convert',
        action: 'convert',
        disabled: false,
        prompt: `convert lead ${entityName} to deal`,
      },
    ],
  };

  const availableActions = actions[entityType] || [];

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
      {availableActions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.action}
            variant="outline"
            size="sm"
            disabled={action.disabled}
            onClick={() => onAction(action.action, { entityData, prompt: action.prompt })}
            className="text-xs"
          >
            <Icon className="h-3 w-3 mr-1" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
