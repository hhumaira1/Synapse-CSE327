package com.example.synapse.data.api.request

import com.google.gson.annotations.SerializedName

/**
 * Request body for sending a message to the chatbot
 */
data class ChatMessageRequest(
    @SerializedName("message")
    val message: String,
    
    @SerializedName("conversationId")
    val conversationId: String? = null  // null = create new conversation
)
