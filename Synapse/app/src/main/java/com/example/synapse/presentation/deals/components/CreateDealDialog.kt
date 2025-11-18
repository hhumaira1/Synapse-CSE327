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
import com.example.synapse.data.model.Contact
import com.example.synapse.data.model.Pipeline

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateDealDialog(
    contacts: List<Contact>,
    pipelines: List<Pipeline>,
    isCreating: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (title: String, contactId: String, pipelineId: String, stageId: String, value: Double, probability: Int, expectedCloseDate: String?, notes: String?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var selectedContactId by remember { mutableStateOf<String?>(null) }
    var selectedPipelineId by remember { mutableStateOf<String?>(null) }
    var selectedStageId by remember { mutableStateOf<String?>(null) }
    var value by remember { mutableStateOf("") }
    var probability by remember { mutableStateOf("50") }
    var expectedCloseDate by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    
    var contactExpanded by remember { mutableStateOf(false) }
    var pipelineExpanded by remember { mutableStateOf(false) }
    var stageExpanded by remember { mutableStateOf(false) }
    
    var titleError by remember { mutableStateOf(false) }
    var contactError by remember { mutableStateOf(false) }
    var pipelineError by remember { mutableStateOf(false) }
    var stageError by remember { mutableStateOf(false) }
    var valueError by remember { mutableStateOf(false) }
    var probabilityError by remember { mutableStateOf(false) }
    
    // Get available stages based on selected pipeline
    val selectedPipeline = pipelines.find { it.id == selectedPipelineId }
    val availableStages = selectedPipeline?.stages?.sortedBy { it.order } ?: emptyList()
    
    // Auto-select first stage when pipeline changes
    LaunchedEffect(selectedPipelineId) {
        if (availableStages.isNotEmpty()) {
            selectedStageId = availableStages.first().id
        } else {
            selectedStageId = null
        }
    }
    
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
                    text = "Create New Deal",
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
                    enabled = !isCreating
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Contact Selection
                ExposedDropdownMenuBox(
                    expanded = contactExpanded,
                    onExpandedChange = { contactExpanded = !contactExpanded }
                ) {
                    OutlinedTextField(
                        value = contacts.find { it.id == selectedContactId }?.let { 
                            "${it.firstName} ${it.lastName}"
                        } ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Contact *") },
                        placeholder = { Text("Select a contact") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = contactExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        isError = contactError,
                        supportingText = if (contactError) {
                            { Text("Please select a contact") }
                        } else null,
                        enabled = !isCreating
                    )
                    
                    ExposedDropdownMenu(
                        expanded = contactExpanded,
                        onDismissRequest = { contactExpanded = false }
                    ) {
                        if (contacts.isEmpty()) {
                            DropdownMenuItem(
                                text = { Text("No contacts available") },
                                onClick = {}
                            )
                        } else {
                            contacts.forEach { contact ->
                                DropdownMenuItem(
                                    text = { 
                                        Column {
                                            Text("${contact.firstName} ${contact.lastName}")
                                            contact.email?.let { email ->
                                                Text(
                                                    email,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    },
                                    onClick = {
                                        selectedContactId = contact.id
                                        contactExpanded = false
                                        contactError = false
                                    }
                                )
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Pipeline Selection
                ExposedDropdownMenuBox(
                    expanded = pipelineExpanded,
                    onExpandedChange = { pipelineExpanded = !pipelineExpanded }
                ) {
                    OutlinedTextField(
                        value = pipelines.find { it.id == selectedPipelineId }?.name ?: "",
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
                        enabled = !isCreating
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
                                        pipelineExpanded = false
                                        pipelineError = false
                                    }
                                )
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Stage Selection (filtered by pipeline)
                ExposedDropdownMenuBox(
                    expanded = stageExpanded,
                    onExpandedChange = { if (selectedPipeline != null) stageExpanded = !stageExpanded }
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
                        enabled = !isCreating && selectedPipeline != null
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
                    enabled = !isCreating
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
                    enabled = !isCreating
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Expected Close Date
                OutlinedTextField(
                    value = expectedCloseDate,
                    onValueChange = { expectedCloseDate = it },
                    label = { Text("Expected Close Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !isCreating
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
                    enabled = !isCreating
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(
                        onClick = onDismiss,
                        enabled = !isCreating
                    ) {
                        Text("Cancel")
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Button(
                        onClick = {
                            titleError = title.isBlank()
                            contactError = selectedContactId == null
                            pipelineError = selectedPipelineId == null
                            stageError = selectedStageId == null
                            val valueDouble = value.toDoubleOrNull()
                            valueError = valueDouble == null || valueDouble < 0
                            val probInt = probability.toIntOrNull()
                            probabilityError = probInt == null || probInt < 0 || probInt > 100
                            
                            if (!titleError && !contactError && !pipelineError && !stageError && 
                                !valueError && !probabilityError && 
                                selectedContactId != null && selectedPipelineId != null && 
                                selectedStageId != null && valueDouble != null && probInt != null) {
                                onConfirm(
                                    title,
                                    selectedContactId!!,
                                    selectedPipelineId!!,
                                    selectedStageId!!,
                                    valueDouble,
                                    probInt,
                                    expectedCloseDate.ifBlank { null },
                                    notes.ifBlank { null }
                                )
                            }
                        },
                        enabled = !isCreating && contacts.isNotEmpty() && pipelines.isNotEmpty()
                    ) {
                        if (isCreating) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Create Deal")
                        }
                    }
                }
            }
        }
    }
}

