package com.example.synapse.presentation.portal.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.model.portal.*
import com.example.synapse.data.repository.portal.PortalRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PortalTicketsState(
    val isLoading: Boolean = true,
    val tickets: List<PortalTicket> = emptyList(),
    val filteredTickets: List<PortalTicket> = emptyList(),
    val error: String? = null,
    val selectedStatus: TicketStatus? = null,
    val showCreateDialog: Boolean = false,
    val showDetailDialog: Boolean = false,
    val selectedTicket: TicketDetail? = null,
    val isCreatingTicket: Boolean = false,
    val isLoadingDetail: Boolean = false,
    val currentTenantId: String? = null
)

@HiltViewModel
class PortalTicketsViewModel @Inject constructor(
    private val portalRepository: PortalRepository
) : ViewModel() {

    private val _state = MutableStateFlow(PortalTicketsState())
    val state: StateFlow<PortalTicketsState> = _state

    init {
        loadPortalAccess()
    }

    private fun loadPortalAccess() {
        viewModelScope.launch {
            portalRepository.getMyPortalAccess().fold(
                onSuccess = { portalAccess ->
                    val tenantId = portalAccess.firstOrNull()?.tenant?.id
                    _state.value = _state.value.copy(currentTenantId = tenantId)
                    loadTickets(tenantId)
                },
                onFailure = { error ->
                    _state.value = _state.value.copy(
                        error = error.message ?: "Failed to load portal access",
                        isLoading = false
                    )
                }
            )
        }
    }

    fun loadTickets(tenantId: String? = null) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)

            portalRepository.getTickets(tenantId).fold(
                onSuccess = { tickets ->
                    val filteredTickets = filterTicketsByStatus(tickets, _state.value.selectedStatus)
                    _state.value = _state.value.copy(
                        isLoading = false,
                        tickets = tickets,
                        filteredTickets = filteredTickets,
                        error = null
                    )
                },
                onFailure = { error ->
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = error.message ?: "Failed to load tickets"
                    )
                }
            )
        }
    }

    fun filterByStatus(status: TicketStatus?) {
        val filteredTickets = filterTicketsByStatus(_state.value.tickets, status)
        _state.value = _state.value.copy(
            selectedStatus = status,
            filteredTickets = filteredTickets
        )
    }

    private fun filterTicketsByStatus(tickets: List<PortalTicket>, status: TicketStatus?): List<PortalTicket> {
        return if (status == null) {
            tickets
        } else {
            tickets.filter { it.status == status }
        }
    }

    fun showCreateDialog() {
        _state.value = _state.value.copy(showCreateDialog = true)
    }

    fun hideCreateDialog() {
        _state.value = _state.value.copy(showCreateDialog = false)
    }

    fun createTicket(request: CreateTicketRequest) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isCreatingTicket = true)

            val tenantId = _state.value.currentTenantId
            val updatedRequest = request.copy(tenantId = tenantId)
            
            portalRepository.createTicket(updatedRequest).fold(
                onSuccess = { _ ->
                    // Reload tickets after creation
                    loadTickets(tenantId)
                    _state.value = _state.value.copy(
                        showCreateDialog = false,
                        isCreatingTicket = false
                    )
                },
                onFailure = { error ->
                    _state.value = _state.value.copy(
                        error = error.message ?: "Failed to create ticket",
                        isCreatingTicket = false
                    )
                }
            )
        }
    }

    fun showTicketDetail(ticketId: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(
                showDetailDialog = true,
                isLoadingDetail = true
            )

            val tenantId = _state.value.currentTenantId
            portalRepository.getTicketDetail(ticketId, tenantId).fold(
                onSuccess = { ticketDetail ->
                    _state.value = _state.value.copy(
                        selectedTicket = ticketDetail,
                        isLoadingDetail = false
                    )
                },
                onFailure = { error ->
                    _state.value = _state.value.copy(
                        error = error.message ?: "Failed to load ticket details",
                        isLoadingDetail = false,
                        showDetailDialog = false
                    )
                }
            )
        }
    }

    fun hideTicketDetail() {
        _state.value = _state.value.copy(
            showDetailDialog = false,
            selectedTicket = null
        )
    }

    fun addComment(ticketId: String, content: String) {
        viewModelScope.launch {
            try {
                // Show loading state
                _state.value = _state.value.copy(isLoadingDetail = true, error = null)
                
                val tenantId = _state.value.currentTenantId
                val request = AddCommentRequest(content = content, tenantId = tenantId)
                portalRepository.addComment(ticketId, request).fold(
                    onSuccess = { _ ->
                        // Reload ticket details to show new comment
                        val currentTicket = _state.value.selectedTicket
                        if (currentTicket != null) {
                            showTicketDetail(currentTicket.id)
                        } else {
                            _state.value = _state.value.copy(isLoadingDetail = false)
                        }
                    },
                    onFailure = { error ->
                        _state.value = _state.value.copy(
                            error = error.message ?: "Failed to add comment",
                            isLoadingDetail = false
                        )
                    }
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.message ?: "An unexpected error occurred",
                    isLoadingDetail = false
                )
            }
        }
    }
}
