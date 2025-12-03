package com.example.synapse.presentation.voip

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.api.voip.OnlineUser
import com.example.synapse.data.repository.VoipRepository
import com.example.synapse.data.preferences.PreferencesManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * OnlineUsersViewModel
 * 
 * Manages the list of online users that can be called.
 * - For CRM users: shows online portal customers
 * - For Portal customers: shows available support agents
 */
@HiltViewModel
class OnlineUsersViewModel @Inject constructor(
    private val voipRepository: VoipRepository,
    private val preferencesManager: PreferencesManager
) : ViewModel() {
    
    private val tag = "OnlineUsersViewModel"
    
    // State
    private val _onlineUsers = MutableStateFlow<List<OnlineUser>>(emptyList())
    val onlineUsers: StateFlow<List<OnlineUser>> = _onlineUsers.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    private var autoRefreshJob: kotlinx.coroutines.Job? = null
    private var isPortalUserConnected = false
    
    init {
        // Start auto-refresh - default to non-portal
        startAutoRefresh()
    }
    
    /**
     * Load online users (for CRM) or available agents (for Portal)
     */
    fun loadOnlineUsers(isPortalUser: Boolean = false) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                
                // Connect WebSocket for portal users (first time only)
                if (isPortalUser && !isPortalUserConnected) {
                    connectPortalWebSocket()
                    isPortalUserConnected = true
                }
                
                Log.d(tag, "🔍 Loading ${if (isPortalUser) "available agents" else "online users"}...")
                
                val users = if (isPortalUser) {
                    // Portal customer - get available support agents
                    voipRepository.getAvailableAgents()
                } else {
                    // CRM user - get all online users (including portal customers)
                    voipRepository.getOnlineUsers()
                }
                
                _onlineUsers.value = users
                Log.d(tag, "✅ Loaded ${users.size} users")
                
            } catch (e: Exception) {
                Log.e(tag, "❌ Failed to load users", e)
                _error.value = e.message ?: "Failed to load users"
                _onlineUsers.value = emptyList()
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    /**
     * Start auto-refresh every 10 seconds
     */
    private fun startAutoRefresh(isPortalUser: Boolean = false) {
        autoRefreshJob?.cancel()
        autoRefreshJob = viewModelScope.launch {
            while (true) {
                loadOnlineUsers(isPortalUser)
                delay(10000) // 10 seconds
            }
        }
    }
    
    /**
     * Manual refresh
     */
    fun refresh(isPortalUser: Boolean = false) {
        loadOnlineUsers(isPortalUser)
    }
    
    /**
     * Connect WebSocket for portal customers
     */
    private suspend fun connectPortalWebSocket() {
        try {
            val userId = preferencesManager.getUserId()
            val tenantId = preferencesManager.getTenantId()
            
            if (userId.isNullOrEmpty() || tenantId.isNullOrEmpty()) {
                Log.w(tag, "⚠️ Cannot connect portal WebSocket: userId or tenantId is null")
                return
            }
            
            Log.d(tag, "🔌 Portal customer connecting to WebSocket: userId=$userId, tenantId=$tenantId")
            voipRepository.connectSocket(userId, tenantId)
            Log.d(tag, "✅ Portal customer WebSocket connected")
        } catch (e: Exception) {
            Log.e(tag, "❌ Failed to connect portal WebSocket: ${e.message}", e)
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        autoRefreshJob?.cancel()
        // Disconnect socket if portal user
        if (isPortalUserConnected) {
            voipRepository.disconnectSocket()
            Log.d(tag, "🔌 Portal customer WebSocket disconnected")
        }
    }
}
