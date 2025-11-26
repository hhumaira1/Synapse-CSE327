"""
Synapse CRM - Streamlined MCP Server
25 essential tools with automatic session management

Natural language examples:
- "Login as admin@example.com password test123"
- "Show all contacts"
- "Create contact John Doe, john@acme.com"
- "Show my deals"
- "Create ticket: Login broken, HIGH priority"
"""

import asyncio
import os
import logging
import json
from typing import Any
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

import httpx
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Load environment variables
load_dotenv()

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")
BACKEND_API = f"{BACKEND_URL}{os.getenv('BACKEND_API_PREFIX', '/api')}"
SESSION_FILE = Path.home() / ".synapse" / "session.json"

# Setup logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("synapse-mcp")


# ==================== GUARDRAILS ====================

# CRM-related keywords and patterns
CRM_KEYWORDS = {
    "contacts", "contact", "customer", "customers", "client", "clients",
    "deals", "deal", "opportunity", "opportunities", "sales", "pipeline",
    "leads", "lead", "prospect", "prospects",
    "tickets", "ticket", "support", "issue", "issues",
    "tenant", "tenants", "workspace", "workspaces",
    "analytics", "dashboard", "reports", "forecast", "revenue",
    "email", "phone", "company", "organization",
    "create", "update", "delete", "list", "show", "get", "find",
    "login", "logout", "signin", "signout", "auth", "authentication"
}

def is_crm_related_query(text: str) -> tuple[bool, str]:
    """
    Check if query is CRM/tenant-related with guardrails
    Returns: (is_valid, reason)
    """
    text_lower = text.lower()
    
    # Allow authentication commands
    if any(word in text_lower for word in ["login", "logout", "signin", "signout", "whoami"]):
        return True, "Authentication command"
    
    # Check for CRM keywords
    if any(keyword in text_lower for keyword in CRM_KEYWORDS):
        return True, "CRM-related query"
    
    # Block non-CRM queries
    blocked_patterns = [
        "weather", "news", "joke", "recipe", "movie", "music",
        "write code", "debug", "programming", "python", "javascript",
        "math", "calculate", "solve", "equation",
        "translate", "definition", "wikipedia",
        "stock", "crypto", "bitcoin", 
        "travel", "flight", "hotel", "booking",
        "game", "gaming", "video game",
    ]
    
    if any(pattern in text_lower for pattern in blocked_patterns):
        return False, f"This chatbot only handles CRM and tenant management operations. Your query appears to be about '{next(p for p in blocked_patterns if p in text_lower)}', which is outside the scope."
    
    # If no CRM keywords found, be cautious
    return False, "⚠️ This chatbot is specialized for CRM operations (contacts, deals, leads, tickets, analytics). Please rephrase your request to include CRM-related operations."


# ==================== SESSION MANAGEMENT ====================

def save_session(data: dict):
    """Save session to file"""
    SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    SESSION_FILE.write_text(json.dumps(data, indent=2, default=str))
    logger.info(f"✅ Session saved for {data.get('email')}")


def load_session() -> dict | None:
    """Load session from file"""
    if not SESSION_FILE.exists():
        return None
    try:
        session = json.loads(SESSION_FILE.read_text())
        # Check if expired (24 hours)
        created = datetime.fromisoformat(session.get('created_at', '2000-01-01'))
        if datetime.now() - created > timedelta(hours=24):
            logger.info("⚠️  Session expired")
            delete_session()
            return None
        return session
    except Exception as e:
        logger.error(f"❌ Error loading session: {e}")
        return None


def delete_session():
    """Delete session"""
    if SESSION_FILE.exists():
        SESSION_FILE.unlink()
        logger.info("🗑️  Session deleted")


# ==================== MCP SERVER ====================

