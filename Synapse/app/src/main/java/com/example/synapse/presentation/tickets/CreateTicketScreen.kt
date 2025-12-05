package com.example.synapse.presentation.tickets

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.synapse.data.api.request.CreateTicketRequest
import com.example.synapse.data.model.Contact
import com.example.synapse.data.model.TicketPriority
import com.example.synapse.data.model.TicketSource
import com.example.synapse.presentation.contacts.ContactViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateTicketScreen(
    viewModel: TicketViewModel = hiltViewModel(),
    contactViewModel: ContactViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val contactsState by contactViewModel.uiState.collectAsState()
    
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf(TicketPriority.MEDIUM) }
    var source by remember { mutableStateOf(TicketSource.INTERNAL) }
    var selectedContact by remember { mutableStateOf<Contact?>(null) }
    var showContactPicker by remember { mutableStateOf(false) }
    var showNoContactsDialog by remember { mutableStateOf(false) }
    
    val maxDescriptionLength = 500
    val minDescriptionLength = 10
    
    LaunchedEffect(Unit) {
        contactViewModel.loadContacts()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create Ticket") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Title Field
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Title *") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                isError = title.length < 5,
                supportingText = if (title.isNotEmpty() && title.length < 5) {
                    { Text("Title must be at least 5 characters", color = MaterialTheme.colorScheme.error) }
                } else null
            )
            
            // Description Field
            OutlinedTextField(
                value = description,
                onValueChange = { 
                    if (it.length <= maxDescriptionLength) {
                        description = it
                    }
                },
                label = { Text("Description (Optional)") },
                placeholder = { Text("Minimum 10 characters if provided") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                maxLines = 10,
                isError = description.isNotEmpty() && description.length < minDescriptionLength,
                supportingText = {
                    val text = if (description.isNotEmpty() && description.length < minDescriptionLength) {
                        "Description must be at least $minDescriptionLength characters (${description.length}/$minDescriptionLength)"
                    } else {
                        "${description.length}/$maxDescriptionLength"
                    }
                    Text(
                        text = text,
                        color = if (description.isNotEmpty() && description.length < minDescriptionLength) {
                            MaterialTheme.colorScheme.error
                        } else if (description.length >= maxDescriptionLength) {
                            MaterialTheme.colorScheme.error
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        }
                    )
                }
            )
            
            // Priority Selector
            Column {
                Text(
                    text = "Priority *",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TicketPriority.entries.forEach { p ->
                        FilterChip(
                            selected = priority == p,
                            onClick = { priority = p },
                            label = { Text(p.name) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = when (p) {
                                    TicketPriority.LOW -> MaterialTheme.colorScheme.tertiaryContainer
                                    TicketPriority.MEDIUM -> MaterialTheme.colorScheme.primaryContainer
                                    TicketPriority.HIGH -> MaterialTheme.colorScheme.secondaryContainer
                                    TicketPriority.URGENT -> MaterialTheme.colorScheme.errorContainer
                                }
                            )
                        )
                    }
                }
            }
            
            // Source Selector
            Column {
                Text(
                    text = "Source *",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(TicketSource.INTERNAL, TicketSource.EMAIL, TicketSource.PHONE, TicketSource.PORTAL).forEach { s ->
                        FilterChip(
                            selected = source == s,
                            onClick = { source = s },
                            label = { Text(s.name) }
                        )
                    }
                }
            }
            
            // Contact Selector (Required)
            Column {
                Text(
                    text = "Contact *",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedButton(
                    onClick = { 
                        if (contactsState.contacts.isEmpty() && !contactsState.isLoading) {
                            showNoContactsDialog = true
                        } else {
                            showContactPicker = true
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (selectedContact == null) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.surface
                    )
                ) {
                    Text(
                        text = selectedContact?.fullName ?: "Select Contact (Required)",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (selectedContact == null) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
                    )
                }
                if (selectedContact == null) {
                    Text(
                        text = "Please select a contact to create a ticket",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(start = 16.dp, top = 4.dp)
                    )
                }
            }
            
            // Error Message
            if (uiState.error != null) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Text(
                        text = uiState.error ?: "",
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
            
            // Submit Button
            Button(
                onClick = {
                    val isValid = title.length >= 5 && 
                                  selectedContact != null &&
                                  (description.isEmpty() || description.length >= minDescriptionLength)
                    
                    if (isValid) {
                        viewModel.createTicket(
                            CreateTicketRequest(
                                title = title,
                                description = description.ifEmpty { null },
                                priority = priority.name,
                                source = source.name,
                                contactId = selectedContact?.id ?: "",
                                dealId = null
                            ),
                            onSuccess = onNavigateBack
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !uiState.isLoading && 
                          title.length >= 5 && 
                          selectedContact != null &&
                          (description.isEmpty() || description.length >= minDescriptionLength)
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Create Ticket")
                }
            }
        }
    }
    
    // No Contacts Dialog
    if (showNoContactsDialog) {
        AlertDialog(
            onDismissRequest = { showNoContactsDialog = false },
            icon = {
                Icon(
                    Icons.Default.Person,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            },
            title = { Text("No Contacts Available") },
            text = { 
                Text("You need to create at least one contact before creating a ticket. Would you like to create a contact now?") 
            },
            confirmButton = {
                Button(
                    onClick = {
                        showNoContactsDialog = false
                        onNavigateBack()
                        // TODO: Navigate to create contact screen
                        // For now, just close and let user navigate manually
                    }
                ) {
                    Text("Create Contact")
                }
            },
            dismissButton = {
                TextButton(onClick = { showNoContactsDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
    
    // Contact Picker Dialog
    if (showContactPicker) {
        AlertDialog(
            onDismissRequest = { showContactPicker = false },
            title = { Text("Select Contact") },
            text = {
                Column {
                    if (contactsState.isLoading) {
                        CircularProgressIndicator()
                    } else {
                        contactsState.contacts.forEach { contact ->
                            TextButton(
                                onClick = {
                                    selectedContact = contact
                                    showContactPicker = false
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(contact.fullName)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showContactPicker = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
