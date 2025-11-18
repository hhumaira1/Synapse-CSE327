package com.example.synapse.presentation.deals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.request.CreateDealRequest
import com.example.synapse.data.api.request.UpdateDealRequest
import com.example.synapse.data.model.*
import com.example.synapse.data.repository.DealRepository
import com.example.synapse.data.repository.PipelineRepository
import com.example.synapse.data.repository.ContactRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class DealsUiState {
    object Loading : DealsUiState()
    object Empty : DealsUiState()
    data class Success(val deals: List<Deal>) : DealsUiState()
    data class Error(val message: String) : DealsUiState()
}

@HiltViewModel
class DealsViewModel @Inject constructor(
    private val dealRepository: DealRepository,
    private val pipelineRepository: PipelineRepository,
    private val contactRepository: ContactRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<DealsUiState>(DealsUiState.Loading)
    val uiState: StateFlow<DealsUiState> = _uiState.asStateFlow()

    private val _pipelines = MutableStateFlow<List<Pipeline>>(emptyList())
    val pipelines: StateFlow<List<Pipeline>> = _pipelines.asStateFlow()

    private val _selectedPipelineId = MutableStateFlow<String?>(null)
    val selectedPipelineId: StateFlow<String?> = _selectedPipelineId.asStateFlow()

    private val _pipelineStats = MutableStateFlow<PipelineStats?>(null)
    val pipelineStats: StateFlow<PipelineStats?> = _pipelineStats.asStateFlow()

    private val _availableContacts = MutableStateFlow<List<Contact>>(emptyList())
    val availableContacts: StateFlow<List<Contact>> = _availableContacts.asStateFlow()

    private val _showCreateDialog = MutableStateFlow(false)
    val showCreateDialog: StateFlow<Boolean> = _showCreateDialog.asStateFlow()

    private val _showEditDialog = MutableStateFlow(false)
    val showEditDialog: StateFlow<Boolean> = _showEditDialog.asStateFlow()

    private val _showMoveDialog = MutableStateFlow(false)
    val showMoveDialog: StateFlow<Boolean> = _showMoveDialog.asStateFlow()

    private val _selectedDeal = MutableStateFlow<Deal?>(null)
    val selectedDeal: StateFlow<Deal?> = _selectedDeal.asStateFlow()

    private val _isProcessing = MutableStateFlow(false)
    val isProcessing: StateFlow<Boolean> = _isProcessing.asStateFlow()
    
    init {
        loadPipelines()
        loadContacts()
    }
    
    private fun loadPipelines() {
        viewModelScope.launch {
            pipelineRepository.getPipelines()
                .onSuccess { pipelines ->
                    _pipelines.value = pipelines
                    if (pipelines.isNotEmpty() && _selectedPipelineId.value == null) {
                        selectPipeline(pipelines.first().id)
                    }
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

    fun selectPipeline(pipelineId: String) {
        _selectedPipelineId.value = pipelineId
        loadDeals(pipelineId)
        loadStats(pipelineId)
    }
    
    private fun loadDeals(pipelineId: String) {
        viewModelScope.launch {
            _uiState.value = DealsUiState.Loading
            
            dealRepository.getDeals(pipelineId = pipelineId)
                .onSuccess { deals ->
                    _uiState.value = if (deals.isEmpty()) {
                        DealsUiState.Empty
                    } else {
                        DealsUiState.Success(deals)
                    }
                }
                .onFailure { error ->
                    _uiState.value = DealsUiState.Error(
                        error.message ?: "Failed to load deals"
                    )
                }
        }
    }

    private fun loadStats(pipelineId: String) {
        viewModelScope.launch {
            dealRepository.getStats(pipelineId)
                .onSuccess { stats ->
                    _pipelineStats.value = stats
                }
                .onFailure {
                    _pipelineStats.value = null
                }
        }
    }

    fun reloadCurrentPipeline() {
        _selectedPipelineId.value?.let { pipelineId ->
            loadDeals(pipelineId)
            loadStats(pipelineId)
        }
    }
    
    fun createDeal(
        title: String,
        contactId: String,
        pipelineId: String,
        stageId: String,
        value: Double,
        probability: Int,
        expectedCloseDate: String?,
        notes: String?
    ) {
        viewModelScope.launch {
            _isProcessing.value = true
            
            val request = CreateDealRequest(
                title = title,
                contactId = contactId,
                pipelineId = pipelineId,
                stageId = stageId,
                value = value,
                probability = probability,
                expectedCloseDate = expectedCloseDate,
                notes = notes
            )
            
            dealRepository.createDeal(request)
                .onSuccess {
                    _isProcessing.value = false
                    _showCreateDialog.value = false
                    reloadCurrentPipeline()
                }
                .onFailure { error ->
                    _isProcessing.value = false
                    _uiState.value = DealsUiState.Error(
                        error.message ?: "Failed to create deal"
                    )
                }
        }
    }
    
    fun updateDeal(
        dealId: String,
        title: String,
        stageId: String,
        value: Double,
        probability: Int,
        expectedCloseDate: String?,
        notes: String?
    ) {
        viewModelScope.launch {
            _isProcessing.value = true
            
            val request = UpdateDealRequest(
                title = title,
                contactId = null,
                stageId = stageId,
                value = value,
                probability = probability,
                expectedCloseDate = expectedCloseDate,
                notes = notes,
                status = null
            )
            
            dealRepository.updateDeal(dealId, request)
                .onSuccess {
                    _isProcessing.value = false
                    _showEditDialog.value = false
                    _selectedDeal.value = null
                    reloadCurrentPipeline()
                }
                .onFailure { error ->
                    _isProcessing.value = false
                    _uiState.value = DealsUiState.Error(
                        error.message ?: "Failed to update deal"
                    )
                }
        }
    }

    fun moveDealToStage(dealId: String, stageId: String) {
        viewModelScope.launch {
            _isProcessing.value = true
            
            dealRepository.moveDealToStage(dealId, stageId)
                .onSuccess {
                    _isProcessing.value = false
                    _showMoveDialog.value = false
                    _selectedDeal.value = null
                    reloadCurrentPipeline()
                }
                .onFailure { error ->
                    _isProcessing.value = false
                    _uiState.value = DealsUiState.Error(
                        error.message ?: "Failed to move deal"
                    )
                }
        }
    }
    
    fun deleteDeal(dealId: String) {
        viewModelScope.launch {
            dealRepository.deleteDeal(dealId)
                .onSuccess {
                    reloadCurrentPipeline()
                }
                .onFailure { error ->
                    _uiState.value = DealsUiState.Error(
                        error.message ?: "Failed to delete deal"
                    )
                }
        }
    }

    fun showCreateDialog() {
        _showCreateDialog.value = true
    }

    fun hideCreateDialog() {
        _showCreateDialog.value = false
    }

    fun showEditDialog(deal: Deal) {
        _selectedDeal.value = deal
        _showEditDialog.value = true
    }

    fun hideEditDialog() {
        _showEditDialog.value = false
        _selectedDeal.value = null
    }

    fun showMoveDialog(deal: Deal) {
        _selectedDeal.value = deal
        _showMoveDialog.value = true
    }

    fun hideMoveDialog() {
        _showMoveDialog.value = false
        _selectedDeal.value = null
    }
    
    fun onRetry() {
        _selectedPipelineId.value?.let { pipelineId ->
            loadDeals(pipelineId)
        }
    }
}
