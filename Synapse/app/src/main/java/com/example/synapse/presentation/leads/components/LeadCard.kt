package com.example.synapse.presentation.leads.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.clickable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.synapse.data.model.Lead
import androidx.core.graphics.toColorInt
import android.graphics.Color as PlatformColor

@Composable
fun getStatusColor(status: String): Color {
    return when (status) {
        "NEW" -> Color(0xFF2563EB) // Blue
        "CONTACTED" -> Color(0xFF9333EA) // Purple
        "QUALIFIED" -> Color(0xFF059669) // Green
        "UNQUALIFIED" -> Color(0xFFDC2626) // Red
        "CONVERTED" -> Color(0xFF059669) // Green
        else -> Color.Gray
    }
}
@Composable
fun LeadCard(
    lead: Lead,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onChangeStatus: () -> Unit,
    onConvert: () -> Unit,
    onClick: (() -> Unit)? = null
) {
    var showMenu by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showConvertDialog by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = onClick != null) { onClick?.invoke() },
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Surface(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = MaterialTheme.shapes.medium
                        ) {
                            Box(
                                modifier = Modifier.size(40.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Default.Person,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = lead.title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (lead.source.isNotBlank()) {
                            Text(
                                text = lead.source,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }

                Box {
                    IconButton(onClick = { showMenu = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "More options")
                    }

                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Edit") },
                            onClick = {
                                showMenu = false
                                onEdit()
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Edit, contentDescription = null)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Change Status") },
                            onClick = {
                                showMenu = false
                                onChangeStatus()
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Cached, contentDescription = null)
                            }
                        )
                        if (lead.status != "CONVERTED") {
                            DropdownMenuItem(
                                text = { Text("Convert to Deal") },
                                onClick = {
                                    showMenu = false
                                    showConvertDialog = true
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null)
                                }
                            )
                        }
                        HorizontalDivider(
                            Modifier,
                            DividerDefaults.Thickness,
                            DividerDefaults.color
                        )
                        DropdownMenuItem(
                            text = { Text("Delete") },
                            onClick = {
                                showMenu = false
                                showDeleteDialog = true
                            },
                            leadingIcon = {
                                Icon(
                                    Icons.Default.Delete,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.error
                                )
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Contact Info
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
//                if (!lead.email.isNullOrBlank()) {
//                    Row(
//                        horizontalArrangement = Arrangement.spacedBy(8.dp),
//                        verticalAlignment = Alignment.CenterVertically
//                    ) {
//                        Icon(
//                            Icons.Default.Email,
//                            contentDescription = null,
//                            modifier = Modifier.size(16.dp),
//                            tint = MaterialTheme.colorScheme.primary
//                        )
//                        Text(
//                            text = lead.email,
//                            style = MaterialTheme.typography.bodyMedium,
//                            maxLines = 1,
//                            overflow = TextOverflow.Ellipsis
//                        )
//                    }
//                }
//
//                if (!lead.phone.isNullOrBlank()) {
//                    Row(
//                        horizontalArrangement = Arrangement.spacedBy(8.dp),
//                        verticalAlignment = Alignment.CenterVertically
//                    ) {
//                        Icon(
//                            Icons.Default.Phone,
//                            contentDescription = null,
//                            modifier = Modifier.size(16.dp),
//                            tint = MaterialTheme.colorScheme.primary
//                        )
//                        Text(
//                            text = lead.phone,
//                            style = MaterialTheme.typography.bodyMedium
//                        )
//                    }
//                }
//            }

                Spacer(modifier = Modifier.height(12.dp))

                // Status and Stage Badges
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Status Badge
                    Surface(
                        color = getStatusColor(lead.status),
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(
                            text = lead.status,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Delete Confirmation Dialog
        if (showDeleteDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteDialog = false },
                title = { Text("Delete Lead") },
                text = { Text("Are you sure you want to delete ${lead.title}?") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            showDeleteDialog = false
                            onDelete()
                        }
                    ) {
                        Text("Delete", color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }

        // Convert Confirmation Dialog
        if (showConvertDialog) {
            AlertDialog(
                onDismissRequest = { showConvertDialog = false },
                title = { Text("Convert to Deal") },
                text = { Text("Convert ${lead.title} to a deal?") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            showConvertDialog = false
                            onConvert()
                        }
                    ) {
                        Text("Convert")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showConvertDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }


}