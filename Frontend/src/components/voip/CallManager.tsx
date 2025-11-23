'use client';

import { useCallEvents } from '@/hooks/useCallEvents';
import { IncomingCallModal } from './IncomingCallModal';
import { ActiveCallView } from './ActiveCallView';
import { useUser } from '@/hooks/useUser';

/**
 * CallManager
 * 
 * Global call management component.
 * Add this to your app layout to handle all call events.
 * 
 * Usage:
 * ```tsx
 * // In app/layout.tsx
 * <body>
 *   <CallManager />
 *   {children}
 * </body>
 * ```
 */
export function CallManager() {
  const { user } = useUser();
  const {
    activeCall,
    incomingCall,
    acceptCall,
    rejectCall,
    endCall,
    updateCallState,
  } = useCallEvents(user?.tenantId, user?.id);

  return (
    <>
      {/* Incoming Call Modal */}
      <IncomingCallModal
        call={incomingCall}
        onAccept={acceptCall}
        onReject={() => rejectCall('User declined')}
      />

      {/* Active Call View */}
      <ActiveCallView
        call={activeCall}
        onEndCall={endCall}
        onCallStateChange={updateCallState}
      />
    </>
  );
}
