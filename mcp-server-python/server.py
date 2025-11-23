"""
Synapse CRM - MCP Server
Python implementation using official MCP SDK

This server acts as a bridge between MCP clients (Gemini CLI, Telegram bot, chatbot)
and the existing NestJS backend API.

Features:
- 16 tools for CRM operations (auth, contacts, leads, deals, tickets)
- JWT-based authentication
- Multi-tenant support
- Automatic token management
"""

import asyncio
import os
import sys
import logging
import json
from typing import Any, Optional
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

import httpx
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
)

# Load environment variables
load_dotenv()

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")
BACKEND_API = f"{BACKEND_URL}{os.getenv('BACKEND_API_PREFIX', '/api')}"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Session storage
SESSION_FILE = Path.home() / ".synapse" / "session.json"

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("synapse-mcp")

# Session management functions
def save_session(data: dict):
    """Save session to file"""
    SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    SESSION_FILE.write_text(json.dumps(data, indent=2, default=str))
    logger.info(f"Session saved for {data.get('email')}")

def load_session() -> dict | None:
    """Load session from file"""
    if not SESSION_FILE.exists():
        return None
    try:
        session = json.loads(SESSION_FILE.read_text())
        # Check if expired (24 hour sessions)
        created_at = datetime.fromisoformat(session.get('created_at', '2000-01-01'))
        if datetime.now() - created_at > timedelta(hours=24):
            logger.info("Session expired, clearing...")
            delete_session()
            return None
        return session
    except Exception as e:
        logger.error(f"Error loading session: {e}")
        return None

def delete_session():
    """Delete session file"""
    if SESSION_FILE.exists():
        SESSION_FILE.unlink()
        logger.info("Session deleted")


