"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useVoIP } from './VoIPProvider';
import { Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
}

interface AgentSelectorDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AgentSelectorDialog({ open, onClose }: AgentSelectorDialogProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const { startCall } = useVoIP();

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/voip/available-agents`)
        .then(res => res.json())
        .then(data => {
          setAgents(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load agents:', err);
          setLoading(false);
        });
    }
  }, [open]);

  const handleCall = (agent: Agent) => {
    startCall(agent.id, agent.name);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Available Support Agents</DialogTitle>
        </DialogHeader>
        
        {loading && (
          <div className="py-8 text-center text-muted-foreground">
            Loading agents...
          </div>
        )}

        {!loading && agents.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-2">No agents available</p>
            <p className="text-sm text-muted-foreground">
              All support agents are currently offline. Please try again later.
            </p>
          </div>
        )}

        {!loading && agents.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {agents.map(agent => (
              <div 
                key={agent.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Status indicator */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      agent.status === 'ONLINE' ? 'bg-green-500' :
                      agent.status === 'BUSY' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`} />
                  </div>
                  
                  {/* Agent info */}
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{agent.role.toLowerCase()}</p>
                  </div>
                </div>
                
                {/* Call button */}
                <Button
                  onClick={() => handleCall(agent)}
                  disabled={agent.status !== 'ONLINE'}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Agents marked with a green dot are available to take your call
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
