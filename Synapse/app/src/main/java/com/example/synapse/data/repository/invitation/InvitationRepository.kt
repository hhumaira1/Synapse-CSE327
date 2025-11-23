package com.example.synapse.data.repository.invitation

import com.example.synapse.data.api.ApiService
import com.example.synapse.data.model.Invitation
import com.example.synapse.data.model.UserRole
import com.example.synapse.data.api.request.InviteUserRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InvitationRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getInvitations(): Result<List<Invitation>> {
        return try {
            val response = apiService.getInvitations()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch invitations: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun sendInvitation(email: String, role: UserRole): Result<Invitation> {
        return try {
            val request = InviteUserRequest(email = email, role = role.name)
            val response = apiService.sendInvitation(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to send invitation: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun cancelInvitation(invitationId: String): Result<Unit> {
        return try {
            val response = apiService.cancelInvitation(invitationId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to cancel invitation: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
