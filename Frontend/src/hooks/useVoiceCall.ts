"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initializeWebRTCSocket,
  getSocket,
  disconnectSocket,
  initializePeerConnection,
  handleWebRTCOffer,
  handleWebRTCAnswer,
  handleICECandidate,
  toggleMute as toggleWebRTCMute,
  cleanupWebRTC,
  getRemoteStream,
} from '@/lib/webrtc';
import { toast } from 'react-hot-toast';
import type { Socket } from 'socket.io-client';

export type CallState = 'idle' | 'connecting' | 'ringing' | 'active' | 'disconnected' | 'error';

interface UseVoiceCallReturn {
  callState: CallState;
  duration: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  currentCallSid: string | null;
  currentContactName: string | null;
  currentContactNumber: string | null;
  initiateCall: (toNumber: string, contactId?: string, contactName?: string) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  isInitialized: boolean;
}

export function useVoiceCall(
  userId: string,
  tenantId: string,
  role: 'tenant_member' | 'portal_customer' = 'tenant_member',
  contactId?: string,
): UseVoiceCallReturn {
  const [callState, setCallState] = useState<CallState>('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [currentContactName, setCurrentContactName] = useState<string | null>(null);
  const [currentContactNumber, setCurrentContactNumber] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize WebRTC Socket on mount
  useEffect(() => {
    let mounted = true;

    const initialize = () => {
      try {
        // Don't initialize if userId or tenantId is empty
        if (!userId || !tenantId) {
          console.log('⏳ Waiting for user data before initializing WebRTC socket...');
          return;
        }

        console.log('🔌 Initializing WebRTC socket with:', { userId, tenantId, role, contactId });

        const socket = initializeWebRTCSocket({
          userId,
          tenantId,
          role,
          contactId,
        });

        socketRef.current = socket;

        // Listen for incoming call events (for portal customers)
        socket.on('call:incoming', async (data: {
          callId: string;
          callerId: string;
          callerName: string;
          contactPhone: string;
        }) => {
          console.log('📞 Incoming call:', data);
          setCurrentCallId(data.callId);
          setCurrentContactName(data.callerName);
          setCurrentContactNumber(data.contactPhone);
          setCallState('ringing');
          toast('Incoming call from ' + data.callerName, {
            icon: '📞',
            duration: 30000,
          });
        });

        // Listen for call ringing (caller side)
        socket.on('call:ringing', (data: { callId: string; callLogId: string }) => {
          console.log('📞 Call ringing:', data);
          setCallState('ringing');
        });

        // Listen for call accepted
        socket.on('call:accepted', async (data: { callId: string }) => {
          console.log('✅ Call accepted:', data);
          setCallState('connecting');
          toast('Connecting call...', { icon: '🔄' });
          
          // If we're the caller and have a peer connection, create and send offer now
          if (peerConnectionRef.current && role === 'tenant_member') {
            try {
              const pc = peerConnectionRef.current;
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              
              socket.emit('webrtc:offer', {
                callId: data.callId,
                offer: pc.localDescription?.toJSON(),
              });
              
              console.log('📤 Sent WebRTC offer after accept');
            } catch (error) {
              console.error('❌ Failed to create offer after accept:', error);
              toast.error('Failed to establish connection');
            }
          }
        });

        // Listen for call rejected
        socket.on('call:rejected', (data: { callId: string }) => {
          console.log('❌ Call rejected:', data);
          setCallState('error');
          toast.error('Call was rejected');
          cleanupCall();
        });

        // Listen for call ended
        socket.on('call:ended', (data: { callId: string }) => {
          console.log('📞 Call ended:', data);
          setCallState('disconnected');
          stopDurationTimer();
          cleanupCall();
          toast('Call ended', { icon: '📞' });
        });

        // Listen for WebRTC signaling
        socket.on('webrtc:offer', async (data: {
          callId: string;
          offer: RTCSessionDescriptionInit;
        }) => {
          console.log('📥 Received WebRTC offer');
          try {
            // Initialize peer connection (callee side)
            const pc = await initializePeerConnection(
              data.callId,
              false, // Not initiator
              handleRemoteStream,
              handleConnectionStateChange,
            );
            peerConnectionRef.current = pc;

            // Handle offer and create answer
            await handleWebRTCOffer(data.callId, data.offer);
          } catch (error) {
            console.error('Failed to handle offer:', error);
            toast.error('Failed to establish call connection');
          }
        });

        socket.on('webrtc:answer', async (data: {
          callId: string;
          answer: RTCSessionDescriptionInit;
        }) => {
          console.log('📥 Received WebRTC answer');
          try {
            await handleWebRTCAnswer(data.answer);
          } catch (error) {
            console.error('Failed to handle answer:', error);
          }
        });

        socket.on('webrtc:ice-candidate', async (data: {
          callId: string;
          candidate: RTCIceCandidateInit;
        }) => {
          console.log('📥 Received ICE candidate');
          try {
            await handleICECandidate(data.candidate);
          } catch (error) {
            console.error('Failed to handle ICE candidate:', error);
          }
        });

        socket.on('call:error', (data: { message: string }) => {
          console.error('❌ Call error:', data.message);
          toast.error(data.message);
          setCallState('error');
          cleanupCall();
        });

        socket.on('call:failed', (data: { callId: string; message: string }) => {
          console.error('❌ Call failed:', data.message);
          toast.error(data.message);
          setCallState('error');
          cleanupCall();
        });

        if (mounted) {
          setIsInitialized(true);
          console.log('✅ WebRTC initialized for user:', userId);
        }
      } catch (error) {
        console.error('Failed to initialize WebRTC:', error);
        if (mounted) {
          toast.error('Failed to initialize voice calling');
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      disconnectSocket();
      cleanupWebRTC();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [userId, tenantId, role, contactId]);

  // Handle remote audio stream
  const handleRemoteStream = useCallback((stream: MediaStream) => {
    console.log('✅ Got remote stream');
    if (!remoteAudioRef.current) {
      remoteAudioRef.current = new Audio();
      remoteAudioRef.current.autoplay = true;
    }
    remoteAudioRef.current.srcObject = stream;
  }, []);

  // Handle connection state changes
  const handleConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    console.log('🔄 Connection state changed:', state);
    if (state === 'connected') {
      setCallState('active');
      startDurationTimer();
      toast.success('Call connected');
    } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
      setCallState('disconnected');
      stopDurationTimer();
      cleanupCall();
    }
  }, []);

  // Cleanup call resources
  const cleanupCall = useCallback(() => {
    cleanupWebRTC();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }
    peerConnectionRef.current = null;
    setCurrentCallId(null);
    setTimeout(() => {
      setCallState('idle');
      setDuration(0);
      setCurrentContactName(null);
      setCurrentContactNumber(null);
      setCurrentCallSid(null);
    }, 1000);
  }, []);

  // Start duration timer
  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  // Stop duration timer
  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Initiate outbound call (tenant member calling portal customer)
  const initiateCall = useCallback(
    async (toNumber: string, calleeContactId?: string, contactName?: string) => {
      try {
        console.log('📞 Initiating call to:', { toNumber, calleeContactId, contactName });
        
        setCallState('connecting');
        setCurrentContactNumber(toNumber);
        setCurrentContactName(contactName || null);

        const socket = getSocket();
        if (!socket) {
          console.error('❌ Socket not initialized');
          throw new Error('Socket not initialized. Please refresh the page.');
        }

        if (!socket.connected) {
          console.error('❌ Socket not connected');
          throw new Error('Not connected to server. Please check your connection.');
        }

        console.log('✅ Socket connected, emitting call:initiate');

        // Emit call initiation to backend
        socket.emit('call:initiate', {
          contactId: calleeContactId,
          contactPhone: toNumber,
          contactName: contactName || 'Unknown',
        });

        // Wait for response (ringing or failed)
        socket.once('call:ringing', async (data: { callId: string; callLogId: string }) => {
          setCurrentCallId(data.callId);
          setCurrentCallSid(data.callLogId);
          setCallState('ringing');
          toast('Calling ' + (contactName || toNumber), { icon: '📞' });

          // Initialize peer connection (caller side) but don't send offer yet
          // We'll send the offer after the callee accepts
          try {
            const pc = await initializePeerConnection(
              data.callId,
              false, // Don't create offer yet - wait for accept
              handleRemoteStream,
              handleConnectionStateChange,
            );
            peerConnectionRef.current = pc;
          } catch (error) {
            console.error('Failed to initialize peer connection:', error);
            toast.error('Failed to establish call connection');
            setCallState('error');
          }
        });

        socket.once('call:failed', (data: { message: string }) => {
          toast.error(data.message);
          setCallState('error');
          setTimeout(() => {
            setCallState('idle');
          }, 2000);
        });
      } catch (error) {
        console.error('Failed to initiate call:', error);
        setCallState('error');
        const errorMessage = error instanceof Error ? error.message : 'Failed to initiate call';
        toast.error(errorMessage);
        
        setTimeout(() => {
          setCallState('idle');
        }, 3000);
      }
    },
    [handleRemoteStream, handleConnectionStateChange]
  );

  // End call
  const endCall = useCallback(() => {
    const socket = getSocket();
    if (socket && currentCallId) {
      socket.emit('call:end', { callId: currentCallId });
    }
    cleanupCall();
  }, [currentCallId, cleanupCall]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    toggleWebRTCMute(newMutedState);
    setIsMuted(newMutedState);
    toast(newMutedState ? '🔇 Microphone muted' : '🔊 Microphone unmuted', {
      duration: 1500,
    });
  }, [isMuted]);

  // Toggle speaker (volume control)
  const toggleSpeaker = useCallback(() => {
    const newSpeakerState = !isSpeakerOn;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = newSpeakerState ? 1.0 : 0.5;
    }
    setIsSpeakerOn(newSpeakerState);
    toast(newSpeakerState ? '� Speaker on' : '� Speaker off', {
      duration: 1500,
    });
  }, [isSpeakerOn]);

  return {
    callState,
    duration,
    isMuted,
    isSpeakerOn,
    currentCallSid,
    currentContactName,
    currentContactNumber,
    initiateCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    isInitialized,
  };
}
