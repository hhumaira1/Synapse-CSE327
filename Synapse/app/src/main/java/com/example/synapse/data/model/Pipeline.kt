package com.example.synapse.data.model

import com.google.gson.annotations.SerializedName

data class Pipeline(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("tenantId")
    val tenantId: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("description")
    val description: String?,
    
    @SerializedName("stages")
    val stages: List<Stage>,
    
    @SerializedName("createdAt")
    val createdAt: String,
    
    @SerializedName("updatedAt")
    val updatedAt: String
)

data class Stage(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("pipelineId")
    val pipelineId: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("order")
    val order: Int,
    
    @SerializedName("color")
    val color: String?,
    
    @SerializedName("createdAt")
    val createdAt: String,
    
    @SerializedName("updatedAt")
    val updatedAt: String
)
