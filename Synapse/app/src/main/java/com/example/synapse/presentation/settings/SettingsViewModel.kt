package com.example.synapse.presentation.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.model.TeamMember
import com.example.synapse.data.model.Invitation
import com.example.synapse.data.model.UserRole
import com.example.synapse.data.repository.team.TeamRepository
import com.example.synapse.data.repository.invitation.InvitationRepository
import com.example.synapse.data.api.ApiService
import com.example.synapse.data.preferences.PreferencesManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val isLoading: Boolean = false,
    val teamMembers: List<TeamMember> = emptyList(),
    val pendingInvitations: List<Invitation> = emptyList(),
    val currentUserRole: UserRole? = null,
    val currentUserId: String? = null,
    val currentUserName: String? = null,
    val currentUserEmail: String? = null,
    val currentUserAvatar: String? = null,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    
    // Dialog states
    val showInviteDialog: Boolean = false,
    val showRoleChangeDialog: Boolean = false,
    val showRemoveConfirmDialog: Boolean = false,
    val selectedMember: TeamMember? = null,
    
    // Selected tab
    val selectedTab: Int = 0,
    
    // Tenant info
    val currentTenant: TenantInfo? = null
)

data class TenantInfo(
    val id: String,
    val name: String,
    val type: String,
    val createdAt: String
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val teamRepository: TeamRepository,
    private val invitationRepository: InvitationRepository,
    private val apiService: ApiService,
    private val preferencesManager: PreferencesManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadTeamData()
    }

    fun loadTeamData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            
            try {
                // Get current user details from API
                val currentUserResponse = apiService.getCurrentUser()
                val currentUser = if (currentUserResponse.isSuccessful) {
                    currentUserResponse.body()?.dbUser
                } else null
                
                // Also get user role from preferences as fallback
                val userRoleStr = preferencesManager.userRole.first()
                val userRole = try {
                    if (userRoleStr != null) UserRole.valueOf(userRoleStr) else null
                } catch (e: Exception) {
                    null
                }
                
                // Get team members
                val membersResult = teamRepository.getTeamMembers()
                val members = membersResult.getOrElse { emptyList() }
                
                // Get pending invitations
                val invitationsResult = invitationRepository.getInvitations()
                val invitations = invitationsResult.getOrElse { emptyList() }
                    .filter { it.status == com.example.synapse.data.model.InvitationStatus.PENDING }
                
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        teamMembers = members,
                        pendingInvitations = invitations,
                        currentUserRole = currentUser?.role ?: userRole,
                        currentUserId = currentUser?.id,
                        currentUserName = currentUser?.name ?: "${currentUser?.firstName ?: ""} ${currentUser?.lastName ?: ""}".trim(),
                        currentUserEmail = currentUser?.email,
                        currentUserAvatar = currentUser?.avatarUrl,
                        currentTenant = try {
                            val tenantId = preferencesManager.getTenantId()
                            if (tenantId != null) {
                                // Get tenant info from user's tenant
                                val tenantResponse = apiService.getMyTenants()
                                if (tenantResponse.isSuccessful && tenantResponse.body() != null) {
                                    val tenants = tenantResponse.body()!!
                                    val tenant = tenants.firstOrNull { it.id == tenantId }
                                    tenant?.let {
                                        TenantInfo(
                                            id = it.id,
                                            name = it.name,
                                            type = it.type,
                                            createdAt = "" // UserTenantInfo doesn't include creation date
                                        )
                                    }
                                } else null
                            } else null
                        } catch (e: Exception) {
                            null
                        },
                        errorMessage = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Failed to load team data: ${e.message}"
                    )
                }
            }
        }
    }

    fun sendInvitation(email: String, role: UserRole) {
        if (!canManageTeam()) {
            _uiState.update { it.copy(errorMessage = "You don't have permission to invite members") }
            return
        }
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                val result = invitationRepository.sendInvitation(email, role)
                result.fold(
                    onSuccess = {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                showInviteDialog = false,
                                successMessage = "Invitation sent successfully to $email"
                            )
                        }
                        loadTeamData()
                    },
                    onFailure = { error ->
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                errorMessage = "Failed to send invitation: ${error.message}"
                            )
                        }
                    }
                )
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Error sending invitation: ${e.message}"
                    )
                }
            }
        }
    }

    fun changeUserRole(userId: String, newRole: UserRole) {
        if (!canManageTeam()) {
            _uiState.update { it.copy(errorMessage = "You don't have permission to change roles") }
            return
        }
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                val result = teamRepository.changeUserRole(userId, newRole)
                result.fold(
                    onSuccess = {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                showRoleChangeDialog = false,
                                successMessage = "Role changed successfully"
                            )
                        }
                        loadTeamData()
                    },
                    onFailure = { error ->
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                errorMessage = "Failed to change role: ${error.message}"
                            )
                        }
                    }
                )
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Error changing role: ${e.message}"
                    )
                }
            }
        }
    }

    fun removeTeamMember(userId: String) {
        if (!canManageTeam()) {
            _uiState.update { it.copy(errorMessage = "You don't have permission to remove members") }
            return
        }
        
        if (userId == _uiState.value.currentUserId) {
            _uiState.update { it.copy(errorMessage = "You cannot remove yourself from the team") }
            return
        }
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                val result = teamRepository.removeTeamMember(userId)
                result.fold(
                    onSuccess = {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                showRemoveConfirmDialog = false,
                                successMessage = "Team member removed successfully"
                            )
                        }
                        loadTeamData()
                    },
                    onFailure = { error ->
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                errorMessage = "Failed to remove member: ${error.message}"
                            )
                        }
                    }
                )
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Error removing member: ${e.message}"
                    )
                }
            }
        }
    }

    fun cancelInvitation(invitationId: String) {
        if (!canManageTeam()) {
            _uiState.update { it.copy(errorMessage = "You don't have permission to cancel invitations") }
            return
        }
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                val result = invitationRepository.cancelInvitation(invitationId)
                result.fold(
                    onSuccess = {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                successMessage = "Invitation cancelled"
                            )
                        }
                        loadTeamData()
                    },
                    onFailure = { error ->
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                errorMessage = "Failed to cancel invitation: ${error.message}"
                            )
                        }
                    }
                )
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Error cancelling invitation: ${e.message}"
                    )
                }
            }
        }
    }

    fun refreshData() {
        loadTeamData()
    }

    // Dialog controls
    fun showInviteDialog() {
        _uiState.update { it.copy(showInviteDialog = true) }
    }

    fun hideInviteDialog() {
        _uiState.update { it.copy(showInviteDialog = false) }
    }

    fun showRoleChangeDialog(member: TeamMember) {
        _uiState.update { it.copy(showRoleChangeDialog = true, selectedMember = member) }
    }

    fun hideRoleChangeDialog() {
        _uiState.update { it.copy(showRoleChangeDialog = false, selectedMember = null) }
    }

    fun showRemoveConfirmDialog(member: TeamMember) {
        _uiState.update { it.copy(showRemoveConfirmDialog = true, selectedMember = member) }
    }

    fun hideRemoveConfirmDialog() {
        _uiState.update { it.copy(showRemoveConfirmDialog = false, selectedMember = null) }
    }

    fun selectTab(index: Int) {
        _uiState.update { it.copy(selectedTab = index) }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, successMessage = null) }
    }

    // Permission checks
    fun canManageTeam(): Boolean {
        val role = _uiState.value.currentUserRole
        return role == UserRole.ADMIN || role == UserRole.MANAGER
    }
    
    fun canInviteMembers(): Boolean {
        return canManageTeam()
    }

    fun canRemoveMember(member: TeamMember): Boolean {
        return canManageTeam() && member.id != _uiState.value.currentUserId
    }
}
