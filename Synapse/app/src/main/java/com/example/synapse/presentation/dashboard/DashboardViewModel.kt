package com.example.synapse.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.model.DashboardStats
import com.example.synapse.data.repository.AnalyticsRepository
import com.example.synapse.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val isLoading: Boolean = false,
    val stats: DashboardStats? = null,
    val currentUserAvatar: String? = null,
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val analyticsRepository: AnalyticsRepository,
    private val userRepository: UserRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()
    
    init {
        loadDashboardStats()
    }
    
    fun loadDashboardStats() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            // Load current user avatar
            val currentUserAvatar = try {
                val userResult = userRepository.getUserDetails()
                userResult.getOrNull()?.avatarUrl
            } catch (e: Exception) {
                null
            }
            
            val result = analyticsRepository.getDashboardStats()

            result.fold(
                onSuccess = { stats ->
                    _uiState.value = DashboardUiState(
                        isLoading = false,
                        stats = stats,
                        currentUserAvatar = currentUserAvatar,
                        error = null
                    )
                },
                onFailure = { error ->
                    _uiState.value = DashboardUiState(
                        isLoading = false,
                        stats = null,
                        currentUserAvatar = currentUserAvatar,
                        error = error.message ?: "Failed to load dashboard stats"
                    )
                }
            )
        }
    }
    
    fun refresh() {
        loadDashboardStats()
    }
    
    /**
     * Sign out the current user
     */
    suspend fun signOut() {
        userRepository.signOut()
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
