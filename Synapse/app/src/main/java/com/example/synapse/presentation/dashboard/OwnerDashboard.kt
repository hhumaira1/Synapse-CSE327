package com.example.synapse.presentation.dashboard

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import coil.compose.AsyncImage
import com.example.synapse.ui.theme.*
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.coroutines.launch


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OwnerDashboard(
    isDarkMode: Boolean = false,
    navController: NavHostController,
    onBack: (() -> Unit)? = null,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedNavItem by remember { mutableStateOf("dashboard") }
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    // Reload dashboard data whenever this screen is displayed
    LaunchedEffect(Unit) {
        viewModel.loadDashboardStats()
    }

    // Handle back button press - close drawer if open, otherwise go back
    BackHandler(enabled = drawerState.isOpen) {
        scope.launch { drawerState.close() }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                modifier = Modifier.width(280.dp),
                drawerContainerColor = if (isDarkMode) Color(0xFF1C1B1F) else Color.White
            ) {
                NavigationDrawerContent(
                    selectedItem = selectedNavItem,
                    onItemSelected = { route ->
                        selectedNavItem = route
                        scope.launch { drawerState.close() }
                        if (route != "dashboard") {
                            navController.navigate(route)
                        }
                    },
                    userAvatar = uiState.currentUserAvatar,
                    isDarkMode = isDarkMode
                )
            }
        }
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Fixed header at top spanning full width
            OwnerDashboardTopBar(
                isDarkMode = isDarkMode,
                onBackClick = onBack,
                viewModel = viewModel,
                navController = navController,
                onMenuClick = { scope.launch { drawerState.open() } }
            )

            // Main scrollable content with FAB (full width now)
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(if (isDarkMode) Color.Black else Color.White)
            ) {
                SwipeRefresh(
                    state = rememberSwipeRefreshState(uiState.isLoading),
                    onRefresh = { viewModel.refresh() },
                    modifier = Modifier.fillMaxSize()
                ) {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        contentPadding = PaddingValues(
                            start = 16.dp,
                            end = 16.dp,
                            top = 16.dp,
                            bottom = 80.dp
                        )
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
                }
            }

            // Floating Action Button overlay
            FloatingActionButton(
                onClick = { navController.navigate("chatbot") },
                containerColor = Purple1,
                contentColor = Color.White,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Psychology,
                    contentDescription = "AI Assistant",
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OwnerDashboardTopBar(
    isDarkMode: Boolean,
    onBackClick: (() -> Unit)? = null,
    viewModel: DashboardViewModel,
    navController: NavHostController,
    onMenuClick: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var showUserMenu by remember { mutableStateOf(false) }
    val uiState by viewModel.uiState.collectAsState()

    TopAppBar(
        title = {
            Column {
                Text(
                    text = "Owner Dashboard",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleLarge
                )
                Text(
                    text = "Manage your CRM operations",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        navigationIcon = {
            IconButton(onClick = onMenuClick) {
                Icon(Icons.Default.Menu, contentDescription = "Open navigation menu")
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

            // User Profile Menu
            Box {
                IconButton(onClick = { showUserMenu = !showUserMenu }) {
                    if (uiState.currentUserAvatar != null) {
                        AsyncImage(
                            model = uiState.currentUserAvatar,
                            contentDescription = "Profile",
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                        )
                    } else {
                        Surface(
                            color = Color(0xFF6366F1),
                            shape = CircleShape,
                            modifier = Modifier.size(40.dp)
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier.fillMaxSize()
                            ) {
                                Text(
                                    text = "U",
                                    color = Color.White,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                DropdownMenu(
                    expanded = showUserMenu,
                    onDismissRequest = { showUserMenu = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Sign Out") },
                        onClick = {
                            showUserMenu = false
                            scope.launch {
                                viewModel.signOut()
                                navController.navigate("signin") {
                                    popUpTo(0) { inclusive = true }
                                }
                            }
                        },
                        leadingIcon = {
                            Icon(Icons.Default.ExitToApp, contentDescription = null)
                        }
                    )
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        )
    )
}


@Composable
fun OverviewSection(stats: com.example.synapse.data.model.DashboardStats?) {
    Column(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Quick Overview Section
        Text(
            text = "Quick Overview",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(vertical = 8.dp)
        )

        // Only 3 metrics: Total Contacts, My Tickets, Recent Contacts
        Column(
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Row 1: Total Contacts and My Ticket Issues
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Total Contacts Card
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .height(140.dp),
                    shape = MaterialTheme.shapes.large,
                    colors = CardDefaults.cardColors(
                        containerColor = if (MaterialTheme.colorScheme.background == Color.Black) 
                            Color(0xFF2D1B3D) else Color(0xFFF3E8FF)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Surface(
                                color = Color(0xFF8B5CF6).copy(alpha = 0.2f),
                                shape = CircleShape,
                                modifier = Modifier.size(48.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        Icons.Default.People,
                                        contentDescription = null,
                                        tint = Color(0xFF8B5CF6),
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            }
                            Column {
                                Text(
                                    text = stats?.totalContacts?.toString() ?: "0",
                                    style = MaterialTheme.typography.headlineLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF8B5CF6)
                                )
                                Text(
                                    text = "Total Contacts",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (MaterialTheme.colorScheme.background == Color.Black) 
                                        Color(0xFFA78BFA) else Color(0xFF6B21A8)
                                )
                            }
                        }
                    }
                }

                // My Ticket Issues Card
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .height(140.dp),
                    shape = MaterialTheme.shapes.large,
                    colors = CardDefaults.cardColors(
                        containerColor = if (MaterialTheme.colorScheme.background == Color.Black) 
                            Color(0xFF0A2F3A) else Color(0xFFCFFAFE)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Surface(
                                color = Color(0xFF06B6D4).copy(alpha = 0.2f),
                                shape = CircleShape,
                                modifier = Modifier.size(48.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        Icons.Default.ConfirmationNumber,
                                        contentDescription = null,
                                        tint = Color(0xFF06B6D4),
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            }
                            Column {
                                Text(
                                    text = stats?.let { (it.openTickets + it.inProgressTickets).toString() } ?: "0",
                                    style = MaterialTheme.typography.headlineLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF06B6D4)
                                )
                                Text(
                                    text = "My Ticket Issues",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (MaterialTheme.colorScheme.background == Color.Black) 
                                        Color(0xFF67E8F9) else Color(0xFF0E7490)
                                )
                            }
                        }
                    }
                }
            }

            // Row 2: Recent Contacts List
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.large,
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.PersonAdd,
                            contentDescription = null,
                            tint = Color(0xFF6366F1),
                            modifier = Modifier.size(24.dp)
                        )
                        Text(
                            text = "Recent Contacts",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    
                    if (stats?.recentContacts.isNullOrEmpty()) {
                        Text(
                            text = "No recent contacts",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    } else {
                        stats?.recentContacts?.take(2)?.forEach { contact ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Surface(
                                    color = Color(0xFF6366F1).copy(alpha = 0.2f),
                                    shape = CircleShape,
                                    modifier = Modifier.size(40.dp)
                                ) {
                                    Box(
                                        modifier = Modifier.fillMaxSize(),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = contact.take(1).uppercase(),
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF6366F1)
                                        )
                                    }
                                }
                                Text(
                                    text = contact,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }
                    }
                }
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
            modifier = modifier.height(140.dp),
            shape = MaterialTheme.shapes.large,
            colors = CardDefaults.cardColors(
                containerColor = gradient[0].copy(alpha = 0.1f)
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Icon in gradient circle
                    Surface(
                        color = gradient[0].copy(alpha = 0.2f),
                        shape = CircleShape,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Box(
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = icon,
                                contentDescription = null,
                                tint = gradient[0],
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }

                    // Value and Title
                    Column {
                        Text(
                            text = value,
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Bold,
                            color = gradient[0]
                        )
                        Text(
                            text = title,
                            style = MaterialTheme.typography.bodySmall,
                            color = gradient[1]
                        )
                    }
                }
            }
        }
    }


/**
 * Navigation Drawer Content (Material 3 - Gmail Style)
 * Slides from left with profile header and navigation items
 */
@Composable
fun NavigationDrawerContent(
    selectedItem: String,
    onItemSelected: (String) -> Unit,
    userAvatar: String?,
    isDarkMode: Boolean
) {
    // Define all navigation items
    val navItems = listOf(
        NavItem("Dashboard", Icons.Default.Dashboard, "dashboard"),
        NavItem("Contacts", Icons.Default.Contacts, "contacts"),
        NavItem("Leads", Icons.AutoMirrored.Filled.TrendingUp, "leads"),
        NavItem("Deals", Icons.Default.Business, "deals"),
        NavItem("Pipelines", Icons.Default.Leaderboard, "pipelines"),
        NavItem("Tickets", Icons.Default.ConfirmationNumber, "tickets"),
        NavItem("Call", Icons.Default.Call, "online_users"),
        NavItem("Analytics", Icons.Default.Assessment, "analytics")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(if (isDarkMode) Color(0xFF1C1B1F) else Color.White)
    ) {
        // Profile Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Purple1.copy(alpha = 0.8f),
                            Purple1.copy(alpha = 0.6f)
                        )
                    )
                )
                .padding(24.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (userAvatar != null) {
                    AsyncImage(
                        model = userAvatar,
                        contentDescription = "Profile",
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                    )
                } else {
                    Surface(
                        color = Color.White,
                        shape = CircleShape,
                        modifier = Modifier.size(56.dp)
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.fillMaxSize()
                        ) {
                            Text(
                                text = "U",
                                color = Purple1,
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
                Column {
                    Text(
                        text = "Owner",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "Synapse CRM",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Navigation Items
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
        ) {
            navItems.forEach { item ->
                NavigationDrawerItem(
                    icon = {
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.title,
                            modifier = Modifier.size(24.dp)
                        )
                    },
                    label = {
                        Text(
                            text = item.title,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = if (selectedItem == item.route) FontWeight.Bold else FontWeight.Normal
                        )
                    },
                    selected = selectedItem == item.route,
                    onClick = { onItemSelected(item.route) },
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                    colors = NavigationDrawerItemDefaults.colors(
                        selectedContainerColor = Purple1.copy(alpha = 0.12f),
                        selectedIconColor = Purple1,
                        selectedTextColor = Purple1,
                        unselectedIconColor = if (isDarkMode) Color.White.copy(alpha = 0.7f) else Color(0xFF49454F),
                        unselectedTextColor = if (isDarkMode) Color.White.copy(alpha = 0.7f) else Color(0xFF49454F)
                    )
                )
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 8.dp, horizontal = 16.dp),
                color = if (isDarkMode) Color.White.copy(alpha = 0.12f) else Color(0xFFE0E0E0)
            )

            // Settings at bottom
            NavigationDrawerItem(
                icon = {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Settings",
                        modifier = Modifier.size(24.dp)
                    )
                },
                label = {
                    Text(
                        text = "Settings",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = if (selectedItem == "settings") FontWeight.Bold else FontWeight.Normal
                    )
                },
                selected = selectedItem == "settings",
                onClick = { onItemSelected("settings") },
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                colors = NavigationDrawerItemDefaults.colors(
                    selectedContainerColor = Purple1.copy(alpha = 0.12f),
                    selectedIconColor = Purple1,
                    selectedTextColor = Purple1,
                    unselectedIconColor = if (isDarkMode) Color.White.copy(alpha = 0.7f) else Color(0xFF49454F),
                    unselectedTextColor = if (isDarkMode) Color.White.copy(alpha = 0.7f) else Color(0xFF49454F)
                )
            )
        }
    }
}


data class NavItem(
    val title: String,
    val icon: ImageVector,
    val route: String
)
