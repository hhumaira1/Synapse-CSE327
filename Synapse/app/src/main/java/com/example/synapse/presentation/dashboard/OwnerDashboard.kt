package com.example.synapse.presentation.dashboard

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Purple1.copy(alpha = 0.1f),
                            Color.White
                        )
                    )
                )
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "📊 Business Overview",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Purple1
                )
                if (stats != null) {
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = "Connected",
                        tint = Color(0xFF4CAF50),
                        modifier = Modifier.size(24.dp)
                    )
                } else {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Purple1,
                        strokeWidth = 2.dp
                    )
                }
            }

            Divider(color = Purple1.copy(alpha = 0.2f), thickness = 1.dp)

            // Real Data Metrics Grid
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OverviewMetricCard(
                        title = "Total Deals",
                        value = stats?.totalDeals?.toString() ?: "-",
                        icon = Icons.Default.Business,
                        color = Purple1,
                        modifier = Modifier.weight(1f)
                    )
                    OverviewMetricCard(
                        title = "Pipeline Value",
                        value = stats?.let { "$${String.format("%.0f", it.totalPipelineValue)}" } ?: "-",
                        icon = Icons.Default.AttachMoney,
                        color = Purple2,
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OverviewMetricCard(
                        title = "Contacts",
                        value = stats?.totalContacts?.toString() ?: "-",
                        icon = Icons.Default.Contacts,
                        color = Purple5,
                        modifier = Modifier.weight(1f)
                    )
                    OverviewMetricCard(
                        title = "Active Leads",
                        value = stats?.totalLeads?.toString() ?: "-",
                        icon = Icons.AutoMirrored.Filled.TrendingUp,
                        color = DarkBlue2,
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OverviewMetricCard(
                        title = "Open Tickets",
                        value = stats?.openTickets?.toString() ?: "-",
                        icon = Icons.Default.ConfirmationNumber,
                        color = Purple3,
                        modifier = Modifier.weight(1f)
                    )
                    OverviewMetricCard(
                        title = "In Progress",
                        value = stats?.inProgressTickets?.toString() ?: "-",
                        icon = Icons.Default.PendingActions,
                        color = Purple6,
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OverviewMetricCard(
                        title = "Total Tickets",
                        value = stats?.totalTickets?.toString() ?: "-",
                        icon = Icons.Default.ConfirmationNumber,
                        color = DarkBlue1,
                        modifier = Modifier.weight(1f)
                    )
                    OverviewMetricCard(
                        title = "All Records",
                        value = stats?.let { "${it.totalContacts + it.totalLeads + it.totalDeals}" } ?: "-",
                        icon = Icons.Default.Assessment,
                        color = Purple1,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Status Notice
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (stats != null) 
                        Color(0xFF4CAF50).copy(alpha = 0.1f) 
                    else 
                        Purple1.copy(alpha = 0.1f)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        if (stats != null) Icons.Default.CheckCircle else Icons.Default.Info,
                        contentDescription = null,
                        tint = if (stats != null) Color(0xFF4CAF50) else Purple1,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = if (stats != null) 
                            "Connected to backend. All metrics are live." 
                        else 
                            "Loading dashboard data...",
                        fontSize = 11.sp,
                        color = if (stats != null) Color(0xFF4CAF50) else Purple1,
                        lineHeight = 14.sp
                    )
                }
            }
        }
    }
}

@Composable
fun OverviewMetricCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.height(100.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.1f)
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(28.dp)
                )

                Column {
                    Text(
                        text = value,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = color
                    )
                    Text(
                        text = title,
                        fontSize = 11.sp,
                        color = color.copy(alpha = 0.7f),
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
