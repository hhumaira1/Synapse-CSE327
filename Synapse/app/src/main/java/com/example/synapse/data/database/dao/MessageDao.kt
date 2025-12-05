package com.example.synapse.data.database.dao

import androidx.room.*
import com.example.synapse.data.database.entity.MessageEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for chatbot messages with offline support
 */
@Dao
interface MessageDao {
    
    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY createdAt ASC")
    fun getMessagesByConversation(conversationId: String): Flow<List<MessageEntity>>
    
    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY createdAt ASC")
    suspend fun getMessagesByConversationSync(conversationId: String): List<MessageEntity>
    
    @Query("SELECT * FROM messages WHERE id = :messageId")
    suspend fun getMessageById(messageId: String): MessageEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessages(messages: List<MessageEntity>)
    
    @Update
    suspend fun updateMessage(message: MessageEntity)
    
    @Query("DELETE FROM messages WHERE id = :messageId")
    suspend fun deleteMessage(messageId: String)
    
    @Query("DELETE FROM messages WHERE conversationId = :conversationId")
    suspend fun deleteMessagesByConversation(conversationId: String)
    
    @Query("SELECT * FROM messages WHERE isSynced = 0")
    suspend fun getUnsyncedMessages(): List<MessageEntity>
    
    @Query("SELECT * FROM messages WHERE hasError = 1")
    suspend fun getFailedMessages(): List<MessageEntity>
    
    @Query("UPDATE messages SET hasError = 0, isSynced = 1 WHERE id = :messageId")
    suspend fun markMessageAsSynced(messageId: String)
    
    @Query("UPDATE messages SET hasError = 1 WHERE id = :messageId")
    suspend fun markMessageAsFailed(messageId: String)
}
