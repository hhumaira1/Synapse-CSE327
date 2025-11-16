package com.example.synapse.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

// Singleton DataStore instance - shared across app
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_prefs")

@Singleton
class PreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore
    
    companion object {
        private val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
        private val TENANT_ID_KEY = stringPreferencesKey("tenant_id")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USER_ROLE_KEY = stringPreferencesKey("user_role")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
    }
    
    val accessToken: Flow<String?> = dataStore.data.map { prefs ->
        prefs[ACCESS_TOKEN_KEY]
    }
    
    val tenantId: Flow<String?> = dataStore.data.map { prefs ->
        prefs[TENANT_ID_KEY]
    }
    
    val userId: Flow<String?> = dataStore.data.map { prefs ->
        prefs[USER_ID_KEY]
    }
    
    val userRole: Flow<String?> = dataStore.data.map { prefs ->
        prefs[USER_ROLE_KEY]
    }
    
    suspend fun saveAccessToken(token: String) {
        dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN_KEY] = token
        }
    }
    
    suspend fun saveTenantId(tenantId: String) {
        dataStore.edit { prefs ->
            prefs[TENANT_ID_KEY] = tenantId
        }
    }
    
    suspend fun saveUserId(userId: String) {
        dataStore.edit { prefs ->
            prefs[USER_ID_KEY] = userId
        }
    }
    
    suspend fun saveUserRole(role: String) {
        dataStore.edit { prefs ->
            prefs[USER_ROLE_KEY] = role
        }
    }
    
    suspend fun saveUserEmail(email: String) {
        dataStore.edit { prefs ->
            prefs[USER_EMAIL_KEY] = email
        }
    }
    
    suspend fun saveUserName(name: String) {
        dataStore.edit { prefs ->
            prefs[USER_NAME_KEY] = name
        }
    }
    
    suspend fun clearAccessToken() {
        dataStore.edit { prefs ->
            prefs.remove(ACCESS_TOKEN_KEY)
        }
    }
    
    suspend fun clearAll() {
        dataStore.edit { prefs ->
            prefs.clear()
        }
    }
    
    suspend fun getAccessToken(): String? {
        return dataStore.data.first()[ACCESS_TOKEN_KEY]
    }
    
    suspend fun getTenantId(): String? {
        return dataStore.data.first()[TENANT_ID_KEY]
    }
}
