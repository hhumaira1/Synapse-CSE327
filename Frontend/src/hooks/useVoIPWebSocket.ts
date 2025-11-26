import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useVoIPStore } from '@/stores/useVoIPStore';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface UseVoIPWebSocketOptions {
  userId: string;
  tenantId?: string;
}

export function useVoIPWebSocket({ userId, tenantId }: UseVoIPWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const {
    setConnected,
    setPresence,
    setIncomingCall,
    setActiveCall,
    activeTenant,
  } = useVoIPStore();

  const currentTenantId = activeTenant || tenantId;

  // Connect to WebSocket
  useEffect(() => {
    if (!userId || !currentTenantId) {
      console.log('🔴 VoIP WebSocket: Missing required data', { 
        userId: userId || 'MISSING', 
        currentTenantId: currentTenantId || 'MISSING',
        activeTenant,
        tenantId 
      });
      return;
    }

    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    console.log('🔌 VoIP WebSocket: Initiating connection...', {
      serverUrl,
      userId,
      currentTenantId,
      namespace: '/voip'
    });
    
    const socket = io(`${serverUrl}/voip`, {
      query: {
        userId,
        tenantId: currentTenantId,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ VoIP WebSocket CONNECTED!', {
        socketId: socket.id,
        userId,
        tenantId: currentTenantId
      });
      setConnected(true);
      setPresence('ONLINE');
      
      // Send heartbeat every 30s
      const heartbeat = setInterval(() => {
        console.log('💓 VoIP WebSocket: Sending heartbeat');
        socket.emit('heartbeat');
      }, 30000);

      socket.on('disconnect', () => {
        clearInterval(heartbeat);
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ VoIP WebSocket DISCONNECTED', {
        reason,
        socketId: socket.id
      });
      setConnected(false);
      setPresence('OFFLINE');
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 VoIP WebSocket CONNECTION ERROR:', {
        error: error.message,
        serverUrl,
        namespace: '/voip'
      });
      toast.error('Unable to connect to call service');
    });

    socket.on('error', (error) => {
      console.error('🔴 VoIP WebSocket ERROR:', error);
    });

    // Call events
    socket.on('incomingCall', (data: {
      from: string;
      callerName: string;
      roomName: string;
      callLogId: string;
    }) => {
      console.log('📞 Incoming call received:', data);
      setIncomingCall({
        ...data,
        tenantId: currentTenantId,
      });

      // Play ringtone (you can add actual audio file)
      playRingtone();
    });

    socket.on('callAccepted', (data: { roomName: string }) => {
      console.log('✅ Call accepted:', data);
      // Call will be handled by LiveKit join
    });

    socket.on('callRejected', (data: { reason?: string }) => {
      console.log('❌ Call rejected:', data);
      toast.error(data.reason || 'Call was rejected');
      setActiveCall(null);
    });

    // When other user accepts the call
    socket.on('callAccepted', (data: { from: string; roomName: string }) => {
      console.log('✅ Call accepted:', data);
      
      const { activeCall } = useVoIPStore.getState();
      if (activeCall && activeCall.roomName === data.roomName) {
        setActiveCall({
          ...activeCall,
          status: 'connected', // Update status to connected!
        });
      }
    });

    socket.on('callEnded', (data: { roomName: string; endedBy: string }) => {
      console.log('📴 Call ended:', data);
      setActiveCall(null);
      setIncomingCall(null);
      stopRingtone();
    });

    socket.on('missedCall', (data: { callerName: string; callTime: string }) => {
      console.log('📵 Missed call:', data);
      
      // Close active call modal (call timeout)
      setActiveCall(null);
      
      toast(`${data.callerName} didn't answer`, {
        icon: '📵',
        duration: 5000,
      });
    });

    // Presence events
    socket.on('presenceUpdate', (data: { userId: string; status: string }) => {
      console.log('👤 Presence update:', data);
      // Can update UI to show other users' presence
    });

    return () => {
      console.log('🔌 VoIP WebSocket: Cleaning up connection');
      socket.disconnect();
      socketRef.current = null;
      stopRingtone();
    };
  }, [userId, currentTenantId, setConnected, setPresence, setIncomingCall, setActiveCall, activeTenant]);

  // Call actions
  const startCall = useCallback(async (calleeId: string, calleeName?: string) => {
    if (!socketRef.current) {
      toast.error('Not connected to call service');
      return null;
    }

    try {
      // Get auth token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error('Not authenticated');
        return null;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voip/start-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Active-Tenant': currentTenantId || '',
        },
        body: JSON.stringify({
          calleeSupabaseId: calleeId,
          callerName: calleeName,
        }),
      });

      if (!response.ok) throw new Error('Failed to start call');

      const data = await response.json();
      
      setActiveCall({
        callLogId: data.callLogId,
        roomName: data.roomName,
        token: data.callerToken,
        participant: {
          id: calleeId,
          name: data.calleeInfo.name,
        },
        startTime: new Date(),
        status: 'connecting',
      });

      return data;
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error('Failed to start call');
      return null;
    }
  }, [currentTenantId, setActiveCall]);

  const acceptCall = useCallback(async () => {
    const { incomingCall } = useVoIPStore.getState();
    if (!incomingCall || !socketRef.current) return;

    try {
      // Get auth token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voip/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Active-Tenant': incomingCall.tenantId,
        },
        body: JSON.stringify({
          callLogId: incomingCall.callLogId,
          roomName: incomingCall.roomName,
        }),
      });

      if (!response.ok) throw new Error('Failed to accept call');

      const data = await response.json();

      setActiveCall({
        callLogId: incomingCall.callLogId,
        roomName: data.roomName,
        token: data.calleeToken,
        participant: {
          id: incomingCall.from,
          name: incomingCall.callerName,
          avatar: incomingCall.callerAvatar,
        },
        startTime: new Date(),
        status: 'connected', // Callee is connected immediately (they accepted!)
      });

      setIncomingCall(null);
      stopRingtone();
    } catch (error) {
      console.error('Failed to accept call:', error);
      toast.error('Failed to accept call');
    }
  }, [setActiveCall, setIncomingCall]);

  const rejectCall = useCallback(async (reason?: string) => {
    const { incomingCall } = useVoIPStore.getState();
    if (!incomingCall || !socketRef.current) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voip/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Active-Tenant': incomingCall.tenantId,
        },
        body: JSON.stringify({
          callLogId: incomingCall.callLogId,
          reason,
        }),
      });

      setIncomingCall(null);
      stopRingtone();
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  }, [setIncomingCall]);

  const endCall = useCallback(async () => {
    const { activeCall } = useVoIPStore.getState();
    if (!activeCall || !socketRef.current) return;

    try {
      // Get auth token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voip/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Active-Tenant': currentTenantId || '',
        },
        body: JSON.stringify({
          callLogId: activeCall.callLogId,
          roomName: activeCall.roomName,
        }),
      });

      setActiveCall(null);
      stopRingtone();
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }, [currentTenantId, setActiveCall]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };
}

// Ringtone helpers (you can replace with actual audio files)
let ringtoneAudio: HTMLAudioElement | null = null;

function playRingtone() {
  try {
    if (!ringtoneAudio) {
      ringtoneAudio = new Audio('/sounds/ringtone.mp3'); // Add this file to public/sounds/
      ringtoneAudio.loop = true;
    }
    ringtoneAudio.play().catch(() => {
      // Browser might block autoplay
      console.warn('Ringtone blocked by browser');
    });
  } catch (error) {
    console.error('Failed to play ringtone:', error);
  }
}

function stopRingtone() {
  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
  }
}
