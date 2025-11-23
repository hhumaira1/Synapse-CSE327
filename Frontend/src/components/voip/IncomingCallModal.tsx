'use client';

import { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CallEvent } from '@/hooks/useCallEvents';

interface IncomingCallModalProps {
  call: CallEvent | null;
  onAccept: () => void;
  onReject: () => void;
}

/**
 * IncomingCallModal
 * 
 * Shows modal for incoming VoIP call.
 * Triggered by Supabase Realtime call_started event.
 */
export function IncomingCallModal({
  call,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (call) {
      setIsOpen(true);
      
      // Play ringtone
      const ringtone = new Audio('/ringtone.mp3');
      ringtone.loop = true;
      ringtone.play().catch(err => console.error('Failed to play ringtone:', err));
      setAudio(ringtone);

      return () => {
        ringtone.pause();
        ringtone.currentTime = 0;
      };
    } else {
      setIsOpen(false);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }, [call]);

  const handleAccept = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    onAccept();
  };

  const handleReject = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    onReject();
  };

  if (!call) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReject()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">📞 Incoming Call</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* Caller Info */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse">
            <Phone className="h-12 w-12 text-white" />
          </div>

          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {call.payload.callerName || 'Unknown User'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Incoming call...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full justify-center">
            {/* Reject Button */}
            <Button
              size="lg"
              variant="destructive"
              onClick={handleReject}
              className="gap-2 px-8 rounded-full"
            >
              <PhoneOff className="h-5 w-5" />
              Decline
            </Button>

            {/* Accept Button */}
            <Button
              size="lg"
              onClick={handleAccept}
              className="gap-2 px-8 rounded-full bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-5 w-5" />
              Accept
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
