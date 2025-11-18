package com.example.synapse.data.model

data class Deal(
    val id: String,
    val title: String,
    val contactId: String,
    val leadId: String?,
    val pipelineId: String,
    val stageId: String,
    val value: Double,
    val probability: Double, // 0.0 to 1.0 (backend stores as decimal)
    val expectedCloseDate: String?,
    val actualCloseDate: String?,
    val notes: String?,
    val tenantId: String,
    val createdAt: String,
    val updatedAt: String,
    // Nested objects from backend
    val contact: Contact?,
    val pipeline: Pipeline?,
    val stage: Stage?,
    val lead: LeadSummary?
)

data class LeadSummary(
    val id: String,
    val title: String,
    val source: String
)

data class PipelineStats(
    val totalDeals: Int,
    val totalValue: Double,
    val averageProbability: Double // As percentage 0-100
)

//data class Pipeline(
//    val id: String,
//    val name: String,
//    val description: String?,
//    val stages: List<Stage>?,
//    val createdAt: String
//)
//
//data class Stage(
//    val id: String,
//    val name: String,
//    val order: Int,
//    val pipelineId: String
//)
