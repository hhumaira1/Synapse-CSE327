package com.example.synapse.data.model

data class Lead(
    val id: String,
    val title: String,
    val contactId: String,
    val contactName: String?,
    val value: Double,
    val status: LeadStatus,
    val source: LeadSource,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String
)

enum class LeadStatus {
    NEW,
    CONTACTED,
    QUALIFIED,
    UNQUALIFIED,
    CONVERTED
}

enum class LeadSource {
    WEBSITE,
    REFERRAL,
    SOCIAL_MEDIA,
    EMAIL,
    PHONE,
    EVENT,
    OTHER
}
