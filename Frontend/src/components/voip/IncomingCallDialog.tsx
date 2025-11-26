"use client";

import React, { useEffect, useState } from 'react';
import { useVoIPStore } from '@/stores/useVoIPStore';
import { useVoIP } from './VoIPProvider';
import { Phone, PhoneOff, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function IncomingCallDialog() {
  const { incomingCall } = useVoIPStore();
  const { acceptCall, rejectCall } = useVoIP(); // Use context instead

  const [callDuration, setCallDuration] = useState(0);

  // Timer for "ringing" duration
  useEffect(() => {
    if (incomingCall) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCallDuration(0);
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            // Don't allow closing by clicking outside during incoming call
          }
        }}
      >
        {/* Glass Morphism Card */}
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative max-w-md w-full mx-4"
        >
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-3xl blur-3xl animate-pulse"></div>

          {/* Main Card */}
          <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            {/* Pulsing Rings Animation */}
            <div className="relative flex justify-center mb-6">
              {/* Outer pulse ring */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.2, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              />

              {/* Middle pulse ring */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.7, 0.3, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
                className="absolute w-28 h-28 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              />

              {/* Avatar */}
              <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-[2px] shadow-lg shadow-purple-500/50">
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                  {incomingCall.callerAvatar ? (
                    <img
                      src={incomingCall.callerAvatar}
                      alt={incomingCall.callerName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>
            </div>

            {/* Caller Info */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                {incomingCall.callerName}
              </h2>
              <p className="text-white/70 text-sm mb-1">Incoming Call</p>
              {incomingCall.tenantName && (
                <p className="text-white/50 text-xs">
                  via {incomingCall.tenantName}
                </p>
              )}
              <p className="text-white/60 text-sm mt-3">
                Ringing... {callDuration}s
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-6 justify-center">
              {/* Reject Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => rejectCall()}
                className="relative group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-pink-500 blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>

                {/* Button */}
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <PhoneOff className="w-7 h-7 text-white" />
                </div>
              </motion.button>

              {/* Accept Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => acceptCall()}
                className="relative group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>

                {/* Button */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg animate-bounce">
                  <Phone className="w-9 h-9 text-white" />
                </div>
              </motion.button>
            </div>

            {/* Labels */}
           <div className="flex gap-6 justify-center mt-3">
              <span className="text-white/60 text-xs">Decline</span>
              <span className="text-white/60 text-xs ml-2">Accept</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
