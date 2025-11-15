package com.example.synapse.data.repository

import com.example.synapse.data.api.ApiService
import com.example.synapse.data.api.request.CreatePipelineRequest
import com.example.synapse.data.api.request.UpdatePipelineRequest
import com.example.synapse.data.model.Pipeline
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PipelineRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun getPipelines(): Result<List<Pipeline>> {
        return try {
            val response = apiService.getPipelines()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch pipelines: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getPipelineById(id: String): Result<Pipeline> {
        return try {
            val response = apiService.getPipelineById(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch pipeline: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createPipeline(request: CreatePipelineRequest): Result<Pipeline> {
        return try {
            val response = apiService.createPipeline(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create pipeline: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updatePipeline(id: String, request: UpdatePipelineRequest): Result<Pipeline> {
        return try {
            val response = apiService.updatePipeline(id, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update pipeline: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deletePipeline(id: String): Result<Unit> {
        return try {
            val response = apiService.deletePipeline(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete pipeline: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
