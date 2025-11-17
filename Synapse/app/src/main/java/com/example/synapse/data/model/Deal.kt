package com.example.synapse.data.model

data class Deal(
    val id: String,
    val title: String,
    val contactId: String,
    val contactName: String?,
    val leadId: String?,
    val pipelineId: String,
    val pipelineName: String?,
    val stageId: String,
    val stageName: String?,
    val value: Double,
    val probability: Int,
    val expectedCloseDate: String?,
    val actualCloseDate: String?,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String
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
