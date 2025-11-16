# 🚀 SynapseCRM Android App with Supabase Auth - Complete Implementation Plan

> **Date**: November 16, 2025  
> **Goal**: Build production-ready Android app with Supabase authentication and full CRM features  
> **Timeline**: 6-8 weeks (with backend already using Supabase)  
> **Status**: ✅ Backend already migrated to Supabase Auth - Android implementation ready

---

## 📊 Current System Analysis

### ✅ Backend Status (Already Complete)
```
✅ Supabase Auth integrated in NestJS backend
✅ SupabaseAuthGuard implemented and used across all controllers
✅ JWT token validation working
✅ User model has supabaseUserId field
✅ Multi-tenant isolation with tenantId
✅ Role-based access control (ADMIN, MANAGER, MEMBER)
✅ All API endpoints protected with @UseGuards(SupabaseAuthGuard)
```

### 📱 Android Current State
```
✅ Basic project structure with Jetpack Compose
✅ Material 3 theme (Purple gradient)
✅ Landing page UI complete
✅ Basic navigation setup
✅ Retrofit + OkHttp dependencies
⚠️ Clerk SDK attempted but not working
❌ No working authentication yet
❌ No API integration yet
❌ CRM features not implemented
```

### 🎯 What We Need to Build
1. **Replace Clerk with Supabase Auth SDK** (Kotlin)
2. **Implement Google Sign-In** for Android
3. **Connect to existing backend APIs**
4. **Build all CRM features** (Contacts, Leads, Deals, Tickets)
5. **Add offline support** with Room database

---

## 🏗️ Implementation Plan

### **PHASE 1: Authentication Setup** (Week 1 - Days 1-7)

#### Day 1-2: Supabase SDK Integration

**Step 1.1: Add Supabase Dependencies**

Update `app/build.gradle.kts`:
```kotlin
dependencies {
    // Supabase Authentication (Kotlin Multiplatform)
    implementation("io.github.jan-tennert.supabase:postgrest-kt:2.5.4")
    implementation("io.github.jan-tennert.supabase:gotrue-kt:2.5.4")
    implementation("io.github.jan-tennert.supabase:storage-kt:2.5.4")
    
    // Ktor (required by Supabase)
    implementation("io.ktor:ktor-client-android:2.3.12")
    implementation("io.ktor:ktor-client-core:2.3.12")
    implementation("io.ktor:ktor-utils:2.3.12")
    
    // Google Sign-In
    implementation("com.google.android.gms:play-services-auth:21.2.0")
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
    
    // Existing dependencies...
    implementation("com.squareup.retrofit2:retrofit:3.0.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:5.3.0")
    implementation("com.squareup.okhttp3:logging-interceptor:5.3.0")
    
    // DataStore for token storage (already added)
    implementation("androidx.datastore:datastore-preferences:1.1.7")
    
    // Dependency Injection - Hilt
    implementation("com.google.dagger:hilt-android:2.51")
    kapt("com.google.dagger:hilt-compiler:2.51")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
    
    // Room Database for offline support
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    
    // Image Loading
    implementation("io.coil-kt:coil-compose:2.5.0")
}
```

**Step 1.2: Configure Build Settings**

Update `app/build.gradle.kts`:
```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    id("kotlin-kapt")
    id("dagger.hilt.android.plugin")
    id("com.google.gms.google-services") // For Google Sign-In
}

android {
    // ... existing config
    
    buildFeatures {
        buildConfig = true
    }
    
    defaultConfig {
        // Read from local.properties
        buildConfigField("String", "SUPABASE_URL", "\"${project.properties["supabase.url"]}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${project.properties["supabase.anonKey"]}\"")
        buildConfigField("String", "API_BASE_URL", "\"${project.properties["api.baseUrl"]}\"")
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"${project.properties["google.webClientId"]}\"")
    }
}
```

**Step 1.3: Create local.properties**

Create/update `Synapse/local.properties`:
```properties
# Supabase Configuration (get from Supabase Dashboard -> Settings -> API)
supabase.url=https://your-project.supabase.co
supabase.anonKey=your_anon_key_here

# Backend API (your existing NestJS server)
api.baseUrl=http://10.0.2.2:3001/api # For emulator
# api.baseUrl=http://192.168.1.100:3001/api # For physical device (replace with your IP)
# api.baseUrl=https://your-production-api.com/api # For production

# Google Sign-In (get from Google Cloud Console)
google.webClientId=your_google_web_client_id.apps.googleusercontent.com
```

