package com.example.synapse.ui.theme.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.synapse.ui.theme.*
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OwnerDashboard(
    isDarkMode: Boolean = false,
    onNavigate: (String) -> Unit = {}
) {
    var isRefreshing by remember { mutableStateOf(false) }
    var selectedTab by remember { mutableIntStateOf(0) }
    var showQuickActions by remember { mutableStateOf(false) }


    // Mock data refresh
    LaunchedEffect(isRefreshing) {
        if (isRefreshing) {
            delay(1500)
            isRefreshing = false
        }
    }

    Scaffold(
        topBar = {
            OwnerDashboardTopBar(
                isDarkMode = isDarkMode
            )
        },
        floatingActionButton = {
            QuickActionsSpeedDial(
                expanded = showQuickActions,
                onExpandChange = { showQuickActions = it },
                onActionClick = { action -> onNavigate(action) }
            )
        }
    ) { paddingValues ->
        SwipeRefresh(
            state = rememberSwipeRefreshState(isRefreshing),
            onRefresh = { isRefreshing = true }
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(if (isDarkMode) Color(0xFF121212) else Color(0xFFF5F5F5)),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
            ) {
                // Critical Alerts Banner
                //item { CriticalAlertsBanner() }

                // Tab Selector
                item {
                    DashboardTabSelector(
                        selectedTab = selectedTab,
                        onTabSelected = { selectedTab = it }
                    )
                }

                when (selectedTab) {
                    0 -> { // Overview
                        item { MetricsCardsGrid() }
                        item { TodaysPriorities() }
                        item { RevenueSnapshot() }
                        item { TeamStatusQuickView() }
                    }

                    1 -> { // Sales
                        item { PipelineHealthDetailed() }
                        item { TopPerformingDeals() }
                    }

                    2 -> { // Team
                        item { TeamPerformanceGrid() }
                        item { ActivityHeatmap() }
                        item { TeamAlerts() }
                    }

                    3 -> { // Analytics
                        item { AIInsightsCard() }
                        item { CompetitiveIntelligence() }
                        item { TrendAnalysis() }
                    }
                }

                // Recent Activities
                item { RecentActivitiesFeed() }

                // Bottom padding for FAB
                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OwnerDashboardTopBar(
    isDarkMode: Boolean
) {
    TopAppBar(
        title = {
            Column {
                Text(
                    text = "Owner Dashboard",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
            }
        },
        actions = {
            IconButton(onClick = { }) {
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
                        contentDescription = "Urgent Notifications",
                        tint = Color.White
                    )
                }
            }
            IconButton(onClick = { /* Search */ }) {
                Icon(Icons.Default.Search, "Search", tint = Color.White)
            }
            IconButton(onClick = { /* Profile */ }) {
                Icon(Icons.Default.AccountCircle, "Profile", tint = Color.White)
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color(0xFF6366F1)
        )
    )
}


@Composable
fun DashboardTabSelector(
    selectedTab: Int,
    onTabSelected: (Int) -> Unit
) {
    val tabs = listOf(
        "Overview" to Icons.Default.Home,
        "Sales" to Icons.AutoMirrored.Filled.ShowChart,
        "Team" to Icons.Default.Group,
        "Analytics" to Icons.Default.Assessment
    )

    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(tabs.size) { index ->
            val (label, icon) = tabs[index]
            FilterChip(
                selected = selectedTab == index,
                onClick = { onTabSelected(index) },
                label = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            icon,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(label, fontSize = 13.sp)
                    }
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = Purple1,
                    selectedLabelColor = Color.White
                )
            )
        }
    }
}

@Composable
fun MetricsCardsGrid() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                AnimatedMetricCard(
                    title = "Today's Revenue",
                    value = "$$$$",
                    change = "+23.5%",
                    icon = Icons.Default.AttachMoney,
                    trend = "up",
                    target = "$10,000",
                    backgroundColor = Color(0xFF9A0680)
                )
            }
            item {
                AnimatedMetricCard(
                    title = "Conversion Rate",
                    value = "32%",
                    change = "-5.2%",
                    icon = Icons.AutoMirrored.Filled.TrendingDown,
                    trend = "down",
                    target = "40%",
                    backgroundColor = Color(0xFF7D5260)
                )
            }
        }

        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                AnimatedMetricCard(
                    title = "Active Deals",
                    value = "23",
                    change = "+3",
                    icon = Icons.Default.Business,
                    trend = "up",
                    target = "30",
                    backgroundColor = Purple1
                )
            }
            item {
                AnimatedMetricCard(
                    title = "Open Tickets",
                    value = "12",
                    change = "-2",
                    icon = Icons.AutoMirrored.Filled.HelpOutline,
                    trend = "up",
                    target = "0",
                    backgroundColor = Color(0xFF2196F3)
                )
            }
        }
    }
}

