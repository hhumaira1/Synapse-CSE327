package com.example.synapse.presentation.pipelines

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.request.CreatePipelineRequest
import com.example.synapse.data.api.request.CreateStageRequest
import com.example.synapse.data.model.Pipeline
import com.example.synapse.data.repository.PipelineRepository
import com.example.synapse.data.repository.StageRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PipelinesViewModel @Inject constructor(
    private val pipelineRepository: PipelineRepository,
    private val stageRepository: StageRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<PipelinesUiState>(PipelinesUiState.Loading)
    val uiState: StateFlow<PipelinesUiState> = _uiState.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    private val _showCreatePipelineDialog = MutableStateFlow(false)
    val showCreatePipelineDialog: StateFlow<Boolean> = _showCreatePipelineDialog.asStateFlow()

    private val _showAddStageDialog = MutableStateFlow(false)
    val showAddStageDialog: StateFlow<Boolean> = _showAddStageDialog.asStateFlow()

    private val _selectedPipeline = MutableStateFlow<Pipeline?>(null)
    val selectedPipeline: StateFlow<Pipeline?> = _selectedPipeline.asStateFlow()

    private val _isCreatingPipeline = MutableStateFlow(false)
    val isCreatingPipeline: StateFlow<Boolean> = _isCreatingPipeline.asStateFlow()

    private val _isAddingStage = MutableStateFlow(false)
    val isAddingStage: StateFlow<Boolean> = _isAddingStage.asStateFlow()

    init {
        loadPipelines()
    }

    fun loadPipelines() {
        viewModelScope.launch {
            _uiState.value = PipelinesUiState.Loading
            
            pipelineRepository.getPipelines()
                .onSuccess { pipelines ->
                    _uiState.value = if (pipelines.isEmpty()) {
                        PipelinesUiState.Empty
                    } else {
                        PipelinesUiState.Success(pipelines)
                    }
                }
                .onFailure { error ->
                    _uiState.value = PipelinesUiState.Error(
                        error.message ?: "Failed to load pipelines"
                    )
                }
        }
    }

    fun onRefresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            
            pipelineRepository.getPipelines()
                .onSuccess { pipelines ->
                    _uiState.value = if (pipelines.isEmpty()) {
                        PipelinesUiState.Empty
                    } else {
                        PipelinesUiState.Success(pipelines)
                    }
                }
                .onFailure { error ->
                    _uiState.value = PipelinesUiState.Error(
                        error.message ?: "Failed to refresh pipelines"
                    )
                }
            
            _isRefreshing.value = false
        }
    }

    fun createPipeline(name: String, description: String) {
        viewModelScope.launch {
            _isCreatingPipeline.value = true
            
            val request = CreatePipelineRequest(
                name = name,
                description = description.ifBlank { null }
            )
            
            pipelineRepository.createPipeline(request)
                .onSuccess {
                    _isCreatingPipeline.value = false
                    _showCreatePipelineDialog.value = false
                    loadPipelines() // Reload to get updated list
                }
                .onFailure { error ->
                    _isCreatingPipeline.value = false
                    _uiState.value = PipelinesUiState.Error(
                        error.message ?: "Failed to create pipeline"
                    )
                }
        }
    }

    fun addStage(pipelineId: String, name: String, color: String) {
        viewModelScope.launch {
            _isAddingStage.value = true
            
            // Get current stages count to calculate order
            val currentPipeline = (_uiState.value as? PipelinesUiState.Success)
                ?.pipelines?.find { it.id == pipelineId }
            val nextOrder = (currentPipeline?.stages?.size ?: 0) + 1
            
            val request = CreateStageRequest(
                name = name,
                pipelineId = pipelineId,
                order = nextOrder
            )
            
            stageRepository.createStage(request)
                .onSuccess {
                    _isAddingStage.value = false
                    _showAddStageDialog.value = false
                    _selectedPipeline.value = null
                    loadPipelines() // Reload to get updated pipeline with new stage
                }
                .onFailure { error ->
                    _isAddingStage.value = false
                    _uiState.value = PipelinesUiState.Error(
                        error.message ?: "Failed to add stage"
                    )
                }
        }
    }

    fun deletePipeline(pipelineId: String) {
        viewModelScope.launch {
            pipelineRepository.deletePipeline(pipelineId)
                .onSuccess {
                    loadPipelines() // Reload after deletion
                }
                .onFailure { error ->
                    _uiState.value = PipelinesUiState.Error(
                        error.message ?: "Failed to delete pipeline"
                    )
                }
        }
    }

    fun deleteStage(stageId: String) {
        viewModelScope.launch {
            stageRepository.deleteStage(stageId)
                .onSuccess {
                    loadPipelines() // Reload to update stage list
                }
                .onFailure { error ->
                    _uiState.value = PipelinesUiState.Error(
                        error.message ?: "Failed to delete stage"
                    )
                }
        }
    }

    fun showCreatePipelineDialog() {
        _showCreatePipelineDialog.value = true
    }

    fun hideCreatePipelineDialog() {
        _showCreatePipelineDialog.value = false
    }

    fun showAddStageDialog(pipeline: Pipeline) {
        _selectedPipeline.value = pipeline
        _showAddStageDialog.value = true
    }

    fun hideAddStageDialog() {
        _showAddStageDialog.value = false
        _selectedPipeline.value = null
    }

    fun onRetry() {
        loadPipelines()
    }
}

sealed class PipelinesUiState {
    object Loading : PipelinesUiState()
    object Empty : PipelinesUiState()
    data class Success(val pipelines: List<Pipeline>) : PipelinesUiState()
    data class Error(val message: String) : PipelinesUiState()
}
