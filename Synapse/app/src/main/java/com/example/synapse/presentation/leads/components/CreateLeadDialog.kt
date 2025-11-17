package com.example.synapse.presentation.leads.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.synapse.data.model.Contact

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateLeadDialog(
    contacts: List<Contact>,
    isCreating: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (title: String, contactId: String, source: String, value: Double?, notes: String?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var selectedContactId by remember { mutableStateOf<String?>(null) }
    var source by remember { mutableStateOf("") }
    var valueText by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    
    var titleError by remember { mutableStateOf(false) }
    var contactError by remember { mutableStateOf(false) }
    var sourceError by remember { mutableStateOf(false) }
    var valueError by remember { mutableStateOf(false) }
    
    var contactExpanded by remember { mutableStateOf(false) }
    
    val selectedContact = contacts.find { it.id == selectedContactId }
    
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
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = "Create New Lead",
                    style = MaterialTheme.typography.headlineSmall
                )
                
                Text(
                    text = "Add a new lead to track potential opportunities",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Title
                OutlinedTextField(
                    value = title,
                    onValueChange = {
                        title = it
                        titleError = false
                    },
                    label = { Text("Title *") },
                    placeholder = { Text("e.g., Enterprise Software Deal") },
                    modifier = Modifier.fillMaxWidth(),
                    isError = titleError,
                    supportingText = if (titleError) {
                        { Text("Title is required") }
                    } else null,
                    singleLine = true,
                    enabled = !isCreating
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Contact Dropdown
                ExposedDropdownMenuBox(
                    expanded = contactExpanded,
                    onExpandedChange = { 
                        if (!isCreating) contactExpanded = !contactExpanded 
                    }
                ) {
                    OutlinedTextField(
                        value = selectedContact?.let { "${it.firstName} ${it.lastName}" } ?: "",
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
                
                // Source
                OutlinedTextField(
                    value = source,
                    onValueChange = {
                        source = it
                        sourceError = false
                    },
                    label = { Text("Source *") },
                    placeholder = { Text("e.g., Website, Referral, Cold Call") },
                    modifier = Modifier.fillMaxWidth(),
                    isError = sourceError,
                    supportingText = if (sourceError) {
                        { Text("Source is required") }
                    } else null,
                    singleLine = true,
                    enabled = !isCreating
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Value
                OutlinedTextField(
                    value = valueText,
                    onValueChange = {
                        valueText = it
                        valueError = false
                    },
                    label = { Text("Value *") },
                    placeholder = { Text("e.g., 5000.00") },
                    modifier = Modifier.fillMaxWidth(),
                    isError = valueError,
                    supportingText = if (valueError) {
                        { Text("Please enter a valid number (0 or greater)") }
                    } else null,
                    singleLine = true,
                    enabled = !isCreating
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Notes
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes") },
                    placeholder = { Text("Additional notes about this lead...") },
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
                            sourceError = source.isBlank()
                            
                            val value = valueText.toDoubleOrNull()
                            valueError = value == null || value < 0
                            
                            if (!titleError && !contactError && !sourceError && !valueError) {
                                onConfirm(
                                    title,
                                    selectedContactId!!,
                                    source,
                                    value,
                                    notes.ifBlank { null }
                                )
                            }
                        },
                        enabled = !isCreating
                    ) {
                        if (isCreating) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Create Lead")
                        }
                    }
                }
            }
        }
    }
}