class SynapseCRMServer:
    """Streamlined MCP Server with 25 essential tools"""

    def __init__(self):
        self.server = Server("synapse-crm")
        self.setup_handlers()

    def setup_handlers(self):
        """Register all tool handlers"""

        @self.server.list_tools()
        async def handle_list_tools() -> list[Tool]:
            """List all 25 essential CRM tools"""
            return [
                # ==================== AUTHENTICATION (3) ====================
                Tool(
                    name="login",
                    description="Login with email and password. Saves session automatically!",
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
                    description="Show current user and session info",
                    inputSchema={"type": "object", "properties": {}},
                ),
                # ==================== CONTACTS (5) ====================
                Tool(
                    name="contacts_list",
                    description="List all contacts. Use natural language: 'Show all contacts' or 'Find contacts'",
                    inputSchema={"type": "object", "properties": {}},
                ),
                Tool(
                    name="contacts_create",
                    description="Create new contact. Example: 'Create contact John Doe, john@acme.com, phone 555-1234'",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "firstName": {"type": "string"},
                            "lastName": {"type": "string"},
                            "email": {"type": "string", "format": "email"},
                            "phone": {"type": "string"},
                            "company": {"type": "string"},
                        },
                        "required": ["firstName", "lastName"],
                    },
                ),
                Tool(
                    name="contacts_get",
                    description="Get contact details by ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "contactId": {"type": "string"},
                        },
                        "required": ["contactId"],
                    },
                ),
                Tool(
                    name="contacts_update",
                    description="Update contact. Example: 'Update contact ABC123 phone to 555-9999'",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "contactId": {"type": "string"},
                            "firstName": {"type": "string"},
                            "lastName": {"type": "string"},
                            "email": {"type": "string"},
                            "phone": {"type": "string"},
                            "company": {"type": "string"},
                        },
                        "required": ["contactId"],
                    },
                ),
                Tool(
                    name="contacts_delete",
                    description="Delete contact by ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "contactId": {"type": "string"},
                        },
                        "required": ["contactId"],
                    },
                ),
                # ==================== LEADS (5) ====================
                Tool(
                    name="leads_list",
                    description="List leads with optional status filter (NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED)",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "status": {
                                "type": "string",
                                "enum": ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"],
                            },
                        },
                    },
                ),
                Tool(
                    name="leads_create",
                    description="Create new lead. Example: 'Create lead: Acme Corp opportunity'",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "source": {"type": "string"},
                            "contactId": {"type": "string"},
                            "value": {"type": "number"},
                        },
                        "required": ["title", "source"],
                    },
                ),
                Tool(
                    name="leads_update",
                    description="Update lead status or details",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "leadId": {"type": "string"},
                            "status": {
                                "type": "string",
                                "enum": ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"],
                            },
                            "title": {"type": "string"},
                        },
                        "required": ["leadId"],
                    },
                ),
                Tool(
                    name="leads_convert",
                    description="Convert lead to deal. Example: 'Convert lead XYZ to deal'",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "leadId": {"type": "string"},
                            "dealTitle": {"type": "string"},
                            "dealValue": {"type": "number"},
                            "pipelineId": {"type": "string"},
                            "stageId": {"type": "string"},
                        },
                        "required": ["leadId", "dealTitle", "pipelineId", "stageId"],
                    },
                ),
                Tool(
                    name="leads_delete",
                    description="Delete lead by ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "leadId": {"type": "string"},
                        },
                        "required": ["leadId"],
                    },
                ),
                # ==================== DEALS (6) ====================
                Tool(
                    name="deals_list",
                    description="List deals with optional filters. Example: 'Show all deals' or 'Deals in pipeline XYZ'",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "pipelineId": {"type": "string"},
                            "stageId": {"type": "string"},
                        },
                    },
                ),
                Tool(
                    name="deals_create",
                    description="Create new deal. Example: 'Create $50k deal with Acme Corp'",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "value": {"type": "number"},
                            "contactId": {"type": "string"},
                            "pipelineId": {"type": "string"},
                            "stageId": {"type": "string"},
                        },
                        "required": ["title", "contactId", "pipelineId", "stageId"],
                    },
                ),
                Tool(
                    name="deals_get",
                    description="Get deal details by ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "dealId": {"type": "string"},
                        },
                        "required": ["dealId"],
                    },
                ),
                Tool(
                    name="deals_move",
                    description="Move deal to different stage. Example: 'Move deal XYZ to Negotiation'",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "dealId": {"type": "string"},
                            "stageId": {"type": "string"},
                        },
                        "required": ["dealId", "stageId"],
                    },
                ),
                Tool(
                    name="deals_update",
                    description="Update deal details",
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
                    description="Delete deal by ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "dealId": {"type": "string"},
                        },
                        "required": ["dealId"],
                    },
                ),
                # ==================== TICKETS (5) ====================
                Tool(
                    name="tickets_list",
                    description="List tickets with optional filters (status: OPEN, IN_PROGRESS, RESOLVED, CLOSED)",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "status": {
                                "type": "string",
                                "enum": ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"],
                            },
                        },
                    },
                ),
                Tool(
                    name="tickets_create",
                    description="Create support ticket. Example: 'Create ticket: Login issue, HIGH priority'",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "priority": {
                                "type": "string",
                                "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"],
                            },
                            "contactId": {"type": "string"},
                        },
                        "required": ["title", "description", "priority", "contactId"],
                    },
                ),
                Tool(
                    name="tickets_update",
                    description="Update ticket status or details",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "ticketId": {"type": "string"},
                            "status": {
                                "type": "string",
                                "enum": ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"],
                            },
                        },
                        "required": ["ticketId"],
                    },
                ),
                Tool(
                    name="tickets_comment",
                    description="Add comment to ticket",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "ticketId": {"type": "string"},
                            "content": {"type": "string"},
                        },
                        "required": ["ticketId", "content"],
                    },
                ),
                Tool(
                    name="tickets_delete",
                    description="Delete ticket by ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "ticketId": {"type": "string"},
                        },
                        "required": ["ticketId"],
                    },
                ),
                # ==================== ANALYTICS (1) ====================
                Tool(
                    name="analytics_dashboard",
                    description="Get dashboard analytics overview",
                    inputSchema={"type": "object", "properties": {}},
                ),
            ]

        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
            """Execute tool with automatic JWT injection"""
            try:
                logger.info(f"🔧 Tool: {name}")

                # Authentication tools (no JWT needed)
                if name == "login":
                    return await self.login(arguments)
                elif name == "logout":
                    return await self.logout()
                elif name == "whoami":
                    return await self.whoami()

                # All other tools require session
                session = load_session()
                if not session:
                    return [TextContent(
                        type="text",
                        text="❌ Not logged in. Please login first:\n"
                             "Example: 'Login as admin@example.com password test123'"
                    )]

                # Auto-inject JWT
                arguments["jwt"] = session["jwt"]

                # Route to handler
                if name.startswith("contacts_"):
                    return await self.handle_contacts(name, arguments)
                elif name.startswith("leads_"):
                    return await self.handle_leads(name, arguments)
                elif name.startswith("deals_"):
                    return await self.handle_deals(name, arguments)
                elif name.startswith("tickets_"):
                    return await self.handle_tickets(name, arguments)
                elif name == "analytics_dashboard":
                    return await self.api_call("GET", "/analytics/dashboard", arguments)
                else:
                    return [TextContent(type="text", text=f"❌ Unknown tool: {name}")]

            except Exception as e:
                logger.error(f"❌ Error: {e}", exc_info=True)
                return [TextContent(type="text", text=f"❌ Error: {str(e)}")]

    # ==================== AUTHENTICATION ====================

    async def login(self, args: dict) -> list[TextContent]:
        """Login and save session"""
        async with httpx.AsyncClient() as client:
            try:
                payload = {"email": args.get("email"), "password": args.get("password")}
                logger.info(f"Login attempt for: {payload['email']}")
                
                response = await client.post(
                    f"{BACKEND_API}/auth/signin",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=30.0,
                )
                
                logger.info(f"Response status: {response.status_code}")
                logger.info(f"Response body: {response.text}")

                if response.status_code in [200, 201]:
                    data = response.json()
                    
                    # Extract JWT from nested session object or top-level
                    session_data = data.get("session", {})
                    jwt = (
                        session_data.get("access_token") or 
                        data.get("access_token") or 
                        data.get("jwt") or 
                        data.get("token")
                    )

                    if jwt:
                        # Save session with user info
                        user_info = data.get("dbUser", {})
                        save_session({
                            "email": args["email"],
                            "jwt": jwt,
                            "userId": user_info.get("id"),
                            "tenantId": user_info.get("tenantId"),
                            "role": user_info.get("role"),
                            "created_at": datetime.now().isoformat(),
                        })

                        return [TextContent(
                            type="text",
                            text=f"✅ Logged in as {args['email']}\n"
                                 f"👤 Role: {user_info.get('role', 'USER')}\n"
                                 f"🏢 Workspace: {user_info.get('tenant', {}).get('name', 'N/A')}\n"
                                 f"✅ Session saved - use tools without JWT!\n\n"
                                 f"Try: 'Show all contacts' or 'Show my deals'"
                        )]

                # Handle error response
                try:
                    error_data = response.json()
                    error_msg = error_data.get("message", error_data)
                except:
                    error_msg = response.text
                    
                return [TextContent(type="text", text=f"❌ Login failed: {error_msg}")]
                
            except Exception as e:
                logger.error(f"Login error: {e}", exc_info=True)
                return [TextContent(type="text", text=f"❌ Login error: {str(e)}")]

    async def logout(self) -> list[TextContent]:
        """Logout and clear session"""
        delete_session()
        return [TextContent(type="text", text="✅ Logged out successfully")]

    async def whoami(self) -> list[TextContent]:
        """Show current session"""
        session = load_session()
        if not session:
            return [TextContent(type="text", text="❌ Not logged in")]

        created = datetime.fromisoformat(session['created_at'])
        age = datetime.now() - created

        return [TextContent(
            type="text",
            text=f"✅ Logged in as: {session['email']}\n"
                 f"📅 Session age: {age.seconds // 3600}h {(age.seconds % 3600) // 60}m\n"
                 f"⏰ Expires in: {24 - (age.seconds // 3600)}h"
        )]

    # ==================== CONTACTS ====================

    async def handle_contacts(self, name: str, args: dict) -> list[TextContent]:
        """Handle contact operations"""
        if name == "contacts_list":
            return await self.api_call("GET", "/contacts", args)
        elif name == "contacts_create":
            return await self.api_call("POST", "/contacts", args)
        elif name == "contacts_get":
            contact_id = args.pop("contactId")
            return await self.api_call("GET", f"/contacts/{contact_id}", args)
        elif name == "contacts_update":
            contact_id = args.pop("contactId")
            return await self.api_call("PATCH", f"/contacts/{contact_id}", args)
        elif name == "contacts_delete":
            contact_id = args.pop("contactId")
            return await self.api_call("DELETE", f"/contacts/{contact_id}", args)

    # ==================== LEADS ====================

    async def handle_leads(self, name: str, args: dict) -> list[TextContent]:
        """Handle lead operations"""
        if name == "leads_list":
            return await self.api_call("GET", "/leads", args)
        elif name == "leads_create":
            return await self.api_call("POST", "/leads", args)
        elif name == "leads_update":
            lead_id = args.pop("leadId")
            return await self.api_call("PATCH", f"/leads/{lead_id}", args)
        elif name == "leads_convert":
            lead_id = args.pop("leadId")
            return await self.api_call("POST", f"/leads/{lead_id}/convert", args)
        elif name == "leads_delete":
            lead_id = args.pop("leadId")
            return await self.api_call("DELETE", f"/leads/{lead_id}", args)

    # ==================== DEALS ====================

    async def handle_deals(self, name: str, args: dict) -> list[TextContent]:
        """Handle deal operations"""
        if name == "deals_list":
            return await self.api_call("GET", "/deals", args)
        elif name == "deals_create":
            return await self.api_call("POST", "/deals", args)
        elif name == "deals_get":
            deal_id = args.pop("dealId")
            return await self.api_call("GET", f"/deals/{deal_id}", args)
        elif name == "deals_move":
            deal_id = args.pop("dealId")
            return await self.api_call("PATCH", f"/deals/{deal_id}/move", args)
        elif name == "deals_update":
            deal_id = args.pop("dealId")
            return await self.api_call("PATCH", f"/deals/{deal_id}", args)
        elif name == "deals_delete":
            deal_id = args.pop("dealId")
            return await self.api_call("DELETE", f"/deals/{deal_id}", args)

    # ==================== TICKETS ====================

    async def handle_tickets(self, name: str, args: dict) -> list[TextContent]:
        """Handle ticket operations"""
        if name == "tickets_list":
            return await self.api_call("GET", "/tickets", args)
        elif name == "tickets_create":
            return await self.api_call("POST", "/tickets", args)
        elif name == "tickets_update":
            ticket_id = args.pop("ticketId")
            return await self.api_call("PATCH", f"/tickets/{ticket_id}", args)
        elif name == "tickets_comment":
            ticket_id = args.pop("ticketId")
            return await self.api_call("POST", f"/tickets/{ticket_id}/comments", args)
        elif name == "tickets_delete":
            ticket_id = args.pop("ticketId")
            return await self.api_call("DELETE", f"/tickets/{ticket_id}", args)

    # ==================== FORMATTERS ====================

    def format_contacts(self, contacts: list) -> str:
        """Format contacts in natural language"""
        if not contacts:
            return "📭 No contacts found."
        
        result = f"📇 **Found {len(contacts)} contact(s):**\n\n"
        for contact in contacts:
            result += f"• **{contact.get('firstName', '')} {contact.get('lastName', '')}**\n"
            if contact.get('email'):
                result += f"  📧 {contact['email']}\n"
            if contact.get('phone'):
                result += f"  📱 {contact['phone']}\n"
            if contact.get('company'):
                result += f"  🏢 {contact['company']}"
                if contact.get('jobTitle'):
                    result += f" - {contact['jobTitle']}"
                result += "\n"
            
            # Show related data counts
            deals_count = len(contact.get('deals', []))
            tickets_count = len(contact.get('tickets', []))
            if deals_count or tickets_count:
                result += f"  💼 {deals_count} deal(s), 🎫 {tickets_count} ticket(s)\n"
            result += "\n"
        
        return result.strip()

    def format_deals(self, deals: list) -> str:
        """Format deals in natural language"""
        if not deals:
            return "📭 No deals found."
        
        result = f"💼 **Found {len(deals)} deal(s):**\n\n"
        total_value = 0
        
        for deal in deals:
            value = float(deal.get('value', 0))
            total_value += value
            
            result += f"• **{deal.get('title', 'Untitled')}** - ${value:,.2f}\n"
            
            contact = deal.get('contact', {})
            if contact:
                result += f"  👤 {contact.get('firstName', '')} {contact.get('lastName', '')} ({contact.get('company', 'N/A')})\n"
            
            stage = deal.get('stage', {})
            pipeline = deal.get('pipeline', {})
            if stage or pipeline:
                result += f"  📊 {pipeline.get('name', 'N/A')} → {stage.get('name', 'N/A')}\n"
            
            if deal.get('probability'):
                result += f"  🎯 {deal['probability']}% probability\n"
            
            if deal.get('expectedCloseDate'):
                result += f"  📅 Expected close: {deal['expectedCloseDate'][:10]}\n"
            
            result += "\n"
        
        result += f"💰 **Total pipeline value:** ${total_value:,.2f}"
        return result

    def format_leads(self, leads: list) -> str:
        """Format leads in natural language"""
        if not leads:
            return "📭 No leads found."
        
        result = f"🎯 **Found {len(leads)} lead(s):**\n\n"
        
        for lead in leads:
            result += f"• **{lead.get('title', 'Untitled')}**\n"
            result += f"  📌 Status: {lead.get('status', 'N/A')}\n"
            result += f"  📍 Source: {lead.get('source', 'N/A')}\n"
            
            if lead.get('value'):
                result += f"  💵 Value: ${float(lead['value']):,.2f}\n"
            
            contact = lead.get('contact', {})
            if contact:
                result += f"  👤 {contact.get('firstName', '')} {contact.get('lastName', '')}\n"
            
            result += "\n"
        
        return result.strip()

    def format_tickets(self, tickets: list) -> str:
        """Format tickets in natural language"""
        if not tickets:
            return "📭 No tickets found."
        
        result = f"🎫 **Found {len(tickets)} ticket(s):**\n\n"
        
        priority_emoji = {"LOW": "🟢", "MEDIUM": "🟡", "HIGH": "🟠", "URGENT": "🔴"}
        status_emoji = {"OPEN": "🆕", "IN_PROGRESS": "⏳", "RESOLVED": "✅", "CLOSED": "🔒"}
        
        for ticket in tickets:
            priority = ticket.get('priority', 'MEDIUM')
            status = ticket.get('status', 'OPEN')
            
            result += f"• {priority_emoji.get(priority, '⚪')} **{ticket.get('title', 'Untitled')}**\n"
            result += f"  {status_emoji.get(status, '⚪')} {status} | Priority: {priority}\n"
            
            if ticket.get('description'):
                desc = ticket['description'][:100]
                result += f"  📝 {desc}{'...' if len(ticket['description']) > 100 else ''}\n"
            
            contact = ticket.get('contact', {})
            if contact:
                result += f"  👤 {contact.get('firstName', '')} {contact.get('lastName', '')}\n"
            
            result += "\n"
        
        return result.strip()

    # ==================== API HELPER ====================

    async def api_call(self, method: str, endpoint: str, args: dict) -> list[TextContent]:
        """Generic API call handler with natural language formatting"""
        jwt = args.pop("jwt", None)
        if not jwt:
            return [TextContent(type="text", text="❌ Missing JWT token")]

        headers = {"Authorization": f"Bearer {jwt}"}

        async with httpx.AsyncClient() as client:
            try:
                if method == "GET":
                    response = await client.get(
                        f"{BACKEND_API}{endpoint}",
                        headers=headers,
                        params=args,
                        timeout=30.0,
                    )
                elif method == "POST":
                    response = await client.post(
                        f"{BACKEND_API}{endpoint}",
                        headers=headers,
                        json=args,
                        timeout=30.0,
                    )
                elif method == "PATCH":
                    response = await client.patch(
                        f"{BACKEND_API}{endpoint}",
                        headers=headers,
                        json=args,
                        timeout=30.0,
                    )
                elif method == "DELETE":
                    response = await client.delete(
                        f"{BACKEND_API}{endpoint}",
                        headers=headers,
                        timeout=30.0,
                    )
                else:
                    raise ValueError(f"Unsupported method: {method}")

                if response.status_code in [200, 201]:
                    data = response.json()
                    
                    # Format based on endpoint for better readability
                    if "/contacts" in endpoint and isinstance(data, list):
                        formatted = self.format_contacts(data)
                    elif "/deals" in endpoint and isinstance(data, list):
                        formatted = self.format_deals(data)
                    elif "/leads" in endpoint and isinstance(data, list):
                        formatted = self.format_leads(data)
                    elif "/tickets" in endpoint and isinstance(data, list):
                        formatted = self.format_tickets(data)
                    elif "/contacts" in endpoint and isinstance(data, dict):
                        # Single contact created/updated
                        formatted = f"✅ **Contact saved:** {data.get('firstName', '')} {data.get('lastName', '')}\n"
                        formatted += f"📧 {data.get('email', 'No email')}\n"
                        formatted += f"🆔 ID: `{data.get('id', 'N/A')}`"
                    elif "/deals" in endpoint and isinstance(data, dict):
                        # Single deal created/updated
                        formatted = f"✅ **Deal saved:** {data.get('title', 'Untitled')}\n"
                        formatted += f"💰 Value: ${float(data.get('value', 0)):,.2f}\n"
                        formatted += f"🆔 ID: `{data.get('id', 'N/A')}`"
                    elif "/leads" in endpoint and isinstance(data, dict):
                        # Single lead created/updated
                        formatted = f"✅ **Lead saved:** {data.get('title', 'Untitled')}\n"
                        formatted += f"📌 Status: {data.get('status', 'N/A')}\n"
                        formatted += f"🆔 ID: `{data.get('id', 'N/A')}`"
                    elif "/tickets" in endpoint and isinstance(data, dict):
                        # Single ticket created/updated
                        formatted = f"✅ **Ticket saved:** {data.get('title', 'Untitled')}\n"
                        formatted += f"📌 Status: {data.get('status', 'N/A')} | Priority: {data.get('priority', 'MEDIUM')}\n"
                        formatted += f"🆔 ID: `{data.get('id', 'N/A')}`"
                    elif "/analytics" in endpoint:
                        # Analytics dashboard
                        formatted = "📊 **Dashboard Analytics:**\n\n"
                        formatted += f"👥 Total Contacts: {data.get('totalContacts', 0)}\n"
                        formatted += f"🎯 Total Leads: {data.get('totalLeads', 0)}\n"
                        formatted += f"💼 Total Deals: {data.get('totalDeals', 0)}\n"
                        formatted += f"🎫 Total Tickets: {data.get('totalTickets', 0)}\n\n"
                        formatted += f"💰 Total Revenue: ${data.get('totalRevenue', 0):,.2f}\n"
                        formatted += f"📈 Win Rate: {data.get('winRate', 0):.1f}%"
                    else:
                        # Fallback to JSON for other responses
                        formatted = json.dumps(data, indent=2, ensure_ascii=False)
                        formatted = f"✅ Success!\n\n```json\n{formatted}\n```"
                    
                    return [TextContent(type="text", text=formatted)]
                else:
                    error = response.json().get("message", "Request failed")
                    return [TextContent(type="text", text=f"❌ Error {response.status_code}: {error}")]

            except Exception as e:
                logger.error(f"API call error: {e}", exc_info=True)
                return [TextContent(type="text", text=f"❌ API Error: {str(e)}")]

    async def run(self):
        """Run the MCP server"""
        async with stdio_server() as (read_stream, write_stream):
            logger.info(f"🚀 Starting Synapse CRM MCP Server (Streamlined)")
            logger.info(f"🔗 Backend: {BACKEND_URL}")
            logger.info(f"📦 Tools: 25 essential CRM operations")
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="synapse-crm",
                    server_version="2.0.0-streamlined",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={},
                    ),
                ),
            )


async def main():
    """Main entry point"""
    server = SynapseCRMServer()
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())
