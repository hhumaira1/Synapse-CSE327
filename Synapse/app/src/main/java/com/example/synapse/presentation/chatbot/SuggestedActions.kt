package com.example.synapse.presentation.chatbot

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.synapse.data.api.response.SuggestedActionDto

/**
 * Enhanced suggested action chips with modern styling and animations
 */
@Composable
fun SuggestedActionsRow(
    actions: List<SuggestedActionDto>,
    onActionClick: (SuggestedActionDto) -> Unit,
    modifier: Modifier = Modifier
) {
    if (actions.isEmpty()) return
    
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        // Section header with AI icon
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.AutoAwesome,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Suggested Actions",
                style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 12.sp
                ),
                color = MaterialTheme.colorScheme.primary
            )
        }
        
        // Action chips with horizontal scroll
        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(actions) { action ->
                SuggestedActionChip(
                    action = action,
                    onClick = { onActionClick(action) }
                )
            }
        }
    }
}

/**
 * Individual action chip with hover effects and enhanced styling
 */
@Composable
fun SuggestedActionChip(
    action: SuggestedActionDto,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isPressed by remember { mutableStateOf(false) }
    
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.95f else 1f,
        animationSpec = tween(150),
        label = "chip_scale"
    )
    
    val containerColor by animateColorAsState(
        targetValue = if (isPressed) {
            MaterialTheme.colorScheme.primaryContainer
        } else {
            MaterialTheme.colorScheme.surface
        },
        animationSpec = tween(150),
        label = "chip_color"
    )
    
    Surface(
        modifier = modifier
            .scale(scale)
            .clip(RoundedCornerShape(20.dp))
            .clickable {
                isPressed = true
                onClick()
            },
        shape = RoundedCornerShape(20.dp),
        color = containerColor,
        shadowElevation = if (isPressed) 4.dp else 2.dp,
        tonalElevation = if (isPressed) 3.dp else 1.dp
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 10.dp)
                .widthIn(max = 200.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Action icon with background
            Surface(
                modifier = Modifier.size(24.dp),
                shape = RoundedCornerShape(6.dp),
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
            ) {
                Icon(
                    imageVector = getIconForAction(action.icon, action.category),
                    contentDescription = null,
                    modifier = Modifier.padding(4.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
            }
            
            // Action label
            Text(
                text = action.label,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontWeight = FontWeight.Medium,
                    fontSize = 13.sp
                ),
                color = if (isPressed) {
                    MaterialTheme.colorScheme.onPrimaryContainer
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
                maxLines = 1
            )
        }
    }
    
    // Reset pressed state
    LaunchedEffect(isPressed) {
        if (isPressed) {
            kotlinx.coroutines.delay(150)
            isPressed = false
        }
    }
}

/**
 * Enhanced icon mapping with support for categories and more icons
 */
private fun getIconForAction(icon: String?, category: String?): ImageVector {
    return when (icon?.lowercase()) {
        "userplus", "user-plus" -> Icons.Default.PersonAdd
        "dollarSign", "dollar-sign" -> Icons.Default.AttachMoney
        "barchart", "bar-chart" -> Icons.Default.BarChart
        "trendingup", "trending-up" -> Icons.Default.TrendingUp
        "percent" -> Icons.Default.Percent
        "arrowright", "arrow-right" -> Icons.Default.ArrowForward
        "eye" -> Icons.Default.Visibility
        "edit" -> Icons.Default.Edit
        "phone" -> Icons.Default.Phone
        "mail" -> Icons.Default.Email
        "calendar" -> Icons.Default.CalendarToday
        "file" -> Icons.Default.Description
        "contact", "contacts" -> Icons.Default.Person
        "deal", "deals" -> Icons.Default.AttachMoney
        "lead", "leads" -> Icons.Default.TrendingUp
        "ticket", "tickets" -> Icons.Default.ConfirmationNumber
        "analytics", "stats" -> Icons.Default.Analytics
        "search" -> Icons.Default.Search
        "create", "add" -> Icons.Default.Add
        "update" -> Icons.Default.Edit
        "delete" -> Icons.Default.Delete
        "view", "show" -> Icons.Default.Visibility
        else -> when (category?.lowercase()) {
            "create" -> Icons.Default.Add
            "analyze" -> Icons.Default.Analytics
            "update" -> Icons.Default.Edit
            "view" -> Icons.Default.Visibility
            "contact" -> Icons.Default.Person
            "deal" -> Icons.Default.AttachMoney
            "lead" -> Icons.Default.TrendingUp
            "ticket" -> Icons.Default.Support
            else -> Icons.Default.AutoAwesome
        }
    }
}
