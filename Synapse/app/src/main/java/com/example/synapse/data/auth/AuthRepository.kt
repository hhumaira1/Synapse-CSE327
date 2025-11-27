package com.example.synapse.data.auth

import android.util.Log
import com.example.synapse.data.api.ApiService
import com.example.synapse.data.api.request.OnboardRequest
import com.example.synapse.data.preferences.PreferencesManager
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.gotrue.user.UserInfo
import io.github.jan.supabase.gotrue.user.UserSession
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.http.ContentType.Application.Json
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Singleton
class AuthRepository @Inject constructor(
    private val supabaseManager: SupabaseManager,
    private val preferencesManager: PreferencesManager,
    private val apiService: ApiService
) {
    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: Flow<AuthState> = _authState.asStateFlow()

    private val auth = supabaseManager.auth

    init {
        checkAuthStatus()
    }

    private fun checkAuthStatus() {
        val session = auth.currentSessionOrNull()
        _authState.value = if (session != null) {
            AuthState.Authenticated(session)
        } else {
            AuthState.Unauthenticated
        }
    }

    suspend fun signInWithEmail(email: String, password: String): Result<UserSession> {
        return try {
            // Step 1: Authenticate with Supabase
            auth.signInWith(Email) {
                this.email = email
                this.password = password
            }

            val session = auth.currentSessionOrNull()
            if (session != null) {
                // Step 2: Get user from backend database
                try {
                    val backendUser = apiService.getCurrentUser()
                    if (backendUser.isSuccessful && backendUser.body() != null) {
                        // User exists in backend, save full user data
                        val user = backendUser.body()!!
                        preferencesManager.saveTenantId(user.tenantId)
                        preferencesManager.saveUserRole(user.role.name)
                        Log.d("AuthRepository", "User loaded from backend: ${user.id}")
                    }
                } catch (e: Exception) {
                    Log.w("AuthRepository", "User not in backend database yet - may need onboarding", e)
                }

                _authState.value = AuthState.Authenticated(session)
                saveUserSession(session)
                Result.success(session)
            } else {
                Result.failure(Exception("Failed to get session"))
            }
        } catch (e: Exception) {
            Log.e("AuthRepository", "Sign in failed", e)
            _authState.value = AuthState.Error(e.message ?: "Sign in failed")
            Result.failure(e)
        }
    }

    suspend fun signUpWithEmail(
        email: String,
        password: String,
        firstName: String,
        lastName: String
    ): Result<UserSession> {
        return try {
            // Step 1: Create user in Supabase Auth only
            // User will be onboarded separately via OnboardingScreen
            auth.signUpWith(Email) {
                this.email = email
                this.password = password
                data = buildJsonObject {
                    put("first_name", firstName)
                    put("last_name", lastName)
                }
            }

            val session = auth.currentSessionOrNull()
            if (session != null) {
                _authState.value = AuthState.Authenticated(session)
                saveUserSession(session)
                Log.d("AuthRepository", "User signed up successfully in Supabase")
                Result.success(session)
            } else {
                Result.failure(Exception("Sign up successful. Please check your email to verify your account."))
            }
        } catch (e: Exception) {
            Log.e("AuthRepository", "Sign up failed", e)
            _authState.value = AuthState.Error(e.message ?: "Sign up failed")
            Result.failure(e)
        }
    }

    suspend fun signInWithGoogle(idToken: String): Result<UserSession> {
        return try {
            // Step 1: Authenticate with Supabase using Google ID token
            // USE STANDALONE CLIENT to bypass any SDK issues
            // Switched to OkHttp engine as it handles Android TLS/Proxy configs better than CIO
            val client = HttpClient(OkHttp) {
                install(ContentNegotiation) {
                    json(Json { ignoreUnknownKeys = true })
                }
            }
            
            // Ensure URL has protocol
            var baseUrl = supabaseManager.supabase.supabaseUrl
            if (!baseUrl.startsWith("http")) {
                baseUrl = "https://$baseUrl"
            }
            
            val url = "$baseUrl/auth/v1/token?grant_type=id_token"
            Log.d("AuthRepository", "Exchanging token at: $url")

            val response: HttpResponse = client.post(url) {
                header("apikey", supabaseManager.supabase.supabaseKey)
                contentType(ContentType.Application.Json)
                setBody("""{"provider":"google","id_token":"$idToken"}""")
            }
            
            Log.d("AuthRepository", "Token exchange response: ${response.status}")
            
            // Parse the response body to get session data
            val responseBody = response.bodyAsText()
            Log.d("AuthRepository", "Response body: $responseBody")
            
            // Parse and import the session into the Supabase SDK
            val sessionData = Json { ignoreUnknownKeys = true }.decodeFromString<UserSession>(responseBody)
            auth.importSession(sessionData)
            
            // Now get the session from the SDK
            val session = auth.currentSessionOrNull()
            if (session != null) {
                // Step 2: Check if user exists in backend
                try {
                    val backendUser = apiService.getCurrentUser()
                    if (backendUser.isSuccessful && backendUser.body() != null) {
                        // User exists in backend
                        val user = backendUser.body()!!
                        preferencesManager.saveTenantId(user.tenantId)
                        preferencesManager.saveUserRole(user.role.name)
                        Log.d("AuthRepository", "Existing user signed in with Google")
                    } else {
                        // User doesn't exist in backend - will need onboarding
                        Log.d("AuthRepository", "New Google user - needs onboarding")
                    }
                } catch (e: Exception) {
                    Log.w("AuthRepository", "Failed to check backend user", e)
                }

                _authState.value = AuthState.Authenticated(session)
                saveUserSession(session)
                Result.success(session)
            } else {
                Result.failure(Exception("Failed to get session after Google sign-in"))
            }
        } catch (e: Exception) {
            Log.e("AuthRepository", "Google sign in failed", e)
            _authState.value = AuthState.Error(e.message ?: "Google sign in failed")
            Result.failure(e)
        }
    }

    suspend fun signOut(): Result<Unit> {
        return try {
            auth.signOut()
            _authState.value = AuthState.Unauthenticated
            preferencesManager.clearAll()
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("AuthRepository", "Sign out failed", e)
            Result.failure(e)
        }
    }

    fun getAccessToken(): String? {
        return auth.currentSessionOrNull()?.accessToken
    }

    fun getCurrentUser(): UserInfo? {
        return auth.currentUserOrNull()
    }

    suspend fun refreshSession(): Result<UserSession?> {
        return try {
            val currentSession = auth.currentSessionOrNull()
            if (currentSession?.refreshToken != null) {
                auth.refreshSession(currentSession.refreshToken)
                val newSession = auth.currentSessionOrNull()
                if (newSession != null) {
                    _authState.value = AuthState.Authenticated(newSession)
                    saveUserSession(newSession)
                    Result.success(newSession)
                } else {
                    _authState.value = AuthState.Unauthenticated
                    Result.success(null)
                }
            } else {
                _authState.value = AuthState.Unauthenticated
                Result.success(null)
            }
        } catch (e: Exception) {
            Log.e("AuthRepository", "Session refresh failed", e)
            _authState.value = AuthState.Unauthenticated
            Result.failure(e)
        }
    }

    private suspend fun saveUserSession(session: UserSession) {
        preferencesManager.saveAccessToken(session.accessToken)
        auth.currentUserOrNull()?.let { user ->
            preferencesManager.saveUserId(user.id)
            preferencesManager.saveUserEmail(user.email ?: "")
            user.userMetadata?.let { metadata ->
                val firstName = metadata["first_name"] as? String ?: ""
                val lastName = metadata["last_name"] as? String ?: ""
                preferencesManager.saveUserName("$firstName $lastName".trim())
            }
        }
    }
}

sealed class AuthState {
    object Loading : AuthState()
    object Unauthenticated : AuthState()
    data class Authenticated(val session: UserSession) : AuthState()
    data class Error(val message: String) : AuthState()
}