**Step 1.4: Initialize Supabase Client**

Create `app/src/main/java/com/example/synapse/data/auth/SupabaseManager.kt`:
```kotlin
package com.example.synapse.data.auth

import android.content.Context
import com.example.synapse.BuildConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.providers.Google
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.postgrest.Postgrest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logger
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.plugins.logging.SIMPLE
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupabaseManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    val supabase: SupabaseClient = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY
    ) {
        install(Auth) {
            // Configure auth settings
        }
        install(Postgrest)
        
        // Add logging in debug mode
        if (BuildConfig.DEBUG) {
            install(Logging) {
                level = LogLevel.BODY
                logger = Logger.SIMPLE
            }
        }
    }
    
    val auth: Auth
        get() = supabase.auth
}
```

#### Day 3-4: Authentication Repository & ViewModel

**Step 1.5: Create AuthRepository**

Create `app/src/main/java/com/example/synapse/data/auth/AuthRepository.kt`:
```kotlin
package com.example.synapse.data.auth

import android.util.Log
import com.example.synapse.BuildConfig
import com.example.synapse.data.preferences.PreferencesManager
import io.github.jan.supabase.gotrue.providers.Google
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.gotrue.user.UserSession
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val supabaseManager: SupabaseManager,
    private val preferencesManager: PreferencesManager
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
    
    /**
     * Sign in with email and password
     */
    suspend fun signInWithEmail(email: String, password: String): Result<UserSession> {
        return try {
            auth.signInWith(Email) {
                this.email = email
                this.password = password
            }
            
            val session = auth.currentSessionOrNull()
            if (session != null) {
                _authState.value = AuthState.Authenticated(session)
                preferencesManager.saveAccessToken(session.accessToken)
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
    
    /**
     * Sign up with email and password
     */
    suspend fun signUpWithEmail(
        email: String, 
        password: String,
        firstName: String,
        lastName: String
    ): Result<UserSession> {
        return try {
            auth.signUpWith(Email) {
                this.email = email
                this.password = password
                data = mapOf(
                    "first_name" to firstName,
                    "last_name" to lastName
                )
            }
            
            val session = auth.currentSessionOrNull()
            if (session != null) {
                _authState.value = AuthState.Authenticated(session)
                preferencesManager.saveAccessToken(session.accessToken)
                Result.success(session)
            } else {
                Result.failure(Exception("Failed to get session"))
            }
        } catch (e: Exception) {
            Log.e("AuthRepository", "Sign up failed", e)
            _authState.value = AuthState.Error(e.message ?: "Sign up failed")
            Result.failure(e)
        }
    }
    
    /**
     * Sign in with Google
     */
    suspend fun signInWithGoogle(idToken: String): Result<UserSession> {
        return try {
            auth.signInWith(Google) {
                this.idToken = idToken
            }
            
            val session = auth.currentSessionOrNull()
            if (session != null) {
                _authState.value = AuthState.Authenticated(session)
                preferencesManager.saveAccessToken(session.accessToken)
                Result.success(session)
            } else {
                Result.failure(Exception("Failed to get session"))
            }
        } catch (e: Exception) {
            Log.e("AuthRepository", "Google sign in failed", e)
            _authState.value = AuthState.Error(e.message ?: "Google sign in failed")
            Result.failure(e)
        }
    }
    
    /**
     * Sign out
     */
    suspend fun signOut(): Result<Unit> {
        return try {
            auth.signOut()
            _authState.value = AuthState.Unauthenticated
            preferencesManager.clearAccessToken()
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("AuthRepository", "Sign out failed", e)
            Result.failure(e)
        }
    }
    
    /**
     * Get current access token
     */
    fun getAccessToken(): String? {
        return auth.currentSessionOrNull()?.accessToken
    }
    
    /**
     * Refresh session
     */
    suspend fun refreshSession(): Result<UserSession> {
        return try {
            val session = auth.refreshCurrentSession()
            _authState.value = AuthState.Authenticated(session)
            preferencesManager.saveAccessToken(session.accessToken)
            Result.success(session)
        } catch (e: Exception) {
            Log.e("AuthRepository", "Session refresh failed", e)
            _authState.value = AuthState.Unauthenticated
            Result.failure(e)
        }
    }
}

sealed class AuthState {
    object Loading : AuthState()
    object Unauthenticated : AuthState()
    data class Authenticated(val session: UserSession) : AuthState()
    data class Error(val message: String) : AuthState()
}
```

