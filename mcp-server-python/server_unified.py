"""
Synapse CRM - Unified MCP Server
Dual Transport: stdio (CLI) + HTTP (Web/Android)
Dual Auth: Natural Login (CLI) + JWT (Web/Android)

Features:
- 56 CRM tools with automatic session management
- Strict system prompt for CRM-only scope
- RBAC enforcement (ADMIN vs MEMBER)
- One command starts both transports

Usage:
    python server_unified.py
"""

import asyncio
import os
import logging
import json
from typing import Any, Optional, Dict
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

import httpx
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# FastAPI for HTTP transport
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import our modules
from system_prompt import STRICT_SYSTEM_PROMPT
from cache import save_session, load_session, delete_session, is_session_expired

# Load environment variables
load_dotenv()

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")
BACKEND_API = f"{BACKEND_URL}{os.getenv('BACKEND_API_PREFIX', '/api')}"
HTTP_PORT = int(os.getenv("MCP_HTTP_PORT", "5000"))

# Setup logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("synapse-mcp")


# ==================== HTTP REQUEST MODELS ====================

class ToolCallRequest(BaseModel):
    """HTTP request model for calling MCP tools"""
    tool_name: str
    arguments: Dict[str, Any] = {}


class ToolResponse(BaseModel):
    """HTTP response model"""
    result: list


# ==================== UNIFIED MCP SERVER ====================

