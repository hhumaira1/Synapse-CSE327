package com.example.synapse.data.model

data class User(
    val id: String,
    val supabaseId: String,
    val email: String,
    val firstName: String?,
    val lastName: String?,
    val role: UserRole,
    val tenantId: String,
    val isActive: Boolean,
    val createdAt: String
)

enum class UserRole {
    ADMIN,
    MANAGER,
    MEMBER
}

data class Tenant(
    val id: String,
    val name: String,
    val type: String,
    val createdAt: String
)

data class DashboardStats(
    val totalContacts: Int,
    val totalLeads: Int,
    val totalDeals: Int,
    val totalTickets: Int,
    val totalPipelineValue: Double,
    val openTickets: Int,
    val inProgressTickets: Int
)
