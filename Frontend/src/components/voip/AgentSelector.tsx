'use client';

import { useState } from 'react';
import { Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAvailableAgents } from '@/hooks/useAvailableAgents';
import { useVoIP } from './VoIPProvider';
import { useVoIPStore } from '@/stores/useVoIPStore';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';

interface AgentSelectorProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

/**
 * AgentSelector
 * 
 * Component for portal customers to select and call available CRM agents.
 * Shows a dialog with list of available agents.
 */
export function AgentSelector({
  variant = 'default',
  size = 'default',
  children,
}: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser(); // Get current user
  
  // Only fetch agents when dialog is open to avoid unnecessary API calls
  const { data: agents, isLoading } = useAvailableAgents(isOpen);
  const { startCall, isConnected } = useVoIP();
  const { activeCall } = useVoIPStore();

  // Filter out current user from agents list
  const filteredAgents = agents?.filter(agent => agent.supabaseUserId !== user?.id) || [];

  const handleCallAgent = async (agentId: string, agentName: string) => {
    if (activeCall) {
      toast.error('Already in a call');
      return;
    }

    if (!isConnected) {
      toast.error('VoIP service not connected');
      return;
    }

    try {
      await startCall(agentId, agentName);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to call agent:', error);
      toast.error('Failed to call agent. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={variant} size={size} disabled={!!activeCall || !isConnected}>
            <Phone className="h-4 w-4 mr-2" />
            Call Support
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select an Agent to Call</DialogTitle>
          <DialogDescription>
            Choose an available agent from the list below to start a voice call.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAgents && filteredAgents.length > 0 ? (
            filteredAgents.map((agent) => (
              <div
                key={agent.supabaseUserId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {agent.email}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {agent.role}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleCallAgent(agent.supabaseUserId, agent.name)
                  }
                  disabled={!!activeCall}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No agents available at the moment.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
