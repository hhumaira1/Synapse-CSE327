package com.example.synapse.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.synapse.MainActivity
import com.example.synapse.R
import com.example.synapse.data.repository.VoipRepository
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * FCMService
 * 
 * Handles Firebase Cloud Messaging for VoIP call notifications.
 * - Receives incoming call notifications when app is in background
 * - Updates FCM token with backend
 * - Shows notification for incoming calls
 */
@AndroidEntryPoint
class FCMService : FirebaseMessagingService() {
    
    @Inject
    lateinit var voipRepository: VoipRepository
    
    private val tag = "FCMService"
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    
    companion object {
        private const val CHANNEL_ID = "voip_calls"
        private const val NOTIFICATION_ID = 1001
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }
    
    /**
     * Called when FCM token is refreshed
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(tag, "🔑 New FCM token: $token")
        
        // Update token with backend
        serviceScope.launch {
            try {
                voipRepository.updateFCMToken(token)
                Log.d(tag, "✅ FCM token updated with backend")
            } catch (e: Exception) {
                Log.e(tag, "❌ Failed to update FCM token: ${e.message}")
            }
        }
    }
    
    /**
     * Called when a new FCM message is received
     */
    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        
        Log.d(tag, "📨 FCM message received")
        Log.d(tag, "   From: ${message.from}")
        Log.d(tag, "   Data: ${message.data}")
        
        // Check if it's an incoming call notification
        val messageType = message.data["type"]
        
        when (messageType) {
            "incoming_call" -> {
                handleIncomingCallNotification(message.data)
            }
            "missed_call" -> {
                handleMissedCallNotification(message.data)
            }
            else -> {
                Log.w(tag, "Unknown message type: $messageType")
            }
        }
    }
    
    /**
     * Handle incoming call notification
     */
    private fun handleIncomingCallNotification(data: Map<String, String>) {
        val callerName = data["caller_name"] ?: "Unknown"
        val callerId = data["caller_id"] ?: return
        val roomName = data["room_name"] ?: return
        val callLogId = data["call_log_id"] ?: return
        
        Log.d(tag, "📞 Incoming call from $callerName")
        
        // Show notification
        showIncomingCallNotification(callerName)
        
        // Note: When app is in foreground, WebSocket will handle this.
        // This FCM notification is only for when app is in background.
    }
    
    /**
     * Handle missed call notification
     */
    private fun handleMissedCallNotification(data: Map<String, String>) {
        val callerName = data["caller_name"] ?: "Unknown"
        val callTime = data["call_time"] ?: ""
        
        Log.d(tag, "📵 Missed call from $callerName at $callTime")
        
        // Show notification
        showMissedCallNotification(callerName, callTime)
    }
    
    /**
     * Show incoming call notification
     */
    private fun showIncomingCallNotification(callerName: String) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE  // Use FLAG_IMMUTABLE for Android 12+
        )
        
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground) // TODO: Replace with call icon
            .setContentTitle("Incoming Call")
            .setContentText("$callerName is calling")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    /**
     * Show missed call notification
     */
    private fun showMissedCallNotification(callerName: String, callTime: String) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("Missed Call")
            .setContentText("Missed call from $callerName at $callTime")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()
        
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID + 1, notification)
    }
    
    /**
     * Create notification channel (required for Android 8.0+)
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "VoIP Calls",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for incoming VoIP calls"
                enableVibration(true)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
}
