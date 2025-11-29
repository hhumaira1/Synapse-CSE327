package com.example.synapse.data.socket

import android.content.Context
import android.util.Log
import com.example.synapse.BuildConfig
import com.example.synapse.data.socket.model.CallEvent
import dagger.hilt.android.qualifiers.ApplicationContext
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

/**
 * SocketIOManager
 * 
 * Manages WebSocket connection to backend VoIP namespace.
 * - Connects to /voip namespace with userId and tenantId
 * - Listens to incoming call events
 * - Emits events to Flow for ViewModel consumption
 * - NO EMIT CALLS - all call actions go through REST API
 */
@Singleton
class SocketIOManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val tag = "SocketIOManager"
    
    private var socket: Socket? = null
    
    // Call events flow (hot flow for ViewModel)
    private val _callEvents = MutableSharedFlow<CallEvent>(replay = 0)
    val callEvents: SharedFlow<CallEvent> = _callEvents.asSharedFlow()
    
    // Connection state
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()
    
    /**
     * Connect to VoIP WebSocket
     * 
     * @param userId Supabase user ID
     * @param tenantId Current tenant ID
     */
    fun connect(userId: String, tenantId: String) {
        try {
            val apiUrl = BuildConfig.API_URL
            Log.d(tag, "🔌 Connecting to $apiUrl/voip")
            Log.d(tag, "   userId: $userId, tenantId: $tenantId")
            
            socket = IO.socket("$apiUrl/voip", IO.Options().apply {
                // Query parameters (not auth!)
                query = "userId=$userId&tenantId=$tenantId"
                
                // Use WebSocket transport only
                transports = arrayOf("websocket")
                
                // Reconnection settings
                reconnection = true
                reconnectionDelay = 1000
                reconnectionAttempts = 5
            }).apply {
                // ========== Connection Events ==========
                
                on(Socket.EVENT_CONNECT) {
                    Log.d(tag, "✅ Connected to VoIP WebSocket")
                    Log.d(tag, "   Socket ID: ${id()}")
                    _isConnected.value = true
                    
                    // Start heartbeat
                    startHeartbeat()
                }
                
                on(Socket.EVENT_DISCONNECT) { args ->
                    val reason = if (args.isNotEmpty()) args[0] as? String else "unknown"
                    Log.d(tag, "❌ Disconnected from VoIP WebSocket: $reason")
                    _isConnected.value = false
                    stopHeartbeat()
                }
                
                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    val error = if (args.isNotEmpty()) args[0] else "unknown error"
                    Log.e(tag, "🔴 Connection error: $error")
                }
                
                // ========== Call Events ==========
                
                on("incomingCall") { args ->
                    try {
                        val json = args[0] as JSONObject
                        Log.d(tag, "════════════════════════════════════════")
                        Log.d(tag, "📞 SOCKET EVENT: incomingCall")
                        Log.d(tag, "📦 Raw JSON: $json")
                        Log.d(tag, "   - from: ${json.getString("from")}")
                        Log.d(tag, "   - callerName: ${json.getString("callerName")}")
                        Log.d(tag, "   - roomName: ${json.getString("roomName")}")
                        Log.d(tag, "   - callLogId: ${json.getString("callLogId")}")
                        
                        CoroutineScope(Dispatchers.IO).launch {
                            val event = CallEvent.IncomingCall(
                                from = json.getString("from"),
                                callerName = json.getString("callerName"),
                                roomName = json.getString("roomName"),
                                callLogId = json.getString("callLogId")
                            )
                            Log.d(tag, "🚀 Emitting to Flow: $event")
                            _callEvents.emit(event)
                            Log.d(tag, "✅ Event emitted successfully")
                        }
                        Log.d(tag, "════════════════════════════════════════")
                    } catch (e: Exception) {
                        Log.e(tag, "❌ Error parsing incomingCall: ${e.message}", e)
                    }
                }
                
                on("callAccepted") { args ->
                    try {
                        val json = args[0] as JSONObject
                        Log.d(tag, "✅ Call accepted: ${json.getString("roomName")}")
                        
                        CoroutineScope(Dispatchers.IO).launch {
                            _callEvents.emit(CallEvent.CallAccepted(
                                from = json.getString("from"),
                                roomName = json.getString("roomName")
                            ))
                        }
                    } catch (e: Exception) {
                        Log.e(tag, "Error parsing callAccepted: ${e.message}")
                    }
                }
                
                on("callRejected") { args ->
                    try {
                        val json = args[0] as JSONObject
                        val reason = json.optString("reason", null)
                        Log.d(tag, "❌ Call rejected: $reason")
                        
                        CoroutineScope(Dispatchers.IO).launch {
                            _callEvents.emit(CallEvent.CallRejected(reason))
                        }
                    } catch (e: Exception) {
                        Log.e(tag, "Error parsing callRejected: ${e.message}")
                    }
                }
                
                on("callEnded") { args ->
                    try {
                        val json = args[0] as JSONObject
                        Log.d(tag, "════════════════════════════════════════")
                        Log.d(tag, "📴 SOCKET EVENT: callEnded")
                        Log.d(tag, "📦 Raw JSON: $json")
                        Log.d(tag, "   - roomName: ${json.getString("roomName")}")
                        Log.d(tag, "   - endedBy: ${json.getString("endedBy")}")
                        
                        CoroutineScope(Dispatchers.IO).launch {
                            val event = CallEvent.CallEnded(
                                roomName = json.getString("roomName"),
                                endedBy = json.getString("endedBy")
                            )
                            Log.d(tag, "🚀 Emitting to Flow: $event")
                            _callEvents.emit(event)
                            Log.d(tag, "✅ Event emitted successfully")
                        }
                        Log.d(tag, "════════════════════════════════════════")
                    } catch (e: Exception) {
                        Log.e(tag, "❌ Error parsing callEnded: ${e.message}", e)
                    }
                }
                
                on("missedCall") { args ->
                    try {
                        val json = args[0] as JSONObject
                        Log.d(tag, "📵 Missed call: ${json.getString("callerName")}")
                        
                        CoroutineScope(Dispatchers.IO).launch {
                            _callEvents.emit(CallEvent.MissedCall(
                                callerName = json.getString("callerName"),
                                callTime = json.getString("callTime")
                            ))
                        }
                    } catch (e: Exception) {
                        Log.e(tag, "Error parsing missedCall: ${e.message}")
                    }
                }
                
                // Connect
                connect()
            }
        } catch (e: Exception) {
            Log.e(tag, "Failed to create socket: ${e.message}", e)
        }
    }
    
    /**
     * Disconnect from VoIP WebSocket
     */
    fun disconnect() {
        Log.d(tag, "🔌 Disconnecting from VoIP WebSocket")
        socket?.disconnect()
        socket = null
        _isConnected.value = false
    }
    
    /**
     * Check if socket is connected
     */
    fun isSocketConnected(): Boolean {
        return socket?.connected() == true
    }
    
    // ========== Heartbeat ==========
    
    private var heartbeatJob: kotlinx.coroutines.Job? = null
    
    private fun startHeartbeat() {
        stopHeartbeat()
        heartbeatJob = CoroutineScope(Dispatchers.IO).launch {
            while (true) {
                kotlinx.coroutines.delay(30000) // 30 seconds
                if (socket?.connected() == true) {
                    Log.d(tag, "💓 Sending heartbeat")
                    socket?.emit("heartbeat")
                } else {
                    break
                }
            }
        }
    }
    
    private fun stopHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = null
    }
}
