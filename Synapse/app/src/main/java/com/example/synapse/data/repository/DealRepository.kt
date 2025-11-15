package com.example.synapse.data.repository

import com.example.synapse.data.api.ApiService
import com.example.synapse.data.api.request.CreateDealRequest
import com.example.synapse.data.api.request.UpdateDealRequest
import com.example.synapse.data.model.Deal
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DealRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun getDeals(pipelineId: String? = null, stageId: String? = null): Result<List<Deal>> {
        return try {
            val response = apiService.getDeals(pipelineId, stageId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch deals: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getDealById(id: String): Result<Deal> {
        return try {
            val response = apiService.getDealById(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch deal: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createDeal(request: CreateDealRequest): Result<Deal> {
        return try {
            val response = apiService.createDeal(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create deal: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateDeal(id: String, request: UpdateDealRequest): Result<Deal> {
        return try {
            val response = apiService.updateDeal(id, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update deal: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteDeal(id: String): Result<Unit> {
        return try {
            val response = apiService.deleteDeal(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete deal: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
