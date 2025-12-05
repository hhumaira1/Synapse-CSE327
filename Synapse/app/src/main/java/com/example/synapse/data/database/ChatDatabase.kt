package com.example.synapse.data.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.example.synapse.data.database.dao.ConversationDao
import com.example.synapse.data.database.dao.MessageDao
import com.example.synapse.data.database.entity.ConversationEntity
import com.example.synapse.data.database.entity.MessageEntity

/**
 * Room Database for offline chatbot support
 * Version 1: Initial schema with conversations and messages
 */
@Database(
    entities = [
        ConversationEntity::class,
        MessageEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class ChatDatabase : RoomDatabase() {
    abstract fun conversationDao(): ConversationDao
    abstract fun messageDao(): MessageDao
}