class SynapseCRMServer:
    """MCP Server for Synapse CRM"""

    def __init__(self):
        self.server = Server("synapse-crm")
        self.setup_handlers()

    def setup_handlers(self):
        """Register all tool handlers"""

        @self.server.list_tools()
        async def handle_list_tools() -> list[Tool]:
            """List all available CRM tools - streamlined to 25 essential tools"""
            return [
                # ==================== AUTHENTICATION (3 tools) ====================
                Tool(
                    name="login",
                    description="Login with email and password. Session persists - no need to pass JWT again!",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "email": {"type": "string", "format": "email", "description": "User email"},
                            "password": {"type": "string", "description": "User password"},
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
                    description="Show current logged in user and session info",
                    inputSchema={"type": "object", "properties": {}},
                ),
                # ==================== CONTACTS ====================
                Tool(
                    name="contact_list",
                    description="List all contacts with optional search/filter",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {
                                "type": "string",
                                "description": "JWT authentication token from auth_sign_in",
                            },
                            "search": {
                                "type": "string",
                                "description": "Search query for contact name/email",
                            },
                            "limit": {
                                "type": "number",
                                "default": 10,
                                "description": "Number of results to return",
                            },
                        },
                        "required": ["jwt"],
                    },
                ),
                Tool(
                    name="contact_create",
                    description="Create a new contact",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string", "description": "JWT token"},
                            "firstName": {"type": "string", "description": "First name"},
                            "lastName": {"type": "string", "description": "Last name"},
                            "email": {
                                "type": "string",
                                "format": "email",
                                "description": "Email address",
                            },
                            "phone": {"type": "string", "description": "Phone number"},
                            "company": {"type": "string", "description": "Company name"},
                        },
                        "required": ["jwt", "firstName", "lastName"],
                    },
                ),
                Tool(
                    name="contact_get",
                    description="Get contact details by ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string", "description": "JWT token"},
                            "contactId": {"type": "string", "description": "Contact ID"},
                        },
                        "required": ["jwt", "contactId"],
                    },
                ),
                Tool(
                    name="contact_update",
                    description="Update contact details",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string", "description": "JWT token"},
                            "contactId": {"type": "string", "description": "Contact ID"},
                            "firstName": {"type": "string"},
                            "lastName": {"type": "string"},
                            "email": {"type": "string", "format": "email"},
                            "phone": {"type": "string"},
                            "company": {"type": "string"},
                        },
                        "required": ["jwt", "contactId"],
                    },
                ),
                Tool(
                    name="contact_delete",
                    description="Delete a contact",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string", "description": "JWT token"},
                            "contactId": {"type": "string", "description": "Contact ID"},
                        },
                        "required": ["jwt", "contactId"],
                    },
                ),
                # ==================== LEADS ====================
                Tool(
                    name="lead_list",
                    description="List all leads with optional filters",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string", "description": "JWT token"},
                            "status": {
                                "type": "string",
                                "enum": ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"],
                                "description": "Filter by lead status",
                            },
                            "limit": {"type": "number", "default": 10},
                        },
                        "required": ["jwt"],
                    },
                ),
                Tool(
                    name="lead_create",
                    description="Create a new lead",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string"},
                            "title": {"type": "string", "description": "Lead title"},
                            "email": {"type": "string", "format": "email"},
                            "phone": {"type": "string"},
                            "company": {"type": "string"},
                            "source": {"type": "string", "description": "Lead source"},
                        },
                        "required": ["jwt", "title"],
                    },
                ),
                Tool(
                    name="lead_update",
                    description="Update lead details",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string"},
                            "leadId": {"type": "string", "description": "Lead ID"},
                            "title": {"type": "string"},
                            "email": {"type": "string", "format": "email"},
                            "phone": {"type": "string"},
                            "company": {"type": "string"},
                            "status": {
                                "type": "string",
                                "enum": ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"],
                            },
                        },
                        "required": ["jwt", "leadId"],
                    },
                ),
                # ==================== DEALS ====================
                Tool(
                    name="deal_list",
                    description="List all deals with optional filters",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string"},
                            "stageId": {"type": "string", "description": "Filter by stage ID"},
                            "limit": {"type": "number", "default": 10},
                        },
                        "required": ["jwt"],
                    },
                ),
                Tool(
                    name="deal_create",
                    description="Create a new deal",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string"},
                            "title": {"type": "string", "description": "Deal title"},
                            "value": {"type": "number", "description": "Deal value in dollars"},
                            "contactId": {"type": "string", "description": "Associated contact ID"},
                            "pipelineId": {"type": "string", "description": "Pipeline ID"},
                            "stageId": {"type": "string", "description": "Initial stage ID"},
                        },
                        "required": ["jwt", "title", "value", "pipelineId", "stageId"],
                    },
                ),
                Tool(
                    name="deal_update",
                    description="Update deal details",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string"},
                            "dealId": {"type": "string", "description": "Deal ID"},
                            "title": {"type": "string"},
                            "value": {"type": "number"},
                            "stageId": {"type": "string"},
                        },
                        "required": ["jwt", "dealId"],
                    },
                ),
                # ==================== TICKETS ====================
                Tool(
                    name="ticket_list",
                    description="List all tickets with optional filters",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string"},
                            "status": {
                                "type": "string",
                                "enum": ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"],
                            },
                            "limit": {"type": "number", "default": 10},
                        },
                        "required": ["jwt"],
                    },
                ),
                Tool(
                    name="ticket_create",
                    description="Create a new support ticket",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string"},
                            "subject": {"type": "string", "description": "Ticket subject"},
                            "description": {"type": "string", "description": "Ticket description"},
                            "priority": {
                                "type": "string",
                                "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"],
                            },
                            "contactId": {"type": "string", "description": "Associated contact ID"},
                        },
                        "required": ["jwt", "subject", "description", "priority"],
                    },
                ),
                Tool(
                    name="ticket_update",
                    description="Update ticket details",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "jwt": {"type": "string"},
                            "ticketId": {"type": "string", "description": "Ticket ID"},
                            "subject": {"type": "string"},
                            "description": {"type": "string"},
                            "status": {
                                "type": "string",
                                "enum": ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
                            },
                            "priority": {
                                "type": "string",
                                "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"],
                            },
                        },
                        "required": ["jwt", "ticketId"],
                    },
                ),
            ]

        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
            """Execute tool calls by forwarding to NestJS backend"""
            try:
                logger.info(f"Executing tool: {name} with args: {arguments}")

                # Route to appropriate handler
                if name == "auth_sign_in":
                    return await self.auth_sign_in(arguments)
                elif name == "auth_sign_up":
                    return await self.auth_sign_up(arguments)
                elif name == "contact_list":
                    return await self.contact_list(arguments)
                elif name == "contact_create":
                    return await self.contact_create(arguments)
                elif name == "contact_get":
                    return await self.contact_get(arguments)
                elif name == "contact_update":
                    return await self.contact_update(arguments)
                elif name == "contact_delete":
                    return await self.contact_delete(arguments)
                elif name == "lead_list":
                    return await self.lead_list(arguments)
                elif name == "lead_create":
                    return await self.lead_create(arguments)
                elif name == "lead_update":
                    return await self.lead_update(arguments)
                elif name == "deal_list":
                    return await self.deal_list(arguments)
                elif name == "deal_create":
                    return await self.deal_create(arguments)
                elif name == "deal_update":
                    return await self.deal_update(arguments)
                elif name == "ticket_list":
                    return await self.ticket_list(arguments)
                elif name == "ticket_create":
                    return await self.ticket_create(arguments)
                elif name == "ticket_update":
                    return await self.ticket_update(arguments)
                else:
                    raise ValueError(f"Unknown tool: {name}")

            except Exception as e:
                logger.error(f"Tool execution error: {str(e)}", exc_info=True)
                return [
                    TextContent(
                        type="text",
                        text=f"❌ Error: {str(e)}",
                    )
                ]

    # ==================== AUTHENTICATION HANDLERS ====================

    async def auth_sign_in(self, args: dict) -> list[TextContent]:
        """Handle sign in"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BACKEND_API}/auth/signin",
                json={"email": args["email"], "password": args["password"]},
                timeout=30.0,
            )

            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                jwt = data.get("access_token") or data.get("jwt") or data.get("token")

                if jwt:
                    # Store token for this user
                    user_tokens[args["email"]] = jwt

                    return [
                        TextContent(
                            type="text",
                            text=f"✅ Sign in successful!\n\n"
                            f"JWT Token: {jwt}\n\n"
                            f"Use this token in subsequent requests by passing it as the 'jwt' parameter.",
                        )
                    ]

            error_msg = response.json().get("message", "Authentication failed")
            return [TextContent(type="text", text=f"❌ Sign in failed: {error_msg}")]

    async def auth_sign_up(self, args: dict) -> list[TextContent]:
        """Handle sign up"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BACKEND_API}/auth/signup",
                json=args,
                timeout=30.0,
            )

            if response.status_code in [200, 201]:
                return [
                    TextContent(
                        type="text",
                        text=f"✅ Account created successfully!\n\nNow use auth_sign_in to login.",
                    )
                ]

            error_msg = response.json().get("message", "Sign up failed")
            return [TextContent(type="text", text=f"❌ Sign up failed: {error_msg}")]

    # ==================== CONTACT HANDLERS ====================

    async def contact_list(self, args: dict) -> list[TextContent]:
        """List contacts"""
        return await self._api_call("GET", "/contacts", args)

    async def contact_create(self, args: dict) -> list[TextContent]:
        """Create contact"""
        return await self._api_call("POST", "/contacts", args)

    async def contact_get(self, args: dict) -> list[TextContent]:
        """Get contact"""
        contact_id = args.pop("contactId")
        return await self._api_call("GET", f"/contacts/{contact_id}", args)

    async def contact_update(self, args: dict) -> list[TextContent]:
        """Update contact"""
        contact_id = args.pop("contactId")
        return await self._api_call("PATCH", f"/contacts/{contact_id}", args)

    async def contact_delete(self, args: dict) -> list[TextContent]:
        """Delete contact"""
        contact_id = args.pop("contactId")
        return await self._api_call("DELETE", f"/contacts/{contact_id}", args)

    # ==================== LEAD HANDLERS ====================

    async def lead_list(self, args: dict) -> list[TextContent]:
        """List leads"""
        return await self._api_call("GET", "/leads", args)

    async def lead_create(self, args: dict) -> list[TextContent]:
        """Create lead"""
        return await self._api_call("POST", "/leads", args)

    async def lead_update(self, args: dict) -> list[TextContent]:
        """Update lead"""
        lead_id = args.pop("leadId")
        return await self._api_call("PATCH", f"/leads/{lead_id}", args)

    # ==================== DEAL HANDLERS ====================

    async def deal_list(self, args: dict) -> list[TextContent]:
        """List deals"""
        return await self._api_call("GET", "/deals", args)

    async def deal_create(self, args: dict) -> list[TextContent]:
        """Create deal"""
        return await self._api_call("POST", "/deals", args)

    async def deal_update(self, args: dict) -> list[TextContent]:
        """Update deal"""
        deal_id = args.pop("dealId")
        return await self._api_call("PATCH", f"/deals/{deal_id}", args)

    # ==================== TICKET HANDLERS ====================

    async def ticket_list(self, args: dict) -> list[TextContent]:
        """List tickets"""
        return await self._api_call("GET", "/tickets", args)

    async def ticket_create(self, args: dict) -> list[TextContent]:
        """Create ticket"""
        return await self._api_call("POST", "/tickets", args)

    async def ticket_update(self, args: dict) -> list[TextContent]:
        """Update ticket"""
        ticket_id = args.pop("ticketId")
        return await self._api_call("PATCH", f"/tickets/{ticket_id}", args)

    # ==================== HELPER METHODS ====================

    async def _api_call(
        self, method: str, endpoint: str, args: dict
    ) -> list[TextContent]:
        """Generic API call handler"""
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
                    return [
                        TextContent(
                            type="text",
                            text=f"✅ Success!\n\n{self._format_response(data)}",
                        )
                    ]
                else:
                    error = response.json().get("message", "Request failed")
                    return [
                        TextContent(
                            type="text",
                            text=f"❌ Error {response.status_code}: {error}",
                        )
                    ]

            except Exception as e:
                logger.error(f"API call error: {str(e)}", exc_info=True)
                return [TextContent(type="text", text=f"❌ API Error: {str(e)}")]

    def _format_response(self, data: Any) -> str:
        """Format API response for display"""
        import json

        return json.dumps(data, indent=2, ensure_ascii=False)

    async def run(self):
        """Run the MCP server"""
        async with stdio_server() as (read_stream, write_stream):
            logger.info(f"Starting {os.getenv('MCP_SERVER_NAME', 'Synapse CRM')} MCP Server")
            logger.info(f"Backend URL: {BACKEND_URL}")
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name=os.getenv("MCP_SERVER_NAME", "synapse-crm"),
                    server_version=os.getenv("MCP_SERVER_VERSION", "1.0.0"),
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
