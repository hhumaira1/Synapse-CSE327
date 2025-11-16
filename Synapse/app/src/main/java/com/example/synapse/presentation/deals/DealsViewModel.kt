package com.example.synapse.presentation.deals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.request.CreateDealRequest
import com.example.synapse.data.api.request.UpdateDealRequest
import com.example.synapse.data.model.Deal
import com.example.synapse.data.repository.DealRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DealsUiState(
    val deals: List<Deal> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedDeal: Deal? = null
)

@HiltViewModel
class DealsViewModel @Inject constructor(
    private val repository: DealRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(DealsUiState())
    val uiState: StateFlow<DealsUiState> = _uiState.asStateFlow()
    
    init {
        loadDeals()
    }
    
    fun loadDeals(pipelineId: String? = null, stageId: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            repository.getDeals(pipelineId, stageId)
                .onSuccess { deals ->
                    _uiState.value = _uiState.value.copy(
                        deals = deals,
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
    
    fun loadDealById(id: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            repository.getDealById(id)
                .onSuccess { deal ->
                    _uiState.value = _uiState.value.copy(
                        selectedDeal = deal,
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
    
    fun createDeal(request: CreateDealRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            repository.createDeal(request)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    loadDeals()
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
    
    fun updateDeal(id: String, request: UpdateDealRequest, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            repository.updateDeal(id, request)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    loadDeals()
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
    
    fun deleteDeal(id: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            repository.deleteDeal(id)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    loadDeals()
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
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
