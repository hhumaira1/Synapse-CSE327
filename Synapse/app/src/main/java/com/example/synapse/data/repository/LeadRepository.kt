package com.example.synapse.data.repository

import com.example.synapse.data.api.ApiService
import com.example.synapse.data.api.request.CreateLeadRequest
import com.example.synapse.data.api.request.UpdateLeadRequest
import com.example.synapse.data.api.request.ConvertLeadRequest
import com.example.synapse.data.model.Lead
import com.example.synapse.data.model.Deal
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LeadRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun getLeads(status: String? = null, source: String? = null): Result<List<Lead>> {
        return try {
            val response = apiService.getLeads(status, source)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch leads: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getLeadById(id: String): Result<Lead> {
        return try {
            val response = apiService.getLeadById(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch lead: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createLead(request: CreateLeadRequest): Result<Lead> {
        return try {
            val response = apiService.createLead(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create lead: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateLead(id: String, request: UpdateLeadRequest): Result<Lead> {
        return try {
            val response = apiService.updateLead(id, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update lead: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteLead(id: String): Result<Unit> {
        return try {
            val response = apiService.deleteLead(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete lead: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun convertLead(
        id: String,
        pipelineId: String,
        stageId: String,
        probability: Int? = null,
        expectedCloseDate: String? = null
    ): Result<Deal> {
        return try {
            val request = ConvertLeadRequest(
                pipelineId = pipelineId,
                stageId = stageId,
                probability = probability,
                expectedCloseDate = expectedCloseDate
            )
            val response = apiService.convertLead(id, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to convert lead: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
