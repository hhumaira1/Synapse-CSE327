package com.example.synapse.presentation.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import coil.compose.AsyncImage
import com.example.synapse.presentation.settings.components.*
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    navController: NavHostController,
    onBack: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    // Show messages
    LaunchedEffect(uiState.errorMessage, uiState.successMessage) {
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(
                message = it,
                duration = SnackbarDuration.Long
            )
            viewModel.clearMessages()
        }
        uiState.successMessage?.let {
            snackbarHostState.showSnackbar(
                message = it,
                duration = SnackbarDuration.Short
            )
            viewModel.clearMessages()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            if (viewModel.canInviteMembers() && uiState.selectedTab == 0) {
                FloatingActionButton(
                    onClick = { viewModel.showInviteDialog() }
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Invite Member")
                }
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // User Profile Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .clickable { navController.navigate("profile") },
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Avatar
                    if (uiState.currentUserAvatar != null) {
                        AsyncImage(
                            model = uiState.currentUserAvatar,
                            contentDescription = "Profile picture",
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.Person,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    // User info
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = uiState.currentUserName ?: "User",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            text = uiState.currentUserEmail ?: "",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        val role = uiState.currentUserRole
                        if (role != null) {
                            Text(
                                text = role.name,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }

            // Tabs
            TabRow(selectedTabIndex = uiState.selectedTab) {
                Tab(
                    selected = uiState.selectedTab == 0,
                    onClick = { viewModel.selectTab(0) },
                    text = { Text("Team") }
                )
                Tab(
                    selected = uiState.selectedTab == 1,
                    onClick = { viewModel.selectTab(1) },
                    text = { Text("Workspace") }
                )
            }

            // Content
            SwipeRefresh(
                state = rememberSwipeRefreshState(isRefreshing = uiState.isLoading),
                onRefresh = { viewModel.refreshData() }
            ) {
                when (uiState.selectedTab) {
                    0 -> TeamTab(
                        uiState = uiState,
                        onRoleChange = { member -> viewModel.showRoleChangeDialog(member) },
                        onRemove = { member -> viewModel.showRemoveConfirmDialog(member) },
                        onCancelInvitation = { invitationId -> viewModel.cancelInvitation(invitationId) },
                        canManageTeam = viewModel.canManageTeam(),
                        canRemoveMember = { member -> viewModel.canRemoveMember(member) },
                        onInviteClick = { viewModel.showInviteDialog() }
                    )
                    1 -> WorkspaceTab(
                        navController = navController,
                        workspaceName = uiState.currentTenant?.name,
                        workspaceType = uiState.currentTenant?.type,
                        createdAt = uiState.currentTenant?.createdAt,
                        memberCount = uiState.teamMembers.size
                    )
                }
            }
        }

        // Dialogs
        if (uiState.showInviteDialog) {
            InviteUserDialog(
                onDismiss = { viewModel.hideInviteDialog() },
                onConfirm = { email, role ->
                    viewModel.sendInvitation(email, role)
                },
                isLoading = uiState.isLoading
            )
        }

        if (uiState.showRoleChangeDialog && uiState.selectedMember != null) {
            ChangeRoleDialog(
                member = uiState.selectedMember!!,
                onDismiss = { viewModel.hideRoleChangeDialog() },
                onConfirm = { newRole ->
                    viewModel.changeUserRole(uiState.selectedMember!!.id, newRole)
                },
                isLoading = uiState.isLoading
            )
        }

        if (uiState.showRemoveConfirmDialog && uiState.selectedMember != null) {
            RemoveUserDialog(
                member = uiState.selectedMember!!,
                onDismiss = { viewModel.hideRemoveConfirmDialog() },
                onConfirm = {
                    viewModel.removeTeamMember(uiState.selectedMember!!.id)
                },
                isLoading = uiState.isLoading
            )
        }
    }
}