@Composable
fun AnimatedMetricCard(
    title: String,
    value: String,
    change: String,
    icon: ImageVector,
    trend: String,
    target: String,
    backgroundColor: Color
) {
    Card(
        modifier = Modifier
            .width(160.dp)
            .height(140.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(backgroundColor)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(28.dp)
                    )
                    AssistChip(
                        onClick = { },
                        label = {
                            Text(
                                change,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = Color.White.copy(alpha = 0.3f),
                            labelColor = Color.White
                        ),
                        modifier = Modifier.height(24.dp)
                    )
                }

                Column {
                    Text(
                        text = value,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = title,
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.8f)
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Target: $target",
                            fontSize = 10.sp,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                        Icon(
                            imageVector = if (trend == "up") Icons.Default.ArrowUpward else Icons.Default.ArrowDownward,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TodaysPriorities() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🎯 Today's Must-Do",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = { /* View All */ }) {
                    Text("See All")
                }
            }

            PriorityTaskItem(
                title = "Close ABC Corp Deal",
                subtitle = "Meeting at 10:00 AM",
                value = "$45,000",
                priority = "URGENT",
                icon = Icons.Default.AttachMoney,
                dueTime = "2 hours"
            )

        }
    }
}

@Composable
fun PriorityTaskItem(
    title: String,
    subtitle: String,
    value: String,
    priority: String,
    icon: ImageVector,
    dueTime: String
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = when (priority) {
                "URGENT" -> Color(0xFFFFEBEE)
                "HIGH" -> Color(0xFFFFF3E0)
                else -> Color(0xFFF5F5F5)
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(
                            when (priority) {
                                "URGENT" -> Color(0xFFD32F2F)
                                "HIGH" -> Color(0xFFFF9800)
                                else -> Color.Gray
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Text(
                        text = subtitle,
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                    if (value.isNotEmpty()) {
                        Text(
                            text = value,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF4CAF50)
                        )
                    }
                }
            }

            Column(
                horizontalAlignment = Alignment.End
            ) {
                AssistChip(
                    onClick = { },
                    label = { Text(priority, fontSize = 10.sp) },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = when (priority) {
                            "URGENT" -> Color(0xFFD32F2F)
                            "HIGH" -> Color(0xFFFF9800)
                            else -> Color.Gray
                        },
                        labelColor = Color.White
                    ),
                    modifier = Modifier.height(24.dp)
                )
                Text(
                    text = dueTime,
                    fontSize = 10.sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}

@Composable
fun RevenueSnapshot() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "💰 Revenue Overview",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                RevenueMetric(
                    label = "Today",
                    value = "$8,450",
                    change = "+23%",
                    isPositive = true
                )
                HorizontalDivider(
                    modifier = Modifier
                        .height(60.dp)
                        .width(1.dp)
                )
                RevenueMetric(
                    label = "This Month",
                    value = "$156K",
                    change = "+12%",
                    isPositive = true
                )
                HorizontalDivider(
                    modifier = Modifier
                        .height(60.dp)
                        .width(1.dp)
                )
                RevenueMetric(
                    label = "Target",
                    value = "$200K",
                    change = "78%",
                    isPositive = true
                )
            }

            LinearProgressIndicator(
                progress = { 0.78f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(MaterialTheme.shapes.small),
                color = Purple1,
                trackColor = Color.LightGray
            )
        }
    }
}

@Composable
fun RevenueMetric(
    label: String,
    value: String,
    change: String,
    isPositive: Boolean
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            color = Color.Gray
        )
        Text(
            text = value,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = change,
            fontSize = 12.sp,
            color = if (isPositive) Color(0xFF4CAF50) else Color(0xFFD32F2F),
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun TeamStatusQuickView() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "👥 Team Status",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(5) { index ->
                    TeamMemberQuickCard(
                        name = "Member ${index + 1}",
                        status = if (index % 3 == 0) "busy" else "available",
                        activeDeals = (3..8).random(),
                        todayCalls = (5..15).random()
                    )
                }
            }
        }
    }
}

@Composable
fun TeamMemberQuickCard(
    name: String,
    status: String,
    activeDeals: Int,
    todayCalls: Int
) {
    Card(
        modifier = Modifier
            .width(110.dp)
            .height(120.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(10.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = null,
                    tint = Purple1,
                    modifier = Modifier.size(24.dp)
                )
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(
                            if (status == "available") Color(0xFF4CAF50)
                            else Color(0xFFFF9800)
                        )
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
                Text(
                    text = "$activeDeals deals",
                    fontSize = 10.sp,
                    color = Color.Gray
                )
                Text(
                    text = "$todayCalls calls",
                    fontSize = 10.sp,
                    color = Color.Gray
                )
            }
        }
    }
}

@Composable
fun RecentActivitiesFeed() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "⚡ Live Activity Feed",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )

            ActivityFeedItem(
                icon = Icons.AutoMirrored.Filled.TrendingUp,
                title = "Deal Closed: ABC Corp",
                subtitle = "John Doe • $45,000",
                time = "2 min ago",
                iconColor = Color(0xFF4CAF50)
            )
        }
    }
}

