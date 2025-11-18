package com.example.synapse.presentation.portal.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.synapse.data.model.portal.CreateTicketRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatePortalTicketDialog(
    open: Boolean,
    onDismiss: () -> Unit,
    onCreateTicket: (CreateTicketRequest) -> Unit,
    isLoading: Boolean = false
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var tenantId by remember { mutableStateOf<String?>(null) }

    val maxDescriptionLength = 500
    val titleLength = title.length
    val descriptionLength = description.length

    // Reset form when dialog opens
    LaunchedEffect(open) {
        if (open) {
            title = ""
            description = ""
            tenantId = null
        }
    }

    if (open) {
        AlertDialog(
            onDismissRequest = onDismiss,
            title = {
                Text(
                    text = "Submit Support Ticket",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "Describe your issue and our support team will assist you as soon as possible.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    // Title Field
                    OutlinedTextField(
                        value = title,
                        onValueChange = { if (it.length <= 200) title = it },
                        label = { Text("Subject *") },
                        placeholder = { Text("Brief summary of your issue") },
                        modifier = Modifier.fillMaxWidth(),
                        supportingText = {
                            Text(
                                text = "${titleLength}/200 characters",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (titleLength > 180) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        },
                        isError = titleLength > 200,
                        enabled = !isLoading
                    )

                    // Description Field
                    OutlinedTextField(
                        value = description,
                        onValueChange = { if (it.length <= maxDescriptionLength) description = it },
                        label = { Text("Description *") },
                        placeholder = { Text("Please provide as much detail as possible about your issue...") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 4,
                        maxLines = 8,
                        supportingText = {
                            Column {
                                Text(
                                    text = "${descriptionLength}/${maxDescriptionLength} characters",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (descriptionLength >= maxDescriptionLength) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "Minimum 10 characters",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        },
                        isError = descriptionLength >= maxDescriptionLength,
                        enabled = !isLoading
                    )

                    // Info Box
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = MaterialTheme.shapes.medium,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = "Note: Our support team will review your ticket and respond within 24 hours. You'll receive email notifications for any updates.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isNotBlank() && description.length >= 10) {
                            val request = CreateTicketRequest(
                                title = title.trim(),
                                description = description.trim(),
                                tenantId = tenantId
                            )
                            onCreateTicket(request)
                        }
                    },
                    enabled = !isLoading && title.isNotBlank() && description.length >= 10 && description.length <= maxDescriptionLength,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = androidx.compose.ui.graphics.Color(0xFF6366F1),
                        contentColor = androidx.compose.ui.graphics.Color.White
                    )
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            color = androidx.compose.ui.graphics.Color.White
                        )
                    } else {
                        Text("Submit Ticket")
                    }
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = onDismiss,
                    enabled = !isLoading
                ) {
                    Text("Cancel")
                }
            }
        )
    }
}
