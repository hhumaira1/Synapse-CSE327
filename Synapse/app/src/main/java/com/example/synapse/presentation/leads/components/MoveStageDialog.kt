package com.example.synapse.presentation.leads.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.synapse.data.model.Lead
import com.example.synapse.data.model.Stage
import androidx.core.graphics.toColorInt
import android.graphics.Color as PlatformColor


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MoveStageDialog(
    lead: Lead,
    stages: List<Stage>,
    isMoving: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (stageId: String) -> Unit
) {
    var selectedStageId by remember { mutableStateOf(lead.stageId) }
    var stageExpanded by remember { mutableStateOf(false) }
    var stageError by remember { mutableStateOf(false) }
    
    // Group stages by pipeline for better UX
    val groupedStages = stages.groupBy { it.pipelineId }
    val sortedStages = stages.sortedWith(
        compareBy<Stage> { it.pipelineId }.thenBy { it.order }
    )
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
            ) {
                Text(
                    text = "Move Lead to Stage",
                    style = MaterialTheme.typography.headlineSmall
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "${lead.firstName} ${lead.lastName}",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Current Stage Info
                if (lead.stage != null) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant
                        )
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "Current Stage",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                            ) {
                                Surface(
                                    color = Color(lead.stage.color?.toColorInt() ?: PlatformColor.GRAY),
                                    shape = MaterialTheme.shapes.small
                                ) {
                                    Text(
                                        text = lead.stage.name,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                } else {
                    Text(
                        text = "This lead is not currently in any stage",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                }
                
                // Stage Selection Dropdown
                ExposedDropdownMenuBox(
                    expanded = stageExpanded,
                    onExpandedChange = { stageExpanded = !stageExpanded }
                ) {
                    OutlinedTextField(
                        value = sortedStages.find { it.id == selectedStageId }?.name ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("New Stage *") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = stageExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        isError = stageError,
                        supportingText = if (stageError) {
                            { Text("Please select a stage") }
                        } else null
                    )
                    
                    ExposedDropdownMenu(
                        expanded = stageExpanded,
                        onDismissRequest = { stageExpanded = false }
                    ) {
                        sortedStages.forEach { stage ->
                            DropdownMenuItem(
                                text = {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                                    ) {
                                        Surface(
                                            color = Color(stage.color?.toColorInt() ?: PlatformColor.GRAY),
                                            shape = MaterialTheme.shapes.small,
                                            modifier = Modifier.size(12.dp)
                                        ) {}
                                        Text(stage.name)
                                    }
                                },
                                onClick = {
                                    selectedStageId = stage.id
                                    stageExpanded = false
                                    stageError = false
                                }
                            )
                        }
                    }
                }
                
                if (stages.isEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "No stages available. Please create a pipeline with stages first.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(
                        onClick = onDismiss,
                        enabled = !isMoving
                    ) {
                        Text("Cancel")
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Button(
                        onClick = {
                            if (selectedStageId != null) {
                                onConfirm(selectedStageId!!)
                            } else {
                                stageError = true
                            }
                        },
                        enabled = !isMoving && stages.isNotEmpty()
                    ) {
                        if (isMoving) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Move")
                        }
                    }
                }
            }
        }
    }
}