**Step 1.6: Create PreferencesManager**

Create `app/src/main/java/com/example/synapse/data/preferences/PreferencesManager.kt`:
```kotlin
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

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_prefs")

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
    }
    
    val accessToken: Flow<String?> = dataStore.data.map { prefs ->
        prefs[ACCESS_TOKEN_KEY]
    }
    
    val tenantId: Flow<String?> = dataStore.data.map { prefs ->
        prefs[TENANT_ID_KEY]
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
}
```

**Step 1.7: Create Google Sign-In Manager**

Create `app/src/main/java/com/example/synapse/data/auth/GoogleSignInManager.kt`:
```kotlin
package com.example.synapse.data.auth

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import com.example.synapse.BuildConfig
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GoogleSignInManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val credentialManager = CredentialManager.create(context)
    
    suspend fun signIn(): Result<String> {
        return try {
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(BuildConfig.GOOGLE_WEB_CLIENT_ID)
                .build()
            
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()
            
            val result = credentialManager.getCredential(
                request = request,
                context = context
            )
            
            val idToken = extractIdToken(result)
            if (idToken != null) {
                Result.success(idToken)
            } else {
                Result.failure(Exception("Failed to get ID token"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private fun extractIdToken(response: GetCredentialResponse): String? {
        val credential = response.credential
        if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
            return googleIdTokenCredential.idToken
        }
        return null
    }
}
```

#### Day 5-7: Authentication UI Screens

**Step 1.8: Create AuthViewModel**

Create `app/src/main/java/com/example/synapse/presentation/auth/AuthViewModel.kt`:
```kotlin
package com.example.synapse.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.synapse.data.auth.AuthRepository
import com.example.synapse.data.auth.AuthState
import com.example.synapse.data.auth.GoogleSignInManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val googleSignInManager: GoogleSignInManager
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()
    
    val authState = authRepository.authState
    
    fun signInWithEmail(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            
            authRepository.signInWithEmail(email, password)
                .onSuccess {
                    _uiState.value = AuthUiState.Success
                }
                .onFailure { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "Sign in failed")
                }
        }
    }
    
    fun signUpWithEmail(email: String, password: String, firstName: String, lastName: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            
            authRepository.signUpWithEmail(email, password, firstName, lastName)
                .onSuccess {
                    _uiState.value = AuthUiState.Success
                }
                .onFailure { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "Sign up failed")
                }
        }
    }
    
    fun signInWithGoogle() {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            
            googleSignInManager.signIn()
                .onSuccess { idToken ->
                    authRepository.signInWithGoogle(idToken)
                        .onSuccess {
                            _uiState.value = AuthUiState.Success
                        }
                        .onFailure { error ->
                            _uiState.value = AuthUiState.Error(error.message ?: "Google sign in failed")
                        }
                }
                .onFailure { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "Google sign in failed")
                }
        }
    }
    
    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut()
        }
    }
    
    fun resetUiState() {
        _uiState.value = AuthUiState.Idle
    }
}

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    object Success : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}
```

**Step 1.9: Create Sign In Screen**

