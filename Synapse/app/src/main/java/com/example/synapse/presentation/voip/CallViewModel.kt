package com.example.synapse.presentation.voip

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.BuildConfig
import com.example.synapse.data.livekit.LiveKitManager
import com.example.synapse.data.repository.VoipRepository
import com.example.synapse.data.socket.model.CallEvent
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * CallViewModel
 * 
 * Manages VoIP call state and orchestrates Repository + LiveKit.
 * - Listens to WebSocket events
 * - Handles call lifecycle (start, accept, reject, end)
 * - Manages call duration timer
 */
@HiltViewModel
class CallViewModel @Inject constructor(
    private val repository: VoipRepository,
    private val liveKitManager: LiveKitManager,
    private val preferencesManager: com.example.synapse.data.preferences.PreferencesManager
) : ViewModel() {
    
    private val tag = "CallViewModel"
    
    // Call state
    private val _callState = MutableStateFlow<CallState>(CallState.Idle)
    val callState: StateFlow<CallState> = _callState.asStateFlow()
    
    // Current call info
    private var currentCallLogId: String? = null
    private var currentRoomName: String? = null
    private var callStartTime: Long = 0
    
    init {
        Log.d(tag, "🚀 CallViewModel INITIALIZED")
        
        // Monitor user session and connect socket
        viewModelScope.launch {
            Log.d(tag, "📡 Starting user session monitor...")
            
            kotlinx.coroutines.flow.combine(
                preferencesManager.userId,
                preferencesManager.tenantId
            ) { userId, tenantId ->
                Log.d(tag, "🔄 Session Flow emitted: userId=$userId, tenantId=$tenantId")
                Pair(userId, tenantId)
            }.collect { (userId, tenantId) ->
                Log.d(tag, "════════════════════════════════════════")
                Log.d(tag, "📊 USER SESSION CHECK:")
                Log.d(tag, "   - userId: ${userId ?: "NULL"}")
                Log.d(tag, "   - tenantId: ${tenantId ?: "NULL"}")
                Log.d(tag, "   - Both valid? ${!userId.isNullOrEmpty() && !tenantId.isNullOrEmpty()}")
                Log.d(tag, "   - Socket connected? ${repository.isSocketConnected()}")
                
                if (!userId.isNullOrEmpty() && !tenantId.isNullOrEmpty()) {
                    Log.d(tag, "✅ Valid session - Attempting socket connection...")
                    if (!repository.isSocketConnected()) {
                        Log.d(tag, "🔌 Calling repository.connectSocket($userId, $tenantId)")
                        try {
                            repository.connectSocket(userId, tenantId)
                            Log.d(tag, "✅ connectSocket() call completed")
                        } catch (e: Exception) {
                            Log.e(tag, "❌ connectSocket() threw exception: ${e.message}", e)
                        }
                    } else {
                        Log.d(tag, "⏭️ Socket already connected, skipping")
                    }
                } else {
                    Log.w(tag, "⚠️ Invalid session - Disconnecting socket")
                    repository.disconnectSocket()
                }
                Log.d(tag, "════════════════════════════════════════")
            }
        }

        // Listen to WebSocket call events
        viewModelScope.launch {
            Log.d(tag, "👂 Starting event listener...")
            repository.observeCallEvents().collect { event ->
                handleCallEvent(event)
            }
        }
        
        // Call duration timer
        viewModelScope.launch {
            while (true) {
                delay(1000) // Update every second
                
                val state = _callState.value
                if (state is CallState.Active && state.isConnected) {
                    val duration = ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
                    _callState.value = state.copy(duration = duration)
                }
            }
        }
        
        Log.d(tag, "✅ CallViewModel init complete - all coroutines launched")
    }
    
    /**
     * Handle WebSocket call events
     */
    private fun handleCallEvent(event: CallEvent) {
        Log.d(tag, "═══════════════════════════════════════════")
        Log.d(tag, "📞 CALL EVENT RECEIVED: ${event::class.simpleName}")
        Log.d(tag, "📊 Current State BEFORE: ${_callState.value::class.simpleName}")
        
        when (event) {
            is CallEvent.IncomingCall -> {
                Log.d(tag, "📥 IncomingCall Details:")
                Log.d(tag, "   - Caller: ${event.callerName}")
                Log.d(tag, "   - From: ${event.from}")
                Log.d(tag, "   - Room: ${event.roomName}")
                Log.d(tag, "   - CallLogId: ${event.callLogId}")
                
                // Incoming call - show ringing dialog
                _callState.value = CallState.Ringing(
                    callerName = event.callerName,
                    callLogId = event.callLogId,
                    roomName = event.roomName,
                    callerAvatar = null // TODO: Get from API if needed
                )
                Log.d(tag, "✅ State UPDATED to Ringing")
                Log.d(tag, "📊 Current State AFTER: ${_callState.value::class.simpleName}")
            }
            
            is CallEvent.CallAccepted -> {
                Log.d(tag, "✅ CallAccepted Details:")
                Log.d(tag, "   - From: ${event.from}")
                Log.d(tag, "   - Room: ${event.roomName}")
                
                // Other party accepted our call
                val state = _callState.value
                Log.d(tag, "   - Current state type: ${state::class.simpleName}")
                
                if (state is CallState.Active) {
                    callStartTime = System.currentTimeMillis()
                    _callState.value = state.copy(isConnected = true)
                    Log.d(tag, "✅ Call accepted - now connected")
                    Log.d(tag, "⏱️ Timer started at $callStartTime")
                } else {
                    Log.w(tag, "⚠️ Received CallAccepted but state is not Active: ${state::class.simpleName}")
                }
                Log.d(tag, "📊 Current State AFTER: ${_callState.value::class.simpleName}")
            }
            
            is CallEvent.CallRejected -> {
                Log.d(tag, "❌ CallRejected Details:")
                Log.d(tag, "   - Reason: ${event.reason}")
                
                // Other party rejected our call
                liveKitManager.disconnect()
                _callState.value = CallState.Error("Call was rejected")
                Log.d(tag, "❌ Call rejected: ${event.reason}")
                
                // Reset to Idle after 2 seconds
                viewModelScope.launch {
                    delay(2000)
                    _callState.value = CallState.Idle
                    Log.d(tag, "🔄 State reset to Idle after rejection")
                }
            }
            
            is CallEvent.CallEnded -> {
                Log.d(tag, "📴 CallEnded Details:")
                Log.d(tag, "   - Room: ${event.roomName}")
                Log.d(tag, "   - Ended by: ${event.endedBy}")
                
                // Call ended by either party
                liveKitManager.disconnect()
                _callState.value = CallState.Idle
                currentCallLogId = null
                currentRoomName = null
                Log.d(tag, "📴 Call ended - state reset to Idle")
                Log.d(tag, "📊 Current State AFTER: ${_callState.value::class.simpleName}")
            }
            
            is CallEvent.MissedCall -> {
                Log.d(tag, "📵 MissedCall Details:")
                Log.d(tag, "   - Caller: ${event.callerName}")
                Log.d(tag, "   - Time: ${event.callTime}")
                
                // Call timed out (30s)
                liveKitManager.disconnect()
                _callState.value = CallState.Error("${event.callerName} didn't answer")
                Log.d(tag, "📵 Missed call from ${event.callerName}")
                
                // Reset to Idle after 3 seconds
                viewModelScope.launch {
                    delay(3000)
                    _callState.value = CallState.Idle
                    Log.d(tag, "🔄 State reset to Idle after missed call")
                }
            }
        }
        
        Log.d(tag, "═══════════════════════════════════════════")
    }
    
    /**
     * Start an outgoing call
     */
    fun startCall(calleeId: String, calleeName: String) {
        viewModelScope.launch {
            try {
                Log.d(tag, "📞 Starting call to $calleeName")
                _callState.value = CallState.Calling(calleeName)
                
                // Call backend API
                val response = repository.startCall(calleeId, calleeName)
                currentCallLogId = response.callLogId
                currentRoomName = response.roomName
                
                // Connect to LiveKit
                val connected = liveKitManager.connect(response.callerToken)
                
                if (connected) {
                    _callState.value = CallState.Active(
                        participantName = calleeName,
                        participantAvatar = null,
                        isConnected = false, // Wait for callAccepted event
                        duration = 0
                    )
                    Log.d(tag, "✅ Call initiated successfully")
                } else {
                    _callState.value = CallState.Error("Failed to connect to call")
                }
            } catch (e: Exception) {
                Log.e(tag, "❌ Failed to start call: ${e.message}", e)
                _callState.value = CallState.Error(e.message ?: "Failed to start call")
            }
        }
    }
    
    /**
     * Accept an incoming call
     */
    fun acceptCall() {
        viewModelScope.launch {
            try {
                val state = _callState.value
                if (state !is CallState.Ringing) {
                    Log.w(tag, "Cannot accept - not in ringing state")
                    return@launch
                }
                
                Log.d(tag, "✅ Accepting call from ${state.callerName}")
                
                // Call backend API
                val response = repository.acceptCall(state.callLogId, state.roomName)
                currentCallLogId = state.callLogId
                currentRoomName = state.roomName
                
                // Connect to LiveKit
                val connected = liveKitManager.connect(response.calleeToken)
                
                if (connected) {
                    callStartTime = System.currentTimeMillis()
                    _callState.value = CallState.Active(
                        participantName = state.callerName,
                        participantAvatar = state.callerAvatar,
                        isConnected = true, // Callee is connected immediately
                        duration = 0
                    )
                    Log.d(tag, "✅ Call accepted successfully")
                } else {
                    _callState.value = CallState.Error("Failed to connect to call")
                }
            } catch (e: Exception) {
                Log.e(tag, "❌ Failed to accept call: ${e.message}", e)
                _callState.value = CallState.Error(e.message ?: "Failed to accept call")
            }
        }
    }
    
    /**
     * Reject an incoming call
     */
    fun rejectCall() {
        viewModelScope.launch {
            val state = _callState.value
            if (state !is CallState.Ringing) return@launch
            
            Log.d(tag, "❌ Rejecting call from ${state.callerName}")
            
            try {
                repository.rejectCall(state.callLogId, "Busy")
                _callState.value = CallState.Idle
            } catch (e: Exception) {
                Log.e(tag, "Failed to reject call: ${e.message}")
                _callState.value = CallState.Idle
            }
        }
    }
    
    /**
     * End active call
     */
    fun endCall() {
        viewModelScope.launch {
            Log.d(tag, "📴 Ending call")
            
            currentCallLogId?.let { callLogId ->
                currentRoomName?.let { roomName ->
                    try {
                        repository.endCall(callLogId, roomName)
                    } catch (e: Exception) {
                        Log.e(tag, "Failed to end call via API: ${e.message}")
                    }
                }
            }
            
            liveKitManager.disconnect()
            _callState.value = CallState.Idle
            currentCallLogId = null
            currentRoomName = null
        }
    }
    
    /**
     * Toggle mute
     */
    fun toggleMute() {
        liveKitManager.toggleMute()
    }
    
    /**
     * Toggle speaker
     */
    fun toggleSpeaker() {
        liveKitManager.toggleSpeaker()
    }
    
    /**
     * Get mute state
     */
    fun isMuted() = liveKitManager.isMuted
    
    /**
     * Get speaker state
     */
    fun isSpeakerOn() = liveKitManager.isSpeakerOn
    
    override fun onCleared() {
        super.onCleared()
        liveKitManager.disconnect()
    }
}

/**
 * CallState - Sealed class representing call states
 */
sealed class CallState {
    object Idle : CallState()
    
    data class Ringing(
        val callerName: String,
        val callLogId: String,
        val roomName: String,
        val callerAvatar: String? = null
    ) : CallState()
    
    data class Calling(
        val calleeName: String
    ) : CallState()
    
    data class Active(
        val participantName: String,
        val participantAvatar: String? = null,
        val isConnected: Boolean,
        val duration: Int
    ) : CallState()
    
    data class Error(
        val message: String
    ) : CallState()
}
