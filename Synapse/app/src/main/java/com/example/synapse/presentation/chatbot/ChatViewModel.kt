package com.example.synapse.presentation.chatbot

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.response.SuggestedActionDto
import com.example.synapse.data.database.entity.ConversationEntity
import com.example.synapse.data.database.entity.MessageEntity
import com.example.synapse.data.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for AI Chatbot
 * 
 * Features:
 * - Offline-first architecture (instant UI updates)
 * - Real-time message streaming (StateFlow)
 * - Suggested actions from AI
 * - Error handling with retry
 * - Conversation management
 */
@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository
) : ViewModel() {
    
    // UI State
    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()
    
    // Current conversation messages (real-time from Room)
    val messages: StateFlow<List<MessageEntity>> = _uiState
        .map { it.currentConversationId }
        .distinctUntilChanged()
        .flatMapLatest { conversationId ->
            if (conversationId != null) {
                chatRepository.getMessages(conversationId)
            } else {
                flowOf(emptyList())
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )
    
    // All conversations (real-time from Room)
    val conversations: StateFlow<List<ConversationEntity>> = chatRepository.getConversations()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )
    
    init {
        // Sync conversations on initialization
        syncConversations()
    }
    
    /**
     * Send a message to the chatbot
     */
    fun sendMessage(message: String) {
        if (message.isBlank()) return
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            val result = chatRepository.sendMessage(
                message = message.trim(),
                conversationId = _uiState.value.currentConversationId
            )
            
            result.fold(
                onSuccess = { response ->
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            currentConversationId = response.conversationId,
                            suggestedActions = response.suggestedActions ?: emptyList(),
                            error = null
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            error = error.message ?: "Failed to send message"
                        )
                    }
                }
            )
        }
    }
    
    /**
     * Start a new conversation
     */
    fun startNewConversation() {
        _uiState.update { state ->
            state.copy(
                currentConversationId = null,
                suggestedActions = emptyList(),
                error = null
            )
        }
    }
    
    /**
     * Open an existing conversation
     */
    fun openConversation(conversationId: String) {
        _uiState.update { state ->
            state.copy(
                currentConversationId = conversationId,
                suggestedActions = emptyList(),
                error = null
            )
        }
        
        // Load full history from server if not cached
        viewModelScope.launch {
            chatRepository.loadConversationHistory(conversationId)
        }
    }
    
    /**
     * Delete a conversation
     */
    fun deleteConversation(conversationId: String) {
        viewModelScope.launch {
            val result = chatRepository.deleteConversation(conversationId)
            
            result.fold(
                onSuccess = {
                    // If deleted conversation was current, start new
                    if (_uiState.value.currentConversationId == conversationId) {
                        startNewConversation()
                    }
                },
                onFailure = { error ->
                    _uiState.update { state ->
                        state.copy(error = "Failed to delete: ${error.message}")
                    }
                }
            )
        }
    }
    
    /**
     * Retry failed messages
     */
    fun retryFailedMessages() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            val result = chatRepository.retryFailedMessages()
            
            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(isLoading = false, error = null) }
                },
                onFailure = { error ->
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            error = "Retry failed: ${error.message}"
                        )
                    }
                }
            )
        }
    }
    
    /**
     * Sync conversations from server
     */
    fun syncConversations() {
        viewModelScope.launch {
            chatRepository.syncConversations()
        }
    }
    
    /**
     * Clear error message
     */
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
    
    /**
     * Send a suggested action as message
     */
    fun executeSuggestedAction(action: SuggestedActionDto) {
        sendMessage(action.action)
    }
    
    /**
     * Toggle conversation sidebar
     */
    fun toggleSidebar() {
        _uiState.update { it.copy(isSidebarOpen = !it.isSidebarOpen) }
    }
    
    /**
     * Set typing indicator
     */
    fun setTyping(isTyping: Boolean) {
        _uiState.update { it.copy(isTyping = isTyping) }
    }
}

/**
 * UI State for ChatScreen
 */
data class ChatUiState(
    val currentConversationId: String? = null,
    val isLoading: Boolean = false,
    val isTyping: Boolean = false,
    val error: String? = null,
    val suggestedActions: List<SuggestedActionDto> = emptyList(),
    val isSidebarOpen: Boolean = false
)
