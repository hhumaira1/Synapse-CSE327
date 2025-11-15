package com.example.synapse.presentation.tickets

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
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
    
    val maxDescriptionLength = 500
    
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
                isError = title.isBlank()
            )
            
            // Description Field
            OutlinedTextField(
                value = description,
                onValueChange = { 
                    if (it.length <= maxDescriptionLength) {
                        description = it
                    }
                },
                label = { Text("Description *") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                maxLines = 10,
                isError = description.isBlank(),
                supportingText = {
                    Text(
                        text = "${description.length}/$maxDescriptionLength",
                        color = if (description.length >= maxDescriptionLength) {
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
            
            // Contact Selector
            OutlinedButton(
                onClick = { showContactPicker = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = selectedContact?.fullName ?: "Select Contact (Optional)",
                    style = MaterialTheme.typography.bodyMedium
                )
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
                    if (title.isNotBlank() && description.isNotBlank()) {
                        viewModel.createTicket(
                            CreateTicketRequest(
                                title = title,
                                description = description,
                                priority = priority.name,
                                source = source.name,
                                contactId = selectedContact?.id,
                                dealId = null
                            ),
                            onSuccess = onNavigateBack
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !uiState.isLoading && title.isNotBlank() && description.isNotBlank()
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
