package com.example.synapse.presentation.portal.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.response.PortalAccessResponse
import com.example.synapse.data.repository.portal.PortalRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PortalDashboardState(
    val isLoading: Boolean = true,
    val portalAccess: List<PortalAccessResponse> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class PortalDashboardViewModel @Inject constructor(
    private val portalRepository: PortalRepository
) : ViewModel() {

    private val _state = MutableStateFlow(PortalDashboardState())
    val state: StateFlow<PortalDashboardState> = _state

    init {
        loadPortalAccess()
    }

    fun loadPortalAccess() {
        viewModelScope.launch {
            _state.value = PortalDashboardState(isLoading = true, error = null)

            portalRepository.getMyPortalAccess().fold(
                onSuccess = { portalAccess ->
                    _state.value = PortalDashboardState(
                        isLoading = false,
                        portalAccess = portalAccess,
                        error = null
                    )
                },
                onFailure = { error ->
                    _state.value = PortalDashboardState(
                        isLoading = false,
                        error = error.message ?: "Failed to load portal access"
                    )
                }
            )
        }
    }

    // Calculate stats for the dashboard
    fun getStats(): PortalStats {
        val portalAccess = _state.value.portalAccess
        return PortalStats(
            totalPortals = portalAccess.size,
            activePortals = portalAccess.count { it.isActive },
            totalActiveSince = portalAccess.minOfOrNull {
                java.time.Instant.parse(it.tenant.createdAt).toEpochMilli()
            }?.let { earliestDate ->
                val now = System.currentTimeMillis()
                val diffInDays = (now - earliestDate) / (1000 * 60 * 60 * 24)
                diffInDays.toInt()
            } ?: 0
        )
    }
}

data class PortalStats(
    val totalPortals: Int,
    val activePortals: Int,
    val totalActiveSince: Int // days
)
