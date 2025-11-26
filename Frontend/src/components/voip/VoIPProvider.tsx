"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useVoIPWebSocket } from '@/hooks/useVoIPWebSocket';
import { IncomingCallDialog } from './IncomingCallDialog';
import { ActiveCallScreen } from './ActiveCallScreen';
import { useVoIPStore } from '@/stores/useVoIPStore';

interface VoIPContextType {
  startCall: (calleeId: string, calleeName?: string) => Promise<any>;
  acceptCall: () => Promise<void>;
  rejectCall: (reason?: string) => Promise<void>;
  endCall: () => Promise<void>;
  isConnected: boolean;
}

const VoIPContext = createContext<VoIPContextType | null>(null);

export function useVoIP() {
  const context = useContext(VoIPContext);
  if (!context) {
    throw new Error('useVoIP must be used within VoIPProvider');
  }
  return context;
}

interface VoIPProviderProps {
  children: React.ReactNode;
  userId: string; // Current user's Supabase ID
  tenantId?: string; // Default tenant (fallback if no X-Active-Tenant)
}

export function VoIPProvider({ children, userId, tenantId }: VoIPProviderProps) {
  const { activeTenant } = useVoIPStore();

  console.log('🔧 VoIPProvider initialized', {
    userId,
    tenantId,
    activeTenant,
    finalTenantId: activeTenant || tenantId
  });

  // Initialize WebSocket connection
  const voipSocket = useVoIPWebSocket({
    userId,
    tenantId: activeTenant || tenantId,
  });

  console.log('🔌 VoIP Socket state:', {
    isConnected: voipSocket.isConnected,
    hasSocket: !!voipSocket.socket
  });

  // Request notification permissions on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        console.log('🔔 Requesting notification permission...');
        Notification.requestPermission().then(permission => {
          console.log('🔔 Notification permission:', permission);
        });
      } else {
        console.log('🔔 Notification permission already set:', Notification.permission);
      }
    }
  }, []);

  return (
    <VoIPContext.Provider
      value={{
        startCall: voipSocket.startCall,
        acceptCall: voipSocket.acceptCall,
        rejectCall: voipSocket.rejectCall,
        endCall: voipSocket.endCall,
        isConnected: voipSocket.isConnected,
      }}
    >
      {children}

      {/* Global VoIP UI Components */}
      <IncomingCallDialog />
      <ActiveCallScreen />
    </VoIPContext.Provider>
  );
}