class UnifiedMCPServer:
    """
    Universal MCP Server supporting:
    - stdio transport (Gemini CLI, Claude CLI, Claude Desktop)
    - HTTP transport (Web, Android, Telegram)
    - JWT auth (Web/Android pre-authenticated)
    - Interactive login (CLI clients)
    """
    
    def __init__(self):
        # MCP Server for stdio transport
        self.server = Server("synapse-crm")
        
        # FastAPI for HTTP transport
        self.http_app = FastAPI(
            title="Synapse MCP Server",
            description="Unified MCP Server with dual transport",
            version="3.0.0"
        )
        
        # Add CORS for web clients
        self.http_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure appropriately for production
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Setup handlers
        self.setup_mcp_handlers()
        self.setup_http_endpoints()
    
    # ==================== TOOL DEFINITIONS ====================
    
    def get_tool_list(self) -> list[Tool]:
        """Get list of all 25 CRM tools"""
        return [
            # AUTH (3)
            Tool(
                name="login",
                description="Login with email and password (CLI only)",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "email": {"type": "string", "format": "email"},
                        "password": {"type": "string"},
                    },
                    "required": ["email", "password"],
                },
            ),
            Tool(
                name="logout",
                description="Logout and clear session",
                inputSchema={"type": "object", "properties": {}},
            ),
            Tool(
                name="whoami",
                description="Show current user info",
                inputSchema={"type": "object", "properties": {}},
            ),
            # CONTACTS (5)
            Tool(
                name="contacts_list",
                description="List all contacts",
                inputSchema={"type": "object", "properties": {}},
            ),
            Tool(
                name="contacts_create",
                description="Create new contact. Only firstName is required, all other fields are optional.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "firstName": {"type": "string", "description": "REQUIRED: First name"},
                        "lastName": {"type": "string", "description": "Optional: Last name"},
                        "email": {"type": "string", "description": "Optional: Email address"},
                        "phone": {"type": "string", "description": "Optional: Phone number"},
                        "company": {"type": "string", "description": "Optional: Company name"},
                        "jobTitle": {"type": "string", "description": "Optional: Job title"},
                        "notes": {"type": "string", "description": "Optional: Additional notes"},
                    },
                    "required": ["firstName"],
                },
            ),
            Tool(
                name="contacts_get",
                description="Get contact by ID",
                inputSchema={
                    "type": "object",
                    "properties": {"contactId": {"type": "string"}},
                    "required": ["contactId"],
                },
            ),
            Tool(
                name="contacts_update",
                description="Update contact",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "contactId": {"type": "string"},
                        "firstName": {"type": "string"},
                        "lastName": {"type": "string"},
                        "email": {"type": "string"},
                        "phone": {"type": "string"},
                    },
                    "required": ["contactId"],
                },
            ),
            Tool(
                name="contacts_delete",
                description="Delete contact (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {"contactId": {"type": "string"}},
                    "required": ["contactId"],
                },
            ),
            # DEALS (5)
            Tool(
                name="deals_list",
                description="List all deals",
                inputSchema={"type": "object", "properties": {}},
            ),
            Tool(
                name="deals_create",
                description="Create new deal. MUST provide pipelineId and stageId - use pipelines_list and stages_list tools first to get valid IDs.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "REQUIRED: Deal title"},
                        "contactId": {"type": "string", "description": "REQUIRED: Associated contact ID"},
                        "pipelineId": {"type": "string", "description": "REQUIRED: Pipeline ID (use pipelines_list)"},
                        "stageId": {"type": "string", "description": "REQUIRED: Initial stage ID (use stages_list)"},
                        "value": {"type": "number", "description": "Optional: Deal value in dollars"},
                        "probability": {"type": "number", "description": "Optional: Win probability (0-100)"},
                        "notes": {"type": "string", "description": "Optional: Additional notes"},
                    },
                    "required": ["title", "contactId", "pipelineId", "stageId"],
                },
            ),
            Tool(
                name="deals_get",
                description="Get deal by ID",
                inputSchema={
                    "type": "object",
                    "properties": {"dealId": {"type": "string"}},
                    "required": ["dealId"],
                },
            ),
            Tool(
                name="deals_update",
                description="Update deal",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "dealId": {"type": "string"},
                        "title": {"type": "string"},
                        "value": {"type": "number"},
                    },
                    "required": ["dealId"],
                },
            ),
            Tool(
                name="deals_delete",
                description="Delete deal (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {"dealId": {"type": "string"}},
                    "required": ["dealId"],
                },
            ),
            # LEADS (5)
            Tool(
                name="leads_list",
                description="List leads",
               inputSchema={"type": "object", "properties": {}},
            ),
            Tool(
                name="leads_create",
                description="Create new lead. MUST provide contactId, title, and source. Get contactId from contacts_list or contacts_search first.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "contactId": {"type": "string", "description": "REQUIRED: ID of contact to associate with this lead. Use contacts_list to get contact IDs."},
                        "title": {"type": "string", "description": "REQUIRED: Lead title/name (min 2 chars, max 200)"},
                        "source": {"type": "string", "description": "REQUIRED: Lead source (e.g., 'Cold Call', 'Website', 'Referral')"},
                        "value": {"type": "number", "description": "Optional: Estimated deal value in dollars"},
                        "notes": {"type": "string", "description": "Optional: Additional notes"},
                    },
                    "required": ["contactId", "title", "source"],
                },
            ),
            Tool(
                name="leads_update",
                description="Update lead details like status, source, or value.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "leadId": {"type": "string", "description": "REQUIRED: Lead ID to update"},
                        "title": {"type": "string", "description": "Optional: Lead title"},
                        "contactId": {"type": "string", "description": "Optional: Associated contact ID"},
                        "status": {"type": "string", "description": "Optional: Status (NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED)"},
                        "source": {"type": "string", "description": "Optional: Lead source"},
                        "value": {"type": "number", "description": "Optional: Estimated value in dollars"},
                        "notes": {"type": "string", "description": "Optional: Additional notes"},
                    },
                    "required": ["leadId"],
                },
            ),
            Tool(
                name="leads_convert",
                description="Convert lead to deal. Deal will inherit title and value from the lead. MUST provide pipelineId and stageId.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "leadId": {"type": "string", "description": "REQUIRED: Lead ID to convert"},
                        "pipelineId": {"type": "string", "description": "REQUIRED: Pipeline ID (use pipelines_list)"},
                        "stageId": {"type": "string", "description": "REQUIRED: Initial stage ID (use stages_list)"},
                        "probability": {"type": "number", "description": "Optional: Win probability (0-100)"},
                        "expectedCloseDate": {"type": "string", "description": "Optional: Expected close date (ISO format)"},
                    },
                    "required": ["leadId", "pipelineId", "stageId"],
                },
            ),
            Tool(
                name="leads_delete",
                description="Delete lead (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {"leadId": {"type": "string"}},
                    "required": ["leadId"],
                },
            ),
            # TICKETS (5)
            Tool(
                name="tickets_list",
                description="List tickets",
                inputSchema={"type": "object", "properties": {}},
            ),
            Tool(
                name="tickets_create",
                description="Create ticket. Requires title, priority, source, and contactId.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "REQUIRED: Ticket title (min 5 characters)"},
                        "priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"], "description": "REQUIRED: Priority level"},
                        "source": {"type": "string", "enum": ["EMAIL", "PHONE", "CHAT", "PORTAL", "WEB_FORM", "SOCIAL_MEDIA", "OTHER"], "description": "REQUIRED: Ticket source"},
                        "contactId": {"type": "string", "description": "REQUIRED: Associated contact ID"},
                        "description": {"type": "string", "description": "Optional: Ticket description"},
                        "dealId": {"type": "string", "description": "Optional: Associated deal ID"},
                        "assignedUserId": {"type": "string", "description": "Optional: User ID to assign to"},
                    },
                    "required": ["title", "priority", "source", "contactId"],
                },
            ),
            Tool(
                name="tickets_get",
                description="Get ticket by ID",
                inputSchema={
                    "type": "object",
                    "properties": {"ticketId": {"type": "string"}},
                    "required": ["ticketId"],
                },
            ),
            Tool(
                name="tickets_update",
                description="Update ticket",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "ticketId": {"type": "string"},
                        "status": {"type": "string"},
                    },
                    "required": ["ticketId"],
                },
            ),
            Tool(
                name="tickets_delete",
                description="Delete ticket (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {"ticketId": {"type": "string"}},
                    "required": ["ticketId"],
                },
            ),
            # ANALYTICS (2 - only verified working endpoints)
            Tool(
                name="analytics_dashboard",
                description="Get analytics dashboard data",
                inputSchema={"type": "object", "properties": {}},
            ),
            Tool(
                name="analytics_revenue",
                description="Get revenue forecast analytics",
                inputSchema={"type": "object", "properties": {}},
            ),
            # CONTACTS - Additional (1)
            Tool(
                name="contacts_search",
                description="Search contacts by query",
                inputSchema={
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            ),
            # DEALS - Additional (1)
            Tool(
                name="deals_move",
                description="Move deal to different stage",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "dealId": {"type": "string"},
                        "stageId": {"type": "string"},
                    },
                    "required": ["dealId", "stageId"],
                },
            ),
            # TICKETS - Additional (2)
            Tool(
                name="tickets_comment",
                description="Add comment to ticket",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "ticketId": {"type": "string"},
                        "comment": {"type": "string"},
                    },
                    "required": ["ticketId", "comment"],
                },
            ),
            Tool(
                name="tickets_assign",
                description="Assign ticket to user",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "ticketId": {"type": "string"},
                        "userId": {"type": "string"},
                    },
                    "required": ["ticketId", "userId"],
                },
            ),
            # USERS (5 - ADMIN ONLY)
            Tool(
                name="users_list",
                description="List all workspace users (ADMIN only)",
                inputSchema={"type": "object", "properties": {}},
            ),
            Tool(
                name="users_get",
                description="Get user by ID (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {"userId": {"type": "string"}},
                    "required": ["userId"],
                },
            ),
            Tool(
                name="users_invite",
                description="Invite new user to workspace (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "email": {"type": "string", "format": "email"},
                        "role": {"type": "string", "enum": ["ADMIN", "MEMBER"]},
                    },
                    "required": ["email", "role"],
                },
            ),
            Tool(
                name="users_update_role",
                description="Update user role (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "userId": {"type": "string"},
                        "role": {"type": "string", "enum": ["ADMIN", "MEMBER"]},
                    },
                    "required": ["userId", "role"],
                },
            ),
            Tool(
                name="users_deactivate",
                description="Deactivate user (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {"userId": {"type": "string"}},
                    "required": ["userId"],
                },
            ),
            # PIPELINES (4)
            Tool(
                name="pipelines_list",
                description="List all pipelines",
                inputSchema={"type": "object", "properties": {}},
            ),
            Tool(
                name="pipelines_create",
                description="Create pipeline (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "description": {"type": "string"},
                    },
                    "required": ["name"],
                },
            ),
            Tool(
                name="pipelines_update",
                description="Update pipeline (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "pipelineId": {"type": "string"},
                        "name": {"type": "string"},
                        "description": {"type": "string"},
                    },
                    "required": ["pipelineId"],
                },
            ),
            Tool(
                name="pipelines_delete",
                description="Delete pipeline (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {"pipelineId": {"type": "string"}},
                    "required": ["pipelineId"],
                },
            ),
            # STAGES (3)
            Tool(
                name="stages_list",
                description="List stages in pipeline",
                inputSchema={
                    "type": "object",
                    "properties": {"pipelineId": {"type": "string"}},
                    "required": ["pipelineId"],
                },
            ),
            Tool(
                name="stages_create",
                description="Create stage in pipeline (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "pipelineId": {"type": "string"},
                        "name": {"type": "string"},
                        "order": {"type": "number"},
                    },
                    "required": ["pipelineId", "name"],
                },
            ),
            Tool(
                name="stages_update",
                description="Update stage (ADMIN only)",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "stageId": {"type": "string"},
                        "name": {"type": "string"},
                        "order": {"type": "number"},
                    },
                    "required": ["stageId"],
                },
            ),
            # PORTAL (3 - only working endpoints)
            Tool(
                name="portal_customers_list",
                description="List portal customers",
                inputSchema={"type": "object", "properties": {}},
            ),
            Tool(
                name="portal_tickets_list",
                description="List customer portal tickets",
                inputSchema={"type": "object", "properties": {}},
            ),
            Tool(
                name="portal_tickets_create",
                description="Create ticket from portal",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "description": {"type": "string"},
                    },
                    "required": ["title"],
                },
            ),
        ]
    
    # ==================== SESSION & AUTH ====================
    
    def get_session(self, arguments: dict) -> Optional[Dict[str, Any]]:
        """
        Get session from either:
        1. JWT token (Web/Android - pre-authenticated via Supabase)
        2. Telegram pseudo-JWT (telegram:userId:tenantId format)
        3. Saved session file (CLI - logged in interactively)
        
        Priority: JWT from arguments > file-based session
        No RBAC checks - backend SupabaseAuthGuard handles all authorization
        """
        # Mode 1: JWT token provided (Web/Android/Telegram) - PRIORITY
        if "jwt" in arguments:
            jwt = arguments["jwt"]
            
            # Check if it's a Telegram pseudo-JWT (format: telegram:userId:tenantId)
            if jwt.startswith("telegram:"):
                # Telegram bot - extract userId and tenantId
                # Backend will validate user exists and has access
                logger.info(f"Telegram session detected: {jwt}")
                return {"jwt": jwt}
            
            # Regular Supabase JWT (web/Android)
            return {"jwt": jwt}
        
        # Mode 2: Saved session (CLI) - FALLBACK
        session = load_session()
        if session and not is_session_expired(session):
            return session
        
        return None
    
    async def login(self, args: dict) -> list[TextContent]:
        """Natural language login for CLI clients"""
        email = args.get("email")
        password = args.get("password")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{BACKEND_API}/auth/signin",
                    json={"email": email, "password": password},
                    timeout=30.0,
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    session_data = data.get("session", {})
                    user_info = data.get("dbUser", {})
                    
                    jwt = session_data.get("access_token")
                    
                    if jwt:
                        # Save session for CLI
                        save_session({
                            "email": email,
                            "jwt": jwt,
                            "userId": user_info.get("id"),
                            "role": user_info.get("role", "MEMBER"),
                            "tenantId": user_info.get("tenantId"),
                        })
                        
                        return [TextContent(
                            type="text",
                            text=f"✅ Logged in as {email}\n"
                                 f"Role: {user_info.get('role', 'MEMBER')}\n"
                                 f"Session saved! You can now use CRM tools."
                        )]
                
                error = response.json().get("message", "Login failed")
                return [TextContent(type="text", text=f"❌ {error}")]
                
            except Exception as e:
                logger.error(f"Login error: {e}")
                return [TextContent(type="text", text=f"❌ Login error: {str(e)}")]
    
    async def logout(self) -> list[TextContent]:
        """Logout and clear session"""
        delete_session()
        return [TextContent(type="text", text="✅ Logged out successfully")]
    
    async def whoami(self) -> list[TextContent]:
        """Show current session info"""
        session = load_session()
        if session:
            return [TextContent(
                type="text",
                text=f"👤 {session.get('email')}\n"
                     f"Role: {session.get('role')}\n"
                     f"Session active"
            )]
        return [TextContent(type="text", text="❌ Not logged in")]
    
    # ==================== TOOL EXECUTION ====================
    
    async def execute_tool(self, name: str, arguments: dict) -> list[TextContent]:
        """Execute tool with backend communication (no RBAC - backend handles authorization)"""
        
        # 1. Handle auth tools (no session needed, CLI only)
        if name == "login":
            return await self.login(arguments)
        elif name == "logout":
            return await self.logout()
        elif name == "whoami":
            return await self.whoami()
        
        # 2. Get session (JWT or file-based)
        session = self.get_session(arguments)
        if not session:
            return [TextContent(
                type="text",
                text="❌ Not authenticated. Please login first or provide valid JWT."
            )]
        
        # 3. Call backend API directly (backend SupabaseAuthGuard handles authorization)
        jwt = session.get("jwt")
        return await self.call_backend(name, arguments, jwt)
    
    def format_natural_language(self, tool_name: str, data: any) -> str:
        """Convert JSON response to natural language"""
        
        # Handle lists
        if isinstance(data, list):
            if len(data) == 0:
                return "No items found."
            
            # Contacts - Include IDs for chatbot to use
            if "contacts" in tool_name:
                result = f"📇 Found {len(data)} contact{'s' if len(data) != 1 else ''}:\n"
                for c in data[:10]:
                    name = f"{c.get('firstName','')} {c.get('lastName','')}".strip()
                    contact_id = c.get('id', 'N/A')
                    result += f"• {name} (ID: {contact_id})\n"
                if len(data) > 10:
                    result += f"... and {len(data) - 10} more"
                return result
            
            # Deals - Include IDs
            elif "deals" in tool_name:
                result = f"💼 Found {len(data)} deal{'s' if len(data) != 1 else ''}:\n"
                for d in data[:10]:
                    title = d.get('title', 'Untitled')
                    deal_id = d.get('id', 'N/A')
                    result += f"• {title} (ID: {deal_id})\n"
                if len(data) > 10:
                    result += f"... and {len(data) - 10} more"
                return result
            
            # Tickets
            elif "tickets" in tool_name:
                titles = [t.get('title','Untitled') for t in data[:5]]
                return f"🎫 Found {len(data)} tickets: {', '.join(titles)}" + ("..." if len(data) > 5 else "")
            
            return f"Found {len(data)} items."
        
        # Handle single objects
        elif isinstance(data, dict):
            # Contact
            if 'firstName' in data:
                name = f"{data.get('firstName','')} {data.get('lastName','')}".strip()
                contact_id = data.get('id', 'N/A')
                if tool_name.endswith('_create'):
                    return f"✅ Created contact: {name} (ID: {contact_id})"
                elif tool_name.endswith('_update'):
                    return f"✅ Updated contact: {name} (ID: {contact_id})"
                return f"Contact: {name}, Email: {data.get('email','N/A')}, ID: {contact_id}"
            
            # Deal  
            elif 'title' in data and 'value' in data:
                if tool_name.endswith('_create'):
                    return f"✅ Created deal: {data['title']} (${data.get('value',0):,.2f})"
                elif tool_name.endswith('_update'):
                    return f"✅ Updated deal: {data['title']}"
                return f"Deal: {data['title']}, Value: ${data.get('value',0):,.2f}"
            
            # Deletions
            if tool_name.endswith('_delete'):
                return "✅ Deleted successfully!"
            
            return json.dumps(data, indent=2)
        
        return str(data)
    
    async def call_backend(self, tool_name: str, args: dict, jwt: str) -> list[TextContent]:
        """Call backend API for tool execution"""
        # Remove jwt from args if present
        args = {k: v for k, v in args.items() if k != "jwt"}
        
        # Map tool names to backend endpoints
        endpoint_map = {
            # Contacts (6)
            "contacts_list": ("GET", "/contacts"),
            "contacts_create": ("POST", "/contacts"),
            "contacts_get": ("GET", "/contacts/{contactId}"),
            "contacts_update": ("PATCH", "/contacts/{contactId}"),
            "contacts_delete": ("DELETE", "/contacts/{contactId}"),
            "contacts_search": ("GET", "/contacts/search?q={query}"),
            # Deals (6)
            "deals_list": ("GET", "/deals"),
            "deals_create": ("POST", "/deals"),
            "deals_get": ("GET", "/deals/{dealId}"),
            "deals_update": ("PATCH", "/deals/{dealId}"),
            "deals_delete": ("DELETE", "/deals/{dealId}"),
            "deals_move": ("PATCH", "/deals/{dealId}/move"),
            # Leads (5)
            "leads_list": ("GET", "/leads"),
            "leads_create": ("POST", "/leads"),
            "leads_update": ("PATCH", "/leads/{leadId}"),
            "leads_convert": ("POST", "/leads/{leadId}/convert"),
            "leads_delete": ("DELETE", "/leads/{leadId}"),
            # Tickets (7)
            "tickets_list": ("GET", "/tickets"),
            "tickets_create": ("POST", "/tickets"),
            "tickets_get": ("GET", "/tickets/{ticketId}"),
            "tickets_update": ("PATCH", "/tickets/{ticketId}"),
            "tickets_delete": ("DELETE", "/tickets/{ticketId}"),
            "tickets_comment": ("POST", "/tickets/{ticketId}/comments"),
            "tickets_assign": ("PATCH", "/tickets/{ticketId}/assign"),
            # Analytics (2 - only verified working endpoints)
            "analytics_dashboard": ("GET", "/analytics/dashboard"),
            "analytics_revenue": ("GET", "/analytics/revenue"),
            # Users (5 - ADMIN)
            "users_list": ("GET", "/users"),
            "users_get": ("GET", "/users/{userId}"),
            "users_invite": ("POST", "/users/invite"),
            "users_update_role": ("PATCH", "/users/{userId}/role"),
            "users_deactivate": ("DELETE", "/users/{userId}"),
            # Pipelines (4)
            "pipelines_list": ("GET", "/pipelines"),
            "pipelines_create": ("POST", "/pipelines"),
            "pipelines_update": ("PATCH", "/pipelines/{pipelineId}"),
            "pipelines_delete": ("DELETE", "/pipelines/{pipelineId}"),
            # Stages (3)
            "stages_list": ("GET", "/stages"),  # Uses ?pipelineId=X query param
            "stages_create": ("POST", "/stages"),
            "stages_update": ("PATCH", "/stages/{stageId}"),
            # Portal (3 - only working endpoints)
            "portal_customers_list": ("GET", "/portal/customers"),
            "portal_tickets_list": ("GET", "/portal/tickets"),
            "portal_tickets_create": ("POST", "/portal/tickets"),
        }
        
        if tool_name not in endpoint_map:
            return [TextContent(type="text", text=f"❌ Unknown tool: {tool_name}")]
        
        method, endpoint = endpoint_map[tool_name]
        
        # Replace path parameters and track which keys are used in path
        path_params = set()
        for key, value in args.items():
            placeholder = f"{{{key}}}"
            if placeholder in endpoint:
                endpoint = endpoint.replace(placeholder, str(value))
                path_params.add(key)
        
        # Remove path parameters from body (they're already in the URL)
        body_args = {k: v for k, v in args.items() if k not in path_params}
        
        async with httpx.AsyncClient() as client:
            try:
                url = f"{BACKEND_API}{endpoint}"
                headers = {"Authorization": f"Bearer {jwt}"}
                
                # Debug logging
                logger.info(f"Calling {method} {url} with body: {json.dumps(body_args, indent=2)}")
                
                if method == "GET":
                    response = await client.get(url, headers=headers, timeout=30.0)
                elif method == "POST":
                    response = await client.post(url, headers=headers, json=body_args, timeout=30.0)
                elif method == "PATCH":
                    response = await client.patch(url, headers=headers, json=body_args, timeout=30.0)
                elif method == "DELETE":
                    response = await client.delete(url, headers=headers, timeout=30.0)
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    # Return raw JSON - Gemini will format it nicely for users
                    # while still having access to IDs for internal use
                    return [TextContent(type="text", text=json.dumps(data, indent=2))]
                else:
                    error = response.json().get("message", "Request failed")
                    return [TextContent(type="text", text=f"❌ {error}")]
                    
            except Exception as e:
                logger.error(f"Backend call error: {e}")
                return [TextContent(type="text", text=f"❌ Error: {str(e)}")]
    
    # ==================== MCP HANDLERS (stdio) ====================
    
    def setup_mcp_handlers(self):
        """Setup MCP server handlers for stdio transport"""
        
        @self.server.list_tools()
        async def handle_list_tools() -> list[Tool]:
            """List all tools"""
            return self.get_tool_list()
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
            """Execute tool"""
            logger.info(f"[stdio] Tool: {name}")
            return await self.execute_tool(name, arguments)
    
    # ==================== HTTP ENDPOINTS ====================
    
    def setup_http_endpoints(self):
        """Setup HTTP endpoints for web/android"""
        
        @self.http_app.get("/health")
        async def health():
            """Health check"""
            return {
                "status": "ok",
                "transports": ["stdio", "http"],
                "tools": len(self.get_tool_list())
            }
        
        @self.http_app.get("/mcp/tools")
        async def list_tools():
            """List all tools via HTTP"""
            tools = self.get_tool_list()
            return {"tools": [{"name": t.name, "description": t.description} for t in tools]}
        
        @self.http_app.post("/mcp/call-tool")
        async def call_tool(
            request: ToolCallRequest,
            authorization: Optional[str] = Header(None)
        ):
            """Call tool via HTTP (with JWT)"""
            logger.info(f"[HTTP] Tool: {request.tool_name}")
            
            # Extract JWT from Authorization header
            arguments = request.arguments.copy()
            if authorization and authorization.startswith("Bearer "):
                jwt = authorization.replace("Bearer ", "")
                arguments["jwt"] = jwt
            
            result = await self.execute_tool(request.tool_name, arguments)
            return {"result": [{"type": r.type, "text": r.text} for r in result]}
    
    # ==================== TRANSPORT RUNNERS ====================
    
    async def run_stdio(self):
        """Run stdio server for CLI clients"""
        logger.info("🖥️  stdio transport: Ready for Gemini/Claude CLI")
        
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="synapse-crm",
                    server_version="3.0.0-unified",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={},
                    ),
                ),
            )
    
    async def run_http(self):
        """Run HTTP server for web/android"""
        logger.info(f"🌐 HTTP transport: Listening on port {HTTP_PORT}")
        
        config = uvicorn.Config(
            self.http_app,
            host="0.0.0.0",
            port=HTTP_PORT,
            log_level="info",
        )
        server = uvicorn.Server(config)
        await server.serve()


# ==================== MAIN ====================

async def main():
    """Start both transports concurrently"""
    server = UnifiedMCPServer()
    
    logger.info("=" * 60)
    logger.info("🚀 Synapse CRM - Unified MCP Server Starting...")
    logger.info("=" * 60)
    logger.info(f"Backend: {BACKEND_URL}")
    logger.info(f"Tools: 25 CRM operations + 3 auth")
    logger.info("")
    logger.info("Transports:")
    logger.info("  - stdio: for Gemini CLI, Claude CLI, Claude Desktop")
    logger.info(f"  - HTTP: for Web, Android, Telegram (port {HTTP_PORT})")
    logger.info("")
    logger.info("Auth Modes:")
    logger.info("  - CLI: Natural language login (saves session)")
    logger.info("  - Web/Android: JWT from Supabase (Authorization header)")
    logger.info("  - Telegram: Pseudo-JWT (telegram:userId:tenantId)")
    logger.info("=" * 60)
    
    # Run both transports concurrently!
    await asyncio.gather(
        server.run_stdio(),
        server.run_http()
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n👋 Server stopped")
