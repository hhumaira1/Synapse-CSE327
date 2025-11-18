package com.example.synapse.data.model

import com.example.synapse.data.api.response.PortalAccessResponse

enum class WorkspaceType {
    INTERNAL_CRM,    // User has internal CRM access (admin/manager)
    CUSTOMER_PORTAL, // User has customer portal access
    CREATE_WORKSPACE // User needs to create a workspace
}

data class WorkspaceOption(
    val type: WorkspaceType,
    val id: String,
    val name: String,
    val description: String,
    val navigationTarget: String,
    val icon: WorkspaceIcon = WorkspaceIcon.DEFAULT
)

enum class WorkspaceIcon {
    BUILDING,   // For internal CRM
    USERS,      // For customer portal
    ADD,        // For creating workspace
    DEFAULT
}
