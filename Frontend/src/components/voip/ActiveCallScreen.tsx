"use client";

import React, { useEffect, useState } from 'react';
import { useVoIPStore } from '@/stores/useVoIPStore';
import { useVoIP } from './VoIPProvider';
import {
    PhoneOff,
    Mic,
    MicOff,
    User,
} from 'lucide-react';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

export function ActiveCallScreen() {
    const {
        activeCall,
        isMuted,
        toggleMute,
    } = useVoIPStore();

    const { endCall } = useVoIP();
    const [callDuration, setCallDuration] = useState(0);

    // Update call duration - ONLY when status is 'connected'!
    useEffect(() => {
        if (!activeCall || activeCall.status !== 'connected') {
            setCallDuration(0);
            return;
        }

        const interval = setInterval(() => {
            const duration = Math.floor((Date.now() - activeCall.startTime.getTime()) / 1000);
            setCallDuration(duration);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeCall, activeCall?.status]);

    if (!activeCall) return null;

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
            {/* LiveKit Room */}
            {activeCall.token && (
                <LiveKitRoom
                    serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || 'ws://localhost:7880'}
                    token={activeCall.token}
                    connect={true}
                    audio={true}
                    video={false}
                    className="hidden"
                    onConnected={() => {
                        console.log('✅ LiveKit Room Connected (audio ready)');
                        // Status updates via WebSocket callAccepted event, not here
                    }}
                >
                    <RoomAudioRenderer />
                </LiveKitRoom>
            )}

            {/* Call UI */}
            <div className="relative h-full flex flex-col items-center justify-center px-4">
                {/* Avatar */}
                <div className="relative mx-auto w-32 h-32 mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-20"></div>
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-[3px]">
                        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                            <User className="w-16 h-16 text-white" />
                        </div>
                    </div>
                </div>

                {/* Name & Status */}
                <h1 className="text-4xl font-bold text-white mb-2">
                    {activeCall.participant.name}
                </h1>
                <p className="text-white/70 text-lg mb-4">
                    {activeCall.status === 'connecting' ? 'Calling...' : 'Connected'}
                </p>

                {/* Duration - only shows when connected */}
                {activeCall.status === 'connected' && (
                    <div className="inline-block px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-12">
                        <p className="text-white font-mono text-2xl">{formatDuration(callDuration)}</p>
                    </div>
                )}

                {activeCall.status === 'connecting' && (
                    <div className="inline-block px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-12">
                        <p className="text-white/60 text-lg">Waiting for answer...</p>
                    </div>
                )}

                {/* Controls */}
                <div className="flex gap-6 items-center">
                    {/* Mute - disabled for now due to LiveKit issues */}
                    <button
                        onClick={toggleMute}
                        disabled
                        className="p-5 rounded-full bg-white/10 opacity-50 cursor-not-allowed"
                        title="Mute temporarily disabled"
                    >
                        {isMuted ? (
                            <MicOff className="w-6 h-6 text-white" />
                        ) : (
                            <Mic className="w-6 h-6 text-white" />
                        )}
                    </button>

                    {/* End Call */}
                    <button
                        onClick={endCall}
                        className="p-6 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg shadow-red-500/50 transition-all hover:scale-105"
                    >
                        <PhoneOff className="w-8 h-8 text-white" />
                    </button>
                </div>

                {/* Labels */}
                <div className="flex gap-14 mt-4">
                    <span className="text-white/60 text-sm">Mute (Disabled)</span>
                    <span className="text-white/60 text-sm">End Call</span>
                </div>
            </div>
        </div>
    );
}