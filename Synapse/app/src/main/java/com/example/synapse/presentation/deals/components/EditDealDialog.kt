package com.example.synapse.presentation.deals.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.synapse.data.model.Deal
import com.example.synapse.data.model.Stage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditDealDialog(
    deal: Deal,
    stages: List<Stage>, // Stages in the current pipeline
    isUpdating: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (title: String, stageId: String, value: Double, probability: Int, expectedCloseDate: String?, notes: String?) -> Unit
) {
    var title by remember { mutableStateOf(deal.title) }
    var selectedStageId by remember { mutableStateOf(deal.stageId) }
    var value by remember { mutableStateOf(deal.value.toString()) }
    var probability by remember { mutableStateOf((deal.probability * 100).toInt().toString()) }
    var expectedCloseDate by remember { mutableStateOf(deal.expectedCloseDate ?: "") }
    var notes by remember { mutableStateOf(deal.notes ?: "") }
    
    var stageExpanded by remember { mutableStateOf(false) }
    var titleError by remember { mutableStateOf(false) }
    var valueError by remember { mutableStateOf(false) }
    var probabilityError by remember { mutableStateOf(false) }
    
    val sortedStages = stages.sortedBy { it.order }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.9f)
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
                    text = "Edit Deal",
                    style = MaterialTheme.typography.headlineSmall
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Title
                OutlinedTextField(
                    value = title,
                    onValueChange = { 
                        title = it
                        titleError = false
                    },
                    label = { Text("Deal Title *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    isError = titleError,
                    supportingText = if (titleError) {
                        { Text("Title is required") }
                    } else null,
                    enabled = !isUpdating
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Contact (read-only - can't change)
                deal.contact?.let { contact ->
                    OutlinedTextField(
                        value = "${contact.firstName} ${contact.lastName}",
                        onValueChange = {},
                        label = { Text("Contact") },
                        modifier = Modifier.fillMaxWidth(),
                        readOnly = true,
                        enabled = false,
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledTextColor = MaterialTheme.colorScheme.onSurface,
                            disabledBorderColor = MaterialTheme.colorScheme.outline,
                            disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                }
                
                // Pipeline (read-only - can't change pipeline)
                deal.pipeline?.let { pipeline ->
                    OutlinedTextField(
                        value = pipeline.name,
                        onValueChange = {},
                        label = { Text("Pipeline") },
                        modifier = Modifier.fillMaxWidth(),
                        readOnly = true,
                        enabled = false,
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledTextColor = MaterialTheme.colorScheme.onSurface,
                            disabledBorderColor = MaterialTheme.colorScheme.outline,
                            disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                }
                
                // Stage Selection (within current pipeline)
                ExposedDropdownMenuBox(
                    expanded = stageExpanded,
                    onExpandedChange = { stageExpanded = !stageExpanded }
                ) {
                    OutlinedTextField(
                        value = sortedStages.find { it.id == selectedStageId }?.name ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Stage *") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = stageExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        enabled = !isUpdating
                    )
                    
                    ExposedDropdownMenu(
                        expanded = stageExpanded,
                        onDismissRequest = { stageExpanded = false }
                    ) {
                        sortedStages.forEach { stage ->
                            DropdownMenuItem(
                                text = { Text(stage.name) },
                                onClick = {
                                    selectedStageId = stage.id
                                    stageExpanded = false
                                }
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Value
                OutlinedTextField(
                    value = value,
                    onValueChange = { 
                        value = it
                        valueError = false
                    },
                    label = { Text("Value ($) *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    isError = valueError,
                    supportingText = if (valueError) {
                        { Text("Invalid value") }
                    } else null,
                    enabled = !isUpdating
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Probability
                OutlinedTextField(
                    value = probability,
                    onValueChange = { 
                        probability = it
                        probabilityError = false
                    },
                    label = { Text("Probability (%) *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    isError = probabilityError,
                    supportingText = if (probabilityError) {
                        { Text("Enter 0-100") }
                    } else {
                        { Text("Likelihood of closing (0-100%)") }
                    },
                    enabled = !isUpdating
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Expected Close Date
                OutlinedTextField(
                    value = expectedCloseDate,
                    onValueChange = { expectedCloseDate = it },
                    label = { Text("Expected Close Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !isUpdating
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Notes
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5,
                    enabled = !isUpdating
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(
                        onClick = onDismiss,
                        enabled = !isUpdating
                    ) {
                        Text("Cancel")
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Button(
                        onClick = {
                            titleError = title.isBlank()
                            val valueDouble = value.toDoubleOrNull()
                            valueError = valueDouble == null || valueDouble < 0
                            val probInt = probability.toIntOrNull()
                            probabilityError = probInt == null || probInt < 0 || probInt > 100
                            
                            if (!titleError && !valueError && !probabilityError && valueDouble != null && probInt != null) {
                                onConfirm(
                                    title,
                                    selectedStageId,
                                    valueDouble,
                                    probInt,
                                    expectedCloseDate.ifBlank { null },
                                    notes.ifBlank { null }
                                )
                            }
                        },
                        enabled = !isUpdating
                    ) {
                        if (isUpdating) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Update Deal")
                        }
                    }
                }
            }
        }
    }
}

