"use client";

import { Mic, MicOff, Volume2, VolumeX, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CallState } from '@/hooks/useVoiceCall';

interface ActiveCallProps {
  callState: CallState;
  duration: number;
  contactName: string | null;
  contactNumber: string | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}

export function ActiveCall({
  callState,
  duration,
  contactName,
  contactNumber,
  isMuted,
  isSpeakerOn,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
}: ActiveCallProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStateDisplay = () => {
    switch (callState) {
      case 'connecting':
        return { text: 'Connecting...', color: 'bg-yellow-500' };
      case 'ringing':
        return { text: 'Ringing...', color: 'bg-blue-500 animate-pulse' };
      case 'active':
        return { text: 'Active', color: 'bg-green-500' };
      case 'disconnected':
        return { text: 'Disconnected', color: 'bg-gray-500' };
      case 'error':
        return { text: 'Error', color: 'bg-red-500' };
      default:
        return { text: 'Idle', color: 'bg-gray-400' };
    }
  };

  if (callState === 'idle') {
    return null;
  }

  const stateDisplay = getCallStateDisplay();

  return (
    <Card className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
      <div className="space-y-6">
        {/* Call Status */}
        <div className="text-center space-y-3">
          <Badge className={`${stateDisplay.color} text-white px-4 py-1 text-sm`}>
            {stateDisplay.text}
          </Badge>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {contactName || 'Unknown'}
            </h3>
            <p className="text-lg text-gray-600 mt-1">{contactNumber}</p>
          </div>

          {/* Duration */}
          {callState === 'active' && (
            <div className="text-4xl font-mono font-bold text-indigo-600 mt-4">
              {formatDuration(duration)}
            </div>
          )}
        </div>

        {/* Call Controls */}
        {(callState === 'connecting' || callState === 'ringing' || callState === 'active') && (
          <div className="flex justify-center items-center gap-4 mt-8">
            {/* Mute Button - only show when active */}
            {callState === 'active' && (
              <Button
                onClick={onToggleMute}
                variant={isMuted ? 'default' : 'outline'}
                size="lg"
                className={`h-16 w-16 rounded-full ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : ''
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>
            )}

            {/* End Call Button */}
            <Button
              onClick={onEndCall}
              size="lg"
              className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>

            {/* Speaker Button - only show when active */}
            {callState === 'active' && (
              <Button
                onClick={onToggleSpeaker}
                variant={isSpeakerOn ? 'default' : 'outline'}
                size="lg"
                className={`h-16 w-16 rounded-full ${
                  isSpeakerOn ? 'bg-blue-500 hover:bg-blue-600' : ''
                }`}
              >
                {isSpeakerOn ? (
                  <Volume2 className="w-6 h-6" />
                ) : (
                  <VolumeX className="w-6 h-6" />
                )}
              </Button>
            )}
          </div>
        )}

        {/* Error/Disconnected State */}
        {(callState === 'error' || callState === 'disconnected') && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {callState === 'error' ? 'Call failed. Please try again.' : 'Call ended.'}
            </p>
            <Button onClick={onEndCall} variant="outline">
              Close
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
