package com.example.synapse.presentation.deals

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.example.synapse.presentation.deals.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DealsScreen(
    viewModel: DealsViewModel = hiltViewModel(),
    navController: NavHostController,
    onBack: (() -> Unit)? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    val pipelines by viewModel.pipelines.collectAsState()
    val selectedPipelineId by viewModel.selectedPipelineId.collectAsState()
    val pipelineStats by viewModel.pipelineStats.collectAsState()
    val showCreateDialog by viewModel.showCreateDialog.collectAsState()
    val showEditDialog by viewModel.showEditDialog.collectAsState()
    val showMoveDialog by viewModel.showMoveDialog.collectAsState()
    val selectedDeal by viewModel.selectedDeal.collectAsState()
    val availableContacts by viewModel.availableContacts.collectAsState()
    val isProcessing by viewModel.isProcessing.collectAsState()
    
    val selectedPipeline = pipelines.find { it.id == selectedPipelineId }
    val stages = selectedPipeline?.stages?.sortedBy { it.order } ?: emptyList()
    
    // State for deal options dialog
    var showDealOptionsDialog by remember { mutableStateOf(false) }
    var clickedDeal by remember { mutableStateOf<com.example.synapse.data.model.Deal?>(null) }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Deals") },
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
            if (pipelines.isNotEmpty()) {
                FloatingActionButton(
                    onClick = { viewModel.showCreateDialog() },
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Create Deal")
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                pipelines.isEmpty() -> {
                    // No pipelines available
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
                                Icons.Default.AttachMoney,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                "No Pipelines Available",
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                "Create a pipeline first to start managing deals",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Button(onClick = { navController.navigate("pipelines") }) {
                                Text("Go to Pipelines")
                            }
                        }
                    }
                }
                else -> {
                    Column(
                        modifier = Modifier.fillMaxSize()
                    ) {
                        // Pipeline Selector & Stats Section
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp)
                            ) {
                                // Pipeline Selector
                                Text(
                                    "Pipeline:",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                
                                Spacer(modifier = Modifier.height(8.dp))
                                
                                var pipelineExpanded by remember { mutableStateOf(false) }
                                ExposedDropdownMenuBox(
                                    expanded = pipelineExpanded,
                                    onExpandedChange = { pipelineExpanded = !pipelineExpanded }
                                ) {
                                    OutlinedTextField(
                                        value = selectedPipeline?.name ?: "",
                                        onValueChange = {},
                                        readOnly = true,
                                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = pipelineExpanded) },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .menuAnchor()
                                    )
                                    
                                    ExposedDropdownMenu(
                                        expanded = pipelineExpanded,
                                        onDismissRequest = { pipelineExpanded = false }
                                    ) {
                                        pipelines.forEach { pipeline ->
                                            DropdownMenuItem(
                                                text = { Text(pipeline.name) },
                                                onClick = {
                                                    viewModel.selectPipeline(pipeline.id)
                                                    pipelineExpanded = false
                                                }
                                            )
                                        }
                                    }
                                }
                                
                                // Stats Cards
                                pipelineStats?.let { stats ->
                                    Spacer(modifier = Modifier.height(16.dp))
                                    
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        // Total Deals
                                        Card(
                                            modifier = Modifier.weight(1f),
                                            colors = CardDefaults.cardColors(
                                                containerColor = Color(0xFFEFF6FF)
                                            )
                                        ) {
                                            Column(
                                                modifier = Modifier.padding(12.dp),
                                                verticalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                                ) {
                                                    Icon(
                                                        Icons.Default.TrendingUp,
                                                        contentDescription = null,
                                                        modifier = Modifier.size(16.dp),
                                                        tint = Color(0xFF2563EB)
                                                    )
                                                    Text(
                                                        "Total Deals",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = Color(0xFF1E40AF)
                                                    )
                                                }
                                                Text(
                                                    stats.totalDeals.toString(),
                                                    style = MaterialTheme.typography.titleLarge,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color(0xFF1E40AF)
                                                )
                                            }
                                        }
                                        
                                        // Total Value
                                        Card(
                                            modifier = Modifier.weight(1f),
                                            colors = CardDefaults.cardColors(
                                                containerColor = Color(0xFFD1FAE5)
                                            )
                                        ) {
                                            Column(
                                                modifier = Modifier.padding(12.dp),
                                                verticalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                                ) {
                                                    Icon(
                                                        Icons.Default.AttachMoney,
                                                        contentDescription = null,
                                                        modifier = Modifier.size(16.dp),
                                                        tint = Color(0xFF059669)
                                                    )
                                                    Text(
                                                        "Total Value",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = Color(0xFF065F46)
                                                    )
                                                }
                                                Text(
                                                    "$${String.format("%,.0f", stats.totalValue)}",
                                                    style = MaterialTheme.typography.titleLarge,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color(0xFF065F46)
                                                )
                                            }
                                        }
                                        
                                        // Avg Probability
                                        Card(
                                            modifier = Modifier.weight(1f),
                                            colors = CardDefaults.cardColors(
                                                containerColor = Color(0xFFFAE8FF)
                                            )
                                        ) {
                                            Column(
                                                modifier = Modifier.padding(12.dp),
                                                verticalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Text(
                                                    "Avg %",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = Color(0xFF7E22CE)
                                                )
                                                Text(
                                                    "${stats.averageProbability.toInt()}%",
                                                    style = MaterialTheme.typography.titleLarge,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color(0xFF7E22CE)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Kanban Board
                        when (uiState) {
                            is DealsUiState.Loading -> {
                                Box(
                                    modifier = Modifier.fillMaxSize(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator()
                                }
                            }
                            
                            is DealsUiState.Empty -> {
                                Box(
                                    modifier = Modifier.fillMaxSize(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.spacedBy(16.dp),
                                        modifier = Modifier.padding(32.dp)
                                    ) {
                                        Text(
                                            "No deals yet",
                                            style = MaterialTheme.typography.headlineSmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text("Create your first deal to get started")
                                        Button(onClick = { viewModel.showCreateDialog() }) {
                                            Icon(Icons.Default.Add, contentDescription = null)
                                            Spacer(Modifier.width(8.dp))
                                            Text("Create Deal")
                                        }
                                    }
                                }
                            }
                            
                            is DealsUiState.Success -> {
                                val deals = (uiState as DealsUiState.Success).deals
                                
                                // Group deals by stage
                                val dealsByStage = stages.associateWith { stage ->
                                    deals.filter { it.stageId == stage.id }
                                }
                                
                                Row(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .padding(16.dp)
                                        .horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    stages.forEach { stage ->
                                        DealKanbanColumn(
                                            stage = stage,
                                            deals = dealsByStage[stage] ?: emptyList(),
                                            onDealClick = { deal ->
                                                clickedDeal = deal
                                                showDealOptionsDialog = true
                                            }
                                        )
                                    }
                                }
                            }
                            
                            is DealsUiState.Error -> {
                                Box(
                                    modifier = Modifier.fillMaxSize(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.spacedBy(16.dp)
                                    ) {
                                        Text(
                                            text = (uiState as DealsUiState.Error).message,
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
                }
            }
        }
        
        // Dialogs
        if (showCreateDialog && selectedPipelineId != null) {
            CreateDealDialog(
                contacts = availableContacts,
                pipelines = pipelines,
                isCreating = isProcessing,
                onDismiss = { viewModel.hideCreateDialog() },
                onConfirm = { title, contactId, pipelineId, stageId, value, probability, expectedCloseDate, notes ->
                    viewModel.createDeal(title, contactId, pipelineId, stageId, value, probability, expectedCloseDate, notes)
                }
            )
        }
        
        if (showEditDialog && selectedDeal != null) {
            EditDealDialog(
                deal = selectedDeal!!,
                stages = stages,
                isUpdating = isProcessing,
                onDismiss = { viewModel.hideEditDialog() },
                onConfirm = { title, stageId, value, probability, expectedCloseDate, notes ->
                    viewModel.updateDeal(selectedDeal!!.id, title, stageId, value, probability, expectedCloseDate, notes)
                }
            )
        }
        
        if (showMoveDialog && selectedDeal != null) {
            MoveStageDialog(
                deal = selectedDeal!!,
                stages = stages,
                isMoving = isProcessing,
                onDismiss = { viewModel.hideMoveDialog() },
                onConfirm = { stageId ->
                    viewModel.moveDealToStage(selectedDeal!!.id, stageId)
                }
            )
        }
        
        // Deal options dialog (from Kanban card click)
        if (showDealOptionsDialog && clickedDeal != null) {
            val dealToShow = clickedDeal!! // Local variable to avoid smart cast issues
            AlertDialog(
                onDismissRequest = { 
                    showDealOptionsDialog = false
                    clickedDeal = null
                },
                title = { Text("Deal Options") },
                text = { Text("Choose an action for ${dealToShow.title}") },
                confirmButton = {
                    Column {
                        TextButton(onClick = {
                            showDealOptionsDialog = false
                            viewModel.showEditDialog(dealToShow)
                            clickedDeal = null
                        }) {
                            Text("Edit")
                        }
                        TextButton(onClick = {
                            showDealOptionsDialog = false
                            viewModel.showMoveDialog(dealToShow)
                            clickedDeal = null
                        }) {
                            Text("Move Stage")
                        }
                    }
                },
                dismissButton = {
                    TextButton(onClick = { 
                        showDealOptionsDialog = false
                        clickedDeal = null
                    }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

