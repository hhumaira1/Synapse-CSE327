package com.example.synapse.data.api

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "synapse_prefs")

class AuthInterceptor @Inject constructor(
    @ApplicationContext private val context: Context
) : Interceptor {
    
    companion object {
        val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
    }
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking {
            context.dataStore.data.map { preferences ->
                preferences[ACCESS_TOKEN_KEY]
            }.first()
        }
        
        val request = if (token != null) {
            chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }
        
        return chain.proceed(request)
    }
}
