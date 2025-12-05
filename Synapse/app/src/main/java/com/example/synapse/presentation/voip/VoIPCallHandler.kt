package com.example.synapse.presentation.voip

import android.util.Log
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel

/**
 * VoIPCallHandler
 * 
 * Composable that handles VoIP call state and shows appropriate UI.
 * Use this in your main app Composable to handle calls app-wide.
 * 
 * Usage:
 * ```
 * @Composable
 * fun MyApp() {
 *     // Your app content
 *     Scaffold { ... }
 *     
 *     // Add VoIP handler
 *     VoIPCallHandler()
 * }
 * ```
 */
@Composable
fun VoIPCallHandler(
    viewModel: CallViewModel = hiltViewModel()
) {
    val callState by viewModel.callState.collectAsState()
    val isMuted by viewModel.isMuted().collectAsState()
    val isSpeakerOn by viewModel.isSpeakerOn().collectAsState()
    
    // Debug logging - track state changes
    LaunchedEffect(callState) {
        Log.d("VoIPCallHandler", "🎨 Call state changed: ${callState::class.simpleName}")
    }
    
    when (val state = callState) {
        is CallState.Ringing -> {
            // Show incoming call dialog
            Log.d("VoIPCallHandler", "📞 Showing incoming call dialog for: ${state.callerName}")
            Dialog(
                onDismissRequest = {},  // Prevent dismissal during call
                properties = DialogProperties(
                    dismissOnBackPress = false,
                    dismissOnClickOutside = false,
                    usePlatformDefaultWidth = false  // Full screen
                )
            ) {
                IncomingCallDialog(
                    callerName = state.callerName,
                    callerAvatar = state.callerAvatar,
                    onAccept = { viewModel.acceptCall() },
                    onReject = { viewModel.rejectCall() }
                )
            }
        }
        
        is CallState.Calling,
        is CallState.Active -> {
            // Show active call screen
            val participantName = when (state) {
                is CallState.Calling -> state.calleeName
                is CallState.Active -> state.participantName
                else -> ""
            }
            
            val participantAvatar = when (state) {
                is CallState.Active -> state.participantAvatar
                else -> null
            }
            
            val isConnected = when (state) {
                is CallState.Active -> state.isConnected
                else -> false
            }
            
            val duration = when (state) {
                is CallState.Active -> state.duration
                else -> 0
            }
            
            Log.d("VoIPCallHandler", "📱 Showing active call screen - Participant: $participantName, Connected: $isConnected")
            Dialog(
                onDismissRequest = {},  // Prevent dismissal during call
                properties = DialogProperties(
                    dismissOnBackPress = false,
                    dismissOnClickOutside = false,
                    usePlatformDefaultWidth = false  // Full screen
                )
            ) {
                ActiveCallScreen(
                    participantName = participantName,
                    participantAvatar = participantAvatar,
                    isConnected = isConnected,
                    duration = duration,
                    isMuted = isMuted,
                    isSpeakerOn = isSpeakerOn,
                    onMuteToggle = { viewModel.toggleMute() },
                    onSpeakerToggle = { viewModel.toggleSpeaker() },
                    onEndCall = { viewModel.endCall() }
                )
            }
        }
        
        is CallState.Error -> {
            // Log errors
            LaunchedEffect(state.message) {
                Log.e("VoIPCallHandler", "❌ Call error: ${state.message}")
            }
        }
        
        CallState.Idle -> {
            // No UI needed
            Log.d("VoIPCallHandler", "⏹️ Call state is Idle - no UI displayed")
        }
    }
}