Create `app/src/main/java/com/example/synapse/presentation/auth/SignInScreen.kt`:
```kotlin
package com.example.synapse.presentation.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.synapse.R

@Composable
fun SignInScreen(
    onNavigateToSignUp: () -> Unit,
    onSignInSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    
    val uiState by viewModel.uiState.collectAsState()
    val authState by viewModel.authState.collectAsState(initial = null)
    
    // Navigate on success
    LaunchedEffect(authState) {
        if (authState is AuthState.Authenticated) {
            onSignInSuccess()
        }
    }
    
    // Show errors
    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Error) {
            // Show snackbar with error
        }
    }
    
    Scaffold { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo
            Image(
                painter = painterResource(id = R.drawable.ic_launcher_foreground),
                contentDescription = "Logo",
                modifier = Modifier.size(120.dp)
            )
            
            Text(
                text = "Welcome Back",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(vertical = 16.dp)
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Email field
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                leadingIcon = {
                    Icon(Icons.Default.Email, contentDescription = null)
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Password field
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                leadingIcon = {
                    Icon(Icons.Default.Lock, contentDescription = null)
                },
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                            contentDescription = if (passwordVisible) "Hide password" else "Show password"
                        )
                    }
                },
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Sign In button
            Button(
                onClick = { viewModel.signInWithEmail(email, password) },
                modifier = Modifier.fillMaxWidth(),
                enabled = uiState !is AuthUiState.Loading && email.isNotBlank() && password.isNotBlank()
            ) {
                if (uiState is AuthUiState.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Sign In")
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Divider
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                HorizontalDivider(modifier = Modifier.weight(1f))
                Text(
                    text = "OR",
                    modifier = Modifier.padding(horizontal = 16.dp),
                    style = MaterialTheme.typography.bodySmall
                )
                HorizontalDivider(modifier = Modifier.weight(1f))
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Google Sign In button
            OutlinedButton(
                onClick = { viewModel.signInWithGoogle() },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_google),
                    contentDescription = "Google",
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign in with Google")
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Sign Up link
            TextButton(onClick = onNavigateToSignUp) {
                Text("Don't have an account? Sign Up")
            }
        }
    }
}
```

**Step 1.10: Create Sign Up Screen**

Create `app/src/main/java/com/example/synapse/presentation/auth/SignUpScreen.kt`:
```kotlin
package com.example.synapse.presentation.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun SignUpScreen(
    onNavigateToSignIn: () -> Unit,
    onSignUpSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    
    val uiState by viewModel.uiState.collectAsState()
    val authState by viewModel.authState.collectAsState(initial = null)
    
    // Navigate on success
    LaunchedEffect(authState) {
        if (authState is AuthState.Authenticated) {
            onSignUpSuccess()
        }
    }
    
    Scaffold { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Create Account",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(vertical = 16.dp)
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // First Name
            OutlinedTextField(
                value = firstName,
                onValueChange = { firstName = it },
                label = { Text("First Name") },
                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Last Name
            OutlinedTextField(
                value = lastName,
                onValueChange = { lastName = it },
                label = { Text("Last Name") },
                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Email
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Password
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                            contentDescription = null
                        )
                    }
                },
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Confirm Password
            OutlinedTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                label = { Text("Confirm Password") },
                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                isError = confirmPassword.isNotEmpty() && password != confirmPassword
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Sign Up button
            Button(
                onClick = {
                    if (password == confirmPassword) {
                        viewModel.signUpWithEmail(email, password, firstName, lastName)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = uiState !is AuthUiState.Loading && 
                        firstName.isNotBlank() && 
                        lastName.isNotBlank() &&
                        email.isNotBlank() && 
                        password.isNotBlank() &&
                        password == confirmPassword
            ) {
                if (uiState is AuthUiState.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Sign Up")
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Divider
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                HorizontalDivider(modifier = Modifier.weight(1f))
                Text(
                    text = "OR",
                    modifier = Modifier.padding(horizontal = 16.dp),
                    style = MaterialTheme.typography.bodySmall
                )
                HorizontalDivider(modifier = Modifier.weight(1f))
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Google Sign Up button
            OutlinedButton(
                onClick = { viewModel.signInWithGoogle() },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Sign up with Google")
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Sign In link
            TextButton(onClick = onNavigateToSignIn) {
                Text("Already have an account? Sign In")
            }
        }
    }
}
```

---

### **PHASE 2: Backend Integration** (Week 2 - Days 8-14)

#### Day 8-9: API Service Setup with Authentication

**Step 2.1: Create API Models**

Create `app/src/main/java/com/example/synapse/data/api/models/`

