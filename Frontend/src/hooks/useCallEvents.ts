'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { useUser } from './useUser';

/**
 * Call event types (must match backend)
 */
export enum CallEventType {
  CALL_STARTED = 'call_started',
  RINGING = 'ringing',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  ENDED = 'ended',
  MISSED = 'missed',
}

/**
 * Call event from Supabase
 */
export interface CallEvent {
  id: string;
  tenant_id: string;
  caller_id: string;
  callee_id: string;
  room_name: string;
  event_type: CallEventType;
  payload: {
    callerName?: string;
    callerToken?: string;
    calleeToken?: string;
    calleeName?: string;
    reason?: string;
    endedBy?: string;
    [key: string]: any;
  };
  created_at: string;
}

/**
 * Call state UI
 */
export enum CallState {
  IDLE = 'idle',
  CALLING = 'calling',          // Outgoing call (waiting for answer)
  RINGING = 'ringing',           // Incoming call
  CONNECTING = 'connecting',     // Call accepted, connecting to LiveKit
  CONNECTED = 'connected',       // In active call
  ENDED = 'ended',              // Call ended
  REJECTED = 'rejected',         // Call rejected
  MISSED = 'missed',            // Call missed
}

/**
 * Active call data
 */
export interface ActiveCall {
  roomName: string;
  isIncoming: boolean;
  otherUserId: string;
  otherUserName: string;
  token?: string;
  state: CallState;
}

/**
 * Hook for listening to call events via Supabase Realtime
 * 
 * @param tenantId - Current tenant ID
 * @param userId - Current user ID
 * @returns Call event handlers and state
 */
export function useCallEvents(tenantId?: string, userId?: string) {
  const { user } = useUser();
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallEvent | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<any>(null);

  // Initialize Supabase client
  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
    }
  }, []);

  /**
   * Subscribe to call events for current user
   */
  useEffect(() => {
    if (!tenantId || !userId || !supabaseRef.current) return;

    const supabase = supabaseRef.current;

    // Create channel for call events
    const channel = supabase
      .channel(`call_events:${tenantId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_events',
          filter: `callee_id=eq.${userId}`,
        },
        (payload: any) => {
          const event = payload.new as CallEvent;
          handleCallEvent(event);
        },
      )
      .subscribe();

    channelRef.current = channel;

    console.log('✅ Subscribed to call events for user:', userId);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tenantId, userId]);

  /**
   * Handle incoming call event
   */
  const handleCallEvent = useCallback((event: CallEvent) => {
    console.log('📞 Call event received:', event.event_type, event);

    switch (event.event_type) {
      case CallEventType.CALL_STARTED:
        // Incoming call
        setIncomingCall(event);
        setActiveCall({
          roomName: event.room_name,
          isIncoming: true,
          otherUserId: event.caller_id,
          otherUserName: event.payload.callerName || 'Unknown',
          state: CallState.RINGING,
        });
        break;

      case CallEventType.ACCEPTED:
        // Call was accepted by callee
        if (activeCall?.roomName === event.room_name) {
          setActiveCall(prev => ({
            ...prev!,
            state: CallState.CONNECTING,
            token: event.payload.calleeToken,
          }));
        }
        break;

      case CallEventType.REJECTED:
        // Call was rejected
        if (activeCall?.roomName === event.room_name) {
          setActiveCall(prev => ({
            ...prev!,
            state: CallState.REJECTED,
          }));
          
          // Clear after 3 seconds
          setTimeout(() => {
            setActiveCall(null);
            setIncomingCall(null);
          }, 3000);
        }
        break;

      case CallEventType.ENDED:
        // Call ended
        if (activeCall?.roomName === event.room_name) {
          setActiveCall(prev => ({
            ...prev!,
            state: CallState.ENDED,
          }));
          
          // Clear after 2 seconds
          setTimeout(() => {
            setActiveCall(null);
            setIncomingCall(null);
          }, 2000);
        }
        break;
    }
  }, [activeCall]);

  /**
   * Start an outgoing call
   */
  const startCall = useCallback(async (calleeId: string, calleeName: string) => {
    try {
      const response = await fetch('/api/voip/start-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calleeId,
          callerName: user?.firstName || 'Unknown',
        }),
      });

      if (!response.ok) throw new Error('Failed to start call');

      const data = await response.json();

      setActiveCall({
        roomName: data.roomName,
        isIncoming: false,
        otherUserId: calleeId,
        otherUserName: calleeName,
        token: data.callerToken,
        state: CallState.CALLING,
      });

      return data;
    } catch (error) {
      console.error('Failed to start call:', error);
      throw error;
    }
  }, [user]);

  /**
   * Accept an incoming call
   */
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const response = await fetch('/api/voip/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: incomingCall.room_name,
        }),
      });

      if (!response.ok) throw new Error('Failed to accept call');

      const data = await response.json();

      setActiveCall(prev => ({
        ...prev!,
        state: CallState.CONNECTING,
        token: data.calleeToken,
      }));

      setIncomingCall(null);

      return data;
    } catch (error) {
      console.error('Failed to accept call:', error);
      throw error;
    }
  }, [incomingCall]);

  /**
   * Reject an incoming call
   */
  const rejectCall = useCallback(async (reason?: string) => {
    if (!incomingCall) return;

    try {
      await fetch('/api/voip/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: incomingCall.room_name,
          reason,
        }),
      });

      setActiveCall(null);
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  }, [incomingCall]);

  /**
   * End an active call
   */
  const endCall = useCallback(async () => {
    if (!activeCall) return;

    try {
      await fetch('/api/voip/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: activeCall.roomName,
        }),
      });

      setActiveCall(prev => ({
        ...prev!,
        state: CallState.ENDED,
      }));

      setTimeout(() => {
        setActiveCall(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }, [activeCall]);

  /**
   * Update call state (for LiveKit connection)
   */
  const updateCallState = useCallback((state: CallState) => {
    setActiveCall(prev => {
      if (!prev) return null;
      return { ...prev, state };
    });
  }, []);

  return {
    activeCall,
    incomingCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    updateCallState,
  };
}
