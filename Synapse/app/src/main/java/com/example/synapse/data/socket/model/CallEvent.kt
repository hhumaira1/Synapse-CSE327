package com.example.synapse.data.socket.model

/**
 * CallEvent - WebSocket event DTOs
 * 
 * Sealed class representing all possible VoIP WebSocket events
 * received from the backend.
 */
sealed class CallEvent {
    /**
     * Incoming call from another user
     */
    data class IncomingCall(
        val from: String,
        val callerName: String,
        val roomName: String,
        val callLogId: String
    ) : CallEvent()
    
    /**
     * Other user accepted the call (for caller)
     */
    data class CallAccepted(
        val from: String,
        val roomName: String
    ) : CallEvent()
    
    /**
     * Other user rejected the call
     */
    data class CallRejected(
        val reason: String?
    ) : CallEvent()
    
    /**
     * Call ended by either party
     */
    data class CallEnded(
        val roomName: String,
        val endedBy: String
    ) : CallEvent()
    
    /**
     * Call went unanswered (30s timeout)
     */
    data class MissedCall(
        val callerName: String,
        val callTime: String
    ) : CallEvent()
}
