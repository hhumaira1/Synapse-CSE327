package com.example.synapse

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * SynapseCRM Application class with Hilt dependency injection.
 * This class is the entry point for the Android application.
 */
@HiltAndroidApp
class SynapseApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // Initialize any app-wide configurations here
        // Supabase will be initialized in the auth module when needed
    }
}