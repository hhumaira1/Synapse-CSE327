package com.example.synapse.presentation.contacts

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.synapse.data.api.request.UpdateContactRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactDetailScreen(
    contactId: String,
    viewModel: ContactViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var isEditing by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    
    val contact = uiState.selectedContact
    
    // Editable fields
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var company by remember { mutableStateOf("") }
    var jobTitle by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    
    // Load contact details
    LaunchedEffect(contactId) {
        viewModel.loadContactById(contactId)
    }
    
    // Update fields when contact is loaded
    LaunchedEffect(contact) {
        contact?.let {
            firstName = it.firstName
            lastName = it.lastName ?: ""
            email = it.email ?: ""
            phone = it.phone ?: ""
            company = it.company ?: ""
            jobTitle = it.jobTitle ?: ""
            notes = it.notes ?: ""
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEditing) "Edit Contact" else "Contact Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (contact != null) {
                        if (isEditing) {
                            IconButton(
                                onClick = {
                                    // Save changes
                                    if (firstName.isNotBlank()) {
                                        val request = UpdateContactRequest(
                                            firstName = firstName,
                                            lastName = lastName.ifBlank { null },
                                            email = email.ifBlank { null },
                                            phone = phone.ifBlank { null },
                                            company = company.ifBlank { null },
                                            jobTitle = jobTitle.ifBlank { null },
                                            address = null,
                                            city = null,
                                            country = null,
                                            linkedInUrl = null,
                                            website = null,
                                            notes = notes.ifBlank { null },
                                            tags = null
                                        )
                                        viewModel.updateContact(
                                            id = contactId,
                                            request = request,
                                            onSuccess = {
                                                isEditing = false
                                                viewModel.loadContactById(contactId)
                                            }
                                        )
                                    }
                                }
                            ) {
                                Icon(Icons.Default.Save, contentDescription = "Save")
                            }
                        } else {
                            IconButton(onClick = { isEditing = true }) {
                                Icon(Icons.Default.Edit, contentDescription = "Edit")
                            }
                            IconButton(onClick = { showDeleteDialog = true }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete")
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                uiState.isLoading && contact == null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = androidx.compose.ui.Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                
                uiState.error != null && contact == null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = androidx.compose.ui.Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = uiState.error ?: "Unknown error",
                                color = MaterialTheme.colorScheme.error
                            )
                            Button(onClick = { viewModel.loadContactById(contactId) }) {
                                Text("Retry")
                            }
                        }
                    }
                }
                
                contact != null -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Personal Information Section
                        Text(
                            text = "Personal Information",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )

                        OutlinedTextField(
                            value = firstName,
                            onValueChange = { firstName = it },
                            label = { Text("First Name *") },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = isEditing,
                            singleLine = true,
                            isError = firstName.isBlank(),
                            colors = if (!isEditing) OutlinedTextFieldDefaults.colors(
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledTextColor = MaterialTheme.colorScheme.onSurface
                            ) else OutlinedTextFieldDefaults.colors()
                        )
                        
                        OutlinedTextField(
                            value = lastName,
                            onValueChange = { lastName = it },
                            label = { Text("Last Name") },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = isEditing,
                            singleLine = true,
                            colors = if (!isEditing) OutlinedTextFieldDefaults.colors(
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledTextColor = MaterialTheme.colorScheme.onSurface
                            ) else OutlinedTextFieldDefaults.colors()
                        )

                        Divider(modifier = Modifier.padding(vertical = 8.dp))

                        // Contact Information Section
                        Text(
                            text = "Contact Information",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )

                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = { Text("Email") },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = isEditing,
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                            isError = email.isNotEmpty() && !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches(),
                            colors = if (!isEditing) OutlinedTextFieldDefaults.colors(
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledTextColor = MaterialTheme.colorScheme.onSurface
                            ) else OutlinedTextFieldDefaults.colors()
                        )
                        
                        OutlinedTextField(
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text("Phone") },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = isEditing,
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            colors = if (!isEditing) OutlinedTextFieldDefaults.colors(
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledTextColor = MaterialTheme.colorScheme.onSurface
                            ) else OutlinedTextFieldDefaults.colors()
                        )

                        Divider(modifier = Modifier.padding(vertical = 8.dp))

                        // Professional Information Section
                        Text(
                            text = "Professional Information",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )

                        OutlinedTextField(
                            value = company,
                            onValueChange = { company = it },
                            label = { Text("Company") },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = isEditing,
                            singleLine = true,
                            colors = if (!isEditing) OutlinedTextFieldDefaults.colors(
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledTextColor = MaterialTheme.colorScheme.onSurface
                            ) else OutlinedTextFieldDefaults.colors()
                        )
                        
                        OutlinedTextField(
                            value = jobTitle,
                            onValueChange = { jobTitle = it },
                            label = { Text("Job Title") },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = isEditing,
                            singleLine = true,
                            colors = if (!isEditing) OutlinedTextFieldDefaults.colors(
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledTextColor = MaterialTheme.colorScheme.onSurface
                            ) else OutlinedTextFieldDefaults.colors()
                        )

                        Divider(modifier = Modifier.padding(vertical = 8.dp))

                        // Additional Notes Section
                        Text(
                            text = "Additional Notes",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )

                        OutlinedTextField(
                            value = notes,
                            onValueChange = { notes = it },
                            label = { Text("Notes") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp),
                            enabled = isEditing,
                            maxLines = 5,
                            colors = if (!isEditing) OutlinedTextFieldDefaults.colors(
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledTextColor = MaterialTheme.colorScheme.onSurface
                            ) else OutlinedTextFieldDefaults.colors()
                        )

                        // Error Message
                        if (uiState.error != null) {
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.errorContainer
                                ),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = uiState.error ?: "",
                                    modifier = Modifier.padding(16.dp),
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                            }
                        }

                        // Cancel button when editing
                        if (isEditing) {
                            OutlinedButton(
                                onClick = {
                                    // Reset fields to original values
                                    contact.let {
                                        firstName = it.firstName
                                        lastName = it.lastName ?: ""
                                        email = it.email ?: ""
                                        phone = it.phone ?: ""
                                        company = it.company ?: ""
                                        jobTitle = it.jobTitle ?: ""
                                        notes = it.notes ?: ""
                                    }
                                    isEditing = false
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Cancel")
                            }
                        }
                    }
                }
            }
        }
    }

    // Delete Confirmation Dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Contact") },
            text = { Text("Are you sure you want to delete ${contact?.fullName}? This action cannot be undone.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteContact(
                            id = contactId,
                            onSuccess = {
                                showDeleteDialog = false
                                onNavigateBack()
                            }
                        )
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
