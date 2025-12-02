"""
Complete Tool List for Synapse CRM MCP Server
43 Working Tools - 100% Backend Coverage
Updated: December 3, 2025
"""

COMPLETE_TOOL_LIST = {
    # ==================== AUTHENTICATION (3) ====================
    "AUTH": [
        "login",  # Natural language login for CLI
        "logout",  # Clear session
        "whoami",  # Show current user info
    ],
    
    # ==================== CONTACTS (6) ====================
    "CONTACTS": [
        "contacts_list",  # List all contacts with filters
        "contacts_create",  # Create new contact
        "contacts_get",  # Get contact by ID
        "contacts_update",  # Update contact
        "contacts_delete",  # Delete contact (ADMIN only)
        "contacts_search",  # Search contacts by query
    ],
    
    # ==================== DEALS (6) ====================
    "DEALS": [
        "deals_list",  # List deals with filters
        "deals_create",  # Create new deal
        "deals_get",  # Get deal by ID
        "deals_update",  # Update deal
        "deals_delete",  # Delete deal (ADMIN only)
        "deals_move",  # Move deal to different stage
    ],
    
    # ==================== LEADS (6) ====================
    "LEADS": [
        "leads_list",  # List leads with status filter
        "leads_create",  # Create new lead
        "leads_get",  # Get lead by ID
        "leads_update",  # Update lead
        "leads_delete",  # Delete lead (ADMIN only)
        "leads_convert",  # Convert lead to deal
    ],
    
    # ==================== TICKETS (6) ====================
    "TICKETS": [
        "tickets_list",  # List tickets with filters
        "tickets_create",  # Create new ticket
        "tickets_get",  # Get ticket by ID
        "tickets_update",  # Update ticket
        "tickets_delete",  # Delete ticket (ADMIN only)
        "tickets_comment",  # Add comment to ticket
    ],
    
    # ==================== USERS (5 - ADMIN ONLY) ====================
    "USERS": [
        "users_list",  # List all workspace users (ADMIN)
        "users_get",  # Get user by ID (ADMIN)
        "users_invite",  # Invite new user to workspace (ADMIN)
        "users_update_role",  # Update user role (ADMIN)
        "users_deactivate",  # Deactivate user (ADMIN)
    ],
    
    # ==================== PIPELINES (4) ====================
    "PIPELINES": [
        "pipelines_list",  # List all pipelines
        "pipelines_create",  # Create pipeline (ADMIN)
        "pipelines_update",  # Update pipeline (ADMIN)
        "pipelines_delete",  # Delete pipeline (ADMIN)
    ],
    
    # ==================== STAGES (3) ====================
    "STAGES": [
        "stages_list",  # List stages in pipeline (query param: ?pipelineId=X)
        "stages_create",  # Create stage in pipeline (ADMIN)
        "stages_update",  # Update stage (ADMIN)
    ],
    
    # ==================== ANALYTICS (2) ====================
    "ANALYTICS": [
        "analytics_dashboard",  # Get main dashboard data
        "analytics_revenue",  # Revenue forecast analytics
    ],
    
    # ==================== PORTAL (3) ====================
    "PORTAL": [
        "portal_customers_list",  # List portal customers
        "portal_tickets_list",  # Customer portal tickets
        "portal_tickets_create",  # Create ticket from portal
    ],
    
    # Total: 3 + 6 + 6 + 6 + 6 + 5 + 4 + 3 + 2 + 3 = 43 tools
}

# ==================== REMOVED TOOLS (No Backend Support) ====================
REMOVED_TOOLS = {
    "ACTIVITIES": [
        # "activities_list", "activities_create", "activities_get"
        # Reason: No ActivitiesController in backend
    ],
    "WEBHOOKS": [
        # "webhooks_list", "webhooks_create", "webhooks_delete"
        # Reason: Only Jira/Zammad webhooks exist, no generic webhooks
    ],
    "PORTAL_EXTRAS": [
        # "portal_send_message", "portal_get_status"
        # Reason: Backend endpoints don't exist
    ],
    "ANALYTICS_EXTRAS": [
        # "analytics_pipeline", "analytics_team", "analytics_contacts"
        # Reason: Backend has different analytics endpoints
    ],
    "TICKETS_EXTRAS": [
        # "tickets_assign", "tickets_close"
        # Reason: No backend endpoints (use tickets_update instead)
    ],
}

# ==================== RBAC CONFIGURATION ====================
ADMIN_ONLY_TOOLS = [
    # Delete operations
    "contacts_delete", "deals_delete", "leads_delete", "tickets_delete",
    # User management
    "users_list", "users_get", "users_invite", "users_update_role", "users_deactivate",
    # Pipeline configuration
    "pipelines_create", "pipelines_update", "pipelines_delete",
    "stages_create", "stages_update",
]

MEMBER_ALLOWED_TOOLS = [
    # Auth (everyone)
    "login", "logout", "whoami",
    # Read operations
    "contacts_list", "contacts_get", "contacts_search",
    "deals_list", "deals_get",
    "leads_list", "leads_get",
    "tickets_list", "tickets_get",
    "pipelines_list", "stages_list",
    "analytics_dashboard", "analytics_revenue",
    "portal_customers_list", "portal_tickets_list",
    # Create operations
    "contacts_create", "deals_create", "leads_create", "tickets_create",
    "portal_tickets_create",
    # Update operations
    "contacts_update", "deals_update", "deals_move", "leads_update", "tickets_update",
    "tickets_comment", "leads_convert",
]
