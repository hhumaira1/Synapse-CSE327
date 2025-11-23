package com.example.synapse.presentation.voip

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.model.User
import com.example.synapse.data.remote.voip.CallEventsRepository
import com.example.synapse.data.remote.voip.VoipApiService
import com.example.synapse.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Call State
 */
sealed class CallState {
    data object Idle : CallState()
    data object Dialing : CallState()
    data class Ringing(val callerName: String) : CallState()
    data class InCall(val roomName: String, val otherUserName: String) : CallState()
    data class Error(val message: String) : CallState()
}

/**
 * Active Call Info
 */
data class ActiveCallInfo(
    val roomName: String,
    val callerId: String,
    val callerName: String,
    val calleeId: String,
    val calleeName: String,
    val token: String,
    val isIncoming: Boolean
)

/**
 * CallViewModel
 * 
 * Manages VoIP call state and orchestrates API calls + Supabase Realtime events.
 * - Subscribes to incoming call events via CallEventsRepository
 * - Handles outgoing call initiation
 * - Manages call lifecycle (accept, reject, end)
 */
@HiltViewModel
class CallViewModel @Inject constructor(
    private val voipApiService: VoipApiService,
    private val callEventsRepository: CallEventsRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val tag = "CallViewModel"

    // Current user from repository
    private val currentUser: StateFlow<User?> = userRepository.currentUser
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Call state
    private val _callState = MutableStateFlow<CallState>(CallState.Idle)
    val callState: StateFlow<CallState> = _callState.asStateFlow()

    // Active call info
    private val _activeCall = MutableStateFlow<ActiveCallInfo?>(null)
    val activeCall: StateFlow<ActiveCallInfo?> = _activeCall.asStateFlow()

    // Event subscription job
    private var eventSubscriptionJob: Job? = null

    init {
        startListeningForIncomingCalls()
    }

    /**
     * Subscribe to incoming call events from Supabase Realtime
     */
    private fun startListeningForIncomingCalls() {
        val user = currentUser.value
        if (user == null || user.tenantId == null) {
            Log.w(tag, "Cannot listen for calls: user not loaded or missing tenantId")
            return
        }

        eventSubscriptionJob?.cancel()
        eventSubscriptionJob = viewModelScope.launch {
            callEventsRepository.subscribeToCallEvents(user.id, user.tenantId)
                .collect { event ->
                    handleCallEvent(event)
                }
        }
    }

    /**
     * Handle incoming call event from Supabase Realtime
     */
    private fun handleCallEvent(event: CallEventsRepository.CallEvent) {
        Log.d(tag, "📞 Received call event: ${event.eventType} for room ${event.roomName}")

        when (event.eventType) {
            CallEventsRepository.CallEventType.CALL_STARTED -> {
                // Incoming call started by another user
                _callState.value = CallState.Ringing(event.payload?.callerName ?: "Unknown")
                _activeCall.value = ActiveCallInfo(
                    roomName = event.roomName,
                    callerId = event.callerId,
                    callerName = event.payload?.callerName ?: "Unknown",
                    calleeId = event.calleeId,
                    calleeName = currentUser.value?.name ?: "",
                    token = "", // Will be fetched when accepting
                    isIncoming = true
                )
            }

            CallEventsRepository.CallEventType.ACCEPTED -> {
                // Other party accepted our call
                if (_callState.value is CallState.Dialing) {
                    val call = _activeCall.value
                    if (call != null) {
                        _callState.value = CallState.InCall(
                            roomName = call.roomName,
                            otherUserName = call.calleeName
                        )
                    }
                }
            }

            CallEventsRepository.CallEventType.REJECTED -> {
                // Other party rejected our call
                _callState.value = CallState.Error("Call rejected")
                _activeCall.value = null
            }

            CallEventsRepository.CallEventType.ENDED -> {
                // Call ended by other party
                _callState.value = CallState.Idle
                _activeCall.value = null
            }

            CallEventsRepository.CallEventType.RINGING -> {
                // Other party is ringing (outgoing call perspective)
                if (_callState.value is CallState.Dialing) {
                    // Stay in dialing state
                    Log.d(tag, "📞 Call is ringing on other end")
                }
            }
        }
    }

    /**
     * Initiate an outgoing call
     */
    fun initiateCall(calleeId: String, calleeName: String) {
        viewModelScope.launch {
            try {
                _callState.value = CallState.Dialing
                Log.d(tag, "📞 Initiating call to $calleeName ($calleeId)")

                val user = currentUser.value
                if (user == null) {
                    _callState.value = CallState.Error("User not authenticated")
                    return@launch
                }

                val result = voipApiService.startCall(calleeId, user.name)
                result.onSuccess { response ->
                    Log.d(tag, "✅ Call started successfully: ${response.roomName}")
                    _activeCall.value = ActiveCallInfo(
                        roomName = response.roomName,
                        callerId = user.id,
                        callerName = user.name ?: "You",
                        calleeId = calleeId,
                        calleeName = calleeName,
                        token = response.callerToken,
                        isIncoming = false
                    )
                    // State will transition to InCall when other party accepts
                }.onFailure { error ->
                    Log.e(tag, "❌ Failed to start call: ${error.message}")
                    _callState.value = CallState.Error(error.message ?: "Failed to start call")
                    _activeCall.value = null
                }
            } catch (e: Exception) {
                Log.e(tag, "❌ Exception initiating call: ${e.message}")
                _callState.value = CallState.Error(e.message ?: "Unknown error")
                _activeCall.value = null
            }
        }
    }

    /**
     * Accept an incoming call
     */
    fun acceptCall() {
        viewModelScope.launch {
            try {
                val call = _activeCall.value
                if (call == null) {
                    Log.w(tag, "❌ No active call to accept")
                    return@launch
                }

                Log.d(tag, "📞 Accepting call: ${call.roomName}")

                val result = voipApiService.acceptCall(call.roomName)
                result.onSuccess { response ->
                    Log.d(tag, "✅ Call accepted successfully")
                    _activeCall.value = call.copy(token = response.calleeToken)
                    _callState.value = CallState.InCall(
                        roomName = call.roomName,
                        otherUserName = call.callerName
                    )
                }.onFailure { error ->
                    Log.e(tag, "❌ Failed to accept call: ${error.message}")
                    _callState.value = CallState.Error(error.message ?: "Failed to accept call")
                    _activeCall.value = null
                }
            } catch (e: Exception) {
                Log.e(tag, "❌ Exception accepting call: ${e.message}")
                _callState.value = CallState.Error(e.message ?: "Unknown error")
                _activeCall.value = null
            }
        }
    }

    /**
     * Reject an incoming call
     */
    fun rejectCall() {
        viewModelScope.launch {
            try {
                val call = _activeCall.value
                if (call == null) {
                    Log.w(tag, "❌ No active call to reject")
                    return@launch
                }

                Log.d(tag, "📞 Rejecting call: ${call.roomName}")

                val result = voipApiService.rejectCall(call.roomName, "User declined")
                result.onSuccess {
                    Log.d(tag, "✅ Call rejected successfully")
                    _callState.value = CallState.Idle
                    _activeCall.value = null
                }.onFailure { error ->
                    Log.e(tag, "❌ Failed to reject call: ${error.message}")
                    // Still clear state even if API call fails
                    _callState.value = CallState.Idle
                    _activeCall.value = null
                }
            } catch (e: Exception) {
                Log.e(tag, "❌ Exception rejecting call: ${e.message}")
                _callState.value = CallState.Idle
                _activeCall.value = null
            }
        }
    }

    /**
     * End an active call
     */
    fun endCall() {
        viewModelScope.launch {
            try {
                val call = _activeCall.value
                if (call == null) {
                    Log.w(tag, "❌ No active call to end")
                    return@launch
                }

                Log.d(tag, "📞 Ending call: ${call.roomName}")

                val result = voipApiService.endCall(call.roomName)
                result.onSuccess {
                    Log.d(tag, "✅ Call ended successfully")
                    _callState.value = CallState.Idle
                    _activeCall.value = null
                }.onFailure { error ->
                    Log.e(tag, "❌ Failed to end call: ${error.message}")
                    // Still clear state even if API call fails
                    _callState.value = CallState.Idle
                    _activeCall.value = null
                }
            } catch (e: Exception) {
                Log.e(tag, "❌ Exception ending call: ${e.message}")
                _callState.value = CallState.Idle
                _activeCall.value = null
            }
        }
    }

    /**
     * Cancel call (for outgoing call before accepted)
     */
    fun cancelCall() {
        endCall() // Same as ending call
    }

    override fun onCleared() {
        super.onCleared()
        eventSubscriptionJob?.cancel()
    }
}
