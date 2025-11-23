package com.example.synapse.presentation.chatbot

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.synapse.data.database.entity.MessageEntity
import io.noties.markwon.Markwon
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import kotlinx.coroutines.launch

/**
 * Main Chat Screen with Material 3 Design
 * 
 * Features:
 * - Bottom sheet design (non-intrusive)
 * - Message bubbles with markdown
 * - Suggested action chips
 * - Typing indicator
 * - Conversation sidebar
 * - Voice input button
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    onNavigateBack: () -> Unit,
    viewModel: ChatViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val messages by viewModel.messages.collectAsState()
    val conversations by viewModel.conversations.collectAsState()
    
    val sheetState = rememberModalBottomSheetState(
        skipPartiallyExpanded = false
    )
    val scope = rememberCoroutineScope()
    
    Scaffold(
        topBar = {
            ChatTopBar(
                onNavigateBack = onNavigateBack,
                onMenuClick = { viewModel.toggleSidebar() },
                onNewChatClick = { viewModel.startNewConversation() }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Main Chat Area
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Messages List
                MessagesSection(
                    messages = messages,
                    isLoading = uiState.isLoading,
                    modifier = Modifier.weight(1f)
                )
                
                // Suggested Actions
                if (uiState.suggestedActions.isNotEmpty()) {
                    SuggestedActionsRow(
                        actions = uiState.suggestedActions,
                        onActionClick = { viewModel.executeSuggestedAction(it) }
                    )
                }
                
                // Input Field
                ChatInputField(
                    onSendMessage = { viewModel.sendMessage(it) },
                    onTypingChanged = { viewModel.setTyping(it) },
                    isEnabled = !uiState.isLoading
                )
            }
            
            // Error Snackbar
            if (uiState.error != null) {
                Snackbar(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp),
                    action = {
                        TextButton(onClick = { viewModel.clearError() }) {
                            Text("Dismiss")
                        }
                    }
                ) {
                    Text(uiState.error!!)
                }
            }
        }
        
        // Conversation Sidebar (Modal Sheet)
        if (uiState.isSidebarOpen) {
            ModalBottomSheet(
                onDismissRequest = { viewModel.toggleSidebar() },
                sheetState = sheetState
            ) {
                ConversationList(
                    conversations = conversations,
                    currentConversationId = uiState.currentConversationId,
                    onConversationClick = { conversationId ->
                        viewModel.openConversation(conversationId)
                        scope.launch {
                            sheetState.hide()
                            viewModel.toggleSidebar()
                        }
                    },
                    onDeleteConversation = { viewModel.deleteConversation(it) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(500.dp)
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatTopBar(
    onNavigateBack: () -> Unit,
    onMenuClick: () -> Unit,
    onNewChatClick: () -> Unit
) {
    TopAppBar(
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Gradient AI icon
                Surface(
                    modifier = Modifier.size(32.dp),
                    shape = MaterialTheme.shapes.small,
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Icon(
                        imageVector = Icons.Default.Psychology,
                        contentDescription = null,
                        modifier = Modifier.padding(6.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "AI Assistant",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = "Powered by Gemini 2.0",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        },
        navigationIcon = {
            IconButton(onClick = onNavigateBack) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Back"
                )
            }
        },
        actions = {
            IconButton(onClick = onNewChatClick) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "New Chat"
                )
            }
            IconButton(onClick = onMenuClick) {
                Icon(
                    imageVector = Icons.Default.History,
                    contentDescription = "Chat History"
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
fun MessagesSection(
    messages: List<MessageEntity>,
    isLoading: Boolean,
    modifier: Modifier = Modifier
) {
    val listState = rememberLazyListState()
    
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }
    
    LazyColumn(
        modifier = modifier.fillMaxWidth(),
        state = listState,
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (messages.isEmpty()) {
            item {
                WelcomeMessage()
            }
        }
        
        items(messages, key = { it.id }) { message ->
            MessageBubble(
                message = message,
                showAvatar = true
            )
        }
        
        if (isLoading) {
            item {
                TypingIndicator()
            }
        }
    }
}

@Composable
fun WelcomeMessage() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            modifier = Modifier.size(80.dp),
            shape = MaterialTheme.shapes.large,
            color = MaterialTheme.colorScheme.primaryContainer
        ) {
            Icon(
                imageVector = Icons.Default.Psychology,
                contentDescription = null,
                modifier = Modifier.padding(20.dp),
                tint = MaterialTheme.colorScheme.primary
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = "👋 Hello! I'm your AI Assistant",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "I can help you manage your CRM:",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Column(
            modifier = Modifier.fillMaxWidth(0.9f),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            WelcomeFeature("📊", "View and search contacts, leads, deals, and tickets")
            WelcomeFeature("✨", "Create and update CRM records with natural language")
            WelcomeFeature("📈", "Get analytics and insights about your pipeline")
            WelcomeFeature("🎯", "Convert leads to deals automatically")
        }
    }
}

@Composable
fun WelcomeFeature(icon: String, text: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = icon,
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(end = 12.dp)
        )
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun TypingIndicator() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // AI Avatar
        AgentAvatar(
            modifier = Modifier.padding(end = 12.dp)
        )
        
        // Typing animation bubble
        Surface(
            shape = RoundedCornerShape(
                topStart = 8.dp,
                topEnd = 20.dp,
                bottomStart = 20.dp,
                bottomEnd = 20.dp
            ),
            color = MaterialTheme.colorScheme.surfaceContainer,
            shadowElevation = 1.dp,
            tonalElevation = 2.dp
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Three animated dots
                repeat(3) { index ->
                    TypingDot(
                        delay = index * 200,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
            }
        }
    }
}

/**
 * Individual typing dot with staggered animation
 */
@Composable
fun TypingDot(
    delay: Int,
    color: Color,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "typing_dot_$delay")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, delayMillis = delay),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )
    
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, delayMillis = delay),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )
    
    Surface(
        modifier = modifier.scale(scale),
        shape = CircleShape,
        color = color.copy(alpha = alpha)
    ) {
        Box(modifier = Modifier.size(8.dp))
    }
}
