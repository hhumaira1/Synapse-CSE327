package com.example.synapse.presentation.dashboard

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.example.synapse.ui.theme.*
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.hilt.navigation.compose.hiltViewModel


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OwnerDashboard(
    isDarkMode: Boolean = false,
    navController: NavHostController,
    onBack: (() -> Unit)? = null,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showQuickActions by remember { mutableStateOf(false) }

    // Reload dashboard data whenever this screen is displayed
    LaunchedEffect(Unit) {
        viewModel.loadDashboardStats()
    }

    // Handle back button press
    BackHandler(enabled = true) {
        onBack?.invoke()
    }
    QuickActionsSpeedDials (
        expanded = showQuickActions,
        onExpandChange = { showQuickActions = it },
        onActionClick = { route ->
            navController.navigate(route)
            showQuickActions = false
        }
    )

    Scaffold(
        topBar = {
            OwnerDashboardTopBar(
                isDarkMode = isDarkMode,
                onBackClick = onBack
            )
        },
        floatingActionButton = {
            QuickActionsSpeedDials (
                expanded = showQuickActions,
                onExpandChange = { showQuickActions = it },
                onActionClick = { actionRoute ->
                    navController.navigate(actionRoute)
                    showQuickActions = false
                }
            )
        }
    ) { paddingValues ->
        SwipeRefresh(
            state = rememberSwipeRefreshState(uiState.isLoading),
            onRefresh = { viewModel.refresh() }
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(if (isDarkMode) Color(0xFF121212) else Color(0xFFF5F5F5)),
                verticalArrangement = Arrangement.spacedBy(20.dp),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp)
            ) {
                // Show error if any
                uiState.error?.let { error ->
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.errorContainer
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.Error,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.error
                                )
                                Text(
                                    text = error,
                                    color = MaterialTheme.colorScheme.error,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }

                // Overview Section with real data
                item {
                    OverviewSection(stats = uiState.stats)
                }

                // Bottom padding
                item { Spacer(modifier = Modifier.height(16.dp)) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OwnerDashboardTopBar(
    isDarkMode: Boolean,
    onBackClick: (() -> Unit)? = null
) {
    TopAppBar(
        title = {
            Column {
                Text(
                    text = "Owner Dashboard",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    color = Color.White
                )
            }
        },
        navigationIcon = {
            if (onBackClick != null) {
                IconButton(onClick = onBackClick) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = Color.White
                    )
                }
            }
        },
        actions = {
            IconButton(onClick = { /* Navigate to notifications */ }) {
                BadgedBox(
                    badge = {
                        Badge(
                            containerColor = Color.Red,
                            contentColor = Color.White
                        ) {
                            Text("3", fontSize = 10.sp)
                        }
                    }
                ) {
                    Icon(
                        Icons.Default.Notifications,
                        contentDescription = "Notifications",
                        tint = Color.White
                    )
                }
            }
            IconButton(onClick = { /* Profile */ }) {
                Icon(Icons.Default.AccountCircle, "Profile", tint = Color.White)
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Purple1
        )
    )
}

@Composable
fun OverviewSection(stats: com.example.synapse.data.model.DashboardStats?) {
    Column(
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Welcome Card with Gradient
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color.Transparent
            )
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(
                                Color(0xFF6366F1),
                                Color(0xFF8B5CF6),
                                Color(0xFFEC4899)
                            )
                        )
                    )
                    .padding(24.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "👋 Welcome to Your Dashboard",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Manage your business, track deals, and grow your customer relationships.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White.copy(alpha = 0.9f)
                        )
                        
                        // Status Badge
                        Surface(
                            color = if (stats != null) 
                                Color(0xFF10B981) 
                            else 
                                Color.White.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.padding(top = 8.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    if (stats != null) Icons.Default.CheckCircle else Icons.Default.Sync,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = if (stats != null) "Live Data" else "Loading...",
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                    Icon(
                        Icons.Default.TrendingUp,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.3f),
                        modifier = Modifier.size(80.dp)
                    )
                }
            }
        }

        // Quick Overview Section
        Text(
            text = "📊 Quick Overview",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(vertical = 8.dp)
        )

        // Metrics Grid - Modern Cards
        Column(
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Row 1: Key Business Metrics
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ModernMetricCard(
                    title = "Total Customers",
                    value = stats?.totalContacts?.toString() ?: "-",
                    icon = Icons.Default.People,
                    gradient = listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)),
                    modifier = Modifier.weight(1f)
                )
                ModernMetricCard(
                    title = "Active Deals",
                    value = stats?.totalDeals?.toString() ?: "-",
                    icon = Icons.Default.Handshake,
                    gradient = listOf(Color(0xFF8B5CF6), Color(0xFFEC4899)),
                    modifier = Modifier.weight(1f)
                )
            }

            // Row 2: Pipeline & Leads
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ModernMetricCard(
                    title = "Pipeline Value",
                    value = stats?.let { "$${String.format("%.0fK", it.totalPipelineValue / 1000)}" } ?: "-",
                    icon = Icons.Default.AttachMoney,
                    gradient = listOf(Color(0xFFEC4899), Color(0xFFF97316)),
                    modifier = Modifier.weight(1f)
                )
                ModernMetricCard(
                    title = "Active Leads",
                    value = stats?.totalLeads?.toString() ?: "-",
                    icon = Icons.AutoMirrored.Filled.TrendingUp,
                    gradient = listOf(Color(0xFFF97316), Color(0xFFF59E0B)),
                    modifier = Modifier.weight(1f)
                )
            }

            // Row 3: Ticket Metrics
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ModernMetricCard(
                    title = "Open Tickets",
                    value = stats?.openTickets?.toString() ?: "-",
                    icon = Icons.Default.ConfirmationNumber,
                    gradient = listOf(Color(0xFF10B981), Color(0xFF059669)),
                    modifier = Modifier.weight(1f)
                )
                ModernMetricCard(
                    title = "In Progress",
                    value = stats?.inProgressTickets?.toString() ?: "-",
                    icon = Icons.Default.PendingActions,
                    gradient = listOf(Color(0xFF3B82F6), Color(0xFF2563EB)),
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
fun ModernMetricCard(
    title: String,
    value: String,
    icon: ImageVector,
    gradient: List<Color>,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.height(120.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            gradient[0].copy(alpha = 0.1f),
                            gradient[1].copy(alpha = 0.05f)
                        )
                    )
                )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // Icon in gradient circle
                Surface(
                    color = gradient[0].copy(alpha = 0.2f),
                    shape = CircleShape,
                    modifier = Modifier.size(40.dp)
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = gradient[0],
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }

                // Value and Title
                Column(
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = value,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = gradient[0],
                        style = MaterialTheme.typography.headlineMedium
                    )
                    Text(
                        text = title,
                        fontSize = 13.sp,
                        color = Color.Gray,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickActionsSpeedDials(
    expanded: Boolean,
    onExpandChange: (Boolean) -> Unit,
    onActionClick: (String) -> Unit
) {
    // Define all navigation items
    val actions = listOf(
        NavigationItem("AI Assistant", Icons.Default.Psychology, "chatbot", Purple1),
        NavigationItem("Contacts", Icons.Default.Contacts, "contacts", Purple1),
        NavigationItem("Pipelines", Icons.Default.Leaderboard, "pipelines", Purple2),
        NavigationItem("Leads", Icons.AutoMirrored.Filled.TrendingUp, "leads", Purple5),
        NavigationItem("Deals", Icons.Default.Business, "deals", DarkBlue2),
        NavigationItem("Tickets", Icons.Default.ConfirmationNumber, "tickets", Purple3),
        NavigationItem("Analytics", Icons.Default.Assessment, "analytics", Purple6),
        NavigationItem("Settings", Icons.Default.Settings, "settings", Purple80)
    )

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.BottomEnd
    ) {
        // Main FAB
        FloatingActionButton(
            onClick = { onExpandChange(!expanded) },
            modifier = Modifier.padding(16.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Quick Actions")
        }

        // Expanded menu
        if (expanded) {
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(bottom = 80.dp, end = 16.dp)
            ) {
                actions.forEach { item ->
                    ExtendedFloatingActionButton(
                        onClick = {
                            onActionClick(item.route)
                            onExpandChange(false)
                        },
                        containerColor = item.color,
                    ) {
                        Icon(item.icon, contentDescription = item.title)
                        Spacer(Modifier.width(8.dp))
                        Text(item.title)
                    }
                }
            }
        }
    }
}


data class NavigationItem(
    val title: String,
    val icon: ImageVector,
    val route: String,
    val color: Color
)
