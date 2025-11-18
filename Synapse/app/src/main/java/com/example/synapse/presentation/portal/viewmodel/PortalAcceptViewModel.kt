package com.example.synapse.presentation.portal.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.response.PortalInvitationDetails
import com.example.synapse.data.api.response.PortalLinkResponse
import com.example.synapse.data.repository.portal.PortalRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PortalAcceptState(
    val isLoading: Boolean = true,
    val invitation: PortalInvitationDetails? = null,
    val error: String? = null,
    val isAccepting: Boolean = false,
    val accepted: Boolean = false
)

@HiltViewModel
class PortalAcceptViewModel @Inject constructor(
    private val portalRepository: PortalRepository
) : ViewModel() {

    private val _state = MutableStateFlow(PortalAcceptState())
    val state: StateFlow<PortalAcceptState> = _state

    fun loadInvitation(token: String) {
        viewModelScope.launch {
            _state.value = PortalAcceptState(isLoading = true, error = null)

            portalRepository.getPortalInvitation(token).fold(
                onSuccess = { invitation ->
                    _state.value = PortalAcceptState(
                        isLoading = false,
                        invitation = invitation,
                        error = if (invitation.alreadyAccepted) {
                            "This invitation has already been accepted"
                        } else if (!invitation.isActive) {
                            "This invitation has expired or been deactivated"
                        } else null
                    )
                },
                onFailure = { error ->
                    _state.value = PortalAcceptState(
                        isLoading = false,
                        error = error.message ?: "Invalid or expired invitation link"
                    )
                }
            )
        }
    }

    fun acceptInvitation(token: String) {
        if (_state.value.isAccepting) return

        viewModelScope.launch {
            _state.value = _state.value.copy(isAccepting = true)

            portalRepository.linkPortalCustomer(token).fold(
                onSuccess = { response ->
                    _state.value = PortalAcceptState(
                        isLoading = false,
                        invitation = _state.value.invitation,
                        accepted = true,
                        isAccepting = false
                    )
                },
                onFailure = { error ->
                    _state.value = _state.value.copy(
                        error = error.message ?: "Failed to accept invitation",
                        isAccepting = false
                    )
                }
            )
        }
    }
}
