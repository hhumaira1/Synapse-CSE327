package com.example.synapse.data.api.response

import com.example.synapse.data.model.User

data class OnboardResponse(
    val user: User,
    val accessToken: String
)

data class ConvertLeadResponse(
    val dealId: String,
    val message: String
)

data class RevenueForecast(
    val currentMonth: Double,
    val nextMonth: Double,
    val currentQuarter: Double,
    val nextQuarter: Double,
    val totalPipelineValue: Double
)

data class Interaction(
    val id: String,
    val type: String,
    val subject: String?,
    val description: String,
    val contactId: String?,
    val leadId: String?,
    val dealId: String?,
    val createdAt: String
)

data class UserTenantInfo(
    val id: String,
    val name: String,
    val slug: String,
    val type: String,
    val role: String,
    val userId: String
)

data class TenantBasic(
    val id: String,
    val name: String,
    val type: String,
    val createdAt: String
)

data class PortalAccessResponse(
    val id: String,
    val isActive: Boolean,
    val tenant: TenantBasic,
    val contact: ContactBasic
)

data class ContactBasic(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String?
)

data class AcceptInviteResponse(
    val message: String,
    val user: User
)

data class PortalInvitationDetails(
    val id: String,
    val isActive: Boolean,
    val alreadyAccepted: Boolean,
    val contact: ContactBasic,
    val tenant: TenantBasic
)

data class PortalLinkResponse(
    val message: String,
    val portalAccess: PortalAccessResponse
)