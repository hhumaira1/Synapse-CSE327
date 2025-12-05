# Supabase Android SDK - Localhost Connection Bug & Fix

## Problem Summary

The Supabase Kotlin SDK was incorrectly routing all HTTP requests to `localhost/127.0.0.1:443` instead of the actual Supabase URL (`https://rjwewskfdfylbgzxxfjf.supabase.co`), causing `Connection refused` errors during Google Sign-In authentication.

## Environment

- **Platform**: Android (physical device, Xiaomi MIUI)
- **Supabase SDK**: `io.github.jan-tennert.supabase:gotrue-kt:2.6.0`
- **Ktor Client**: `2.3.12`
- **Issue**: Google OAuth ID token exchange failing

## Error Symptoms

### Primary Error
```
java.net.ConnectException: Failed to connect to localhost/127.0.0.1:443
```

### Malformed URL in Logs
Despite correct configuration (`https://rjwewskfdfylbgzxxfjf.supabase.co`), the SDK was constructing:
```
http://localhost:443/rjwewskfdfylbgzxxfjf.supabase.co/auth/v1/token?grant_type=id_token
```

The domain was being treated as a **path segment** instead of a **host**.

## Investigation Steps

### 1. Configuration Verification
- ✅ Confirmed `BuildConfig.SUPABASE_URL` contained correct HTTPS URL
- ✅ DNS resolution worked correctly (resolved to Cloudflare IPs: `172.64.149.246`, `104.18.38.10`)
- ✅ Character-by-character logging ruled out invisible characters

### 2. Network Configuration Tests
- ✅ Raw `OkHttpClient` test **succeeded** with same URL
- ❌ Supabase SDK's internal client still failed
- ✅ Network Security Config allowed cleartext to localhost (suggesting proxy/interception)

### 3. Engine Testing
Attempted multiple Ktor HTTP engines:
- **Android engine** + `proxy = null`: Failed (syntax error)
- **OkHttp engine** + `Proxy.NO_PROXY`: Failed (SDK ignored config)
- **CIO engine** (default): Failed (certificate exception on Android)
- **CIO engine** + `ProxyConfig.NO_PROXY`: Crashed (unsupported config)

### 4. Root Cause
The Supabase SDK's Ktor client was either:
1. Stripping the `https://` protocol internally
2. Being overridden by device-level network configuration
3. Mishandling URL construction when using `supabaseUrl` property

## Solution

### Strategy
**Bypass the SDK's HTTP client** for the critical authentication request, then feed the result back to the SDK.

### Implementation

#### 1. Create Standalone OkHttp Client
```kotlin
val client = HttpClient(OkHttp) {
    install(ContentNegotiation) {
        json(Json { ignoreUnknownKeys = true })
    }
}
```

**Why OkHttp?**
- Native Android TLS/SSL certificate handling
- Robust proxy configuration support
- Proven reliability (used by raw test that succeeded)

#### 2. Manual Token Exchange
```kotlin
// Ensure URL has protocol
var baseUrl = supabaseManager.supabase.supabaseUrl
if (!baseUrl.startsWith("http")) {
    baseUrl = "https://$baseUrl"
}

val url = "$baseUrl/auth/v1/token?grant_type=id_token"

val response: HttpResponse = client.post(url) {
    header("apikey", supabaseManager.supabase.supabaseKey)
    contentType(ContentType.Application.Json)
    setBody("""{"provider":"google","id_token":"$idToken"}""")
}
```

#### 3. Import Session into SDK
```kotlin
// Parse response
val responseBody = response.bodyAsText()
val sessionData = Json { ignoreUnknownKeys = true }
    .decodeFromString<UserSession>(responseBody)

// Import into SDK so it knows about the session
auth.importSession(sessionData)

// Now SDK has the session
val session = auth.currentSessionOrNull()
```

### Modified Files
- [`AuthRepository.kt`](file:///g:/Cse%20327/synapse/Synapse/app/src/main/java/com/example/synapse/data/auth/AuthRepository.kt#L122-L160) - Added standalone client for Google Sign-In
- [`build.gradle.kts`](file:///g:/Cse%20327/synapse/Synapse/app/build.gradle.kts#L108) - Added `ktor-client-okhttp` dependency
- [`AndroidManifest.xml`](file:///g:/Cse%20327/synapse/Synapse/app/src/main/AndroidManifest.xml#L27) - Added `android:enableOnBackInvokedCallback="true"`

## Results

✅ **Success**: Google Sign-In token exchange now receives `200 OK`  
✅ **Success**: Session properly imported into Supabase SDK  
✅ **Success**: User successfully authenticated and navigated to app  

## Key Takeaways

1. **SDK Internal Clients Aren't Always Reliable**: When a library's internal HTTP client misbehaves, direct HTTP requests can be a viable workaround.

2. **Device-Level Network Configs Matter**: The issue may have been exacerbated by MIUI's network security or developer tools on the physical device.

3. **Session Import API**: The `auth.importSession()` method allows manually feeding authentication responses to the SDK, which is useful for custom auth flows or workarounds.

4. **OkHttp is King on Android**: When in doubt on Android, OkHttp's native integration with the platform makes it the safest choice.

## Potential Long-Term Fixes

1. **Report to Supabase**: File an issue with the Supabase Kotlin SDK repository about URL handling in the Ktor client.

2. **Migrate to Official Fix**: Once the SDK fixes the underlying issue, revert to using `auth.signInWith(Google)` or the built-in OAuth providers.

3. **Remove Workaround Code**: The standalone client is a temporary fix and should be replaced when the SDK properly handles the authentication flow.

---

**Issue Resolved**: 2025-11-27  
**Total Debugging Time**: ~4 hours  
**Attempts**: 15+ different configurations tested