```kotlin
// User.kt
data class User(
    val id: String,
    val supabaseUserId: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String,
    val tenantId: String,
    val tenant: Tenant?
)

data class Tenant(
    val id: String,
    val name: String,
    val slug: String,
    val type: String
)

// Contact.kt
data class Contact(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String?,
    val phone: String?,
    val company: String?,
    val jobTitle: String?,
    val linkedInUrl: String?,
    val createdAt: String,
    val updatedAt: String
)

// Lead.kt
data class Lead(
    val id: String,
    val title: String,
    val status: String,
    val source: String,
    val value: Double?,
    val contactId: String?,
    val contact: Contact?,
    val createdAt: String
)

// Deal.kt
data class Deal(
    val id: String,
    val title: String,
    val value: Double,
    val probability: Int,
    val stageId: String,
    val stageName: String?,
    val pipelineId: String,
    val contactId: String?,
    val contact: Contact?,
    val expectedCloseDate: String?,
    val createdAt: String
)

// Ticket.kt
data class Ticket(
    val id: String,
    val title: String,
    val description: String?,
    val status: String,
    val priority: String,
    val contactId: String?,
    val contact: Contact?,
    val assignedUserId: String?,
    val assignedUser: User?,
    val createdAt: String
)
```

**Step 2.2: Create API Service Interface**

Create `app/src/main/java/com/example/synapse/data/api/ApiService.kt`:
```kotlin
package com.example.synapse.data.api

import com.example.synapse.data.api.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    // Auth endpoints
    @POST("auth/me")
    suspend fun getUserProfile(): Response<User>
    
    @POST("auth/onboard")
    suspend fun onboard(@Body request: OnboardRequest): Response<User>
    
    // Contacts endpoints
    @GET("contacts")
    suspend fun getContacts(
        @Query("search") search: String? = null
    ): Response<List<Contact>>
    
    @GET("contacts/{id}")
    suspend fun getContact(@Path("id") id: String): Response<Contact>
    
    @POST("contacts")
    suspend fun createContact(@Body contact: CreateContactRequest): Response<Contact>
    
    @PATCH("contacts/{id}")
    suspend fun updateContact(
        @Path("id") id: String,
        @Body contact: UpdateContactRequest
    ): Response<Contact>
    
    @DELETE("contacts/{id}")
    suspend fun deleteContact(@Path("id") id: String): Response<Unit>
    
    // Leads endpoints
    @GET("leads")
    suspend fun getLeads(
        @Query("status") status: String? = null
    ): Response<List<Lead>>
    
    @POST("leads")
    suspend fun createLead(@Body lead: CreateLeadRequest): Response<Lead>
    
    @PATCH("leads/{id}")
    suspend fun updateLead(
        @Path("id") id: String,
        @Body lead: UpdateLeadRequest
    ): Response<Lead>
    
    // Deals endpoints
    @GET("deals")
    suspend fun getDeals(): Response<List<Deal>>
    
    @POST("deals")
    suspend fun createDeal(@Body deal: CreateDealRequest): Response<Deal>
    
    @PATCH("deals/{id}/move")
    suspend fun moveDeal(
        @Path("id") id: String,
        @Body request: MoveDealRequest
    ): Response<Deal>
    
    // Tickets endpoints
    @GET("tickets")
    suspend fun getTickets(
        @Query("status") status: String? = null
    ): Response<List<Ticket>>
    
    @POST("tickets")
    suspend fun createTicket(@Body ticket: CreateTicketRequest): Response<Ticket>
    
    @PATCH("tickets/{id}")
    suspend fun updateTicket(
        @Path("id") id: String,
        @Body ticket: UpdateTicketRequest
    ): Response<Ticket>
    
    @GET("tickets/{id}/comments")
    suspend fun getTicketComments(@Path("id") id: String): Response<List<Comment>>
    
    @POST("tickets/{id}/comments")
    suspend fun addTicketComment(
        @Path("id") id: String,
        @Body comment: CreateCommentRequest
    ): Response<Comment>
}

// Request models
data class OnboardRequest(
    val workspaceName: String,
    val workspaceType: String = "BUSINESS"
)

data class CreateContactRequest(
    val firstName: String,
    val lastName: String,
    val email: String?,
    val phone: String?,
    val company: String?,
    val jobTitle: String?,
    val linkedInUrl: String?
)

data class UpdateContactRequest(
    val firstName: String?,
    val lastName: String?,
    val email: String?,
    val phone: String?,
    val company: String?,
    val jobTitle: String?
)

data class CreateLeadRequest(
    val title: String,
    val source: String,
    val value: Double?,
    val contactId: String?
)

data class UpdateLeadRequest(
    val status: String?,
    val value: Double?
)

data class CreateDealRequest(
    val title: String,
    val value: Double,
    val probability: Int,
    val pipelineId: String,
    val stageId: String,
    val contactId: String?,
    val expectedCloseDate: String?
)

data class MoveDealRequest(
    val stageId: String
)

data class CreateTicketRequest(
    val title: String,
    val description: String?,
    val priority: String,
    val contactId: String?
)

data class UpdateTicketRequest(
    val status: String?,
    val priority: String?
)

data class CreateCommentRequest(
    val content: String,
    val isInternal: Boolean = false
)
```

