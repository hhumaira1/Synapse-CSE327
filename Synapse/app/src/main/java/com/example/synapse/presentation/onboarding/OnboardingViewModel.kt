package com.example.synapse.presentation.onboarding

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.ApiService
import com.example.synapse.data.api.request.OnboardRequest
import com.example.synapse.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val apiService: ApiService,
    private val userRepository: UserRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<OnboardingUiState>(OnboardingUiState.Idle)
    val uiState: StateFlow<OnboardingUiState> = _uiState.asStateFlow()
    
    fun createWorkspace(workspaceName: String, workspaceType: String) {
        if (workspaceName.isBlank()) {
            _uiState.value = OnboardingUiState.Error("Workspace name cannot be empty")
            return
        }
        
        viewModelScope.launch {
            _uiState.value = OnboardingUiState.Loading
            
            try {
                val response = apiService.onboardUser(
                    OnboardRequest(
                        workspaceName = workspaceName,
                        workspaceType = workspaceType
                    )
                )
                
                if (response.isSuccessful && response.body() != null) {
                    val onboardData = response.body()!!
                    
                    // Reload user details to get full user info
                    userRepository.getUserDetails()
                        .onSuccess {
                            Log.d("OnboardingViewModel", "Workspace created successfully: ${onboardData.user.tenantId}")
                            _uiState.value = OnboardingUiState.Success
                        }
                        .onFailure { error ->
                            Log.e("OnboardingViewModel", "Failed to load user details after onboarding", error)
                            // Still mark as success since onboarding worked
                            _uiState.value = OnboardingUiState.Success
                        }
                } else {
                    val errorBody = response.errorBody()?.string()
                    Log.e("OnboardingViewModel", "Onboarding failed: $errorBody")
                    _uiState.value = OnboardingUiState.Error(
                        errorBody ?: "Failed to create workspace. Please try again."
                    )
                }
            } catch (e: Exception) {
                Log.e("OnboardingViewModel", "Onboarding error", e)
                _uiState.value = OnboardingUiState.Error(
                    e.message ?: "An error occurred. Please check your connection and try again."
                )
            }
        }
    }
    
    fun resetState() {
        _uiState.value = OnboardingUiState.Idle
    }
}

sealed class OnboardingUiState {
    object Idle : OnboardingUiState()
    object Loading : OnboardingUiState()
    object Success : OnboardingUiState()
    data class Error(val message: String) : OnboardingUiState()
}
