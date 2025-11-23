package com.example.synapse.data.database.dao

import androidx.room.*
import com.example.synapse.data.database.entity.ConversationEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for chatbot conversations with offline support
 */
@Dao
interface ConversationDao {
    
    @Query("SELECT * FROM conversations ORDER BY updatedAt DESC")
    fun getAllConversations(): Flow<List<ConversationEntity>>
    
    @Query("SELECT * FROM conversations WHERE id = :conversationId")
    suspend fun getConversationById(conversationId: String): ConversationEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConversation(conversation: ConversationEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConversations(conversations: List<ConversationEntity>)
    
    @Update
    suspend fun updateConversation(conversation: ConversationEntity)
    
    @Query("DELETE FROM conversations WHERE id = :conversationId")
    suspend fun deleteConversation(conversationId: String)
    
    @Query("DELETE FROM conversations")
    suspend fun deleteAllConversations()
    
    @Query("SELECT COUNT(*) FROM conversations")
    suspend fun getConversationCount(): Int
}
