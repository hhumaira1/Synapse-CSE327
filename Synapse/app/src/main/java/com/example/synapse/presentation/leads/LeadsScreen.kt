package com.example.synapse.presentation.leads

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.example.synapse.presentation.leads.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeadsScreen(
    viewModel: LeadsViewModel = hiltViewModel(),
    navController: NavHostController,
    isDarkMode: Boolean = false,
    onBack: (() -> Unit)? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    val showCreateDialog by viewModel.showCreateLeadDialog.collectAsState()
    val showEditDialog by viewModel.showEditLeadDialog.collectAsState()
    val showImportDialog by viewModel.showImportContactDialog.collectAsState()
    val showConvertDialog by viewModel.showConvertLeadDialog.collectAsState()
    val showChangeStatusDialog by viewModel.showChangeStatusDialog.collectAsState()
    val selectedLead by viewModel.selectedLead.collectAsState()
    val availableContacts by viewModel.availableContacts.collectAsState()
    val availablePipelines by viewModel.availablePipelines.collectAsState()
    val isProcessing by viewModel.isProcessing.collectAsState()
    val selectedFilter by viewModel.selectedStatusFilter.collectAsState()
    
    var showFilterMenu by remember { mutableStateOf(false) }
    
    // Reload leads when screen is displayed
    LaunchedEffect(Unit) {
        viewModel.loadLeads()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text("Leads")
                        if (selectedFilter != null) {
                            Text(
                                "Filter: $selectedFilter",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { onBack?.invoke() ?: navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    Box {
                        IconButton(onClick = { showFilterMenu = true }) {
                            Icon(Icons.Default.FilterList, contentDescription = "Filter")
                        }
                        
                        DropdownMenu(
                            expanded = showFilterMenu,
                            onDismissRequest = { showFilterMenu = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("All Leads") },
                                onClick = {
                                    showFilterMenu = false
                                    viewModel.filterByStatus(null)
                                }
                            )
                            Divider()
                            listOf("NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED").forEach { status ->
                                DropdownMenuItem(
                                    text = { Text(status) },
                                    onClick = {
                                        showFilterMenu = false
                                        viewModel.filterByStatus(status)
                                    }
                                )
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        floatingActionButton = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                SmallFloatingActionButton(
                    onClick = { viewModel.showImportContactDialog() },
                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                ) {
                    Icon(
                        Icons.Default.PersonAdd,
                        contentDescription = "Import from Contacts"
                    )
                }
                
                FloatingActionButton(
                    onClick = { viewModel.showCreateLeadDialog() },
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Create Lead")
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (uiState) {
                is LeadsUiState.Loading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                
                is LeadsUiState.Empty -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                            modifier = Modifier.padding(32.dp)
                        ) {
                            Text(
                                "No leads yet",
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text("Create your first lead or import from contacts")
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedButton(onClick = { viewModel.showImportContactDialog() }) {
                                    Icon(Icons.Default.PersonAdd, contentDescription = null)
                                    Spacer(Modifier.width(8.dp))
                                    Text("Import Contact")
                                }
                                Button(onClick = { viewModel.showCreateLeadDialog() }) {
                                    Icon(Icons.Default.Add, contentDescription = null)
                                    Spacer(Modifier.width(8.dp))
                                    Text("Create Lead")
                                }
                            }
                        }
                    }
                }
                
                is LeadsUiState.Success -> {
                    val successState = uiState as? LeadsUiState.Success
                    if (successState != null) {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(successState.leads) { lead ->
                                LeadCard(
                                    lead = lead,
                                    onEdit = { viewModel.showEditLeadDialog(lead) },
                                    onDelete = { viewModel.deleteLead(lead.id) },
                                    onChangeStatus = { viewModel.showChangeStatusDialog(lead) },
                                    onConvert = { viewModel.showConvertLeadDialog(lead) },
                                    onClick = { navController.navigate("leads/${lead.id}") }
                                )
                            }
                        }
                    }
                }
                
                is LeadsUiState.Error -> {
                    val errorState = uiState as? LeadsUiState.Error
                    if (errorState != null) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Text(
                                    text = errorState.message,
                                    color = MaterialTheme.colorScheme.error,
                                    style = MaterialTheme.typography.bodyLarge
                                )
                                Button(onClick = { viewModel.onRetry() }) {
                                    Text("Retry")
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Dialogs
        if (showCreateDialog) {
            CreateLeadDialog(
                contacts = availableContacts,
                isCreating = isProcessing,
                onDismiss = { viewModel.hideCreateLeadDialog() },
                onConfirm = { title, contactId, source, value, notes ->
                    viewModel.createLead(title, contactId, source, value, notes)
                }
            )
        }
        
        if (showEditDialog && selectedLead != null) {
            EditLeadDialog(
                lead = selectedLead!!,
                isUpdating = isProcessing,
                onDismiss = { viewModel.hideEditLeadDialog() },
                onConfirm = { title, status, value, notes ->
                    viewModel.updateLead(selectedLead!!.id, title, status, value, notes)
                }
            )
        }
        
        if (showImportDialog) {
            ImportContactDialog(
                contacts = availableContacts,
                isImporting = isProcessing,
                onDismiss = { viewModel.hideImportContactDialog() },
                onConfirm = { contactId ->
                    viewModel.importLeadFromContact(contactId)
                }
            )
        }
        
        if (showConvertDialog && selectedLead != null) {
            ConvertLeadDialog(
                lead = selectedLead!!,
                pipelines = availablePipelines,
                isConverting = isProcessing,
                onDismiss = { viewModel.hideConvertLeadDialog() },
                onConfirm = { pipelineId, stageId, probability, expectedCloseDate ->
                    viewModel.convertLead(
                        selectedLead!!.id,
                        pipelineId,
                        stageId,
                        probability,
                        expectedCloseDate
                    )
                }
            )
        }
        
        if (showChangeStatusDialog && selectedLead != null) {
            ChangeLeadStatusDialog(
                lead = selectedLead!!,
                isUpdating = isProcessing,
                onDismiss = { viewModel.hideChangeStatusDialog() },
                onConfirm = { newStatus ->
                    viewModel.changeLeadStatus(selectedLead!!.id, newStatus)
                }
            )
        }
    }
}
