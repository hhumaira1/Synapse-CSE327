package com.example.synapse.presentation.voip

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.voip.OnlineUser
import com.example.synapse.data.repository.VoipRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * OnlineAgentsViewModel
 * 
 * Manages online users list for VoIP calls.
 */
@HiltViewModel
class OnlineAgentsViewModel @Inject constructor(
    private val repository: VoipRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(OnlineAgentsUiState())
    val uiState: StateFlow<OnlineAgentsUiState> = _uiState.asStateFlow()
    
    fun loadOnlineUsers() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            try {
                val users = repository.getOnlineUsers()
                _uiState.value = _uiState.value.copy(
                    onlineUsers = users,
                    isLoading = false,
                    error = null
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to load online users"
                )
            }
        }
    }
}

data class OnlineAgentsUiState(
    val onlineUsers: List<OnlineUser> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)
