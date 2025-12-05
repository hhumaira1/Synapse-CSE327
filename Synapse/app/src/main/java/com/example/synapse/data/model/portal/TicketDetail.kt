package com.example.synapse.data.model.portal

import com.google.gson.annotations.SerializedName

data class TicketDetail(
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

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("comments")
    val comments: List<PortalComment> = emptyList()
)
