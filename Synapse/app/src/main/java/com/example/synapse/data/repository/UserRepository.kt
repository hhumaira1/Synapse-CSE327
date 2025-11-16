package com.example.synapse.data.repository

import android.util.Log
import com.example.synapse.data.api.ApiService
import com.example.synapse.data.model.User
import com.example.synapse.data.preferences.PreferencesManager
import javax.inject.Inject
import javax.inject.Singleton

data class TenantInfo(
    val id: String,
    val name: String,
    val type: String,
    val role: String,
    val createdAt: String
)

data class PortalAccessInfo(
    val id: String,
    val tenantName: String,
    val contactName: String,
    val isActive: Boolean
)

data class MyWorkspaces(
    val tenants: List<TenantInfo>,
    val portalAccess: List<PortalAccessInfo>
)

@Singleton
class UserRepository @Inject constructor(
    private val apiService: ApiService,
    private val preferencesManager: PreferencesManager
) {
    
    /**
     * Get current user details from backend
     * Includes tenant information and role
     */
    suspend fun getUserDetails(): Result<User> {
        return try {
            val response = apiService.getCurrentUser()
            if (response.isSuccessful && response.body() != null) {
                val user = response.body()!!
                // Save user data to preferences
                preferencesManager.saveTenantId(user.tenantId)
                preferencesManager.saveUserRole(user.role.name)
                preferencesManager.saveUserId(user.id)
                preferencesManager.saveUserEmail(user.email)
                
                val userName = "${user.firstName ?: ""} ${user.lastName ?: ""}".trim()
                if (userName.isNotEmpty()) {
                    preferencesManager.saveUserName(userName)
                }
                
                Log.d("UserRepository", "User details loaded: ${user.id}, tenant: ${user.tenantId}")
                Result.success(user)
            } else {
                val errorBody = response.errorBody()?.string()
                Log.e("UserRepository", "Failed to get user details: $errorBody")
                Result.failure(Exception(errorBody ?: "Failed to get user details"))
            }
        } catch (e: Exception) {
            Log.e("UserRepository", "Error getting user details", e)
            Result.failure(e)
        }
    }
    
    /**
     * Get all workspaces user has access to
     * Returns both tenant memberships and portal customer access
     */
    suspend fun getMyWorkspaces(): Result<MyWorkspaces> {
        return try {
            // Get tenant workspaces
            val tenantsResponse = apiService.getMyTenants()
            val tenants = if (tenantsResponse.isSuccessful && tenantsResponse.body() != null) {
                tenantsResponse.body()!!.map { tenant ->
                    TenantInfo(
                        id = tenant.tenant.id,
                        name = tenant.tenant.name,
                        type = tenant.tenant.type,
                        role = tenant.role,
                        createdAt = tenant.tenant.createdAt
                    )
                }
            } else {
                emptyList()
            }
            
            // Get portal customer access
            val portalResponse = apiService.getMyPortalAccess()
            val portalAccess = if (portalResponse.isSuccessful && portalResponse.body() != null) {
                portalResponse.body()!!.map { access ->
                    PortalAccessInfo(
                        id = access.id,
                        tenantName = access.tenant.name,
                        contactName = "${access.contact.firstName} ${access.contact.lastName}",
                        isActive = access.isActive
                    )
                }
            } else {
                emptyList()
            }
            
            Log.d("UserRepository", "Workspaces loaded - Tenants: ${tenants.size}, Portal: ${portalAccess.size}")
            Result.success(MyWorkspaces(tenants, portalAccess))
        } catch (e: Exception) {
            Log.e("UserRepository", "Error getting workspaces", e)
            Result.failure(e)
        }
    }
    
    /**
     * Check if user needs onboarding (no workspace yet)
     */
    suspend fun needsOnboarding(): Boolean {
        return try {
            val response = apiService.getCurrentUser()
            // If user doesn't exist in backend, needs onboarding
            !response.isSuccessful || response.body() == null
        } catch (e: Exception) {
            Log.w("UserRepository", "Error checking onboarding status", e)
            true // Assume needs onboarding if check fails
        }
    }
    
    /**
     * Check if user has multiple workspace access
     */
    suspend fun hasMultipleWorkspaces(): Boolean {
        return try {
            val workspaces = getMyWorkspaces()
            if (workspaces.isSuccess) {
                val data = workspaces.getOrNull()!!
                (data.tenants.size + data.portalAccess.size) > 1
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e("UserRepository", "Error checking multiple workspaces", e)
            false
        }
    }
    
    /**
     * Clear all user data from preferences
     */
    suspend fun clearUserData() {
        preferencesManager.clearAll()
        Log.d("UserRepository", "User data cleared")
    }
}
