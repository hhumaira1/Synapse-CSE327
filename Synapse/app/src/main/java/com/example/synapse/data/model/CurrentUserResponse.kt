package com.example.synapse.data.model

import com.google.gson.annotations.SerializedName

/**
 * Response model for /api/auth/me endpoint
 * Matches the backend response structure with nested dbUser
 */
data class CurrentUserResponse(
    val supabaseUser: SupabaseUser,
    val dbUser: DbUser
)

data class SupabaseUser(
    val id: String,
    val email: String
    // Add other supabase fields as needed
)

data class DbUser(
    val id: String,
    val tenantId: String,
    val supabaseUserId: String,
    val email: String,
    val firstName: String?,
    val lastName: String?,
    val name: String?,
    val avatarUrl: String?, // Google OAuth profile picture
    @SerializedName("role")
    val roleString: String?,  // Backend sends "ADMIN" as string
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String
) {
    // Convert string role to enum
    val role: UserRole? get() = try {
        roleString?.let { UserRole.valueOf(it) }
    } catch (e: Exception) {
        null
    }
}
