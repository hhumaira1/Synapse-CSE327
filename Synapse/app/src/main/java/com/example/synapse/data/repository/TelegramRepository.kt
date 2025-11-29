package com.example.synapse.data.repository

import com.example.synapse.data.api.ApiService
import com.example.synapse.data.model.TelegramLinkResponse
import com.example.synapse.data.model.TelegramStatusResponse
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TelegramRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    /**
     * Generate a deep link for Telegram account linking
     */
    suspend fun generateLink(): Result<TelegramLinkResponse> {
        return try {
            val response = apiService.generateTelegramLink()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to generate link"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Check Telegram connection status
     */
    suspend fun getStatus(): Result<TelegramStatusResponse> {
        return try {
            val response = apiService.getTelegramStatus()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to get status"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Disconnect Telegram account
     */
    suspend fun disconnect(): Result<Unit> {
        return try {
            val response = apiService.disconnectTelegram()
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Failed to disconnect"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
