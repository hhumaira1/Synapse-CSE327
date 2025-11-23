package com.example.synapse.data.remote.voip

import android.content.Context
import android.util.Log
import dagger.hilt.android.qualifiers.ApplicationContext
import io.livekit.android.LiveKit
import io.livekit.android.room.Room
import io.livekit.android.room.track.LocalAudioTrack
import io.livekit.android.room.track.Track
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * LiveKitManager
 * 
 * Manages LiveKit Room connection and audio tracks for VoIP calls.
 * - Connects to LiveKit room with token
 * - Publishes local audio track
 * - Handles mute/unmute
 * - Manages audio routing (earpiece/speaker)
 */
@Singleton
class LiveKitManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val tag = "LiveKitManager"

    // LiveKit room instance
    private var room: Room? = null

    // Local audio track
    private var localAudioTrack: LocalAudioTrack? = null

    // Room connection state
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    // Mute state
    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()

    // Speaker state (false = earpiece, true = speaker)
    private val _isSpeakerOn = MutableStateFlow(false)
    val isSpeakerOn: StateFlow<Boolean> = _isSpeakerOn.asStateFlow()

    /**
     * Connect to LiveKit room
     * 
     * @param url LiveKit server URL (wss://...)
     * @param token JWT token from backend
     * @param roomName Room identifier
     */
    suspend fun connect(url: String, token: String, roomName: String) {
        try {
            Log.d(tag, "🔗 Connecting to LiveKit room: $roomName")
            
            // Create room instance
            room = LiveKit.create(
                appContext = context,
                overrides = null
            )

            // Connect to room
            room?.connect(url, token)
            
            // Create and publish local audio track
            localAudioTrack = room?.localParticipant?.createAudioTrack()
            localAudioTrack?.let { track ->
                room?.localParticipant?.publishAudioTrack(track)
            }

            _isConnected.value = true
            Log.d(tag, "✅ Connected to LiveKit room successfully")
        } catch (e: Exception) {
            Log.e(tag, "❌ Failed to connect to LiveKit: ${e.message}")
            _isConnected.value = false
            throw e
        }
    }

    /**
     * Disconnect from LiveKit room
     */
    fun disconnect() {
        try {
            Log.d(tag, "🔌 Disconnecting from LiveKit room")
            
            localAudioTrack?.stop()
            localAudioTrack = null
            
            room?.disconnect()
            room = null
            
            _isConnected.value = false
            _isMuted.value = false
            _isSpeakerOn.value = false
            
            Log.d(tag, "✅ Disconnected from LiveKit successfully")
        } catch (e: Exception) {
            Log.e(tag, "❌ Error disconnecting from LiveKit: ${e.message}")
        }
    }

    /**
     * Toggle mute state
     */
    fun toggleMute() {
        val newMuteState = !_isMuted.value
        localAudioTrack?.setMuted(newMuteState)
        _isMuted.value = newMuteState
        Log.d(tag, "🎤 Mute toggled: ${if (newMuteState) "MUTED" else "UNMUTED"}")
    }

    /**
     * Set mute state
     */
    fun setMuted(muted: Boolean) {
        localAudioTrack?.setMuted(muted)
        _isMuted.value = muted
        Log.d(tag, "🎤 Mute set: ${if (muted) "MUTED" else "UNMUTED"}")
    }

    /**
     * Toggle speaker state (earpiece/speaker)
     */
    fun toggleSpeaker() {
        val newSpeakerState = !_isSpeakerOn.value
        setSpeaker(newSpeakerState)
    }

    /**
     * Set speaker state
     */
    fun setSpeaker(enabled: Boolean) {
        // Note: Android audio routing is handled by AudioManager
        // LiveKit Android SDK should handle this automatically,
        // but we can force it if needed
        room?.audioManager?.isSpeakerphoneOn = enabled
        _isSpeakerOn.value = enabled
        Log.d(tag, "🔊 Speaker set: ${if (enabled) "ON" else "OFF (Earpiece)"}")
    }

    /**
     * Get remote participants count
     */
    fun getRemoteParticipantsCount(): Int {
        return room?.remoteParticipants?.size ?: 0
    }

    /**
     * Check if room is connected
     */
    fun isRoomConnected(): Boolean {
        return _isConnected.value && room != null
    }

    /**
     * Get room instance (for advanced usage)
     */
    fun getRoom(): Room? {
        return room
    }
}
