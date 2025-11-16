package com.example.synapse.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.auth.AuthRepository
import com.example.synapse.data.auth.AuthState
import com.example.synapse.data.auth.GoogleSignInManager
import com.example.synapse.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val googleSignInManager: GoogleSignInManager,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    val authState = authRepository.authState

    fun signInWithEmail(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.signInWithEmail(email, password)
                .onSuccess {
                    // Check if user needs onboarding
                    val needsOnboarding = userRepository.needsOnboarding()
                    _uiState.value = AuthUiState.Success(needsOnboarding = needsOnboarding)
                }
                .onFailure { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "Sign in failed")
                }
        }
    }

    fun signUpWithEmail(email: String, password: String, firstName: String, lastName: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.signUpWithEmail(email, password, firstName, lastName)
                .onSuccess {
                    _uiState.value = AuthUiState.Success()
                }
                .onFailure { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "Sign up failed")
                }
        }
    }

    fun signInWithGoogle(activity: android.app.Activity) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            googleSignInManager.signIn(activity)
                .onSuccess { idToken ->
                    // Now use the idToken to sign in with Supabase
                    authRepository.signInWithGoogle(idToken)
                        .onSuccess {
                            // Check if user needs onboarding
                            val needsOnboarding = userRepository.needsOnboarding()
                            _uiState.value = AuthUiState.Success(needsOnboarding = needsOnboarding)
                        }
                        .onFailure { error ->
                            _uiState.value = AuthUiState.Error(error.message ?: "Google sign in failed")
                        }
                }
                .onFailure { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "Google sign in failed")
                }
        }
    }

    fun resetUiState() {
        _uiState.value = AuthUiState.Idle
    }
}

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class Success(val needsOnboarding: Boolean = false) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}
