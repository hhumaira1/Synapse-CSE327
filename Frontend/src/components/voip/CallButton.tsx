'use client';

import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoIP } from './VoIPProvider';
import { useVoIPStore } from '@/stores/useVoIPStore';
import toast from 'react-hot-toast';

interface CallButtonProps {
  supabaseUserId: string;
  userName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * CallButton
 * 
 * Button to initiate a VoIP call to a user (CRM user or portal customer).
 * Place this next to contacts/leads/users in the CRM.
 */
export function CallButton({
  supabaseUserId,
  userName,
  variant = 'outline',
  size = 'sm',
}: CallButtonProps) {
  const { startCall, isConnected } = useVoIP();
  const { activeCall } = useVoIPStore();

  console.log('📞 CallButton state:', {
    supabaseUserId,
    userName,
    isConnected,
    hasActiveCall: !!activeCall,
    isDisabled: !!activeCall || !isConnected
  });

  const handleCall = async () => {
    console.log('📞 CallButton clicked:', { supabaseUserId, userName });
    
    if (activeCall) {
      console.warn('⚠️ Already in a call');
      toast.error('Already in a call');
      return;
    }

    if (!isConnected) {
      console.error('⚠️ VoIP service not connected');
      toast.error('VoIP service not connected');
      return;
    }

    try {
      console.log('📞 Starting call to:', { supabaseUserId, userName });
      await startCall(supabaseUserId, userName);
      console.log('✅ Call initiated successfully');
    } catch (error) {
      console.error('❌ Failed to start call:', error);
      toast.error('Failed to start call. Please try again.');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCall}
      disabled={!!activeCall || !isConnected}
      className="gap-2"
    >
      <Phone className="h-4 w-4" />
      {size !== 'icon' && 'Call'}
    </Button>
  );
}
