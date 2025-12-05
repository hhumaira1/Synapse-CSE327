package com.example.synapse.presentation.tickets

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.synapse.data.model.Ticket
import com.example.synapse.data.model.TicketPriority
import com.example.synapse.data.model.TicketStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TicketsScreen(
    viewModel: TicketViewModel = hiltViewModel(),
    onTicketClick: (String) -> Unit,
    onCreateTicket: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(0) }
    
    val statusTabs = listOf(
        "All" to null,
        "Open" to TicketStatus.OPEN,
        "In Progress" to TicketStatus.IN_PROGRESS,
        "Resolved" to TicketStatus.RESOLVED,
        "Closed" to TicketStatus.CLOSED
    )
    
    LaunchedEffect(selectedTab) {
        viewModel.filterByStatus(statusTabs[selectedTab].second)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tickets") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onCreateTicket,
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Ticket")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Status Tabs
            ScrollableTabRow(selectedTabIndex = selectedTab) {
                statusTabs.forEachIndexed { index, (label, _) ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(label) }
                    )
                }
            }
            
            // Content
            when {
                uiState.isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                
                uiState.error != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = uiState.error ?: "Unknown error",
                                color = MaterialTheme.colorScheme.error
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = { viewModel.loadTickets() }) {
                                Text("Retry")
                            }
                        }
                    }
                }
                
                uiState.tickets.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No tickets found",
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
                
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.tickets) { ticket ->
                            TicketCard(
                                ticket = ticket,
                                onClick = { viewModel.loadTicketById(ticket.id) }
                            )
                        }
                    }
                }
            }
        }
    }

    // Ticket Detail Dialog
    if (uiState.showDetailDialog) {
        TicketDetailDialog(
            ticket = uiState.selectedTicket,
            comments = uiState.comments,
            onDismiss = { viewModel.hideTicketDetail() },
            onAddComment = { content ->
                val ticketId = uiState.selectedTicket?.id ?: ""
                viewModel.addComment(ticketId, content)
            },
            onUpdateStatus = { status ->
                val ticketId = uiState.selectedTicket?.id ?: ""
                viewModel.updateTicketStatus(ticketId, status) {
                    viewModel.loadTicketById(ticketId)
                }
            },
            onUpdatePriority = { priority ->
                val ticketId = uiState.selectedTicket?.id ?: ""
                viewModel.updateTicket(
                    ticketId,
                    com.example.synapse.data.api.request.UpdateTicketRequest(
                        title = null,
                        description = null,
                        status = null,
                        priority = priority,
                        contactId = null,
                        dealId = null
                    )
                ) {
                    viewModel.loadTicketById(ticketId)
                }
            },
            isLoading = uiState.isLoadingDetail
        )
    }
}

@Composable
fun TicketCard(
    ticket: Ticket,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Title
            Text(
                text = ticket.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            // Description Preview
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = ticket.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2
            )
            
            // Tags Row
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                // Status Badge
                AssistChip(
                    onClick = { },
                    label = { 
                        Text(
                            ticket.status.name.replace("_", " "),
                            style = MaterialTheme.typography.labelSmall
                        ) 
                    },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = when (ticket.status) {
                            TicketStatus.OPEN -> MaterialTheme.colorScheme.primaryContainer
                            TicketStatus.IN_PROGRESS -> MaterialTheme.colorScheme.secondaryContainer
                            TicketStatus.RESOLVED -> MaterialTheme.colorScheme.tertiaryContainer
                            TicketStatus.CLOSED -> MaterialTheme.colorScheme.surfaceVariant
                        }
                    )
                )
                
                // Priority Badge
                AssistChip(
                    onClick = { },
                    label = { 
                        Text(
                            ticket.priority.name,
                            style = MaterialTheme.typography.labelSmall
                        ) 
                    },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = when (ticket.priority) {
                            TicketPriority.LOW -> MaterialTheme.colorScheme.tertiaryContainer
                            TicketPriority.MEDIUM -> MaterialTheme.colorScheme.primaryContainer
                            TicketPriority.HIGH -> MaterialTheme.colorScheme.secondaryContainer
                            TicketPriority.URGENT -> MaterialTheme.colorScheme.errorContainer
                        }
                    )
                )
                
                // Source Badge
                AssistChip(
                    onClick = { },
                    label = { 
                        Text(
                            ticket.source.name,
                            style = MaterialTheme.typography.labelSmall
                        ) 
                    }
                )
                
                // Jira Badge (if linked to Jira)
                if (ticket.externalSystem == "jira" && ticket.externalId != null) {
                    AssistChip(
                        onClick = { },
                        label = { 
                            Text(
                                "\uD83C\uDFAB ${ticket.externalId}",
                                style = MaterialTheme.typography.labelSmall
                            ) 
                        },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    )
                }
            }
            
            // Contact Name
            if (ticket.contactName != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Contact: ${ticket.contactName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}
