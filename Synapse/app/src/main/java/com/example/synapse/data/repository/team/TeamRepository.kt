package com.example.synapse.data.repository.team

import com.example.synapse.data.api.ApiService
import com.example.synapse.data.model.TeamMember
import com.example.synapse.data.model.UserRole
import com.example.synapse.data.api.request.ChangeRoleRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TeamRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getTeamMembers(): Result<List<TeamMember>> {
        return try {
            val response = apiService.getTeamMembers()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch team members: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun removeTeamMember(userId: String): Result<Unit> {
        return try {
            val response = apiService.removeTeamMember(userId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to remove team member: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun changeUserRole(userId: String, newRole: UserRole): Result<TeamMember> {
        return try {
            val request = ChangeRoleRequest(role = newRole.name)
            val response = apiService.changeUserRole(userId, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to change user role: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
