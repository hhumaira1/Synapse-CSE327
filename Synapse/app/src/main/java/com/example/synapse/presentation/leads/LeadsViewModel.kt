package com.example.synapse.presentation.leads

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.request.CreateLeadRequest
import com.example.synapse.data.api.request.UpdateLeadRequest
import com.example.synapse.data.model.Contact
import com.example.synapse.data.model.Lead
import com.example.synapse.data.model.Pipeline
import com.example.synapse.data.model.Stage
import com.example.synapse.data.repository.ContactRepository
import com.example.synapse.data.repository.LeadRepository
import com.example.synapse.data.repository.PipelineRepository
import com.example.synapse.data.repository.StageRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LeadsViewModel @Inject constructor(
    private val leadRepository: LeadRepository,
    private val contactRepository: ContactRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<LeadsUiState>(LeadsUiState.Loading)
    val uiState: StateFlow<LeadsUiState> = _uiState.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    private val _showCreateLeadDialog = MutableStateFlow(false)
    val showCreateLeadDialog: StateFlow<Boolean> = _showCreateLeadDialog.asStateFlow()

    private val _showEditLeadDialog = MutableStateFlow(false)
    val showEditLeadDialog: StateFlow<Boolean> = _showEditLeadDialog.asStateFlow()

    private val _showImportContactDialog = MutableStateFlow(false)
    val showImportContactDialog: StateFlow<Boolean> = _showImportContactDialog.asStateFlow()

    private val _showMoveStageDialog = MutableStateFlow(false)
    val showMoveStageDialog: StateFlow<Boolean> = _showMoveStageDialog.asStateFlow()

    private val _selectedLead = MutableStateFlow<Lead?>(null)
    val selectedLead: StateFlow<Lead?> = _selectedLead.asStateFlow()

    private val _availableContacts = MutableStateFlow<List<Contact>>(emptyList())
    val availableContacts: StateFlow<List<Contact>> = _availableContacts.asStateFlow()

    private val _isProcessing = MutableStateFlow(false)
    val isProcessing: StateFlow<Boolean> = _isProcessing.asStateFlow()

    private val _selectedStatusFilter = MutableStateFlow<String?>(null)
    val selectedStatusFilter: StateFlow<String?> = _selectedStatusFilter.asStateFlow()

    init {
        loadLeads()
        loadContacts()
    }

    fun loadLeads() {
        viewModelScope.launch {
            _uiState.value = LeadsUiState.Loading
            
            leadRepository.getLeads(_selectedStatusFilter.value)
                .onSuccess { leads ->
                    _uiState.value = if (leads.isEmpty()) {
                        LeadsUiState.Empty
                    } else {
                        LeadsUiState.Success(leads)
                    }
                }
                .onFailure { error ->
                    _uiState.value = LeadsUiState.Error(
                        error.message ?: "Failed to load leads"
                    )
                }
        }
    }

    private fun loadContacts() {
        viewModelScope.launch {
            contactRepository.getContacts()
                .onSuccess { contacts ->
                    _availableContacts.value = contacts
                }
        }
    }

    fun onRefresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            
            leadRepository.getLeads(_selectedStatusFilter.value)
                .onSuccess { leads ->
                    _uiState.value = if (leads.isEmpty()) {
                        LeadsUiState.Empty
                    } else {
                        LeadsUiState.Success(leads)
                    }
                }
                .onFailure { error ->
                    _uiState.value = LeadsUiState.Error(
                        error.message ?: "Failed to refresh leads"
                    )
                }
            
            _isRefreshing.value = false
        }
    }

    fun createLead(
        title: String,
        contactId: String,
        source: String,
        value: Double?,
        notes: String?
    ) {
        viewModelScope.launch {
            _isProcessing.value = true
            
            val leadRequest = CreateLeadRequest(
                contactId = contactId,
                title = title,
                source = source,
                value = value,
                notes = notes,
                status = "NEW"
            )
            
            leadRepository.createLead(leadRequest)
                .onSuccess {
                    _isProcessing.value = false
                    _showCreateLeadDialog.value = false
                    loadLeads()
                }
                .onFailure { error ->
                    _isProcessing.value = false
                    _uiState.value = LeadsUiState.Error(
                        error.message ?: "Failed to create lead"
                    )
                }
        }
    }

    fun importLeadFromContact(contactId: String) {
        viewModelScope.launch {
            _isProcessing.value = true
            
            contactRepository.getContactById(contactId)
                .onSuccess { contact ->
                    val leadRequest = CreateLeadRequest(
                        contactId = contact.id,
                        title = "${contact.firstName} ${contact.lastName}",
                        source = "IMPORTED",
                        value = null,
                        notes = null,
                        status = "NEW"
                    )
                    
                    leadRepository.createLead(leadRequest)
                        .onSuccess {
                            _isProcessing.value = false
                            _showImportContactDialog.value = false
                            loadLeads()
                        }
                        .onFailure { error ->
                            _isProcessing.value = false
                            _uiState.value = LeadsUiState.Error(
                                error.message ?: "Failed to import lead"
                            )
                        }
                }
                .onFailure { error ->
                    _isProcessing.value = false
                    _uiState.value = LeadsUiState.Error(
                        error.message ?: "Failed to fetch contact"
                    )
                }
        }
    }

    fun updateLead(
        leadId: String,
        title: String,
        status: String,
        value: Double?,
        notes: String?
    ) {
        viewModelScope.launch {
            _isProcessing.value = true
            
            val request = UpdateLeadRequest(
                contactId = null,
                title = title,
                source = null,
                value = value,
                notes = notes,
                status = status
            )
            
            leadRepository.updateLead(leadId, request)
                .onSuccess {
                    _isProcessing.value = false
                    _showEditLeadDialog.value = false
                    _selectedLead.value = null
                    loadLeads()
                }
                .onFailure { error ->
                    _isProcessing.value = false
                    _uiState.value = LeadsUiState.Error(
                        error.message ?: "Failed to update lead"
                    )
                }
        }
    }

    fun deleteLead(leadId: String) {
        viewModelScope.launch {
            leadRepository.deleteLead(leadId)
                .onSuccess {
                    loadLeads()
                }
                .onFailure { error ->
                    _uiState.value = LeadsUiState.Error(
                        error.message ?: "Failed to delete lead"
                    )
                }
        }
    }

    fun convertLead(leadId: String) {
        viewModelScope.launch {
            _isProcessing.value = true
            
            leadRepository.convertLead(leadId)
                .onSuccess {
                    _isProcessing.value = false
                    loadLeads()
                }
                .onFailure { error ->
                    _isProcessing.value = false
                    _uiState.value = LeadsUiState.Error(
                        error.message ?: "Failed to convert lead"
                    )
                }
        }
    }

    fun filterByStatus(status: String?) {
        _selectedStatusFilter.value = status
        loadLeads()
    }

    fun showCreateLeadDialog() {
        _showCreateLeadDialog.value = true
    }

    fun hideCreateLeadDialog() {
        _showCreateLeadDialog.value = false
    }

    fun showEditLeadDialog(lead: Lead) {
        _selectedLead.value = lead
        _showEditLeadDialog.value = true
    }

    fun hideEditLeadDialog() {
        _showEditLeadDialog.value = false
        _selectedLead.value = null
    }

    fun showImportContactDialog() {
        _showImportContactDialog.value = true
    }

    fun hideImportContactDialog() {
        _showImportContactDialog.value = false
    }

    fun showMoveStageDialog(lead: Lead) {
        _selectedLead.value = lead
        _showMoveStageDialog.value = true
    }

    fun hideMoveStageDialog() {
        _showMoveStageDialog.value = false
        _selectedLead.value = null
    }

    fun onRetry() {
        loadLeads()
    }
}

sealed class LeadsUiState {
    object Loading : LeadsUiState()
    object Empty : LeadsUiState()
    data class Success(val leads: List<Lead>) : LeadsUiState()
    data class Error(val message: String) : LeadsUiState()
}
