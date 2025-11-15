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
    val currentFilter: TicketStatus? = null
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
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            repository.getTicketById(id)
                .onSuccess { ticket ->
                    _uiState.value = _uiState.value.copy(
                        selectedTicket = ticket,
                        isLoading = false
                    )
                    loadComments(id)
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message
                    )
                }
        }
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
            repository.addComment(ticketId, content)
                .onSuccess {
                    loadComments(ticketId)
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(error = error.message)
                }
        }
    }
    
    private fun loadComments(ticketId: String) {
        viewModelScope.launch {
            repository.getComments(ticketId)
                .onSuccess { comments ->
                    _uiState.value = _uiState.value.copy(comments = comments)
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(error = error.message)
                }
        }
    }
    
    fun filterByStatus(status: TicketStatus?) {
        _uiState.value = _uiState.value.copy(currentFilter = status)
        loadTickets(status = status?.name)
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
