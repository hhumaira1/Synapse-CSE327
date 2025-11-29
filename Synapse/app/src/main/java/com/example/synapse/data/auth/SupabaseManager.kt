package com.example.synapse.data.auth

import android.content.Context
import android.util.Log
import com.example.synapse.BuildConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.Postgrest
import io.ktor.client.engine.cio.CIO
import io.ktor.client.engine.ProxyConfig
import io.ktor.client.engine.okhttp.OkHttp
import okhttp3.Dns
import java.net.InetAddress
import java.net.Proxy
import java.net.UnknownHostException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupabaseManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val tag = "SupabaseManager"
    
    val supabase: SupabaseClient by lazy {
        // DEBUG: Log BuildConfig values to verify they're loaded correctly
        Log.d(tag, "====== SUPABASE CONFIG DEBUG ======")
        Log.d(tag, "BuildConfig.SUPABASE_URL = '${BuildConfig.SUPABASE_URL}'")
        // Log character codes to check for invisible chars
        BuildConfig.SUPABASE_URL.forEach { char ->
            Log.d(tag, "Char: '$char' Code: ${char.code}")
        }
        
        // HARDCODED URL FOR DEBUGGING
        val hardcodedUrl = "https://rjwewskfdfylbgzxxfjf.supabase.co"
        Log.d(tag, "Using Hardcoded URL: $hardcodedUrl")
        
        createSupabaseClient(
            supabaseUrl = hardcodedUrl, // Force hardcoded URL
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Auth)
            install(Postgrest)
            
            // CRITICAL FIX: Use CIO engine
            // CIO is a pure Kotlin engine and may handle proxies differently than OkHttp
            // We removed explicit proxy config because it caused a crash
            httpEngine = CIO.create()
        }
    }

    init {
        // DEBUG: Run a raw OkHttp request to test connectivity independent of Supabase SDK
        Thread {
            try {
                Log.d(tag, "Starting RAW OkHttp Connectivity Test...")
                val client = okhttp3.OkHttpClient.Builder()
                    .proxy(Proxy.NO_PROXY)
                    .dns(object : Dns {
                        override fun lookup(hostname: String): List<InetAddress> {
                            val addresses = Dns.SYSTEM.lookup(hostname)
                            val valid = addresses.filter { !it.isLoopbackAddress }
                            Log.d(tag, "RAW TEST DNS: $hostname -> ${valid.map { it.hostAddress }}")
                            return valid.ifEmpty { addresses }
                        }
                    })
                    .build()

                val request = okhttp3.Request.Builder()
                    .url(BuildConfig.SUPABASE_URL) // Just hit the root URL
                    .build()

                client.newCall(request).execute().use { response ->
                    Log.d(tag, "RAW TEST RESULT: Code=${response.code}, Message=${response.message}")
                    Log.d(tag, "RAW TEST SUCCESS! Connection to Supabase is possible.")
                }
            } catch (e: Exception) {
                Log.e(tag, "RAW TEST FAILED: ${e.message}", e)
            }
        }.start()
    }

    val auth: Auth
        get() = supabase.auth
}
