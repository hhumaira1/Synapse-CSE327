package com.example.synapse.data.model

data class Ticket(
    val id: String,
    val title: String,
    val description: String,
    val status: TicketStatus,
    val priority: TicketPriority,
    val source: TicketSource,
    val contactId: String?,
    val contactName: String?,
    val dealId: String?,
    val assignedUserId: String?,
    val assignedUserName: String?,
    val portalCustomerId: String?,
    val externalSystem: String?,
    val externalId: String?,
    val submittedByPortalCustomer: Boolean,
    val comments: List<TicketComment>?,
    val createdAt: String,
    val updatedAt: String
)

data class TicketComment(
    val id: String,
    val content: String,
    val ticketId: String,
    val userId: String?,
    val userName: String?,
    val authorName: String?,
    val isInternal: Boolean,
    val createdAt: String
)

enum class TicketStatus {
    OPEN,
    IN_PROGRESS,
    RESOLVED,
    CLOSED
}

enum class TicketPriority {
    LOW,
    MEDIUM,
    HIGH,
    URGENT
}

enum class TicketSource {
    INTERNAL,
    PORTAL,
    EMAIL,
    PHONE,
    API
}
