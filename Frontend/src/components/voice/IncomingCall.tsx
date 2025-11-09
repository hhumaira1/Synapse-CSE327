"use client";

import { Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface IncomingCallProps {
  callerName: string;
  contactPhone: string;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCall({
  callerName,
  contactPhone,
  onAccept,
  onReject,
}: IncomingCallProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center space-y-6">
          {/* Animated ringing icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
              <div className="relative p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full">
                <Phone className="w-12 h-12 text-white animate-bounce" />
              </div>
            </div>
          </div>

          {/* Caller info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Incoming Call
            </h2>
            <p className="text-xl font-semibold text-gray-700">
              {callerName}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {contactPhone}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 justify-center pt-4">
            {/* Reject button */}
            <Button
              onClick={onReject}
              variant="outline"
              size="lg"
              className="w-24 h-24 rounded-full border-2 border-red-500 hover:bg-red-50"
            >
              <div className="flex flex-col items-center gap-1">
                <PhoneOff className="w-8 h-8 text-red-500" />
                <span className="text-xs text-red-600 font-semibold">Reject</span>
              </div>
            </Button>

            {/* Accept button */}
            <Button
              onClick={onAccept}
              size="lg"
              className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <div className="flex flex-col items-center gap-1">
                <Phone className="w-8 h-8 text-white" />
                <span className="text-xs text-white font-semibold">Accept</span>
              </div>
            </Button>
          </div>

          {/* Ringing text */}
          <p className="text-sm text-gray-500 animate-pulse">
            📞 Ringing...
          </p>
        </div>
      </Card>
    </div>
  );
}
