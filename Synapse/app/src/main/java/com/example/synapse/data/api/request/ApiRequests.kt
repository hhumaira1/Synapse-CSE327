package com.example.synapse.data.api.request

import com.google.gson.annotations.SerializedName

data class OnboardRequest(
    @SerializedName("tenantName")
    val workspaceName: String,
    val workspaceType: String
)

data class CreateContactRequest(
    val firstName: String,
    val lastName: String?,
    val email: String?,
    val phone: String?,
    val company: String?,
    val jobTitle: String?,
    val address: String?,
    val city: String?,
    val country: String?,
    val linkedInUrl: String?,
    val website: String?,
    val notes: String?,
    val tags: List<String>?
)

data class UpdateContactRequest(
    val firstName: String?,
    val lastName: String?,
    val email: String?,
    val phone: String?,
    val company: String?,
    val jobTitle: String?,
    val address: String?,
    val city: String?,
    val country: String?,
    val linkedInUrl: String?,
    val website: String?,
    val notes: String?,
    val tags: List<String>?
)

data class CreateLeadRequest(
    val contactId: String,
    val title: String,
    val source: String,
    val value: Double?,
    val notes: String?,
    val status: String?
)

data class UpdateLeadRequest(
    val contactId: String?,
    val title: String?,
    val source: String?,
    val value: Double?,
    val notes: String?,
    val status: String?
)

data class ConvertLeadRequest(
    val pipelineId: String,
    val stageId: String,
    val probability: Int? = null,
    val expectedCloseDate: String? = null
)

data class CreatePipelineRequest(
    val name: String,
    val description: String?
)

data class CreateStageRequest(
    val name: String,
    val pipelineId: String,
    val order: Int?
)

data class UpdatePipelineRequest(
    val name: String?,
    val stages: List<UpdateStageRequest>?
)

data class UpdateStageRequest(
    val name: String?,
    val order: Int?,
    val color: String?
)

data class CreateDealRequest(
    val title: String,
    val contactId: String,
    val pipelineId: String,
    val stageId: String,
    val value: Double,
    val probability: Int?,
    val expectedCloseDate: String?,
    val notes: String?
)

data class UpdateDealRequest(
    val title: String?,
    val contactId: String?,
    val stageId: String?,
    val value: Double?,
    val probability: Int?,
    val expectedCloseDate: String?,
    val notes: String?,
    val status: String?
)

data class MoveStageRequest(
    val stageId: String
)

data class CreateTicketRequest(
    val title: String,
    val description: String?,
    val priority: String,
    val source: String,
    val contactId: String,
    val dealId: String?
)

data class UpdateTicketRequest(
    val title: String?,
    val description: String?,
    val status: String?,
    val priority: String?,
    val contactId: String?,
    val dealId: String?
)

data class AddCommentRequest(
    val content: String
)

data class CreateInteractionRequest(
    val type: String,
    val subject: String?,
    val description: String,
    val contactId: String?,
    val leadId: String?,
    val dealId: String?,
    val metadata: Map<String, Any>?
)

// Team Management Requests
data class InviteUserRequest(
    val email: String,
    val role: String
)

data class ChangeRoleRequest(
    val role: String
)


