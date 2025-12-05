package com.example.synapse.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.model.DashboardStats
import com.example.synapse.data.model.TicketStatus
import com.example.synapse.data.repository.ContactRepository
import com.example.synapse.data.repository.TicketRepository
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
    private val contactRepository: ContactRepository,
    private val ticketRepository: TicketRepository,
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
            
            try {
                // Fetch real data from repositories
                val contactsResult = contactRepository.getContacts()
                val ticketsResult = ticketRepository.getTickets()
                
                val contacts = contactsResult.getOrNull() ?: emptyList()
                val tickets = ticketsResult.getOrNull() ?: emptyList()
                
                // Count open and in-progress tickets
                val openTickets = tickets.count { it.status == TicketStatus.OPEN }
                val inProgressTickets = tickets.count { it.status == TicketStatus.IN_PROGRESS }
                
                // Get recent contacts (last 2)
                val recentContacts = contacts
                    .sortedByDescending { it.createdAt }
                    .take(2)
                    .map { "${it.firstName} ${it.lastName}".trim() }
                
                // Create stats with real data
                val stats = DashboardStats(
                    totalContacts = contacts.size,
                    totalLeads = 0, // Not used in current UI
                    totalDeals = 0, // Not used in current UI
                    totalTickets = tickets.size,
                    totalPipelineValue = 0.0, // Not used in current UI
                    openTickets = openTickets,
                    inProgressTickets = inProgressTickets,
                    recentContacts = recentContacts
                )
                
                _uiState.value = DashboardUiState(
                    isLoading = false,
                    stats = stats,
                    currentUserAvatar = currentUserAvatar,
                    error = null
                )
                
            } catch (e: Exception) {
                _uiState.value = DashboardUiState(
                    isLoading = false,
                    stats = null,
                    currentUserAvatar = currentUserAvatar,
                    error = e.message ?: "Failed to load dashboard data"
                )
            }
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
