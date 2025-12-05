package com.example.synapse.data.model.portal

import com.google.gson.annotations.SerializedName

data class PortalCustomer(
    @SerializedName("id")
    val id: String,

    @SerializedName("isActive")
    val isActive: Boolean,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("tenant")
    val tenant: Tenant,

    @SerializedName("contact")
    val contact: Contact,

    @SerializedName("name")
    val name: String? = null,

    @SerializedName("email")
    val email: String? = null
)

data class Tenant(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String
)

data class Contact(
    @SerializedName("id")
    val id: String,

    @SerializedName("firstName")
    val firstName: String,

    @SerializedName("lastName")
    val lastName: String,

    @SerializedName("email")
    val email: String? = null,

    @SerializedName("company")
    val company: String? = null
)
