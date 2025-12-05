package com.example.synapse.di

import android.content.Context
import androidx.room.Room
import com.example.synapse.data.database.ChatDatabase
import com.example.synapse.data.database.dao.ConversationDao
import com.example.synapse.data.database.dao.MessageDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    @Provides
    @Singleton
    fun provideChatDatabase(
        @ApplicationContext context: Context
    ): ChatDatabase {
        return Room.databaseBuilder(
            context,
            ChatDatabase::class.java,
            "synapse_chat.db"
        )
            .fallbackToDestructiveMigration()  // For development, use proper migrations in production
            .build()
    }
    
    @Provides
    fun provideConversationDao(database: ChatDatabase): ConversationDao {
        return database.conversationDao()
    }
    
    @Provides
    fun provideMessageDao(database: ChatDatabase): MessageDao {
        return database.messageDao()
    }
}
