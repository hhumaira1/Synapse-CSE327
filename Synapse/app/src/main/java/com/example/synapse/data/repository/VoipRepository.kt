package com.example.synapse.data.repository

import com.example.synapse.data.api.voip.*
import com.example.synapse.data.socket.SocketIOManager
import com.example.synapse.data.socket.model.CallEvent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * VoipRepository
 * 
 * Coordinates VoIP operations between API service and WebSocket manager.
 * - Provides clean interface to ViewModels
 * - Handles coroutine dispatching
 * - Exposes WebSocket events as Flow
 */
@Singleton
class VoipRepository @Inject constructor(
    private val apiService: VoipApiService,
    private val socketManager: SocketIOManager
) {
    
    // ========== API Calls ==========
    
    suspend fun startCall(
        calleeId: String,
        callerName: String? = null
    ): StartCallResponse = withContext(Dispatchers.IO) {
        apiService.startCall(StartCallRequest(calleeId, callerName))
    }
    
    suspend fun acceptCall(
        callLogId: String,
        roomName: String
    ): AcceptCallResponse = withContext(Dispatchers.IO) {
        apiService.acceptCall(AcceptCallRequest(callLogId, roomName))
    }
    
    suspend fun rejectCall(
        callLogId: String,
        reason: String? = null
    ): RejectCallResponse = withContext(Dispatchers.IO) {
        apiService.rejectCall(RejectCallRequest(callLogId, reason))
    }
    
    suspend fun endCall(
        callLogId: String,
        roomName: String
    ): EndCallResponse = withContext(Dispatchers.IO) {
        apiService.endCall(EndCallRequest(callLogId, roomName))
    }
    
    suspend fun updateFCMToken(token: String) = withContext(Dispatchers.IO) {
        apiService.updateFCMToken(UpdateFCMTokenRequest(token))
    }
    
    suspend fun getAvailableAgents(): List<OnlineUser> = withContext(Dispatchers.IO) {
        apiService.getAvailableAgents()
    }
    
    suspend fun getOnlineUsers(): List<OnlineUser> = withContext(Dispatchers.IO) {
        apiService.getOnlineUsers()
    }
    
    // ========== WebSocket ==========
    
    /**
     * Observe call events from WebSocket
     */
    fun observeCallEvents(): Flow<CallEvent> = socketManager.callEvents
    
    /**
     * Connect to VoIP WebSocket
     */
    fun connectSocket(userId: String, tenantId: String) {
        socketManager.connect(userId, tenantId)
    }
    
    /**
     * Disconnect from VoIP WebSocket
     */
    fun disconnectSocket() {
        socketManager.disconnect()
    }
    
    /**
     * Check if socket is connected
     */
    fun isSocketConnected(): Boolean = socketManager.isSocketConnected()
    
    /**
     * Get socket connection state flow
     */
    fun getSocketConnectionState(): Flow<Boolean> = socketManager.isConnected
}
