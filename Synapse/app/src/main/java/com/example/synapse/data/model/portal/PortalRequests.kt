package com.example.synapse.data.model.portal

import com.google.gson.annotations.SerializedName

data class CreateTicketRequest(
    @SerializedName("title")
    val title: String,

    @SerializedName("description")
    val description: String,

    @SerializedName("tenantId")
    val tenantId: String? = null
)

data class AddCommentRequest(
    @SerializedName("content")
    val content: String,

    @SerializedName("tenantId")
    val tenantId: String? = null
)
