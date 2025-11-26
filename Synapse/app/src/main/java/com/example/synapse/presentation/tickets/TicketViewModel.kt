package com.example.synapse.presentation.tickets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.request.CreateTicketRequest
import com.example.synapse.data.api.request.UpdateTicketRequest
import com.example.synapse.data.model.Ticket
import com.example.synapse.data.model.TicketComment
import com.example.synapse.data.model.TicketStatus
import com.example.synapse.data.repository.TicketRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TicketsUiState(
    val tickets: List<Ticket> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedTicket: Ticket? = null,
    val comments: List<TicketComment> = emptyList(),
    val currentFilter: TicketStatus? = null,
    val showDetailDialog: Boolean = false,
    val isLoadingDetail: Boolean = false
)

@HiltViewModel
class TicketViewModel @Inject constructor(
    private val repository: TicketRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(TicketsUiState())
    val uiState: StateFlow<TicketsUiState> = _uiState.asStateFlow()
    
    init {
        loadTickets()
    }
    
    fun loadTickets(
        status: String? = null,
        priority: String? = null,
        contactId: String? = null
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            repository.getTickets(status, priority, contactId)
                .onSuccess { tickets ->
                    _uiState.value = _uiState.value.copy(
                        tickets = tickets,
                        isLoading = false
                    )
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message
                    )
                }
        }
    }
    
    fun loadTicketById(id: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoadingDetail = true, 
                showDetailDialog = true,
                error = null
            )
            
            repository.getTicketById(id)
                .onSuccess { ticket ->
                    _uiState.value = _uiState.value.copy(
                        selectedTicket = ticket,
                        comments = ticket.comments ?: emptyList(),
                        isLoadingDetail = false
                    )
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoadingDetail = false,
                        showDetailDialog = false,
                        error = error.message
                    )
                }
        }
    }

    fun hideTicketDetail() {
        _uiState.value = _uiState.value.copy(
            showDetailDialog = false,
            selectedTicket = null,
            comments = emptyList()
        )
    }
    
    fun createTicket(request: CreateTicketRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            repository.createTicket(request)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    loadTickets()
                    onSuccess()
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message
                    )
                }
        }
    }
    
    fun updateTicket(id: String, request: UpdateTicketRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            repository.updateTicket(id, request)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    loadTickets()
                    onSuccess()
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message
                    )
                }
        }
    }
    
    fun updateTicketStatus(id: String, status: String, onSuccess: () -> Unit) {
        updateTicket(
            id, 
            UpdateTicketRequest(
                title = null,
                description = null,
                status = status,
                priority = null,
                contactId = null,
                dealId = null
            ), 
            onSuccess
        )
    }
    
    fun deleteTicket(id: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            repository.deleteTicket(id)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    loadTickets()
                    onSuccess()
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message
                    )
                }
        }
    }
    
    fun addComment(ticketId: String, content: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingDetail = true)
            
            repository.addComment(ticketId, content)
                .onSuccess {
                    // Reload the entire ticket to get updated comments
                    repository.getTicketById(ticketId)
                        .onSuccess { ticket ->
                            _uiState.value = _uiState.value.copy(
                                selectedTicket = ticket,
                                comments = ticket.comments ?: emptyList(),
                                isLoadingDetail = false
                            )
                        }
                        .onFailure { error ->
                            _uiState.value = _uiState.value.copy(
                                error = error.message,
                                isLoadingDetail = false
                            )
                        }
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        error = error.message,
                        isLoadingDetail = false
                    )
                }
        }
    }
    
    private fun loadComments(ticketId: String) {
        // No longer needed - comments are included in the ticket object
    }
    
    fun filterByStatus(status: TicketStatus?) {
        _uiState.value = _uiState.value.copy(currentFilter = status)
        loadTickets(status = status?.name)
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
