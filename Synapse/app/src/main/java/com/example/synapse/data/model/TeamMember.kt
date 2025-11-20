package com.example.synapse.data.model

data class TeamMember(
    val id: String,
    val email: String,
    val firstName: String?,
    val lastName: String?,
    val role: UserRole,
    val tenantId: String,
    val createdAt: String,
    val updatedAt: String
) {
    val fullName: String
        get() = listOfNotNull(firstName, lastName).joinToString(" ").ifBlank { email }
    
    val initials: String
        get() = buildString {
            firstName?.firstOrNull()?.let { append(it.uppercase()) }
            lastName?.firstOrNull()?.let { append(it.uppercase()) }
        }.ifBlank { email.take(2).uppercase() }
}
