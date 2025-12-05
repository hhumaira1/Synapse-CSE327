package com.example.synapse.data.api.response

import com.google.gson.annotations.SerializedName

/**
 * Conversation with message history
 */
data class ConversationDto(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("userId")
    val userId: String,
    
    @SerializedName("tenantId")
    val tenantId: String,
    
    @SerializedName("createdAt")
    val createdAt: String,
    
    @SerializedName("updatedAt")
    val updatedAt: String,
    
    @SerializedName("messages")
    val messages: List<MessageDto>? = null
)

data class MessageDto(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("conversationId")
    val conversationId: String,
    
    @SerializedName("role")
    val role: String,  // "user" or "assistant"
    
    @SerializedName("content")
    val content: String,
    
    @SerializedName("createdAt")
    val createdAt: String
)
