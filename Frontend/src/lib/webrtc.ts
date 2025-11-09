import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;
let pendingIceCandidates: RTCIceCandidateInit[] = [];

// Remove /api suffix if present, we'll add it explicitly for WebSocket
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api').replace(/\/api$/, '');

// ICE servers for NAT traversal (using free STUN servers)
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

/**
 * Initialize WebSocket connection
 */
export function initializeWebRTCSocket(auth: {
  userId: string;
  tenantId: string;
  role: 'tenant_member' | 'portal_customer';
  contactId?: string;
}): Socket {
  if (socket?.connected) {
    return socket;
  }

  console.log('🔌 Attempting to connect to:', `${BACKEND_URL}/api/webrtc`);
  console.log('🔑 Auth data:', { ...auth, userId: auth.userId?.substring(0, 10) + '...' });

  socket = io(`${BACKEND_URL}/api/webrtc`, {
    auth,
    path: '/api/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('✅ WebRTC Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ WebRTC Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
    console.error('Error details:', error);
  });

  socket.on('connection:success', (data) => {
    console.log('✅ WebRTC connection authenticated:', data);
  });

  return socket;
}

/**
 * Get current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Initialize RTCPeerConnection
 */
export async function initializePeerConnection(
  callId: string,
  isInitiator: boolean,
  onRemoteStream: (stream: MediaStream) => void,
  onConnectionStateChange: (state: RTCPeerConnectionState) => void,
): Promise<RTCPeerConnection> {
  // Clean up existing connection
  if (peerConnection) {
    peerConnection.close();
  }

  peerConnection = new RTCPeerConnection(ICE_SERVERS);
  remoteStream = new MediaStream();

  // Get local audio stream
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
      if (peerConnection && localStream) {
        peerConnection.addTrack(track, localStream);
      }
    });

    console.log('✅ Local audio stream acquired');
  } catch (error) {
    console.error('❌ Failed to get local audio stream:', error);
    throw new Error('Microphone access denied');
  }

  // Handle remote tracks
  peerConnection.ontrack = (event) => {
    console.log('✅ Received remote track:', event.track.kind);
    event.streams[0].getTracks().forEach((track) => {
      remoteStream?.addTrack(track);
    });
    onRemoteStream(remoteStream!);
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate && socket) {
      socket.emit('webrtc:ice-candidate', {
        callId,
        candidate: event.candidate.toJSON(),
      });
    }
  };

  // Handle connection state changes
  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection?.connectionState || 'failed';
    console.log('🔄 Connection state:', state);
    onConnectionStateChange(state);
  };

  // If initiator, create and send offer
  if (isInitiator && socket) {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socket.emit('webrtc:offer', {
        callId,
        offer: peerConnection.localDescription?.toJSON(),
      });
      
      console.log('📤 Sent WebRTC offer');
    } catch (error) {
      console.error('❌ Failed to create offer:', error);
      throw error;
    }
  }

  return peerConnection;
}

/**
 * Handle incoming WebRTC offer (callee side)
 */
export async function handleWebRTCOffer(
  callId: string,
  offer: RTCSessionDescriptionInit,
): Promise<void> {
  if (!peerConnection || !socket) {
    throw new Error('Peer connection not initialized');
  }

  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Process any queued ICE candidates
    if (pendingIceCandidates.length > 0) {
      console.log(`🔄 Processing ${pendingIceCandidates.length} queued ICE candidates`);
      for (const candidate of pendingIceCandidates) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingIceCandidates = [];
    }
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('webrtc:answer', {
      callId,
      answer: peerConnection.localDescription?.toJSON(),
    });

    console.log('📤 Sent WebRTC answer');
  } catch (error) {
    console.error('❌ Failed to handle offer:', error);
    throw error;
  }
}

/**
 * Handle incoming WebRTC answer (caller side)
 */
export async function handleWebRTCAnswer(
  answer: RTCSessionDescriptionInit,
): Promise<void> {
  if (!peerConnection) {
    throw new Error('Peer connection not initialized');
  }

  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    
    // Process any queued ICE candidates
    if (pendingIceCandidates.length > 0) {
      console.log(`🔄 Processing ${pendingIceCandidates.length} queued ICE candidates`);
      for (const candidate of pendingIceCandidates) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingIceCandidates = [];
    }
    
    console.log('✅ Set remote description (answer)');
  } catch (error) {
    console.error('❌ Failed to handle answer:', error);
    throw error;
  }
}

/**
 * Handle incoming ICE candidate
 */
export async function handleICECandidate(
  candidate: RTCIceCandidateInit,
): Promise<void> {
  if (!peerConnection) {
    console.warn('⚠️ Peer connection not ready for ICE candidate');
    return;
  }

  // If remote description is not set yet, queue the candidate
  if (!peerConnection.remoteDescription) {
    console.log('⏳ Queuing ICE candidate (waiting for remote description)');
    pendingIceCandidates.push(candidate);
    return;
  }

  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('✅ Added ICE candidate');
  } catch (error) {
    console.error('❌ Failed to add ICE candidate:', error);
  }
}

/**
 * Get local audio stream
 */
export function getLocalStream(): MediaStream | null {
  return localStream;
}

/**
 * Get remote audio stream
 */
export function getRemoteStream(): MediaStream | null {
  return remoteStream;
}

/**
 * Toggle microphone mute
 */
export function toggleMute(muted: boolean): void {
  if (localStream) {
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }
}

/**
 * Clean up WebRTC resources
 */
export function cleanupWebRTC(): void {
  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // Clear remote stream
  if (remoteStream) {
    remoteStream.getTracks().forEach((track) => track.stop());
    remoteStream = null;
  }

  // Clear pending ICE candidates
  pendingIceCandidates = [];

  console.log('🧹 WebRTC resources cleaned up');
}
