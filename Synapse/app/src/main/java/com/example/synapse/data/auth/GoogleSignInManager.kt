package com.example.synapse.data.auth

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import com.example.synapse.BuildConfig
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GoogleSignInManager @Inject constructor() {
    
    suspend fun signIn(activity: Activity): Result<String> {
        val credentialManager = CredentialManager.create(activity)
        return try {
            Log.d("GoogleSignIn", "Starting Google Sign-In...")
            Log.d("GoogleSignIn", "Web Client ID: ${BuildConfig.GOOGLE_WEB_CLIENT_ID}")
            
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(BuildConfig.GOOGLE_WEB_CLIENT_ID)
                .setAutoSelectEnabled(true)
                .build()
            
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()
            
            Log.d("GoogleSignIn", "Requesting credentials...")
            val result = credentialManager.getCredential(
                request = request,
                context = activity
            )
            
            Log.d("GoogleSignIn", "Got credential response")
            val idToken = extractIdToken(result)
            if (idToken != null) {
                Log.d("GoogleSignIn", "Successfully got ID token")
                Result.success(idToken)
            } else {
                Log.e("GoogleSignIn", "Failed to extract ID token")
                Result.failure(Exception("Failed to get ID token"))
            }
        } catch (e: androidx.credentials.exceptions.GetCredentialCancellationException) {
            Log.e("GoogleSignIn", "User cancelled the sign-in")
            Result.failure(Exception("Sign-in cancelled"))
        } catch (e: androidx.credentials.exceptions.NoCredentialException) {
            Log.e("GoogleSignIn", "No Google accounts found. Please add a Google account to your device.")
            Result.failure(Exception("No Google accounts found. Please add a Google account in Settings."))
        } catch (e: Exception) {
            Log.e("GoogleSignIn", "Sign in failed: ${e::class.simpleName} - ${e.message}", e)
            Result.failure(Exception("Google Sign-In failed: ${e.message}"))
        }
    }
    
    private fun extractIdToken(response: GetCredentialResponse): String? {
        val credential = response.credential
        if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            try {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                return googleIdTokenCredential.idToken
            } catch (e: Exception) {
                Log.e("GoogleSignIn", "Failed to create GoogleIdTokenCredential", e)
            }
        }
        return null
    }
}
