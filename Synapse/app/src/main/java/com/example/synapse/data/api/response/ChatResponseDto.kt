package com.example.synapse.data.api.response

import com.google.gson.annotations.SerializedName

/**
 * Response from chatbot with AI-generated message and suggested actions
 */
data class ChatResponseDto(
    @SerializedName("response")
    val response: String,
    
    @SerializedName("conversationId")
    val conversationId: String,
    
    @SerializedName("suggestedActions")
    val suggestedActions: List<SuggestedActionDto>? = null
)

data class SuggestedActionDto(
    @SerializedName("label")
    val label: String,
    
    @SerializedName("prompt")  // Server sends "prompt", not "action"
    val action: String,
    
    @SerializedName("icon")
    val icon: String? = null,
    
    @SerializedName("category")
    val category: String? = null
)
