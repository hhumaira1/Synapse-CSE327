package com.example.synapse.presentation.chatbot

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp

/**
 * Chat input field with voice support
 * 
 * Features:
 * - Text input with emoji support
 * - Voice input button (integration ready)
 * - Send button with gradient
 * - Typing indicator callback
 * - Keyboard handling
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatInputField(
    onSendMessage: (String) -> Unit,
    onTypingChanged: (Boolean) -> Unit,
    isEnabled: Boolean,
    modifier: Modifier = Modifier
) {
    var message by remember { mutableStateOf("") }
    val keyboardController = LocalSoftwareKeyboardController.current
    val context = LocalContext.current
    
    // Voice input handler
    val voiceInputHandler = remember { VoiceInputHandler(context) }
    val voiceState by voiceInputHandler.voiceState.collectAsState()
    
    // Microphone permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            voiceInputHandler.startListening()
        }
    }
    
    // Update message from voice transcription
    LaunchedEffect(voiceState.transcription) {
        if (voiceState.isComplete && voiceState.transcription.isNotEmpty()) {
            message = voiceState.transcription
        }
    }
    
    // Track typing state
    LaunchedEffect(message) {
        onTypingChanged(message.isNotEmpty())
    }
    
    // Cleanup voice handler
    DisposableEffect(Unit) {
        onDispose {
            voiceInputHandler.destroy()
        }
    }
    
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 8.dp,
        tonalElevation = 3.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Voice input button
            IconButton(
                onClick = {
                    if (voiceState.isListening) {
                        voiceInputHandler.stopListening()
                    } else {
                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    }
                },
                enabled = isEnabled && message.isEmpty() && voiceInputHandler.isAvailable()
            ) {
                if (voiceState.isListening) {
                    // Animated recording icon
                    VoiceRecordingAnimation()
                } else {
                    Icon(
                        imageVector = Icons.Default.Mic,
                        contentDescription = "Voice input",
                        tint = if (message.isEmpty() && voiceInputHandler.isAvailable()) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                        }
                    )
                }
            }
            
            // Text input field
            TextField(
                value = message,
                onValueChange = { message = it },
                modifier = Modifier.weight(1f),
                placeholder = {
                    Text(
                        text = "Ask me anything...",
                        style = MaterialTheme.typography.bodyMedium
                    )
                },
                enabled = isEnabled,
                keyboardOptions = KeyboardOptions(
                    imeAction = ImeAction.Send
                ),
                keyboardActions = KeyboardActions(
                    onSend = {
                        if (message.isNotBlank()) {
                            onSendMessage(message)
                            message = ""
                            keyboardController?.hide()
                        }
                    }
                ),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                    disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                    disabledIndicatorColor = Color.Transparent
                ),
                shape = MaterialTheme.shapes.large,
                maxLines = 4
            )
            
            // Send button
            FloatingActionButton(
                onClick = {
                    if (message.isNotBlank()) {
                        onSendMessage(message)
                        message = ""
                        keyboardController?.hide()
                    }
                },
                modifier = Modifier.size(48.dp),
                containerColor = if (message.isNotBlank() && isEnabled) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.surfaceVariant
                },
                elevation = FloatingActionButtonDefaults.elevation(
                    defaultElevation = 0.dp,
                    pressedElevation = 2.dp
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Send message",
                    tint = if (message.isNotBlank() && isEnabled) {
                        MaterialTheme.colorScheme.onPrimary
                    } else {
                        MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                    }
                )
            }
        }
    }
}

/**
 * Animated recording indicator
 */
@Composable
fun VoiceRecordingAnimation() {
    val infiniteTransition = rememberInfiniteTransition(label = "recording")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )
    
    Icon(
        imageVector = Icons.Default.Mic,
        contentDescription = "Recording",
        tint = MaterialTheme.colorScheme.error,
        modifier = Modifier.size((24 * scale).dp)
    )
}
