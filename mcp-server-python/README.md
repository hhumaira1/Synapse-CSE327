# Synapse CRM - MCP Server (Python)

Official Python implementation of MCP (Model Context Protocol) server for Synapse CRM. This server acts as a bridge between MCP clients (Gemini CLI, Telegram bots, chatbots) and the NestJS backend API.

## Architecture

```
┌─────────────────────┐
│  MCP Clients        │
│  - Gemini CLI       │
│  - Telegram Bot     │
│  - Web Chatbot      │
└──────────┬──────────┘
           │ stdio/SSE
           ↓
┌─────────────────────┐
│  Python MCP Server  │
│  (Port 5000)        │
│  - 16 CRM Tools     │
│  - JWT Auth         │
│  - Multi-tenant     │
└──────────┬──────────┘
           │ HTTP
           ↓
┌─────────────────────┐
│  NestJS Backend     │
│  (Port 3001)        │
│  - Prisma ORM       │
│  - Supabase Auth    │
│  - PostgreSQL       │
└─────────────────────┘
```

## Features

### 16 CRM Tools

**Authentication (2)**:
- `auth_sign_in` - JWT authentication
- `auth_sign_up` - User registration

**Contacts (5)**:
- `contact_list` - List/search contacts
- `contact_create` - Create new contact
- `contact_get` - Get contact details
- `contact_update` - Update contact
- `contact_delete` - Delete contact

**Leads (3)**:
- `lead_list` - List/filter leads
- `lead_create` - Create lead
- `lead_update` - Update lead status

**Deals (3)**:
- `deal_list` - List deals
- `deal_create` - Create deal
- `deal_update` - Move deal in pipeline

**Tickets (3)**:
- `ticket_list` - List support tickets
- `ticket_create` - Create ticket
- `ticket_update` - Update ticket status

## Installation

### Prerequisites

- **Python 3.11+** (tested on 3.11 and 3.12)
- **NestJS Backend** running on `http://localhost:3001`
- **pip** or **conda** for package management

### Step 1: Clone/Navigate

```bash
cd "G:\Cse 327\synapse\mcp-server-python"
```

### Step 2: Create Virtual Environment

**Option A: venv (Recommended)**
```bash
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows CMD
.\venv\Scripts\activate.bat

# Linux/Mac
source venv/bin/activate
```

**Option B: conda**
```bash
conda create -n synapse-mcp python=3.11
conda activate synapse-mcp
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `mcp>=1.0.0` - Official Anthropic MCP SDK
- `httpx>=0.27.0` - Async HTTP client
- `python-dotenv>=1.0.0` - Environment management
- `orjson>=3.9.0` - Fast JSON parsing

### Step 4: Configuration

Copy environment template:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```bash
# Backend API URL (NestJS server)
BACKEND_URL=http://localhost:3001

# API prefix (usually /api)
BACKEND_API_PREFIX=/api

# Server metadata
MCP_SERVER_NAME=Synapse CRM
MCP_SERVER_VERSION=1.0.0

# Logging
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

## Usage

### Running Locally

Start the MCP server:
```bash
# Activate venv first
python server.py
```

The server runs in **stdio mode** (stdin/stdout) for MCP clients.

**Expected Output**:
```
2025-01-21 10:00:00 - synapse-mcp - INFO - Starting Synapse CRM MCP Server
2025-01-21 10:00:00 - synapse-mcp - INFO - Backend URL: http://localhost:3001
```

### Testing with Gemini CLI

#### 1. Update Gemini CLI Config

Edit `e:\gemini cli test\.gemini\settings.json`:

```json
{
  "mcpServers": {
    "synapse": {
      "command": "python",
      "args": ["G:/Cse 327/synapse/mcp-server-python/server.py"],
      "env": {
        "BACKEND_URL": "http://localhost:3001"
      }
    }
  }
}
```

**Critical**: Use forward slashes `/` in path, even on Windows!

#### 2. Start Backend

In separate terminal:
```powershell
cd "G:\Cse 327\synapse\server"
npm run start:dev
```

Wait for: `Application is running on: http://localhost:3001`

#### 3. Start MCP Server

In another terminal:
```powershell
cd "G:\Cse 327\synapse\mcp-server-python"
.\venv\Scripts\Activate.ps1
python server.py
```

#### 4. Test with Gemini CLI

```bash
# List available tools
gemini mcp list

# Expected output:
# synapse: 16 tools
#   - auth_sign_in
#   - auth_sign_up
#   - contact_list
#   ... (13 more)

# Authenticate
gemini chat "Sign in with admin@yourcrm.com password test123"

# Use tools
gemini chat "List all contacts"
gemini chat "Create a contact named John Doe with email john@example.com"
gemini chat "Show me all open tickets"
```

### Example Workflows

#### 1. Authentication Flow

```bash
gemini chat "Sign in as admin@yourcrm.com with password test123"
```

**Expected Response**:
```
✅ Sign in successful!

JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Use this token in subsequent requests by passing it as the 'jwt' parameter.
```

The MCP server **automatically stores the token** for future requests.

#### 2. Contact Management

