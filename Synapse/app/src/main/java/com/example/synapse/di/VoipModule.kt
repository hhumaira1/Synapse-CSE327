package com.example.synapse.di

import com.example.synapse.data.api.voip.VoipApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

/**
 * VoipModule
 * 
 * Hilt module providing VoIP-related dependencies.
 */
@Module
@InstallIn(SingletonComponent::class)
object VoipModule {
    
    /**
     * Provide VoipApiService
     * Uses existing Retrofit instance from AppModule
     */
    @Provides
    @Singleton
    fun provideVoipApiService(retrofit: Retrofit): VoipApiService {
        return retrofit.create(VoipApiService::class.java)
    }
}
