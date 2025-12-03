package com.example.synapse.presentation.voip

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.example.synapse.data.api.voip.OnlineUser
import com.example.synapse.ui.theme.*
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState

/**
 * OnlineUsersScreen
 * 
 * Shows a list of users that can be called via VoIP.
 * - For CRM users: displays online portal customers
 * - For Portal customers: displays available support agents
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnlineUsersScreen(
    navController: NavHostController,
    isPortalUser: Boolean = false,
    viewModel: OnlineUsersViewModel = hiltViewModel(),
    callViewModel: CallViewModel = hiltViewModel()
) {
    val users by viewModel.onlineUsers.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    
    // Load data when screen appears
    LaunchedEffect(Unit) {
        viewModel.loadOnlineUsers(isPortalUser)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isPortalUser) "Available Support" else "Online Customers",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = Color.White
                        )
                        Text(
                            text = if (isPortalUser) "Contact support agents" else "Call portal customers",
                            fontSize = 14.sp,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.refresh(isPortalUser) }) {
                        Icon(
                            Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Purple1
                )
            )
        }
    ) { paddingValues ->
        SwipeRefresh(
            state = rememberSwipeRefreshState(isLoading),
            onRefresh = { viewModel.refresh(isPortalUser) }
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(Color(0xFFF5F5F5)),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Error message
                error?.let { errorMsg ->
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
                                    text = errorMsg,
                                    color = MaterialTheme.colorScheme.error,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
                
                // Stats header
                item {
                    StatsHeader(users = users)
                }
                
                // Empty state
                if (!isLoading && users.isEmpty()) {
                    item {
                        EmptyState(isPortalUser = isPortalUser)
                    }
                }
                
                items(users) { user ->
                    UserListItem(
                        user = user,
                        onCallClick = {
                            // Use supabaseUserId for CRM agents, id for portal customers
                            val calleeId = user.supabaseUserId ?: user.id
                            callViewModel.startCall(calleeId, user.name ?: user.email)
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun StatsHeader(users: List<OnlineUser>) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Online count
        StatCard(
            title = "Online",
            count = users.count { it.status == "ONLINE" },
            color = Color(0xFF10B981),
            icon = Icons.Default.Circle,
            modifier = Modifier.weight(1f)
        )
        
        // Total count
        StatCard(
            title = "Total",
            count = users.size,
            color = Color(0xFF6366F1),
            icon = Icons.Default.People,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun StatCard(
    title: String,
    count: Int,
    color: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = count.toString(),
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = color
                )
                Text(
                    text = title,
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
            Surface(
                color = color.copy(alpha = 0.2f),
                shape = CircleShape,
                modifier = Modifier.size(40.dp)
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = color,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun EmptyState(isPortalUser: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 64.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Icon(
            Icons.Default.PeopleOutline,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = Color.Gray.copy(alpha = 0.3f)
        )
        Text(
            text = if (isPortalUser) "No agents available" else "No customers online",
            fontSize = 18.sp,
            fontWeight = FontWeight.Medium,
            color = Color.Gray
        )
        Text(
            text = if (isPortalUser) 
                "Support agents will appear here when online" 
            else 
                "Portal customers will appear here when they log in",
            fontSize = 14.sp,
            color = Color.Gray.copy(alpha = 0.7f)
        )
    }
}

@Composable
private fun UserListItem(
    user: OnlineUser,
    onCallClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // User info
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                // Avatar with status indicator
                Box(
                    contentAlignment = Alignment.BottomEnd
                ) {
                    Surface(
                        color = Color.Transparent,
                        shape = CircleShape,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.linearGradient(
                                        colors = listOf(
                                            Color(0xFF6366F1),
                                            Color(0xFF8B5CF6),
                                            Color(0xFFEC4899)
                                        )
                                    )
                                )
                        ) {
                            Text(
                                text = user.name?.firstOrNull()?.uppercase() ?: user.email.firstOrNull()?.uppercase() ?: "U",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    
                    // Online status indicator
                    if (user.status == "ONLINE") {
                        Surface(
                            color = Color(0xFF10B981),
                            shape = CircleShape,
                            modifier = Modifier.size(14.dp),
                            border = androidx.compose.foundation.BorderStroke(2.dp, Color.White)
                        ) {}
                    }
                }
                
                // Name and role
                Column {
                    Text(
                        text = user.name ?: user.email,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    if (user.name != null) {
                        Text(
                            text = user.email,
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                    if (user.role != null) {
                        Surface(
                            color = Color(0xFF6366F1).copy(alpha = 0.1f),
                            shape = MaterialTheme.shapes.small,
                            modifier = Modifier.padding(top = 4.dp)
                        ) {
                            Text(
                                text = user.role ?: "",
                                fontSize = 10.sp,
                                color = Color(0xFF6366F1),
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
            
            // Call button
            FloatingActionButton(
                onClick = onCallClick,
                containerColor = Color(0xFF10B981),
                modifier = Modifier.size(48.dp)
            ) {
                Icon(
                    Icons.Default.Phone,
                    contentDescription = "Call",
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}
