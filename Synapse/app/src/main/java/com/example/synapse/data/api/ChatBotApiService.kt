package com.example.synapse.data.api

import com.example.synapse.data.api.request.ChatMessageRequest
import com.example.synapse.data.api.response.ChatResponseDto
import com.example.synapse.data.api.response.ConversationDto
import retrofit2.Response
import retrofit2.http.*

/**
 * API service for AI Chatbot integration
 * Uses the same backend ChatbotService as web and Telegram
 */
interface ChatBotApiService {
    
    /**
     * Send a message to the AI chatbot
     * POST /api/chatbot/chat
     */
    @POST("chatbot/chat")
    suspend fun sendMessage(
        @Body request: ChatMessageRequest
    ): Response<ChatResponseDto>
    
    /**
     * Get all conversations for the current user
     * GET /api/chatbot/conversations
     */
    @GET("chatbot/conversations")
    suspend fun getConversations(): Response<List<ConversationDto>>
    
    /**
     * Get a specific conversation with full message history
     * GET /api/chatbot/conversations/:id
     */
    @GET("chatbot/conversations/{id}")
    suspend fun getConversationById(
        @Path("id") conversationId: String
    ): Response<ConversationDto>
    
    /**
     * Delete a conversation
     * DELETE /api/chatbot/conversations/:id
     */
    @DELETE("chatbot/conversations/{id}")
    suspend fun deleteConversation(
        @Path("id") conversationId: String
    ): Response<Unit>
}