@Composable
fun ActivityFeedItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    time: String,
    iconColor: Color
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(iconColor.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(20.dp)
            )
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontWeight = FontWeight.Medium,
                fontSize = 13.sp
            )
            Text(
                text = subtitle,
                fontSize = 11.sp,
                color = Color.Gray
            )
        }

        Text(
            text = time,
            fontSize = 10.sp,
            color = Color.Gray
        )
    }
}

@Composable
fun QuickActionsSpeedDial(
    expanded: Boolean,
    onExpandChange: (Boolean) -> Unit,
    onActionClick: (String) -> Unit
) {
    val actions = listOf(
        Triple("Add Contact", Icons.Default.PersonAdd, "contacts/create"),
        Triple("Log Call", Icons.Default.Phone, "calls/log"),
        Triple("Create Deal", Icons.Default.Business, "deals/create"),
        Triple("New Ticket", Icons.Default.ConfirmationNumber, "tickets/create")
    )

    Column(
        horizontalAlignment = Alignment.End,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        AnimatedVisibility(
            visible = expanded,
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                actions.forEach { (label, icon, route) ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Card(
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Text(
                                text = label,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                fontSize = 12.sp
                            )
                        }

                        SmallFloatingActionButton(
                            onClick = {
                                onActionClick(route)
                                onExpandChange(false)
                            },
                            containerColor = Purple3
                        ) {
                            Icon(icon, label, tint = Color.White)
                        }
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = { onExpandChange(!expanded) },
            containerColor = Purple1
        ) {
            Icon(
                imageVector = if (expanded) Icons.Default.Close else Icons.Default.Add,
                contentDescription = "Quick Actions",
                tint = Color.White
            )
        }
    }
}

@Composable
fun PipelineHealthDetailed() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "🎯 Pipeline Health",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )

            PipelineStageBar("Qualified", 8, "$120K", 0.4f)
            PipelineStageBar("Proposal", 5, "$85K", 0.25f)
            PipelineStageBar("Negotiation", 3, "$65K", 0.15f)
            PipelineStageBar("Closing", 7, "$180K", 0.7f)
        }
    }
}

@Composable
fun PipelineStageBar(
    stage: String,
    count: Int,
    value: String,
    progress: Float
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = stage, fontWeight = FontWeight.Medium, fontSize = 13.sp)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(text = "$count deals", fontSize = 12.sp, color = Color.Gray)
                Text(text = value, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Purple1)
            }
        }
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(MaterialTheme.shapes.small),
            color = Purple1
        )
    }
}


@Composable
fun ForecastMetric(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, fontSize = 11.sp, color = Color.Gray)
        Text(
            text = value,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}

@Composable
fun TopPerformingDeals() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "🏆 Top Deals This Week",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            DealListItem("Global Industries", "$45,000", "Proposal", "65%")
        }
    }
}

@Composable
fun DealListItem(company: String, value: String, stage: String, probability: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = company, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text(text = stage, fontSize = 11.sp, color = Color.Gray)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(text = value, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text(text = probability, fontSize = 11.sp, color = Color(0xFF4CAF50))
        }
    }
}

@Composable
fun TeamPerformanceGrid() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "⭐ Team Performance",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )


        }
    }
}

@Composable
fun TeamMemberPerformance(
    name: String,
    deals: Int,
    revenue: String,
    satisfaction: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Purple1),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = name.split(" ").map { it.first() }.joinToString(""),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }
            Column {
                Text(text = name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(text = "$deals deals closed", fontSize = 11.sp, color = Color.Gray)
            }
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(text = revenue, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text(text = "⭐ $satisfaction", fontSize = 11.sp, color = Color(0xFF4CAF50))
        }
    }
}

@Composable
fun ActivityHeatmap() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "🔥 Activity Heatmap",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "📊 Heatmap visualization coming soon",
                    color = Color.Gray,
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
fun TeamAlerts() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "⚠️ Team Alerts",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )

        }
    }
}

@Composable
fun AIInsightsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFFF3E5F5)
        )
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
                    Icons.Default.Lightbulb,
                    contentDescription = null,
                    tint = Purple1,
                    modifier = Modifier.size(24.dp)
                )
                Text(
                    text = "🤖 AI Insights",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }

        }
    }
}

@Composable
fun InsightItem(text: String, color: Color) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(color)
        )
        Text(text = text, fontSize = 12.sp)
    }
}

@Composable
fun CompetitiveIntelligence() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "🎯 Market Intelligence",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Coming in Phase 2: Competitive analysis & market trends",
                fontSize = 12.sp,
                color = Color.Gray
            )
        }
    }
}

@Composable
fun TrendAnalysis() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "📊 Trend Analysis",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Coming in Phase 2: Historical performance & predictions",
                fontSize = 12.sp,
                color = Color.Gray
            )
        }
    }
}