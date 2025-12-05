"""
Role-Based Access Control for MCP Tools
Defines which roles can access which tools
"""

from enum import Enum
from typing import Tuple


class UserRole(Enum):
    """Match backend Prisma UserRole enum"""
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"


class ToolPermissions:
    """
    Define which roles can access which tools
    Based on backend's UserRole enum
    """
    
    # Tools that MEMBERs CAN access (read + basic operations)
    MEMBER_ALLOWED = [
        # Authentication (everyone)
        "login", "logout", "whoami",
        
        # Contacts - Read & Create & Update
        "contacts_list", "contacts_get", "contacts_search",
        "contacts_create", "contacts_update",
        
        # Deals - Read & Create & Update
        "deals_list", "deals_get", "deals_create", 
        "deals_update", "deals_move",
        
        # Leads - Read & Create & Update & Convert
        "leads_list", "leads_get", "leads_create",
        "leads_update", "leads_convert",
        
       # Tickets - Read & Create & Update & Comment
        "tickets_list", "tickets_get", "tickets_create",
        "tickets_update", "tickets_comment", "tickets_assign",
        
        # Pipelines & Stages - Read only
        "pipelines_list", "stages_list",
        
        # Analytics - All members can view
        "analytics_dashboard", "analytics_revenue", 
        "analytics_pipeline", "analytics_team", "analytics_contacts",
        
        # Activities - Read & Create
        "activities_list", "activities_get", "activities_create",
        
        # Portal - Customer portal operations
        "portal_customers_list", "portal_tickets_list",
        "portal_tickets_create", "portal_send_message", "portal_get_status",
    ]
    
    # Tools that ONLY ADMINs can use
    ADMIN_ONLY = [
        # Delete operations (dangerous!)
        "contacts_delete", "deals_delete", "leads_delete", "tickets_delete",
        
        # User management
        "users_list", "users_get", "users_invite", 
        "users_update_role", "users_deactivate",
        
        # Pipeline & Stage configuration
        "pipelines_create", "pipelines_update", "pipelines_delete",
        "stages_create", "stages_update",
        
        # Webhooks (integrations)
        "webhooks_list", "webhooks_create", "webhooks_delete",
    ]
    
    # Tools that MANAGERs CAN access (MEMBER permissions + some admin tools)
    MANAGER_ALLOWED = [
        # All MEMBER permissions
        *MEMBER_ALLOWED,
        # Plus: Can delete records (but not users/config)
        "contacts_delete", "deals_delete", "leads_delete", "tickets_delete",
        # Plus: Can view users (but not manage them)
        "users_list", "users_get",
    ]
    
    def check_permission(self, user_role: str, tool_name: str) -> Tuple[bool, str]:
        """
        Check if user role has permission to use tool
        
        Args:
            user_role: "ADMIN" or "MEMBER"
            tool_name: Name of the tool being called
            
        Returns:
            (allowed: bool, reason: str)
        """
        try:
            role = UserRole(user_role)
        except ValueError:
            return (False, f"Invalid role: {user_role}")
        
        # Admin can do everything
        if role == UserRole.ADMIN:
            return (True, "")
        
        # Manager has extended permissions
        if role == UserRole.MANAGER:
            if tool_name in self.MANAGER_ALLOWED:
                return (True, "")
            # Check if it's ADMIN-only (system config)
            if tool_name in self.ADMIN_ONLY:
                return (False, f"🔒 Only ADMINs can use '{tool_name}'. Contact your workspace admin.")
            return (False, f"🔒 MANAGERs cannot access '{tool_name}'")
        
        # Member has basic permissions
        if role == UserRole.MEMBER:
            if tool_name in self.MEMBER_ALLOWED:
                return (True, "")
            return (False, f"🔒 MEMBERs cannot access '{tool_name}'. Contact your manager or admin.")
        
        # Default: deny if not explicitly allowed
        return (False, f"🔒 Role '{user_role}' cannot access '{tool_name}'")


# Global instance
rbac = ToolPermissions()
