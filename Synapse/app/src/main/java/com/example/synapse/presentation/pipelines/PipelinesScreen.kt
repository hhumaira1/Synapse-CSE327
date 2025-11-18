package com.example.synapse.presentation.pipelines

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.example.synapse.presentation.pipelines.components.CreatePipelineDialog
import com.example.synapse.presentation.pipelines.components.AddStageDialog
import com.example.synapse.presentation.pipelines.components.PipelineCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PipelinesScreen(
    viewModel: PipelinesViewModel = hiltViewModel(),
    navController: NavHostController,
    isDarkMode: Boolean = false,
    onBack: (() -> Unit)? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    val showCreateDialog by viewModel.showCreatePipelineDialog.collectAsState()
    val showAddStageDialog by viewModel.showAddStageDialog.collectAsState()
    val selectedPipeline by viewModel.selectedPipeline.collectAsState()
    val isCreatingPipeline by viewModel.isCreatingPipeline.collectAsState()
    val isAddingStage by viewModel.isAddingStage.collectAsState()
    
    // Reload pipelines when screen is displayed
    LaunchedEffect(Unit) {
        viewModel.loadPipelines()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Pipelines") },
                navigationIcon = {
                    IconButton(onClick = { onBack?.invoke() ?: navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.showCreatePipelineDialog() },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Pipeline")
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (uiState) {
                is PipelinesUiState.Loading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                
                is PipelinesUiState.Empty -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Text(
                                "No pipelines yet",
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text("Create your first pipeline to get started")
                            Button(onClick = { viewModel.showCreatePipelineDialog() }) {
                                Text("Create Pipeline")
                            }
                        }
                    }
                }
                
                is PipelinesUiState.Success -> {
                    val successState = uiState as? PipelinesUiState.Success
                    if (successState != null) {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(successState.pipelines) { pipeline ->
                                PipelineCard(
                                    pipeline = pipeline,
                                    onAddStage = { viewModel.showAddStageDialog(pipeline) },
                                    onDelete = { viewModel.deletePipeline(pipeline.id) },
                                    onDeleteStage = { stageId -> viewModel.deleteStage(stageId) },
                                    onClick = { navController.navigate("pipelines/${pipeline.id}") }
                                )
                            }
                        }
                    }
                }
                
                is PipelinesUiState.Error -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Text(
                                text = (uiState as PipelinesUiState.Error).message,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodyLarge
                            )
                            Button(onClick = { viewModel.onRetry() }) {
                                Text("Retry")
                            }
                        }
                    }
                }
            }
        }
        
        // Dialogs
        if (showCreateDialog) {
            CreatePipelineDialog(
                isCreating = isCreatingPipeline,
                onDismiss = { viewModel.hideCreatePipelineDialog() },
                onConfirm = { name, description ->
                    viewModel.createPipeline(name, description)
                }
            )
        }
        
        if (showAddStageDialog && selectedPipeline != null) {
            AddStageDialog(
                pipeline = selectedPipeline!!,
                isAdding = isAddingStage,
                onDismiss = { viewModel.hideAddStageDialog() },
                onConfirm = { name, color ->
                    viewModel.addStage(selectedPipeline!!.id, name, color)
                }
            )
        }
    }
}
