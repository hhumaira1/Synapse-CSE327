package com.example.synapse.presentation.portal

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.example.synapse.data.model.portal.TicketStatus
import com.example.synapse.data.model.portal.TicketPriority
import com.example.synapse.presentation.portal.components.CreatePortalTicketDialog
import com.example.synapse.presentation.portal.components.PortalTicketDetailDialog
import com.example.synapse.presentation.portal.viewmodel.PortalTicketsViewModel
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PortalTicketsScreen(
    navController: NavHostController,
    onBack: (() -> Unit)? = null,
    viewModel: PortalTicketsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var selectedStatusTab by remember { mutableStateOf(0) }
    val snackbarHostState = remember { SnackbarHostState() }

    val statusTabs = listOf(
        "All" to null,
        "Open" to TicketStatus.OPEN,
        "In Progress" to TicketStatus.IN_PROGRESS,
        "Resolved" to TicketStatus.RESOLVED,
        "Closed" to TicketStatus.CLOSED
    )

    // Update filter when tab changes
    LaunchedEffect(selectedStatusTab) {
        viewModel.filterByStatus(statusTabs[selectedStatusTab].second)
    }

    // Show error snackbar when error occurs
    LaunchedEffect(state.error) {
        state.error?.let { errorMessage ->
            snackbarHostState.showSnackbar(
                message = errorMessage,
                duration = SnackbarDuration.Long
            )
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "🎫 Support Tickets",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Submit and track your support requests",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { onBack?.invoke() ?: navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    // Switch Workspace Button
                    FilledTonalButton(
                        onClick = { navController.navigate("workspace_selector") },
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = MaterialTheme.colorScheme.secondaryContainer
                        ),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Icon(
                            Icons.Default.SwapHoriz,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Switch",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { viewModel.showCreateDialog() },
                containerColor = Color(0xFF6366F1),
                contentColor = Color.White,
                elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 6.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Ticket")
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "New Ticket",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.labelLarge
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                state.isLoading && state.tickets.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            CircularProgressIndicator()
                            Text(
                                text = "Loading your tickets...",
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }
                    }
                }

                state.error != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                            modifier = Modifier.padding(32.dp)
                        ) {
                            Icon(
                                Icons.Default.Error,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.error
                            )
                            Text(
                                text = "Error",
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = state.error ?: "Unknown error",
                                style = MaterialTheme.typography.bodyLarge,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                            Button(onClick = { viewModel.loadTickets() }) {
                                Text("Retry")
                            }
                        }
                    }
                }

                state.tickets.isEmpty() && !state.isLoading -> {
                    // Enhanced Empty State
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        // Animated Icon Container
                        Surface(
                            color = Color.Transparent,
                            shape = MaterialTheme.shapes.extraLarge,
                            modifier = Modifier.size(140.dp)
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.radialGradient(
                                            colors = listOf(
                                                Color(0xFFEEF2FF),
                                                Color(0xFFDDD6FE)
                                            )
                                        )
                                    )
                            ) {
                                Icon(
                                    Icons.Default.ConfirmationNumber,
                                    contentDescription = null,
                                    tint = Color(0xFF6366F1),
                                    modifier = Modifier.size(70.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(32.dp))

                        Text(
                            text = "No Tickets Yet",
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Bold,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "Need help? Submit your first support ticket and our team will get back to you within 24 hours.",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            lineHeight = MaterialTheme.typography.bodyLarge.lineHeight * 1.5
                        )

                        Spacer(modifier = Modifier.height(40.dp))

                        // Enhanced CTA Button
                        Button(
                            onClick = { viewModel.showCreateDialog() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF6366F1),
                                contentColor = Color.White
                            ),
                            modifier = Modifier
                                .fillMaxWidth(0.7f)
                                .height(56.dp),
                            shape = MaterialTheme.shapes.large,
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
                        ) {
                            Icon(
                                Icons.Default.Add,
                                contentDescription = null,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                "Create Your First Ticket",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Info Card
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = Color(0xFFFEF3C7)
                            ),
                            shape = MaterialTheme.shapes.medium
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(
                                    Icons.Default.Info,
                                    contentDescription = null,
                                    tint = Color(0xFF92400E),
                                    modifier = Modifier.size(24.dp)
                                )
                                Text(
                                    text = "Our support team is available to help you with any questions or issues.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color(0xFF92400E)
                                )
                            }
                        }
                    }
                }

                else -> {
                    Column(modifier = Modifier.fillMaxSize()) {
                        // Status Tabs
                        ScrollableTabRow(
                            selectedTabIndex = selectedStatusTab,
                            containerColor = MaterialTheme.colorScheme.surface,
                            contentColor = MaterialTheme.colorScheme.primary
                        ) {
                            statusTabs.forEachIndexed { index, (label, _) ->
                                Tab(
                                    selected = selectedStatusTab == index,
                                    onClick = { selectedStatusTab = index },
                                    text = { Text(label) }
                                )
                            }
                        }

                        // Enhanced Tickets List
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(20.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            items(state.filteredTickets) { ticket ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { viewModel.showTicketDetail(ticket.id) },
                                    shape = MaterialTheme.shapes.large,
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                    ),
                                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(20.dp),
                                        verticalArrangement = Arrangement.spacedBy(16.dp)
                                    ) {
                                        // Header with title and badges
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.Top
                                        ) {
                                            Column(
                                                modifier = Modifier.weight(1f),
                                                verticalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                Text(
                                                    text = ticket.title,
                                                    style = MaterialTheme.typography.titleLarge,
                                                    fontWeight = FontWeight.Bold,
                                                    maxLines = 2,
                                                    overflow = TextOverflow.Ellipsis
                                                )

                                                if (ticket.description != null) {
                                                    Text(
                                                        text = ticket.description!!,
                                                        style = MaterialTheme.typography.bodyMedium,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                        maxLines = 2,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                }
                                            }

                                            // Priority Indicator
                                            if (ticket.priority == TicketPriority.URGENT || ticket.priority == TicketPriority.HIGH) {
                                                Surface(
                                                    color = getPriorityColor(ticket.priority),
                                                    shape = CircleShape,
                                                    modifier = Modifier.size(48.dp)
                                                ) {
                                                    Box(contentAlignment = Alignment.Center) {
                                                        Icon(
                                                            Icons.Default.PriorityHigh,
                                                            contentDescription = null,
                                                            tint = Color.White,
                                                            modifier = Modifier.size(28.dp)
                                                        )
                                                    }
                                                }
                                            }
                                        }

                                        HorizontalDivider()

                                        // Status and Priority Row
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Surface(
                                                color = getStatusColor(ticket.status),
                                                shape = MaterialTheme.shapes.small
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    Icon(
                                                        when (ticket.status) {
                                                            TicketStatus.OPEN -> Icons.Default.FiberManualRecord
                                                            TicketStatus.IN_PROGRESS -> Icons.Default.Schedule
                                                            TicketStatus.RESOLVED -> Icons.Default.CheckCircle
                                                            TicketStatus.CLOSED -> Icons.Default.Cancel
                                                        },
                                                        contentDescription = null,
                                                        modifier = Modifier.size(16.dp),
                                                        tint = Color.White
                                                    )
                                                    Text(
                                                        text = ticket.status.name.replace("_", " "),
                                                        style = MaterialTheme.typography.labelLarge,
                                                        color = Color.White,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                }
                                            }

                                            Surface(
                                                color = getPriorityColor(ticket.priority).copy(alpha = 0.2f),
                                                shape = MaterialTheme.shapes.small
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    Text(
                                                        text = ticket.priority.name,
                                                        style = MaterialTheme.typography.labelLarge,
                                                        color = getPriorityColor(ticket.priority),
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                }
                                            }

                                            // Jira badge
                                            if (ticket.externalSystem == "jira" && ticket.externalId != null) {
                                                Surface(
                                                    color = Color(0xFF6366F1).copy(alpha = 0.2f),
                                                    shape = MaterialTheme.shapes.small
                                                ) {
                                                    Text(
                                                        text = "\uD83C\uDFAB ${ticket.externalId}",
                                                        style = MaterialTheme.typography.labelMedium,
                                                        color = Color(0xFF6366F1),
                                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                                        fontWeight = FontWeight.Medium
                                                    )
                                                }
                                            }
                                        }

                                        // Footer with metadata
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(
                                                horizontalArrangement = Arrangement.spacedBy(20.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    Surface(
                                                        color = Color(0xFF10B981).copy(alpha = 0.15f),
                                                        shape = CircleShape,
                                                        modifier = Modifier.size(32.dp)
                                                    ) {
                                                        Box(contentAlignment = Alignment.Center) {
                                                            Icon(
                                                                Icons.Default.Message,
                                                                contentDescription = null,
                                                                modifier = Modifier.size(16.dp),
                                                                tint = Color(0xFF10B981)
                                                            )
                                                        }
                                                    }
                                                    Text(
                                                        text = "${ticket.count?.comments ?: 0}",
                                                        style = MaterialTheme.typography.titleSmall,
                                                        fontWeight = FontWeight.Bold,
                                                        color = MaterialTheme.colorScheme.onSurface
                                                    )
                                                }

                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    Icon(
                                                        Icons.Default.AccessTime,
                                                        contentDescription = null,
                                                        modifier = Modifier.size(18.dp),
                                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                                    )
                                                    Text(
                                                        text = formatRelativeTime(ticket.createdAt),
                                                        style = MaterialTheme.typography.bodyMedium,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                        fontWeight = FontWeight.Medium
                                                    )
                                                }
                                            }

                                            Icon(
                                                Icons.Default.ChevronRight,
                                                contentDescription = null,
                                                modifier = Modifier.size(24.dp),
                                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Create Ticket Dialog
    CreatePortalTicketDialog(
        open = state.showCreateDialog,
        onDismiss = { viewModel.hideCreateDialog() },
        onCreateTicket = { request -> viewModel.createTicket(request) },
        isLoading = state.isCreatingTicket
    )

    // Ticket Detail Dialog
    if (state.showDetailDialog) {
        PortalTicketDetailDialog(
            ticket = state.selectedTicket,
            onDismiss = { viewModel.hideTicketDetail() },
            onAddComment = { content -> 
                val ticketId = state.selectedTicket?.id ?: ""
                viewModel.addComment(ticketId, content)
            },
            isLoading = state.isLoadingDetail
        )
    }
}

private fun getStatusColor(status: TicketStatus): Color {
    return when (status) {
        TicketStatus.OPEN -> Color(0xFF3B82F6)
        TicketStatus.IN_PROGRESS -> Color(0xFF8B5CF6)
        TicketStatus.RESOLVED -> Color(0xFF10B981)
        TicketStatus.CLOSED -> Color(0xFF6B7280)
    }
}

private fun getPriorityColor(priority: TicketPriority): Color {
    return when (priority) {
        TicketPriority.URGENT -> Color(0xFFDC2626)
        TicketPriority.HIGH -> Color(0xFFF97316)
        TicketPriority.MEDIUM -> Color(0xFFF59E0B)
        TicketPriority.LOW -> Color(0xFF10B981)
    }
}

private fun formatRelativeTime(dateString: String): String {
    return try {
        val instant = Instant.parse(dateString)
        val formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy")
            .withZone(ZoneId.systemDefault())
        formatter.format(instant)
    } catch (e: Exception) {
        "Unknown date"
    }
}
