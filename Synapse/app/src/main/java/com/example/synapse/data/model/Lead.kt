package com.example.synapse.data.model

import com.google.gson.annotations.SerializedName

data class Lead(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("tenantId")
    val tenantId: String,
    
    @SerializedName("title")
    val title: String,
    
    @SerializedName("source")
    val source: String,
    
    @SerializedName("status")
    val status: String,
    
    @SerializedName("value")
    val value: Double?,
    
    @SerializedName("notes")
    val notes: String?,
    
    @SerializedName("contactId")
    val contactId: String?,
    
    @SerializedName("contact")
    val contact: Contact?,
    
    @SerializedName("convertedAt")
    val convertedAt: String?,
    
    @SerializedName("createdAt")
    val createdAt: String,
    
    @SerializedName("updatedAt")
    val updatedAt: String
)
