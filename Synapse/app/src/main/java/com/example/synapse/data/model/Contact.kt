package com.example.synapse.data.model

data class Contact(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String?,
    val phone: String?,
    val company: String?,
    val jobTitle: String?,
    val address: String?,
    val city: String?,
    val country: String?,
    val linkedInUrl: String?,
    val website: String?,
    val notes: String?,
    val tags: List<String>?,
    val createdAt: String,
    val updatedAt: String
) {
    val fullName: String
        get() = "$firstName $lastName"
}
