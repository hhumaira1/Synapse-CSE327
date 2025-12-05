package com.example.synapse.data.repository

import com.example.synapse.data.api.ApiService
import com.example.synapse.data.api.request.AddCommentRequest
import com.example.synapse.data.api.request.CreateTicketRequest
import com.example.synapse.data.api.request.UpdateTicketRequest
import com.example.synapse.data.model.Ticket
import com.example.synapse.data.model.TicketComment
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TicketRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun getTickets(
        status: String? = null,
        priority: String? = null,
        contactId: String? = null
    ): Result<List<Ticket>> {
        return try {
            val response = apiService.getTickets(status, priority, contactId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch tickets: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getTicketById(id: String): Result<Ticket> {
        return try {
            val response = apiService.getTicketById(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch ticket: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createTicket(request: CreateTicketRequest): Result<Ticket> {
        return try {
            val response = apiService.createTicket(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create ticket: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateTicket(id: String, request: UpdateTicketRequest): Result<Ticket> {
        return try {
            val response = apiService.updateTicket(id, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update ticket: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteTicket(id: String): Result<Unit> {
        return try {
            val response = apiService.deleteTicket(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete ticket: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun addComment(ticketId: String, content: String): Result<TicketComment> {
        return try {
            val response = apiService.addTicketComment(ticketId, AddCommentRequest(content))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to add comment: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getComments(ticketId: String): Result<List<TicketComment>> {
        return try {
            val response = apiService.getTicketComments(ticketId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch comments: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
