package com.example.synapse.presentation.auth.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.ApiService
import com.example.synapse.data.api.response.UserTenantInfo
import com.example.synapse.data.api.response.PortalAccessResponse
import com.example.synapse.data.model.WorkspaceOption
import com.example.synapse.data.model.WorkspaceType
import com.example.synapse.data.model.WorkspaceIcon
import com.example.synapse.data.repository.portal.PortalRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WorkspaceSelectorState(
    val isLoading: Boolean = true,
    val workspaces: List<WorkspaceOption> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class WorkspaceSelectorViewModel @Inject constructor(
    private val apiService: ApiService,
    private val portalRepository: PortalRepository
) : ViewModel() {

    private val _state = MutableStateFlow(WorkspaceSelectorState())
    val state: StateFlow<WorkspaceSelectorState> = _state

    init {
        loadWorkspaceOptions()
    }

    fun loadWorkspaceOptions() {
        viewModelScope.launch {
            _state.value = WorkspaceSelectorState(isLoading = true, error = null)

            try {
                val workspaceOptions = mutableListOf<WorkspaceOption>()

                // Check for internal CRM access (tenant workspace)
                try {
                    val tenantResponse = apiService.getMyTenants()
                    if (tenantResponse.isSuccessful && tenantResponse.body() != null) {
                        val tenants = tenantResponse.body()!!
                        if (tenants.isNotEmpty()) {
                            workspaceOptions.add(
                                WorkspaceOption(
                                    type = WorkspaceType.INTERNAL_CRM,
                                    id = tenants.first().id,
                                    name = "My Workspace",
                                    description = "Manage your business, contacts, deals, and team",
                                    navigationTarget = "owner_dashboard",
                                    icon = WorkspaceIcon.BUILDING
                                )
                            )
                        }
                    }
                } catch (e: Exception) {
                    // No internal CRM access, continue
                }

                // Check for customer portal access
                try {
                    val portalResult = portalRepository.getMyPortalAccess()
                    portalResult.fold(
                        onSuccess = { portalAccess ->
                            if (portalAccess.isNotEmpty()) {
                                workspaceOptions.add(
                                    WorkspaceOption(
                                        type = WorkspaceType.CUSTOMER_PORTAL,
                                        id = "portal",
                                        name = "Customer Portal",
                                        description = "Access to ${portalAccess.size} vendor portal${if (portalAccess.size > 1) "s" else ""}",
                                        navigationTarget = "portal_dashboard",
                                        icon = WorkspaceIcon.USERS
                                    )
                                )
                            }
                        },
                        onFailure = { /* No portal access, continue */ }
                    )
                } catch (e: Exception) {
                    // No portal access, continue
                }

                // If no workspaces, add create workspace option
                if (workspaceOptions.isEmpty()) {
                    workspaceOptions.add(
                        WorkspaceOption(
                            type = WorkspaceType.CREATE_WORKSPACE,
                            id = "create",
                            name = "Create Workspace",
                            description = "Set up your CRM workspace to manage your business",
                            navigationTarget = "onboard",
                            icon = WorkspaceIcon.ADD
                        )
                    )
                }

                _state.value = WorkspaceSelectorState(
                    isLoading = false,
                    workspaces = workspaceOptions,
                    error = null
                )

            } catch (e: Exception) {
                _state.value = WorkspaceSelectorState(
                    isLoading = false,
                    error = e.message ?: "Failed to load workspace options"
                )
            }
        }
    }

    fun refresh() {
        loadWorkspaceOptions()
    }
}