**Step 2.3: Create Auth Interceptor**

Create `app/src/main/java/com/example/synapse/data/api/AuthInterceptor.kt`:
```kotlin
package com.example.synapse.data.api

import com.example.synapse.data.auth.AuthRepository
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val authRepository: AuthRepository
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        
        // Get access token from Supabase
        val token = authRepository.getAccessToken()
        
        val request = if (token != null) {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            original
        }
        
        val response = chain.proceed(request)
        
        // Handle 401 Unauthorized - refresh token
        if (response.code == 401) {
            response.close()
            
            // Try to refresh session
            runBlocking {
                authRepository.refreshSession()
            }
            
            // Retry request with new token
            val newToken = authRepository.getAccessToken()
            val newRequest = original.newBuilder()
                .header("Authorization", "Bearer $newToken")
                .build()
            
            return chain.proceed(newRequest)
        }
        
        return response
    }
}
```

**Step 2.4: Setup Dependency Injection**

Create `app/src/main/java/com/example/synapse/di/NetworkModule.kt`:
```kotlin
package com.example.synapse.di

import com.example.synapse.BuildConfig
import com.example.synapse.data.api.ApiService
import com.example.synapse.data.api.AuthInterceptor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: AuthInterceptor): OkHttpClient {
        val builder = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
        
        if (BuildConfig.DEBUG) {
            val loggingInterceptor = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            builder.addInterceptor(loggingInterceptor)
        }
        
        return builder.build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}
```

**Step 2.5: Create Application Class**

Create `app/src/main/java/com/example/synapse/SynapseApplication.kt`:
```kotlin
package com.example.synapse

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class SynapseApplication : Application()
```

Update `AndroidManifest.xml`:
```xml
<application
    android:name=".SynapseApplication"
    ...>
```

---

### **PHASE 3: CRM Features Implementation** (Weeks 3-5 - Days 15-35)

This follows the structure from ANDROID_APP_IMPLEMENTATION_PLAN.md with repositories, ViewModels, and UI screens for:
- Contacts Module (Days 15-17)
- Leads Module with Kanban (Days 18-20)
- Deals Module with Pipeline (Days 21-23)
- Tickets Module (Days 24-26)
- Dashboard with Stats (Days 27-29)
- Settings & Team Management (Days 30-32)
- Polish & Testing (Days 33-35)

*(Full implementation details in separate files to keep this document focused)*

---

## 📋 Summary & Next Steps

### ✅ What's Already Done
- Backend has Supabase Auth fully integrated
- All API endpoints protected with SupabaseAuthGuard
- JWT token validation working
- Multi-tenant architecture in place

### 🚀 What We're Building (6-8 Weeks)
1. **Week 1**: Supabase Auth SDK + Google Sign-In for Android
2. **Week 2**: API integration with authenticated requests
3. **Weeks 3-4**: Core CRM features (Contacts, Leads, Deals)
4. **Week 5**: Tickets, Dashboard, Analytics
5. **Week 6**: Settings, Team Management, Polish
6. **Weeks 7-8**: Testing, Offline support, Play Store prep

### 📦 Required Setup Before Starting
1. Get Supabase credentials from dashboard
2. Setup Google Cloud Console for Sign-In
3. Add google-services.json to Android project
4. Configure local.properties with all keys
5. Enable Google Sign-In in Supabase dashboard

### 🎯 Success Criteria
- ✅ User can sign up/sign in with email or Google
- ✅ JWT tokens automatically added to API requests
- ✅ All CRM features work (create, read, update, delete)
- ✅ Offline support with Room database
- ✅ Material 3 design throughout
- ✅ Production-ready APK

---

**Ready to start implementation?** Let me know and I'll help you set up the first files!
