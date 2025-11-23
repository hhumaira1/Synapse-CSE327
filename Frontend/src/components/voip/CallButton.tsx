'use client';

import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallEvents } from '@/hooks/useCallEvents';
import { useUser } from '@/hooks/useUser';

interface CallButtonProps {
  userId: string;
  userName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * CallButton
 * 
 * Button to initiate a VoIP call to a user.
 * Place this next to contacts/leads/users in the CRM.
 */
export function CallButton({
  userId,
  userName,
  variant = 'outline',
  size = 'sm',
}: CallButtonProps) {
  const { user } = useUser();
  const { startCall, activeCall } = useCallEvents(user?.tenantId, user?.id);

  const handleCall = async () => {
    if (activeCall) {
      console.warn('Already in a call');
      return;
    }

    try {
      await startCall(userId, userName);
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start call. Please try again.');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCall}
      disabled={!!activeCall}
      className="gap-2"
    >
      <Phone className="h-4 w-4" />
      {size !== 'icon' && 'Call'}
    </Button>
  );
}
