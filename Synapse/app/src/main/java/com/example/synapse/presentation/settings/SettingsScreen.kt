package com.example.synapse.presentation.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
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
                    1 -> WorkspaceTab()
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
