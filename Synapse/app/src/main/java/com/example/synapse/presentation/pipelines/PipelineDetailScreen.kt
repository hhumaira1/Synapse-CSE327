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
import com.example.synapse.presentation.pipelines.components.StageDetailCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PipelineDetailScreen(
    pipelineId: String,
    viewModel: PipelinesViewModel = hiltViewModel(),
    navController: NavHostController,
    isDarkMode: Boolean = false,
    onBack: (() -> Unit)? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(pipelineId) {
        viewModel.loadPipelines() // Reload to get latest data
    }
    
    // Find the pipeline by ID
    val pipeline = (uiState as? PipelinesUiState.Success)?.pipelines?.find { it.id == pipelineId }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text(pipeline?.name ?: "Pipeline Details")
                        if (!pipeline?.description.isNullOrBlank()) {
                            Text(
                                pipeline?.description ?: "",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
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
            if (pipeline != null) {
                FloatingActionButton(
                    onClick = { viewModel.showAddStageDialog(pipeline) },
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Stage")
                }
            }
        }
    ) { paddingValues ->
        if (pipeline == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                when (uiState) {
                    is PipelinesUiState.Loading -> {
                        CircularProgressIndicator()
                    }
                    is PipelinesUiState.Error -> {
                        val errorState = uiState as? PipelinesUiState.Error
                        if (errorState != null) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Text(
                                    text = errorState.message,
                                    color = MaterialTheme.colorScheme.error
                                )
                                Button(onClick = { viewModel.loadPipelines() }) {
                                    Text("Retry")
                                }
                            }
                        }
                    }
                    else -> {
                        Text("Pipeline not found")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (pipeline.stages.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Text(
                                    "No stages yet",
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    "Create your first stage to start managing deals",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Button(onClick = { viewModel.showAddStageDialog(pipeline) }) {
                                    Text("Create Stage")
                                }
                            }
                        }
                    }
                } else {
                    items(pipeline.stages.sortedBy { it.order }) { stage ->
                        StageDetailCard(
                            stage = stage,
                            dealsCount = 0, // TODO: Fetch deals count for this stage
                            onDeleteStage = { viewModel.deleteStage(stage.id) }
                        )
                    }
                }
            }
        }
    }
}
