package com.example.synapse.data.api.voip

/**
 * VoIP API Request/Response DTOs
 */

// ========== Request DTOs ==========

data class StartCallRequest(
    val calleeSupabaseId: String,
    val callerName: String? = null
)

data class AcceptCallRequest(
    val callLogId: String,
    val roomName: String
)

data class RejectCallRequest(
    val callLogId: String,
    val reason: String? = null
)

data class EndCallRequest(
    val callLogId: String,
    val roomName: String
)

data class UpdateFCMTokenRequest(
    val fcmToken: String
)

// ========== Response DTOs ==========

data class StartCallResponse(
    val roomName: String,
    val callerToken: String,
    val callLogId: String,
    val calleeInfo: CalleeInfo
)

data class CalleeInfo(
    val name: String
)

data class AcceptCallResponse(
    val calleeToken: String,
    val roomName: String
)

data class RejectCallResponse(
    val success: Boolean
)

data class EndCallResponse(
    val success: Boolean,
    val duration: Int
)

data class OnlineUser(
    val id: String,
    val supabaseUserId: String? = null, // For CRM users, this is the Supabase ID
    val name: String,
    val email: String,
    val type: String, // "CRM_USER" or "PORTAL_CUSTOMER"
    val role: String?,
    val status: String,
    val lastSeen: String?
)
