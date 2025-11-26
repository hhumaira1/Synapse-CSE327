import { create } from 'zustand';

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  isMuted?: boolean;
}

export interface IncomingCall {
  callLogId: string;
  from: string;
  callerName: string;
  callerAvatar?: string;
  roomName: string;
  tenantId: string;
  tenantName?: string;
}

export interface ActiveCall {
  callLogId: string;
  roomName: string;
  token: string;
  participant: CallParticipant;
  startTime: Date;
  status: 'connecting' | 'connected' | 'ended';
}

export type PresenceStatus = 'ONLINE' | 'BUSY' | 'AWAY' | 'OFFLINE';

interface VoIPState {
  // Connection state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Active  tenant (for multi-tenant users)
  activeTenant: string | null;
  setActiveTenant: (tenantId: string) => void;

  // Presence
  presence: PresenceStatus;
  setPresence: (status: PresenceStatus) => void;

  // Current call state
  activeCall: ActiveCall | null;
  setActiveCall: (call: ActiveCall | null) => void;

  // Incoming call
  incomingCall: IncomingCall | null;
  setIncomingCall: (call: IncomingCall | null) => void;

  // UI state
  isCallMinimized: boolean;
  setCallMinimized: (minimized: boolean) => void;

  showCallHistory: boolean;
  setShowCallHistory: (show: boolean) => void;

  showAvailableAgents: boolean;
  setShowAvailableAgents: (show: boolean) => void;

  // Audio settings
  isMuted: boolean;
  toggleMute: () => void;

  isSpeakerOn: boolean;
  toggleSpeaker: () => void;
}

export const useVoIPStore = create<VoIPState>((set) => ({
  // Connection
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),

  // Tenant
  activeTenant: null,
  setActiveTenant: (tenantId) => set({ activeTenant: tenantId }),

  // Presence
  presence: 'OFFLINE',
  setPresence: (status) => set({ presence: status }),

  // Call state
  activeCall: null,
  setActiveCall: (call) => set({ activeCall: call }),

  incomingCall: null,
  setIncomingCall: (call) => set({ incomingCall: call }),

  // UI
  isCallMinimized: false,
  setCallMinimized: (minimized) => set({ isCallMinimized: minimized }),

  showCallHistory: false,
  setShowCallHistory: (show) => set({ showCallHistory: show }),

  showAvailableAgents: false,
  setShowAvailableAgents: (show) => set({ showAvailableAgents: show }),

  // Audio
  isMuted: false,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  isSpeakerOn: false,
  toggleSpeaker: () => set((state) => ({ isSpeakerOn: !state.isSpeakerOn })),
}));
