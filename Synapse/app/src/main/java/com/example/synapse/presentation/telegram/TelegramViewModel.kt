package com.example.synapse.presentation.telegram

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.model.TelegramStatusResponse
import com.example.synapse.data.repository.TelegramRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TelegramUiState(
    val isLoading: Boolean = false,
    val isConnected: Boolean = false,
    val telegramUsername: String? = null,
    val deepLink: String? = null,
    val linkCode: String? = null,
    val isPolling: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class TelegramViewModel @Inject constructor(
    private val telegramRepository: TelegramRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(TelegramUiState())
    val uiState: StateFlow<TelegramUiState> = _uiState.asStateFlow()
    
    private var pollingJob: Job? = null
    
    init {
        checkStatus()
    }
    
    fun checkStatus() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            val result = telegramRepository.getStatus()
            result.fold(
                onSuccess = { status ->
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            isConnected = status.connected,
                            telegramUsername = status.telegramUsername
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            error = "Failed to check status: ${error.message}"
                        )
                    }
                }
            )
        }
    }
    
    fun generateLink() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            val result = telegramRepository.generateLink()
            result.fold(
                onSuccess = { linkResponse ->
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            deepLink = linkResponse.deepLink,
                            linkCode = linkResponse.code
                        )
                    }
                    // Start polling for connection status
                    startPolling()
                },
                onFailure = { error ->
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            error = "Failed to generate link: ${error.message}"
                        )
                    }
                }
            )
        }
    }
    
    private fun startPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            _uiState.update { it.copy(isPolling = true) }
            
            // Poll for 2 minutes (60 iterations * 2 seconds)
            repeat(60) {
                delay(2000) // Check every 2 seconds
                
                val result = telegramRepository.getStatus()
                result.fold(
                    onSuccess = { status ->
                        if (status.connected) {
                            _uiState.update { 
                                it.copy(
                                    isPolling = false,
                                    isConnected = true,
                                    telegramUsername = status.telegramUsername,
                                    deepLink = null,
                                    linkCode = null,
                                    successMessage = "Telegram account linked successfully!"
                                )
                            }
                            pollingJob?.cancel()
                        }
                    },
                    onFailure = { /* Ignore failures during polling */ }
                )
            }
            
            // Timeout after 2 minutes
            _uiState.update { 
                it.copy(
                    isPolling = false,
                    deepLink = null,
                    linkCode = null,
                    error = if (!it.isConnected) "Link expired. Please try again." else null
                )
            }
        }
    }
    
    fun disconnect() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            val result = telegramRepository.disconnect()
            result.fold(
                onSuccess = {
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            isConnected = false,
                            telegramUsername = null,
                            successMessage = "Telegram account disconnected"
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            error = "Failed to disconnect: ${error.message}"
                        )
                    }
                }
            )
        }
    }
    
    fun clearMessages() {
        _uiState.update { it.copy(error = null, successMessage = null) }
    }
    
    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }
}
