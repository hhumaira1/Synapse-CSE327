package com.example.synapse.data.repository

import com.example.synapse.data.api.ApiService
import com.example.synapse.data.api.request.CreateStageRequest
import com.example.synapse.data.api.request.UpdateStageRequest
import com.example.synapse.data.model.Stage
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StageRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun getStages(pipelineId: String? = null): Result<List<Stage>> {
        return try {
            val response = apiService.getStages(pipelineId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch stages: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getStageById(id: String): Result<Stage> {
        return try {
            val response = apiService.getStageById(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch stage: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createStage(request: CreateStageRequest): Result<Stage> {
        return try {
            val response = apiService.createStage(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create stage: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateStage(id: String, request: UpdateStageRequest): Result<Stage> {
        return try {
            val response = apiService.updateStage(id, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update stage: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteStage(id: String): Result<Unit> {
        return try {
            val response = apiService.deleteStage(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete stage: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
