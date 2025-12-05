package com.example.synapse.presentation.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.example.synapse.data.model.WorkspaceType
import com.example.synapse.presentation.auth.viewmodel.WorkspaceSelectorViewModel
import com.example.synapse.presentation.auth.viewmodel.WorkspaceSelectorState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkspaceSelectorScreen(
    navController: NavHostController,
    onWorkspaceSelected: ((String) -> Unit)? = null,
    viewModel: WorkspaceSelectorViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    // Auto-navigate if only one option
    LaunchedEffect(state.workspaces) {
        if (!state.isLoading && state.workspaces.size == 1) {
            val target = state.workspaces.first().navigationTarget
            onWorkspaceSelected?.invoke(target) ?: navController.navigate(target) {
                popUpTo("signin") { inclusive = true }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Select Workspace") },
                actions = {
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                state.isLoading -> {
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
                                text = "Loading workspace options...",
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
                            Button(onClick = { viewModel.refresh() }) {
                                Text("Retry")
                            }
                        }
                    }
                }

                else -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Spacer(modifier = Modifier.height(32.dp))

                        // Header
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                            modifier = Modifier.padding(bottom = 32.dp)
                        ) {
                            Text(
                                text = "Welcome Back! 👋",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                            Text(
                                text = "Choose which workspace you'd like to access",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }

                        // Workspace Options
                        Column(
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            state.workspaces.forEach { workspace ->
                                WorkspaceCard(
                                    workspace = workspace,
                                    onClick = {
                                        // Connect VoIP socket if selecting CRM workspace
                                        if (workspace.type == WorkspaceType.INTERNAL_CRM) {
                                            viewModel.connectVoipSocket()
                                        }
                                        
                                        onWorkspaceSelected?.invoke(workspace.navigationTarget)
                                            ?: navController.navigate(workspace.navigationTarget) {
                                                popUpTo("signin") { inclusive = true }
                                            }
                                    }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(32.dp))

                        // Back to Home button
                        OutlinedButton(
                            onClick = { navController.navigate("landing") {
                                popUpTo("signin") { inclusive = true }
                            }},
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Back to Home")
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorkspaceCard(
    workspace: com.example.synapse.data.model.WorkspaceOption,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Icon
            Surface(
                color = getWorkspaceIconColor(workspace.type).copy(alpha = 0.1f),
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier.size(64.dp)
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Icon(
                        imageVector = getWorkspaceIcon(workspace.type),
                        contentDescription = null,
                        tint = getWorkspaceIconColor(workspace.type),
                        modifier = Modifier.size(32.dp)
                    )
                }
            }

            // Content
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = workspace.name,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )

                Text(
                    text = workspace.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }

            // Action Button
            Button(
                onClick = onClick,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF6366F1),
                    contentColor = Color.White
                )
            ) {
                Row(
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = getButtonText(workspace.type),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        Icons.Default.ArrowForward,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

private fun getWorkspaceIcon(type: WorkspaceType) = when (type) {
    WorkspaceType.INTERNAL_CRM -> Icons.Default.Business
    WorkspaceType.CUSTOMER_PORTAL -> Icons.Default.People
    WorkspaceType.CREATE_WORKSPACE -> Icons.Default.Add
}

private fun getWorkspaceIconColor(type: WorkspaceType) = when (type) {
    WorkspaceType.INTERNAL_CRM -> Color(0xFF6366F1)
    WorkspaceType.CUSTOMER_PORTAL -> Color(0xFF10B981)
    WorkspaceType.CREATE_WORKSPACE -> Color(0xFFF59E0B)
}

private fun getButtonText(type: WorkspaceType) = when (type) {
    WorkspaceType.INTERNAL_CRM -> "Go to Dashboard"
    WorkspaceType.CUSTOMER_PORTAL -> "Go to Portal"
    WorkspaceType.CREATE_WORKSPACE -> "Create Workspace"
}
