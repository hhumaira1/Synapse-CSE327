package com.example.synapse.data.remote.voip

import android.util.Log
import com.example.synapse.data.api.ApiService
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Request/Response DTOs for VoIP API
 */
@Serializable
data class StartCallRequest(
    val calleeId: String,
    val callerName: String? = null
)

@Serializable
data class StartCallResponse(
    val roomName: String,
    val callerToken: String,
    val callLogId: String,
    val callEventId: String
)

@Serializable
data class AcceptCallRequest(
    val roomName: String
)

@Serializable
data class AcceptCallResponse(
    val calleeToken: String,
    val roomName: String
)

@Serializable
data class RejectCallRequest(
    val roomName: String,
    val reason: String? = null
)

@Serializable
data class EndCallRequest(
    val roomName: String
)

@Serializable
data class EndCallResponse(
    val success: Boolean,
    val duration: Int? = null
)

@Serializable
data class TokenRequest(
    val roomName: String,
    val userName: String? = null
)

@Serializable
data class TokenResponse(
    val token: String,
    val roomName: String
)

/**
 * VoipApiService
 * 
 * REST API client for VoIP endpoints.
 * Uses Retrofit to communicate with backend.
 */
@Singleton
class VoipApiService @Inject constructor(
    private val apiService: ApiService
) {
    private val tag = "VoipApiService"
    private val json = Json { ignoreUnknownKeys = true }

    /**
     * Start a call
     */
    suspend fun startCall(
        calleeId: String,
        callerName: String?
    ): Result<StartCallResponse> {
        return try {
            val request = StartCallRequest(calleeId, callerName)
            val requestBody = json.encodeToString(
                StartCallRequest.serializer(),
                request
            ).toRequestBody("application/json".toMediaType())

            val response = apiService.startCall(requestBody)
            
            if (response.isSuccessful && response.body() != null) {
                Log.d(tag, "✅ Call started successfully")
                Result.success(json.decodeFromString(response.body()!!.string()))
            } else {
                Log.e(tag, "❌ Failed to start call: ${response.code()}")
                Result.failure(Exception("Failed to start call: ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e(tag, "❌ Exception starting call: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * Accept a call
     */
    suspend fun acceptCall(roomName: String): Result<AcceptCallResponse> {
        return try {
            val request = AcceptCallRequest(roomName)
            val requestBody = json.encodeToString(
                AcceptCallRequest.serializer(),
                request
            ).toRequestBody("application/json".toMediaType())

            val response = apiService.acceptCall(requestBody)
            
            if (response.isSuccessful && response.body() != null) {
                Log.d(tag, "✅ Call accepted successfully")
                Result.success(json.decodeFromString(response.body()!!.string()))
            } else {
                Log.e(tag, "❌ Failed to accept call: ${response.code()}")
                Result.failure(Exception("Failed to accept call: ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e(tag, "❌ Exception accepting call: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * Reject a call
     */
    suspend fun rejectCall(roomName: String, reason: String?): Result<Unit> {
        return try {
            val request = RejectCallRequest(roomName, reason)
            val requestBody = json.encodeToString(
                RejectCallRequest.serializer(),
                request
            ).toRequestBody("application/json".toMediaType())

            val response = apiService.rejectCall(requestBody)
            
            if (response.isSuccessful) {
                Log.d(tag, "✅ Call rejected successfully")
                Result.success(Unit)
            } else {
                Log.e(tag, "❌ Failed to reject call: ${response.code()}")
                Result.failure(Exception("Failed to reject call: ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e(tag, "❌ Exception rejecting call: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * End a call
     */
    suspend fun endCall(roomName: String): Result<EndCallResponse> {
        return try {
            val request = EndCallRequest(roomName)
            val requestBody = json.encodeToString(
                EndCallRequest.serializer(),
                request
            ).toRequestBody("application/json".toMediaType())

            val response = apiService.endCall(requestBody)
            
            if (response.isSuccessful && response.body() != null) {
                Log.d(tag, "✅ Call ended successfully")
                Result.success(json.decodeFromString(response.body()!!.string()))
            } else {
                Log.e(tag, "❌ Failed to end call: ${response.code()}")
                Result.failure(Exception("Failed to end call: ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e(tag, "❌ Exception ending call: ${e.message}")
            Result.failure(e)
        }
    }

    /**
     * Generate LiveKit token
     */
    suspend fun generateToken(
        roomName: String,
        userName: String?
    ): Result<TokenResponse> {
        return try {
            val request = TokenRequest(roomName, userName)
            val requestBody = json.encodeToString(
                TokenRequest.serializer(),
                request
            ).toRequestBody("application/json".toMediaType())

            val response = apiService.generateVoipToken(requestBody)
            
            if (response.isSuccessful && response.body() != null) {
                Log.d(tag, "✅ Token generated successfully")
                Result.success(json.decodeFromString(response.body()!!.string()))
            } else {
                Log.e(tag, "❌ Failed to generate token: ${response.code()}")
                Result.failure(Exception("Failed to generate token: ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e(tag, "❌ Exception generating token: ${e.message}")
            Result.failure(e)
        }
    }
}
