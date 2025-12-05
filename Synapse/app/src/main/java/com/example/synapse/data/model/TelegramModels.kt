package com.example.synapse.data.model

data class TelegramLinkResponse(
    val deepLink: String,
    val code: String,
    val expiresAt: String
)

data class TelegramStatusResponse(
    val connected: Boolean,
    val telegramUsername: String? = null,
    val firstName: String? = null,
    val lastName: String? = null
)
