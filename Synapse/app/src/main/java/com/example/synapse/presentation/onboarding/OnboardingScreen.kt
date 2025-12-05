package com.example.synapse.presentation.onboarding

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.WorkOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingScreen(
    onOnboardingComplete: () -> Unit,
    viewModel: OnboardingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    var workspaceName by remember { mutableStateOf("") }
    var selectedType by remember { mutableStateOf("business") }
    
    // Navigate on success
    LaunchedEffect(uiState) {
        if (uiState is OnboardingUiState.Success) {
            onOnboardingComplete()
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create Your Workspace") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(32.dp))
            
            // Welcome text
            Text(
                text = "Welcome to SynapseCRM!",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Let's set up your workspace to get started",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(48.dp))
            
            // Workspace name input
            OutlinedTextField(
                value = workspaceName,
                onValueChange = { workspaceName = it },
                label = { Text("Workspace Name") },
                placeholder = { Text("e.g., Acme Corporation") },
                modifier = Modifier.fillMaxWidth(),
                enabled = uiState !is OnboardingUiState.Loading,
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Workspace type selector
            Text(
                text = "Workspace Type",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            WorkspaceTypeOption(
                icon = Icons.Default.Business,
                title = "Business",
                description = "For companies and organizations",
                selected = selectedType == "business",
                enabled = uiState !is OnboardingUiState.Loading,
                onClick = { selectedType = "business" }
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            WorkspaceTypeOption(
                icon = Icons.Default.Person,
                title = "Personal",
                description = "For individual use",
                selected = selectedType == "personal",
                enabled = uiState !is OnboardingUiState.Loading,
                onClick = { selectedType = "personal" }
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            WorkspaceTypeOption(
                icon = Icons.Default.WorkOutline,
                title = "Organization",
                description = "For non-profits and institutions",
                selected = selectedType == "organization",
                enabled = uiState !is OnboardingUiState.Loading,
                onClick = { selectedType = "organization" }
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Error message
            if (uiState is OnboardingUiState.Error) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Text(
                        text = (uiState as OnboardingUiState.Error).message,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.padding(16.dp)
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
            }
            
            // Create button
            Button(
                onClick = {
                    viewModel.createWorkspace(workspaceName.trim(), selectedType)
                },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                enabled = uiState !is OnboardingUiState.Loading && workspaceName.trim().isNotEmpty()
            ) {
                if (uiState is OnboardingUiState.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Create Workspace")
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkspaceTypeOption(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String,
    selected: Boolean,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        enabled = enabled,
        colors = CardDefaults.cardColors(
            containerColor = if (selected) 
                MaterialTheme.colorScheme.primaryContainer 
            else 
                MaterialTheme.colorScheme.surface
        ),
        border = if (selected) 
            CardDefaults.outlinedCardBorder().copy(width = 2.dp) 
        else 
            CardDefaults.outlinedCardBorder()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = if (selected) 
                    MaterialTheme.colorScheme.primary 
                else 
                    MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            if (selected) {
                RadioButton(
                    selected = true,
                    onClick = null
                )
            }
        }
    }
}
