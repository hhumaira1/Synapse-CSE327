package com.example.synapse.data.repository.portal

import com.example.synapse.data.api.portal.PortalApiService
import com.example.synapse.data.api.response.PortalAccessResponse
import com.example.synapse.data.api.response.PortalInvitationDetails
import com.example.synapse.data.api.response.PortalLinkResponse
import com.example.synapse.data.model.portal.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PortalRepository @Inject constructor(
    private val portalApiService: PortalApiService
) {

    // ========== Portal Customer Access ==========
    suspend fun getMyPortalAccess(): Result<List<PortalAccessResponse>> {
        return try {
            val response = portalApiService.getMyPortalAccess()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch portal access: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPortalInvitation(accessToken: String): Result<PortalInvitationDetails> {
        return try {
            val response = portalApiService.getPortalInvitation(accessToken)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch invitation: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun linkPortalCustomer(accessToken: String): Result<PortalLinkResponse> {
        return try {
            val response = portalApiService.linkPortalCustomer(accessToken)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to link portal account: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ========== Portal Tickets ==========
    suspend fun getTickets(tenantId: String? = null): Result<List<PortalTicket>> {
        return try {
            val response = portalApiService.getTickets(tenantId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch tickets: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createTicket(request: CreateTicketRequest): Result<PortalTicket> {
        return try {
            val response = portalApiService.createTicket(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create ticket: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTicketDetail(id: String, tenantId: String? = null): Result<TicketDetail> {
        return try {
            val response = portalApiService.getTicketDetail(id, tenantId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch ticket details: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun addComment(ticketId: String, request: AddCommentRequest): Result<PortalComment> {
        return try {
            val response = portalApiService.addComment(ticketId, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to add comment: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
