package com.example.synapse.data.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Local cache for chatbot conversations
 * Enables offline viewing of conversation history
 */
@Entity(tableName = "conversations")
data class ConversationEntity(
    @PrimaryKey
    val id: String,
    val userId: String,
    val tenantId: String,
    val createdAt: Long,
    val updatedAt: Long,
    val lastMessage: String? = null,  // For preview in list
    val messageCount: Int = 0
)
