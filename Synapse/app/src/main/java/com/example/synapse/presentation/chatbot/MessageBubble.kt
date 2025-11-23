package com.example.synapse.presentation.chatbot

import android.text.Spanned
import android.widget.TextView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
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
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.synapse.data.database.entity.MessageEntity
import io.noties.markwon.Markwon
import io.noties.markwon.ext.strikethrough.StrikethroughPlugin
import io.noties.markwon.ext.tables.TablePlugin

/**
 * Modern message bubble with avatars and enhanced styling
 * 
 * Features:
 * - User/AI avatars with animations
 * - Improved bubble design with shadows
 * - Markdown rendering for AI responses
 * - Animated entrance effects
 * - Better spacing and typography
 * - Status indicators
 */
@Composable
fun MessageBubble(
    message: MessageEntity,
    showAvatar: Boolean = true,
    modifier: Modifier = Modifier
) {
    val isUser = message.role == "user"
    
    // Animated entrance
    AnimatedVisibility(
        visible = true,
        enter = fadeIn(animationSpec = tween(400, delayMillis = 100)) + 
               slideInVertically(
                   animationSpec = tween(400, delayMillis = 100),
                   initialOffsetY = { it / 3 }
               ),
        modifier = modifier
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start,
            verticalAlignment = Alignment.Bottom
        ) {
            if (!isUser && showAvatar) {
                // AI Agent Avatar (left side)
                AgentAvatar(
                    modifier = Modifier.padding(end = 12.dp)
                )
            }
            
            // Message Content with improved styling
            Surface(
                modifier = Modifier.widthIn(max = 280.dp),
                shape = RoundedCornerShape(
                    topStart = if (isUser) 20.dp else 8.dp,
                    topEnd = if (isUser) 8.dp else 20.dp,
                    bottomStart = 20.dp,
                    bottomEnd = 20.dp
                ),
                color = if (isUser) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.surfaceContainer
                },
                shadowElevation = if (isUser) 3.dp else 1.dp,
                tonalElevation = if (isUser) 6.dp else 2.dp
            ) {
                Column(
                    modifier = Modifier.padding(
                        horizontal = 16.dp,
                        vertical = 12.dp
                    )
                ) {
                    if (isUser) {
                        // User message (clean text)
                        Text(
                            text = message.content,
                            style = MaterialTheme.typography.bodyMedium.copy(
                                lineHeight = 22.sp,
                                fontWeight = FontWeight.Normal
                            ),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        // AI message (with markdown support)
                        MarkdownText(
                            markdown = message.content,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    
                    // Status and timestamp row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Sync status
                        if (!message.isSynced || message.hasError) {
                            StatusIndicator(
                                isSynced = message.isSynced,
                                hasError = message.hasError,
                                isUser = isUser
                            )
                        } else {
                            Spacer(modifier = Modifier.width(1.dp))
                        }
                        
                        // Timestamp
                        Text(
                            text = formatTimestamp(message.createdAt),
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 11.sp
                            ),
                            color = if (isUser) {
                                MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                            },
                            textAlign = TextAlign.End
                        )
                    }
                }
            }
            
            if (isUser && showAvatar) {
                // User Avatar (right side)
                UserAvatar(
                    modifier = Modifier.padding(start = 12.dp)
                )
            }
        }
    }
}

/**
 * AI Agent Avatar with animated gradient background
 */
@Composable
fun AgentAvatar(
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "ai-pulse")
    val pulseAnimation by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )
    
    val rotationAnimation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(20000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )
    
    Box(
        modifier = modifier
            .size(42.dp)
            .clip(CircleShape)
            .background(
                Brush.sweepGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.primary,
                        MaterialTheme.colorScheme.secondary,
                        MaterialTheme.colorScheme.tertiary,
                        MaterialTheme.colorScheme.primary
                    ),
                    center = androidx.compose.ui.geometry.Offset(21.dp.value, 21.dp.value)
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier.size(36.dp),
            shape = CircleShape,
            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f)
        ) {
            Icon(
                imageVector = Icons.Default.Psychology,
                contentDescription = "AI Assistant",
                modifier = Modifier
                    .padding(8.dp)
                    .size((20 * pulseAnimation).dp),
                tint = MaterialTheme.colorScheme.primary
            )
        }
    }
}

/**
 * User Avatar with Material Design styling
 */
@Composable
fun UserAvatar(
    modifier: Modifier = Modifier,
    initials: String = "U"  // Can be customized with user's actual initials
) {
    Box(
        modifier = modifier
            .size(42.dp)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.primaryContainer),
        contentAlignment = Alignment.Center
    ) {
        if (initials.length <= 2) {
            Text(
                text = initials,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp
                ),
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        } else {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = "User",
                modifier = Modifier.size(24.dp),
                tint = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

/**
 * Status indicator for message sync state
 */
@Composable
fun StatusIndicator(
    isSynced: Boolean,
    hasError: Boolean,
    isUser: Boolean,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = when {
                hasError -> Icons.Default.ErrorOutline
                !isSynced -> Icons.Default.Schedule
                else -> Icons.Default.CheckCircle
            },
            contentDescription = null,
            modifier = Modifier.size(12.dp),
            tint = when {
                hasError -> MaterialTheme.colorScheme.error
                !isSynced -> if (isUser) {
                    MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f)
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                }
                else -> if (isUser) {
                    MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
                } else {
                    MaterialTheme.colorScheme.primary.copy(alpha = 0.8f)
                }
            }
        )
    }
}

/**
 * Enhanced markdown text rendering
 */
@Composable
fun MarkdownText(
    markdown: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    AndroidView(
        modifier = modifier.fillMaxWidth(),
        factory = { context ->
            TextView(context).apply {
                textSize = 15f
                setTextColor(color.toArgb())
                setLineSpacing(1.3f, 1.0f)
                setPadding(0, 0, 0, 0)
                
                // Initialize Markwon with plugins
                val markwon = Markwon.builder(context)
                    .usePlugin(StrikethroughPlugin.create())
                    .usePlugin(TablePlugin.create(context))
                    .build()
                
                // Set markdown content
                markwon.setMarkdown(this, markdown)
            }
        },
        update = { textView ->
            val markwon = Markwon.builder(textView.context)
                .usePlugin(StrikethroughPlugin.create())
                .usePlugin(TablePlugin.create(textView.context))
                .build()
            
            markwon.setMarkdown(textView, markdown)
            textView.setTextColor(color.toArgb())
        }
    )
}

/**
 * Format timestamp to human-readable string
 */
private fun formatTimestamp(timestamp: Long): String {
    val now = System.currentTimeMillis()
    val diff = now - timestamp
    
    return when {
        diff < 60_000 -> "now"
        diff < 3600_000 -> "${diff / 60_000}m"
        diff < 86400_000 -> "${diff / 3600_000}h"
        else -> "${diff / 86400_000}d"
    }
}
