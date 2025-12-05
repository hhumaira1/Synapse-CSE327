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
    /**
     * Get pending invitations
     * Note: Backend doesn't have a separate invitations endpoint.
     * Invitations are returned as part of team members with pending status.
     */
    suspend fun getInvitations(): Result<List<Invitation>> {
        // Invitations are fetched through team members endpoint
        // This is a placeholder that returns empty list
        return Result.success(emptyList())
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
    
    /**
     * Cancel invitation
     * Note: Backend uses DELETE /users/{id} to remove pending invitations
     */
    suspend fun cancelInvitation(invitationId: String): Result<Unit> {
        // Cancellation is done through team repository removeTeamMember
        // This is a placeholder
        return Result.success(Unit)
    }
}

