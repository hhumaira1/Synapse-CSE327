package com.example.synapse.data.api.voip

import retrofit2.http.*

/**
 * VoipApiService
 * 
 * Retrofit interface for VoIP REST API endpoints.
 * All endpoints require Authorization: Bearer {token} header.
 * Optional X-Active-Tenant header for multi-portal users.
 */
interface VoipApiService {
    
    /**
     * POST /api/voip/start-call
     * Initiate a call
     */
    @POST("voip/start-call")
    suspend fun startCall(
        @Body request: StartCallRequest
    ): StartCallResponse
    
    /**
     * POST /api/voip/accept
     * Accept incoming call
     */
    @POST("voip/accept")
    suspend fun acceptCall(
        @Body request: AcceptCallRequest
    ): AcceptCallResponse
    
    /**
     * POST /api/voip/reject
     * Reject incoming call
     */
    @POST("voip/reject")
    suspend fun rejectCall(
        @Body request: RejectCallRequest
    ): RejectCallResponse
    
    /**
     * POST /api/voip/end
     * End active call
     */
    @POST("voip/end")
    suspend fun endCall(
        @Body request: EndCallRequest
    ): EndCallResponse
    
    /**
     * POST /api/voip/update-fcm-token
     * Update FCM token for push notifications
     */
    @POST("voip/update-fcm-token")
    suspend fun updateFCMToken(
        @Body request: UpdateFCMTokenRequest
    ): Map<String, Boolean>
    
    /**
     * GET /api/voip/available-agents
     * Get list of available agents (for portal customers)
     */
    @GET("voip/available-agents")
    suspend fun getAvailableAgents(): List<OnlineUser>
    
    /**
     * GET /api/voip/online-users
     * Get list of online users in current tenant
     */
    @GET("voip/online-users")
    suspend fun getOnlineUsers(): List<OnlineUser>
}
