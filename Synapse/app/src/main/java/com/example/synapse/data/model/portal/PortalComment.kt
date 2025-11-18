package com.example.synapse.data.model.portal

import com.google.gson.annotations.SerializedName

data class PortalComment(
    @SerializedName("id")
    val id: String,

    @SerializedName("content")
    val content: String,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("isInternal")
    val isInternal: Boolean,

    @SerializedName("authorName")
    val authorName: String? = null
)
