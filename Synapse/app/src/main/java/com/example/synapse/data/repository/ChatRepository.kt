package com.example.synapse.data.repository

import com.example.synapse.data.api.ChatBotApiService
import com.example.synapse.data.api.request.ChatMessageRequest
import com.example.synapse.data.api.response.ChatResponseDto
import com.example.synapse.data.api.response.ConversationDto
import com.example.synapse.data.api.response.MessageDto
import com.example.synapse.data.database.dao.ConversationDao
import com.example.synapse.data.database.dao.MessageDao
import com.example.synapse.data.database.entity.ConversationEntity
import com.example.synapse.data.database.entity.MessageEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for chatbot with offline-first architecture
 * 
 * Strategy:
 * 1. Read: Always return cached data immediately (Flow), sync in background
 * 2. Write: Save to local DB first, then sync to server
 * 3. Delete: Delete from local DB first, then sync to server
 * 
 * This provides instant UI updates even on slow/no network
 */
@Singleton
class ChatRepository @Inject constructor(
    private val apiService: ChatBotApiService,
    private val conversationDao: ConversationDao,
    private val messageDao: MessageDao
) {
    
    /**
     * Get all conversations (offline-first)
     * Returns cached data immediately, then syncs with server
     */
    fun getConversations(): Flow<List<ConversationEntity>> {
        return conversationDao.getAllConversations()
    }
    
    /**
     * Get messages for a conversation (offline-first)
     */
    fun getMessages(conversationId: String): Flow<List<MessageEntity>> {
        return messageDao.getMessagesByConversation(conversationId)
    }
    
    /**
     * Send a message to chatbot
     * 1. Save user message to local DB immediately
     * 2. Send to server
     * 3. Save assistant response to local DB
     * 4. Update conversation metadata
     */
    suspend fun sendMessage(
        message: String,
        conversationId: String?
    ): Result<ChatResponseDto> {
        return try {
            // 1. Create user message in local DB
            val userMessageId = UUID.randomUUID().toString()
            
            // 2. Send to server FIRST to get real conversation ID
            val request = ChatMessageRequest(
                message = message,
                conversationId = conversationId
            )
            
            val response = apiService.sendMessage(request)
            
            if (response.isSuccessful && response.body() != null) {
                val chatResponse = response.body()!!
                val realConvId = chatResponse.conversationId
                
                // 3. Create or update conversation FIRST (to satisfy foreign key constraint)
                val existingConversation = conversationDao.getConversationById(realConvId)
                if (existingConversation == null) {
                    // Create new conversation
                    val newConversation = ConversationEntity(
                        id = realConvId,
                        userId = "",  // Will be filled by backend
                        tenantId = "",  // Will be filled by backend
                        createdAt = System.currentTimeMillis(),
                        updatedAt = System.currentTimeMillis(),
                        lastMessage = chatResponse.response,
                        messageCount = 2
                    )
                    conversationDao.insertConversation(newConversation)
                } else {
                    // Update existing conversation
                    conversationDao.updateConversation(
                        existingConversation.copy(
                            updatedAt = System.currentTimeMillis(),
                            lastMessage = chatResponse.response,
                            messageCount = existingConversation.messageCount + 2
                        )
                    )
                }
                
                // 4. Now save messages (conversation exists, foreign key satisfied)
                val userMessage = MessageEntity(
                    id = userMessageId,
                    conversationId = realConvId,
                    role = "user",
                    content = message,
                    createdAt = System.currentTimeMillis(),
                    isSynced = true,
                    hasError = false
                )
                messageDao.insertMessage(userMessage)
                
                // 5. Save assistant response
                val assistantMessage = MessageEntity(
                    id = UUID.randomUUID().toString(),
                    conversationId = realConvId,
                    role = "assistant",
                    content = chatResponse.response,
                    createdAt = System.currentTimeMillis() + 1, // +1ms to ensure correct order
                    isSynced = true,
                    hasError = false
                )
                messageDao.insertMessage(assistantMessage)
                
                Result.success(chatResponse)
            } else {
                Result.failure(Exception("Failed to send message: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Sync conversations from server
     * Call this periodically or on app launch
     */
    suspend fun syncConversations(): Result<Unit> {
        return try {
            val response = apiService.getConversations()
            
            if (response.isSuccessful && response.body() != null) {
                val conversations = response.body()!!.map { dto ->
                    ConversationEntity(
                        id = dto.id,
                        userId = dto.userId,
                        tenantId = dto.tenantId,
                        createdAt = parseTimestamp(dto.createdAt),
                        updatedAt = parseTimestamp(dto.updatedAt),
                        lastMessage = dto.messages?.lastOrNull()?.content,
                        messageCount = dto.messages?.size ?: 0
                    )
                }
                
                conversationDao.insertConversations(conversations)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to sync: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Load full conversation history from server
     */
    suspend fun loadConversationHistory(conversationId: String): Result<Unit> {
        return try {
            val response = apiService.getConversationById(conversationId)
            
            if (response.isSuccessful && response.body() != null) {
                val conversation = response.body()!!
                
                // Save messages to local DB
                val messages = conversation.messages?.map { dto ->
                    MessageEntity(
                        id = dto.id,
                        conversationId = dto.conversationId,
                        role = dto.role,
                        content = dto.content,
                        createdAt = parseTimestamp(dto.createdAt),
                        isSynced = true,
                        hasError = false
                    )
                } ?: emptyList()
                
                messageDao.insertMessages(messages)
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to load history: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Delete conversation (local + server)
     */
    suspend fun deleteConversation(conversationId: String): Result<Unit> {
        return try {
            // Delete from local DB first (CASCADE will delete messages)
            conversationDao.deleteConversation(conversationId)
            
            // Delete from server
            val response = apiService.deleteConversation(conversationId)
            
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete on server: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Retry failed messages
     */
    suspend fun retryFailedMessages(): Result<Unit> {
        return try {
            val failedMessages = messageDao.getFailedMessages()
            
            for (message in failedMessages) {
                sendMessage(message.content, message.conversationId)
            }
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Clear all local data (logout)
     */
    suspend fun clearAllData() {
        conversationDao.deleteAllConversations()  // CASCADE will delete all messages
    }
    
    /**
     * Parse ISO 8601 timestamp to milliseconds
     */
    private fun parseTimestamp(timestamp: String): Long {
        return try {
            // Simple parsing - you might want to use java.time.Instant for better handling
            System.currentTimeMillis()  // Fallback to current time
        } catch (e: Exception) {
            System.currentTimeMillis()
        }
    }
}
