'use client';

import { useEffect, useState } from 'react';
import { LiveKitRoom, AudioConference, useRoomContext } from '@livekit/components-react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActiveCall, CallState } from '@/hooks/useCallEvents';
import '@livekit/components-styles';

interface ActiveCallViewProps {
  call: ActiveCall | null;
  onEndCall: () => void;
  onCallStateChange: (state: CallState) => void;
}

/**
 * Call Controls Component
 * 
 * Mute/unmute, speaker on/off, end call button
 */
function CallControls({ onEndCall }: { onEndCall: () => void }) {
  const room = useRoomContext();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const toggleMute = async () => {
    const localTrack = Array.from(
      room.localParticipant.audioTrackPublications.values()
    )[0]?.audioTrack;

    if (localTrack) {
      await localTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    // Note: Speaker control is browser-dependent
    // This is a UI indicator, actual implementation may vary
    setIsSpeakerOn(!isSpeakerOn);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-50">
      {/* Mute Button */}
      <Button
        size="lg"
        variant="outline"
        onClick={toggleMute}
        className="rounded-full h-16 w-16 bg-gray-800 hover:bg-gray-700 border-gray-600"
      >
        {isMuted ? (
          <MicOff className="h-6 w-6 text-red-500" />
        ) : (
          <Mic className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* End Call Button */}
      <Button
        size="lg"
        variant="destructive"
        onClick={onEndCall}
        className="rounded-full h-20 w-20"
      >
        <PhoneOff className="h-8 w-8" />
      </Button>

      {/* Speaker Button */}
      <Button
        size="lg"
        variant="outline"
        onClick={toggleSpeaker}
        className="rounded-full h-16 w-16 bg-gray-800 hover:bg-gray-700 border-gray-600"
      >
        {isSpeakerOn ? (
          <Volume2 className="h-6 w-6 text-white" />
        ) : (
          <VolumeX className="h-6 w-6 text-gray-400" />
        )}
      </Button>
    </div>
  );
}

/**
 * Call Status Display
 */
function CallStatus({ call }: { call: ActiveCall }) {
  const getStatusText = () => {
    switch (call.state) {
      case CallState.CALLING:
        return 'Calling...';
      case CallState.RINGING:
        return 'Ringing...';
      case CallState.CONNECTING:
        return 'Connecting...';
      case CallState.CONNECTED:
        return 'Connected';
      case CallState.ENDED:
        return 'Call Ended';
      case CallState.REJECTED:
        return 'Call Rejected';
      default:
        return 'In Call';
    }
  };

  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-black/60 backdrop-blur-md rounded-full px-8 py-4 text-center">
        <p className="text-white text-lg font-medium">
          {call.otherUserName}
        </p>
        <p className="text-gray-300 text-sm mt-1">{getStatusText()}</p>
      </div>
    </div>
  );
}

/**
 * ActiveCallView
 * 
 * Full-screen active call UI with LiveKit audio.
 * Shows caller/callee info, call controls, and connection status.
 */
export function ActiveCallView({
  call,
  onEndCall,
  onCallStateChange,
}: ActiveCallViewProps) {
  const [duration, setDuration] = useState(0);

  // Update call duration timer
  useEffect(() => {
    if (call?.state === CallState.CONNECTED) {
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setDuration(0);
    }
  }, [call?.state]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!call || !call.token) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Call Status */}
      <CallStatus call={call} />

      {/* Duration Timer (only when connected) */}
      {call.state === CallState.CONNECTED && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-6 py-2">
            <p className="text-white text-lg font-mono">{formatDuration(duration)}</p>
          </div>
        </div>
      )}

      {/* LiveKit Room */}
      <LiveKitRoom
        token={call.token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
        connect={true}
        audio={true}
        video={false}
        className="h-full w-full"
        onConnected={() => {
          console.log('✅ Connected to LiveKit room');
          onCallStateChange(CallState.CONNECTED);
        }}
        onDisconnected={() => {
          console.log('📴 Disconnected from LiveKit room');
          onCallStateChange(CallState.ENDED);
        }}
      >
        {/* Audio Conference (invisible, but handles audio) */}
        <div className="hidden">
          <AudioConference />
        </div>

        {/* Call Controls */}
        <CallControls onEndCall={onEndCall} />

        {/* Visual Avatar (center of screen) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center gap-4">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
              {call.otherUserName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </LiveKitRoom>
    </div>
  );
}