```bash
# List contacts
gemini chat "Show me all contacts"

# Search contacts
gemini chat "Find contacts with email containing 'gmail.com'"

# Create contact
gemini chat "Create a new contact: John Doe, john@example.com, phone 555-1234"

# Update contact
gemini chat "Update contact ID abc123 - change phone to 555-9999"
```

#### 3. Lead Tracking

```bash
# List new leads
gemini chat "Show me all NEW status leads"

# Create lead
gemini chat "Create lead: Potential Customer, email lead@company.com, source: Website"

# Update lead status
gemini chat "Update lead ID xyz789 to QUALIFIED status"
```

#### 4. Deal Pipeline

```bash
# List deals
gemini chat "Show me all deals in stage XYZ"

# Create deal
gemini chat "Create deal: $50,000 Enterprise Sale, contact ID abc123, pipeline ID main-pipeline, stage ID discovery"

# Move deal
gemini chat "Move deal ID deal123 to stage negotiation"
```

## Troubleshooting

### Issue 1: "ModuleNotFoundError: No module named 'mcp'"

**Cause**: Virtual environment not activated or dependencies not installed

**Solution**:
```bash
# Activate venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### Issue 2: "Connection refused to localhost:3001"

**Cause**: NestJS backend not running

**Solution**:
```bash
cd "G:\Cse 327\synapse\server"
npm run start:dev
```

Verify backend is running: `curl http://localhost:3001/api`

### Issue 3: "❌ Missing JWT token"

**Cause**: Not authenticated yet

**Solution**:
```bash
gemini chat "Sign in with admin@yourcrm.com password test123"
```

### Issue 4: Gemini CLI shows "Initializing..." forever

**Cause**: MCP server path or command incorrect

**Solution**:
1. Check `.gemini/settings.json` has **forward slashes** in path
2. Verify Python is in PATH: `python --version`
3. Test server manually: `python server.py` (should not crash)

### Issue 5: "401 Unauthorized" from backend

**Cause**: JWT token expired or invalid

**Solution**:
```bash
# Re-authenticate
gemini chat "Sign in again with admin@yourcrm.com password test123"
```

## Development

### Project Structure

```
mcp-server-python/
├── server.py           # Main MCP server (16 tools)
├── requirements.txt    # Python dependencies
├── .env                # Configuration (git-ignored)
├── .env.example        # Configuration template
├── README.md           # This file
└── venv/               # Virtual environment (git-ignored)
```

### Adding New Tools

1. **Define Tool in `handle_list_tools()`**:
```python
Tool(
    name="custom_action",
    description="Do something custom",
    inputSchema={
        "type": "object",
        "properties": {
            "jwt": {"type": "string"},
            "param": {"type": "string"}
        },
        "required": ["jwt", "param"]
    }
)
```

2. **Add Handler Method**:
```python
async def custom_action(self, args: dict) -> list[TextContent]:
    """Handle custom action"""
    return await self._api_call("POST", "/custom", args)
```

3. **Route in `handle_call_tool()`**:
```python
elif name == "custom_action":
    return await self.custom_action(arguments)
```

### Debugging

Enable debug logging in `.env`:
```bash
LOG_LEVEL=DEBUG
```

Restart server to see detailed logs:
```
2025-01-21 10:00:01 - synapse-mcp - DEBUG - Executing tool: contact_list with args: {'jwt': 'eyJ...', 'limit': 10}
2025-01-21 10:00:02 - synapse-mcp - DEBUG - API Response: 200 OK
```

## Deployment

### Production Considerations

1. **Token Storage**: Current implementation stores JWT in memory (`user_tokens` dict). For production:
   - Use Redis: `import redis; redis_client.set(email, jwt, ex=3600)`
   - Use encrypted cookies for web clients
   - Implement token refresh logic

2. **HTTPS**: Configure backend with SSL:
   ```bash
   BACKEND_URL=https://api.yourcrm.com
   ```

3. **Monitoring**: Add Sentry or Datadog:
   ```python
   import sentry_sdk
   sentry_sdk.init(dsn="your-dsn")
   ```

4. **Rate Limiting**: Add throttling per user/tenant

5. **Docker**: Create `Dockerfile`:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY server.py .
   CMD ["python", "server.py"]
   ```

## Testing

### Manual Testing

```bash
# Test auth
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourcrm.com","password":"test123"}'

# Test contacts (replace TOKEN)
curl http://localhost:3001/api/contacts \
  -H "Authorization: Bearer TOKEN"
```

### Automated Testing

Create `tests/test_server.py`:
```python
import pytest
from server import SynapseCRMServer

@pytest.mark.asyncio
async def test_auth_sign_in():
    server = SynapseCRMServer()
    result = await server.auth_sign_in({
        "email": "admin@yourcrm.com",
        "password": "test123"
    })
    assert "✅" in result[0].text
```

Run tests:
```bash
pip install pytest pytest-asyncio
pytest tests/
```

## Support

- **Documentation**: See `synapse-crm-workflow.md` in project root
- **Backend Issues**: Check `server/src/` modules
- **MCP Protocol**: https://spec.modelcontextprotocol.io/
- **GitHub Issues**: [Create issue](https://github.com/yourorg/synapse/issues)

## License

MIT License - See project root for details
