package com.example.synapse.presentation.voip

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * ActiveCallScreen
 * 
 * Full-screen UI for active VoIP call.
 * Shows:
 * - Participant name and avatar
 * - Call status ("Calling..." or "Connected")
 * - Call duration (only when connected)
 * - Mute/Speaker/End call controls
 */
@Composable
fun ActiveCallScreen(
    participantName: String,
    participantAvatar: String?,
    isConnected: Boolean,
    duration: Int,
    isMuted: Boolean,
    isSpeakerOn: Boolean,
    onMuteToggle: () -> Unit,
    onSpeakerToggle: () -> Unit,
    onEndCall: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF1a1a2e),
                        Color(0xFF16213e),
                        Color(0xFF0f3460)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp)
        ) {
            Spacer(modifier = Modifier.weight(1f))
            
            // Avatar
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                Color(0xFFe94560),
                                Color(0xFF533483)
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "Avatar",
                    modifier = Modifier.size(64.dp),
                    tint = Color.White
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Participant name
            Text(
                text = participantName,
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Call status
            Text(
                text = if (isConnected) "Connected" else "Calling...",
                fontSize = 18.sp,
                color = Color.White.copy(alpha = 0.7f)
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Duration (only when connected)
            if (isConnected) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = Color.White.copy(alpha = 0.1f)
                    ),
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = formatDuration(duration),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 12.dp)
                    )
                }
            } else {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = Color.White.copy(alpha = 0.1f)
                    ),
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Waiting for answer...",
                        fontSize = 16.sp,
                        color = Color.White.copy(alpha = 0.6f),
                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 12.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            // Call controls
            Row(
                horizontalArrangement = Arrangement.spacedBy(24.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 48.dp)
            ) {
                // Mute button
                FloatingActionButton(
                    onClick = onMuteToggle,
                    containerColor = if (isMuted) Color(0xFFe94560) else Color.White.copy(alpha = 0.2f),
                    modifier = Modifier.size(64.dp)
                ) {
                    Icon(
                        imageVector = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                        contentDescription = if (isMuted) "Unmute" else "Mute",
                        tint = Color.White,
                        modifier = Modifier.size(28.dp)
                    )
                }
                
                // End call button
                FloatingActionButton(
                    onClick = onEndCall,
                    containerColor = Color(0xFFe94560),
                    modifier = Modifier.size(72.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CallEnd,
                        contentDescription = "End Call",
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
                
                // Speaker button
                FloatingActionButton(
                    onClick = onSpeakerToggle,
                    containerColor = if (isSpeakerOn) Color(0xFF533483) else Color.White.copy(alpha = 0.2f),
                    modifier = Modifier.size(64.dp)
                ) {
                    Icon(
                        imageVector = if (isSpeakerOn) Icons.Default.VolumeUp else Icons.Default.PhoneInTalk,
                        contentDescription = if (isSpeakerOn) "Speaker On" else "Speaker Off",
                        tint = Color.White,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
            
            // Control labels
            Row(
                horizontalArrangement = Arrangement.spacedBy(24.dp),
                modifier = Modifier.padding(bottom = 24.dp)
            ) {
                Text(
                    text = if (isMuted) "Unmute" else "Mute",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.width(64.dp)
                )
                Text(
                    text = "End Call",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.width(72.dp)
                )
                Text(
                    text = if (isSpeakerOn) "Speaker" else "Earpiece",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.width(64.dp)
                )
            }
        }
    }
}

/**
 * Format duration in MM:SS format
 */
private fun formatDuration(seconds: Int): String {
    val mins = seconds / 60
    val secs = seconds % 60
    return String.format("%02d:%02d", mins, secs)
}
