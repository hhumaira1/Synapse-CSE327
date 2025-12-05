package com.example.synapse.presentation.leads.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.synapse.data.model.Lead
import com.example.synapse.data.model.Pipeline
import com.example.synapse.data.model.Stage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConvertLeadDialog(
    lead: Lead,
    pipelines: List<Pipeline>,
    isConverting: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (pipelineId: String, stageId: String, probability: Int?, expectedCloseDate: String?) -> Unit
) {
    var selectedPipelineId by remember { mutableStateOf<String?>(null) }
    var selectedStageId by remember { mutableStateOf<String?>(null) }
    var probability by remember { mutableStateOf("50") }
    var expectedCloseDate by remember { mutableStateOf("") }
    
    var pipelineExpanded by remember { mutableStateOf(false) }
    var stageExpanded by remember { mutableStateOf(false) }
    var pipelineError by remember { mutableStateOf(false) }
    var stageError by remember { mutableStateOf(false) }
    
    val selectedPipeline = pipelines.find { it.id == selectedPipelineId }
    val availableStages = selectedPipeline?.stages?.sortedBy { it.order } ?: emptyList()
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = "Convert Lead to Deal",
                    style = MaterialTheme.typography.headlineSmall
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "Move \"${lead.title}\" to your sales pipeline",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Pipeline Selection
                ExposedDropdownMenuBox(
                    expanded = pipelineExpanded,
                    onExpandedChange = { pipelineExpanded = !pipelineExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedPipeline?.name ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Pipeline *") },
                        placeholder = { Text("Select a pipeline") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = pipelineExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        isError = pipelineError,
                        supportingText = if (pipelineError) {
                            { Text("Please select a pipeline") }
                        } else null,
                        enabled = !isConverting
                    )
                    
                    ExposedDropdownMenu(
                        expanded = pipelineExpanded,
                        onDismissRequest = { pipelineExpanded = false }
                    ) {
                        if (pipelines.isEmpty()) {
                            DropdownMenuItem(
                                text = { Text("No pipelines available") },
                                onClick = {}
                            )
                        } else {
                            pipelines.forEach { pipeline ->
                                DropdownMenuItem(
                                    text = { Text(pipeline.name) },
                                    onClick = {
                                        selectedPipelineId = pipeline.id
                                        selectedStageId = null // Reset stage selection
                                        pipelineExpanded = false
                                        pipelineError = false
                                    }
                                )
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Stage Selection
                ExposedDropdownMenuBox(
                    expanded = stageExpanded,
                    onExpandedChange = { if (selectedPipeline != null) stageExpanded = !stageExpanded },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = availableStages.find { it.id == selectedStageId }?.name ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Stage *") },
                        placeholder = { Text("Select a stage") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = stageExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        isError = stageError,
                        supportingText = if (stageError) {
                            { Text("Please select a stage") }
                        } else if (selectedPipeline == null) {
                            { Text("Select a pipeline first") }
                        } else null,
                        enabled = !isConverting && selectedPipeline != null
                    )
                    
                    ExposedDropdownMenu(
                        expanded = stageExpanded,
                        onDismissRequest = { stageExpanded = false }
                    ) {
                        if (availableStages.isEmpty()) {
                            DropdownMenuItem(
                                text = { Text("No stages available") },
                                onClick = {}
                            )
                        } else {
                            availableStages.forEach { stage ->
                                DropdownMenuItem(
                                    text = { Text(stage.name) },
                                    onClick = {
                                        selectedStageId = stage.id
                                        stageExpanded = false
                                        stageError = false
                                    }
                                )
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Optional Fields
                OutlinedTextField(
                    value = probability,
                    onValueChange = { probability = it },
                    label = { Text("Probability (%)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !isConverting
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = expectedCloseDate,
                    onValueChange = { expectedCloseDate = it },
                    label = { Text("Expected Close Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !isConverting
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(
                        onClick = onDismiss,
                        enabled = !isConverting
                    ) {
                        Text("Cancel")
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Button(
                        onClick = {
                            pipelineError = selectedPipelineId == null
                            stageError = selectedStageId == null
                            
                            if (!pipelineError && !stageError && selectedPipelineId != null && selectedStageId != null) {
                                val prob = probability.toIntOrNull()
                                onConfirm(
                                    selectedPipelineId!!,
                                    selectedStageId!!,
                                    prob,
                                    expectedCloseDate.ifBlank { null }
                                )
                            }
                        },
                        enabled = !isConverting && selectedPipelineId != null && selectedStageId != null
                    ) {
                        if (isConverting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Convert to Deal")
                        }
                    }
                }
            }
        }
    }
}
