package com.example.synapse.data.model

data class Invitation(
    val id: String,
    val email: String,
    val role: UserRole,
    val status: InvitationStatus,
    val token: String,
    val expiresAt: String,
    val createdAt: String,
    val tenantId: String
) {
    fun isExpired(): Boolean {
        // Simple check - in production use proper date parsing
        return status == InvitationStatus.EXPIRED
    }
}

enum class InvitationStatus {
    PENDING,
    ACCEPTED,
    EXPIRED;
    
    companion object {
        fun fromString(value: String): InvitationStatus {
            return when (value.uppercase()) {
                "PENDING" -> PENDING
                "ACCEPTED" -> ACCEPTED
                "EXPIRED" -> EXPIRED
                else -> PENDING
            }
        }
    }
}
