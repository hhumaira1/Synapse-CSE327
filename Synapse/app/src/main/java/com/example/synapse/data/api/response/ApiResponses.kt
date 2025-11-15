package com.example.synapse.data.api.response

import com.example.synapse.data.model.User

data class OnboardResponse(
    val user: User,
    val accessToken: String
)

data class ConvertLeadResponse(
    val dealId: String,
    val message: String
)

data class RevenueForecast(
    val currentMonth: Double,
    val nextMonth: Double,
    val currentQuarter: Double,
    val nextQuarter: Double,
    val totalPipelineValue: Double
)

data class Interaction(
    val id: String,
    val type: String,
    val subject: String?,
    val description: String,
    val contactId: String?,
    val leadId: String?,
    val dealId: String?,
    val createdAt: String
)
