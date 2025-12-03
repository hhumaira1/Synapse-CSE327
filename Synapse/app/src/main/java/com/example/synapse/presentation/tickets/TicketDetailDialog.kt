package com.example.synapse.presentation.tickets

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.synapse.data.model.Ticket
import com.example.synapse.data.model.TicketComment
import com.example.synapse.data.model.TicketPriority
import com.example.synapse.data.model.TicketStatus
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TicketDetailDialog(
    ticket: Ticket?,
    comments: List<TicketComment>,
    onDismiss: () -> Unit,
    onAddComment: (String) -> Unit,
    onUpdateStatus: ((String) -> Unit)? = null,
    onUpdatePriority: ((String) -> Unit)? = null,
    isLoading: Boolean = false
) {
    var commentText by remember { mutableStateOf("") }
    var showStatusMenu by remember { mutableStateOf(false) }
    var showPriorityMenu by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier.fillMaxSize(0.95f),
        title = {
            if (ticket != null) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = ticket.title,
                        style = MaterialTheme.typography.headlineSmall,
                        modifier = Modifier.weight(1f)
                    )
                    if (ticket.priority == TicketPriority.URGENT) {
                        Icon(
                            Icons.Default.Warning,
                            contentDescription = "Urgent",
                            tint = Color(0xFFDC2626),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        },
        text = {
            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (ticket != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Status and Priority Controls
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Status Dropdown
                        Box {
                            Badge(
                                containerColor = getStatusColor(ticket.status),
                                contentColor = Color.White,
                                modifier = Modifier.clickable { 
                                    if (onUpdateStatus != null && ticket.status != TicketStatus.CLOSED) {
                                        showStatusMenu = true 
                                    }
                                }
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(ticket.status.name.replace("_", " "))
                                    if (onUpdateStatus != null && ticket.status != TicketStatus.CLOSED) {
                                        Icon(
                                            Icons.Default.ArrowDropDown,
                                            contentDescription = "Change status",
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }
                            
                            DropdownMenu(
                                expanded = showStatusMenu,
                                onDismissRequest = { showStatusMenu = false }
                            ) {
                                TicketStatus.values().forEach { status ->
                                    if (status != ticket.status) {
                                        DropdownMenuItem(
                                            text = { Text(status.name.replace("_", " ")) },
                                            onClick = {
                                                onUpdateStatus?.invoke(status.name)
                                                showStatusMenu = false
                                            }
                                        )
                                    }
                                }
                            }
                        }
                        
                        // Priority Dropdown
                        Box {
                            Badge(
                                containerColor = getPriorityColor(ticket.priority),
                                contentColor = Color.White,
                                modifier = Modifier.clickable { 
                                    if (onUpdatePriority != null) {
                                        showPriorityMenu = true 
                                    }
                                }
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(ticket.priority.name)
                                    if (onUpdatePriority != null) {
                                        Icon(
                                            Icons.Default.ArrowDropDown,
                                            contentDescription = "Change priority",
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }
                            
                            DropdownMenu(
                                expanded = showPriorityMenu,
                                onDismissRequest = { showPriorityMenu = false }
                            ) {
                                TicketPriority.values().forEach { priority ->
                                    if (priority != ticket.priority) {
                                        DropdownMenuItem(
                                            text = { Text(priority.name) },
                                            onClick = {
                                                onUpdatePriority?.invoke(priority.name)
                                                showPriorityMenu = false
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Description
                    if (ticket.description.isNotEmpty()) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "Description",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(bottom = 8.dp)
                                )
                                Text(
                                    text = ticket.description,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    // Metadata
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                Icons.Default.AccessTime,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "Created ${formatDate(ticket.createdAt)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Status Messages
                    when (ticket.status) {
                        TicketStatus.RESOLVED -> {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = Color(0xFFD1FAE5)
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.Top,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = Color(0xFF059669),
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "Ticket Resolved",
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF059669)
                                        )
                                        Text(
                                            text = "This ticket has been marked as resolved.",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color(0xFF059669)
                                        )
                                    }
                                }
                            }
                        }
                        TicketStatus.CLOSED -> {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = Color(0xFFF3F4F6)
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.Top,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        Icons.Default.Cancel,
                                        contentDescription = null,
                                        tint = Color(0xFF6B7280),
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "Ticket Closed",
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF374151)
                                        )
                                        Text(
                                            text = "This ticket has been closed.",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color(0xFF6B7280)
                                        )
                                    }
                                }
                            }
                        }
                        else -> { /* No special message for other statuses */ }
                    }

                    // Comments Section
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Conversation (${comments.size})",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            if (comments.isEmpty()) {
                                Text(
                                    text = "No comments yet.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(vertical = 24.dp),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                            } else {
                                Column(
                                    verticalArrangement = Arrangement.spacedBy(12.dp),
                                    modifier = Modifier
                                        .heightIn(max = 300.dp)
                                        .verticalScroll(rememberScrollState())
                                ) {
                                    comments.forEach { comment ->
                                        Card(
                                            modifier = Modifier.fillMaxWidth(),
                                            colors = CardDefaults.cardColors(
                                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                            )
                                        ) {
                                            Column(modifier = Modifier.padding(12.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.Top
                                                ) {
                                                    Row(
                                                        verticalAlignment = Alignment.CenterVertically,
                                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                    ) {
                                                        // Avatar
                                                        Surface(
                                                            color = if (comment.isInternal) Color(0xFF6366F1) else Color(0xFF06B6D4),
                                                            shape = MaterialTheme.shapes.small,
                                                            modifier = Modifier.size(32.dp)
                                                        ) {
                                                            Box(
                                                                contentAlignment = Alignment.Center,
                                                                modifier = Modifier.fillMaxSize()
                                                            ) {
                                                                Text(
                                                                    text = getInitials(comment.authorName ?: "Unknown"),
                                                                    color = Color.White,
                                                                    style = MaterialTheme.typography.bodySmall,
                                                                    fontWeight = FontWeight.Bold
                                                                )
                                                            }
                                                        }

                                                        Column {
                                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                                Text(
                                                                    text = comment.authorName ?: "Unknown",
                                                                    style = MaterialTheme.typography.bodySmall,
                                                                    fontWeight = FontWeight.Medium
                                                                )
                                                                if (comment.isInternal) {
                                                                    Spacer(modifier = Modifier.width(4.dp))
                                                                    Badge(
                                                                        containerColor = MaterialTheme.colorScheme.primary,
                                                                        contentColor = Color.White
                                                                    ) {
                                                                        Text("Internal", style = MaterialTheme.typography.labelSmall)
                                                                    }
                                                                }
                                                            }
                                                            Text(
                                                                text = formatDate(comment.createdAt),
                                                                style = MaterialTheme.typography.bodySmall,
                                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                                            )
                                                        }
                                                    }
                                                }

                                                Spacer(modifier = Modifier.height(8.dp))

                                                Text(
                                                    text = comment.content,
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    modifier = Modifier.padding(start = 40.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            // Add Comment Form (only if ticket is not closed)
                            if (ticket.status != TicketStatus.CLOSED) {
                                Divider(modifier = Modifier.padding(vertical = 8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.Bottom,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedTextField(
                                        value = commentText,
                                        onValueChange = { commentText = it },
                                        placeholder = { Text("Type your comment...") },
                                        modifier = Modifier.weight(1f),
                                        minLines = 2,
                                        maxLines = 4,
                                        enabled = !isLoading
                                    )

                                    Button(
                                        onClick = {
                                            if (commentText.isNotBlank()) {
                                                onAddComment(commentText)
                                                commentText = ""
                                            }
                                        },
                                        enabled = commentText.isNotBlank() && !isLoading,
                                        modifier = Modifier.height(56.dp),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = Color(0xFF6366F1),
                                            contentColor = Color.White
                                        )
                                    ) {
                                        if (isLoading) {
                                            CircularProgressIndicator(
                                                modifier = Modifier.size(20.dp),
                                                color = Color.White
                                            )
                                        } else {
                                            Icon(
                                                Icons.Default.Send,
                                                contentDescription = "Send",
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

private fun getStatusColor(status: TicketStatus): Color {
    return when (status) {
        TicketStatus.OPEN -> Color(0xFF3B82F6)
        TicketStatus.IN_PROGRESS -> Color(0xFF8B5CF6)
        TicketStatus.RESOLVED -> Color(0xFF10B981)
        TicketStatus.CLOSED -> Color(0xFF6B7280)
    }
}

private fun getPriorityColor(priority: TicketPriority): Color {
    return when (priority) {
        TicketPriority.URGENT -> Color(0xFFDC2626)
        TicketPriority.HIGH -> Color(0xFFF97316)
        TicketPriority.MEDIUM -> Color(0xFFF59E0B)
        TicketPriority.LOW -> Color(0xFF10B981)
    }
}

private fun getInitials(name: String): String {
    return name.split(" ")
        .mapNotNull { it.firstOrNull()?.toString() }
        .take(2)
        .joinToString("")
        .uppercase()
}

private fun formatDate(dateString: String): String {
    return try {
        val instant = Instant.parse(dateString)
        val formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm")
            .withZone(ZoneId.systemDefault())
        formatter.format(instant)
    } catch (e: Exception) {
        "Unknown date"
    }
}
