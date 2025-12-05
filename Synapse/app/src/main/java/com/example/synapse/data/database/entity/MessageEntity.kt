package com.example.synapse.data.database.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Local cache for chatbot messages
 * Foreign key ensures CASCADE deletion when conversation is deleted
 */
@Entity(
    tableName = "messages",
    foreignKeys = [
        ForeignKey(
            entity = ConversationEntity::class,
            parentColumns = ["id"],
            childColumns = ["conversationId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["conversationId"])]
)
data class MessageEntity(
    @PrimaryKey
    val id: String,
    val conversationId: String,
    val role: String,  // "user" or "assistant"
    val content: String,
    val createdAt: Long,
    val isSynced: Boolean = true,  // false if waiting to upload (offline mode)
    val hasError: Boolean = false  // true if send failed (for retry)
)
