package com.example.synapse.data.repository

import com.example.synapse.data.api.ApiService
import com.example.synapse.data.model.DashboardStats
import com.example.synapse.data.api.response.RevenueForecast
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AnalyticsRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun getDashboardStats(): Result<DashboardStats> {
        return try {
            val response = apiService.getDashboardStats()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch dashboard stats: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getLeadsByStatus(): Result<Map<String, Int>> {
        return try {
            val response = apiService.getLeadsByStatus()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch leads by status: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getDealsByStage(pipelineId: String): Result<Map<String, Int>> {
        return try {
            val response = apiService.getDealsByStage(pipelineId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch deals by stage: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getTicketsByStatus(): Result<Map<String, Int>> {
        return try {
            val response = apiService.getTicketsByStatus()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch tickets by status: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getRevenueForecast(): Result<RevenueForecast> {
        return try {
            val response = apiService.getRevenueForecast()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch revenue forecast: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
