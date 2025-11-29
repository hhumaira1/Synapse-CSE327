package com.example.synapse.presentation.voip

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

/**
 * IncomingCallDialog
 * 
 * Full-screen dialog for incoming VoIP call.
 * Shows caller info and Accept/Reject buttons.
 */
@Composable
fun IncomingCallDialog(
    callerName: String,
    callerAvatar: String?,
    onAccept: () -> Unit,
    onReject: () -> Unit
) {
    Dialog(
        onDismissRequest = { /* Don't allow dismissing by tapping outside */ },
        properties = DialogProperties(
            dismissOnBackPress = false,
            dismissOnClickOutside = false,
            usePlatformDefaultWidth = false
        )
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
                
                // Pulsing ring around avatar
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.size(160.dp)
                ) {
                    // Outer pulsing circle
                    Box(
                        modifier = Modifier
                            .size(160.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF533483).copy(alpha = 0.3f))
                    )
                    
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
                            contentDescription = "Caller Avatar",
                            modifier = Modifier.size(64.dp),
                            tint = Color.White
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(32.dp))
                
                // "Incoming Call" label
                Text(
                    text = "Incoming Call",
                    fontSize = 16.sp,
                    color = Color.White.copy(alpha = 0.7f),
                    fontWeight = FontWeight.Medium
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Caller name
                Text(
                    text = callerName,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // "is calling you" text
                Text(
                    text = "is calling you",
                    fontSize = 16.sp,
                    color = Color.White.copy(alpha = 0.6f)
                )
                
                Spacer(modifier = Modifier.weight(1f))
                
                // Accept/Reject buttons
                Row(
                    horizontalArrangement = Arrangement.spacedBy(48.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(bottom = 64.dp)
                ) {
                    // Reject button
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        FloatingActionButton(
                            onClick = onReject,
                            containerColor = Color(0xFFe94560),
                            modifier = Modifier.size(72.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CallEnd,
                                contentDescription = "Reject",
                                tint = Color.White,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Decline",
                            fontSize = 14.sp,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                    }
                    
                    // Accept button
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        FloatingActionButton(
                            onClick = onAccept,
                            containerColor = Color(0xFF4CAF50),
                            modifier = Modifier.size(72.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Call,
                                contentDescription = "Accept",
                                tint = Color.White,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Accept",
                            fontSize = 14.sp,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                    }
                }
            }
        }
    }
}
