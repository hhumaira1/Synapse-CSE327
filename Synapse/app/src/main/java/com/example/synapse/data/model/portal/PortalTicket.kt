package com.example.synapse.data.model.portal

import com.google.gson.annotations.SerializedName

data class PortalTicket(
    @SerializedName("id")
    val id: String,

    @SerializedName("title")
    val title: String,

    @SerializedName("description")
    val description: String? = null,

    @SerializedName("status")
    val status: TicketStatus,

    @SerializedName("priority")
    val priority: TicketPriority,

    @SerializedName("externalSystem")
    val externalSystem: String? = null,

    @SerializedName("externalId")
    val externalId: String? = null,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("_count")
    val count: CommentCount? = null
)

data class CommentCount(
    @SerializedName("comments")
    val comments: Int
)

enum class TicketStatus {
    @SerializedName("OPEN")
    OPEN,

    @SerializedName("IN_PROGRESS")
    IN_PROGRESS,

    @SerializedName("RESOLVED")
    RESOLVED,

    @SerializedName("CLOSED")
    CLOSED
}

enum class TicketPriority {
    @SerializedName("LOW")
    LOW,

    @SerializedName("MEDIUM")
    MEDIUM,

    @SerializedName("HIGH")
    HIGH,

    @SerializedName("URGENT")
    URGENT
}
