package com.example.synapse.data.remote.voip

import android.util.Log
import com.example.synapse.BuildConfig
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.PostgresAction
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Call event types (must match backend)
 */
enum class CallEventType {
    CALL_STARTED,
    RINGING,
    ACCEPTED,
    REJECTED,
    ENDED,
    MISSED;

    companion object {
        fun fromString(value: String): CallEventType {
            return when (value) {
                "call_started" -> CALL_STARTED
                "ringing" -> RINGING
                "accepted" -> ACCEPTED
                "rejected" -> REJECTED
                "ended" -> ENDED
                "missed" -> MISSED
                else -> CALL_STARTED
            }
        }
    }

    fun toServerString(): String {
        return when (this) {
            CALL_STARTED -> "call_started"
            RINGING -> "ringing"
            ACCEPTED -> "accepted"
            REJECTED -> "rejected"
            ENDED -> "ended"
            MISSED -> "missed"
        }
    }
}

/**
 * Call event from Supabase Realtime
 */
@Serializable
data class CallEvent(
    val id: String,
    val tenant_id: String,
    val caller_id: String,
    val callee_id: String,
    val room_name: String,
    val event_type: String,
    val payload: Map<String, String> = emptyMap(),
    val created_at: String
) {
    val eventType: CallEventType
        get() = CallEventType.fromString(event_type)
}

/**
 * Call state for UI
 */
sealed class CallState {
    object Idle : CallState()
    object Calling : CallState()         // Outgoing call
    object Ringing : CallState()         // Incoming call
    object Connecting : CallState()      // Accepted, connecting to LiveKit
    data class Connected(val duration: Int = 0) : CallState()  // Active call
    object Ended : CallState()
    object Rejected : CallState()
    object Missed : CallState()
}

/**
 * Active call data
 */
data class ActiveCall(
    val roomName: String,
    val isIncoming: Boolean,
    val otherUserId: String,
    val otherUserName: String,
    val token: String? = null,
    val state: CallState = CallState.Idle
)

/**
 * CallEventsRepository
 * 
 * Manages VoIP call events using Supabase Realtime.
 * Subscribes to call_events table and emits events via Kotlin Flow.
 */
@Singleton
class CallEventsRepository @Inject constructor() {
    private val tag = "CallEventsRepository"
    
    private val supabase = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY
    ) {
        install(Postgrest)
        install(Realtime)
    }

    /**
     * Subscribe to call events for a specific user
     * 
     * @param userId Current user ID
     * @param tenantId Current tenant ID
     * @return Flow of CallEvent for incoming calls
     */
    fun subscribeToCallEvents(
        userId: String,
        tenantId: String
    ): Flow<CallEvent> {
        Log.d(tag, "Subscribing to call events for user: $userId, tenant: $tenantId")

        return supabase.channel("call_events:$tenantId:$userId") {
            // Subscribe to Postgres changes on call_events table
        }.postgresChangeFlow<CallEvent>(schema = "public") {
            table = "call_events"
            filter = "callee_id=eq.$userId"
        }.map { action ->
            when (action) {
                is PostgresAction.Insert -> {
                    Log.d(tag, "📞 Call event received: ${action.record.event_type}")
                    action.record
                }
                else -> null
            }
        }.filterNotNull()
    }

    /**
     * Unsubscribe from call events
     */
    suspend fun unsubscribe(channelName: String) {
        try {
            supabase.realtime.removeChannel(channelName)
            Log.d(tag, "Unsubscribed from channel: $channelName")
        } catch (e: Exception) {
            Log.e(tag, "Failed to unsubscribe: ${e.message}")
        }
    }

    /**
     * Clean up all subscriptions
     */
    suspend fun cleanup() {
        try {
            supabase.realtime.removeAllChannels()
            Log.d(tag, "All channels removed")
        } catch (e: Exception) {
            Log.e(tag, "Failed to cleanup: ${e.message}")
        }
    }
}
