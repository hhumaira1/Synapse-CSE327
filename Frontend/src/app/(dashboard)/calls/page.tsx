"use client";

import { useUser } from '@clerk/nextjs';
import { Phone } from 'lucide-react';
import { useVoiceCall } from '@/hooks/useVoiceCall';
import { useUserData } from '@/hooks/useUserData';
import { Dialer } from '@/components/voice/Dialer';
import { ActiveCall } from '@/components/voice/ActiveCall';
import { CallHistory } from '@/components/voice/CallHistory';

export default function CallsPage() {
  const { user } = useUser();
  const { userData, loading: userDataLoading } = useUserData();
  
  const {
    callState,
    duration,
    isMuted,
    isSpeakerOn,
    currentContactName,
    currentContactNumber,
    initiateCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    isInitialized,
  } = useVoiceCall(
    userData?.id || '',
    userData?.tenantId || '',
    'tenant_member'
  );

  if (!user || userDataLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-linear-to-br from-indigo-600 to-purple-600 rounded-lg">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voice Calls</h1>
            <p className="text-gray-600 mt-1">
              Make calls to your contacts and view call history
            </p>
          </div>
        </div>
      </div>

      {/* Initialization Check */}
      {!isInitialized && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
            <span className="text-yellow-800">Initializing voice calling...</span>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Dialer */}
        <div className="space-y-6">
          {callState === 'idle' ? (
            <Dialer onCall={initiateCall} disabled={!isInitialized} />
          ) : (
            <ActiveCall
              callState={callState}
              duration={duration}
              contactName={currentContactName}
              contactNumber={currentContactNumber}
              isMuted={isMuted}
              isSpeakerOn={isSpeakerOn}
              onEndCall={endCall}
              onToggleMute={toggleMute}
              onToggleSpeaker={toggleSpeaker}
            />
          )}
        </div>

        {/* Right Column - Call History */}
        <div>
          <CallHistory
            onCallBack={(phoneNumber, contactId, contactName) => {
              if (callState === 'idle') {
                initiateCall(phoneNumber, contactId, contactName);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
