package com.example.synapse.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.ApiService
import com.example.synapse.data.model.DbUser
import com.example.synapse.data.preferences.PreferencesManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val user: DbUser? = null,
    val isLoading: Boolean = false,
    val isEditing: Boolean = false,
    val editFirstName: String = "",
    val editLastName: String = "",
    val error: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class UserProfileViewModel @Inject constructor(
    private val apiService: ApiService,
    private val preferencesManager: PreferencesManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            try {
                val response = apiService.getCurrentUser()
                if (response.isSuccessful && response.body() != null) {
                    val dbUser = response.body()!!.dbUser
                    _uiState.value = _uiState.value.copy(
                        user = dbUser,
                        editFirstName = dbUser.firstName ?: "",
                        editLastName = dbUser.lastName ?: "",
                        isLoading = false
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to load profile"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Error: ${e.message}"
                )
            }
        }
    }

    fun startEditing() {
        val currentUser = _uiState.value.user ?: return
        _uiState.value = _uiState.value.copy(
            isEditing = true,
            editFirstName = currentUser.firstName ?: "",
            editLastName = currentUser.lastName ?: ""
        )
    }

    fun updateFirstName(value: String) {
        _uiState.value = _uiState.value.copy(editFirstName = value)
    }

    fun updateLastName(value: String) {
        _uiState.value = _uiState.value.copy(editLastName = value)
    }

    fun saveProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            try {
                // TODO: Call PATCH /api/users/me/profile when endpoint is ready
                // For now, just update local state
                val currentUser = _uiState.value.user ?: return@launch
                
                _uiState.value = _uiState.value.copy(
                    user = currentUser.copy(
                        firstName = _uiState.value.editFirstName,
                        lastName = _uiState.value.editLastName
                    ),
                    isEditing = false,
                    isLoading = false,
                    successMessage = "Profile updated successfully"
                )
                
                // Save to preferences
                val name = "${_uiState.value.editFirstName} ${_uiState.value.editLastName}".trim()
                if (name.isNotEmpty()) {
                    preferencesManager.saveUserName(name)
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Failed to save: ${e.message}"
                )
            }
        }
    }

    fun cancelEditing() {
        val currentUser = _uiState.value.user ?: return
        _uiState.value = _uiState.value.copy(
            isEditing = false,
            editFirstName = currentUser.firstName ?: "",
            editLastName = currentUser.lastName ?: ""
        )
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(error = null, successMessage = null)
    }
}
