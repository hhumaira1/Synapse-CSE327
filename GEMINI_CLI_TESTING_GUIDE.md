# Gemini CLI Testing Guide for SynapseCRM MCP Server

## Overview

This guide shows you how to test the SynapseCRM MCP Server using Google's Gemini CLI with natural language commands.

## Prerequisites

### 1. Gemini API Key

You need a Google AI Studio API key to use Gemini CLI.

**Get your API key**:

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (looks like: `AIzaSyC...`)
4. Save it securely

### 2. Install Gemini CLI

```powershell
# Install globally via npm
npm install -g @google/generative-ai-cli

# Or use npx (no installation needed)
npx @google/generative-ai-cli
```

**Verify installation**:

```powershell
gemini --version
```

## Setup Steps

### Step 1: Start SynapseCRM Backend

```powershell
# Terminal 1: Start backend server
cd "g:\Cse 327\synapse\server"
npm run start:dev

# Wait for:
# ✅ Registered 27 MCP tools (2 auth + 25 CRM) with JWT-based multi-tenancy
# MCP server initialized (JWT-based multi-tenant mode)
```

**Verify MCP endpoint**:

```powershell
# Terminal 2: Test endpoint is accessible
curl http://localhost:3001/api/mcp/sse
```

### Step 2: Configure Gemini CLI with Your API Key

```powershell
# Set environment variable (Windows PowerShell)
$env:GEMINI_API_KEY = "AIzaSyC..."  # Your actual API key

# Or permanently set it
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'AIzaSyC...', 'User')

# Restart PowerShell after permanent setting
```

### Step 3: Create MCP Configuration File

Create `mcp-config.json` in your working directory:

```json
{
  "mcpServers": {
    "synapse-crm": {
      "url": "http://localhost:3001/mcp/sse",
      "transport": "sse"
    }
  }
}
```

### Step 4: Start Gemini CLI with MCP Support

```powershell
# Start with MCP configuration
gemini --mcp-config mcp-config.json

# You should see:
# Connected to Gemini AI
# MCP Server: synapse-crm (27 tools available)
```

## Authentication Flow

### Yes, You Can Login with Existing Account! ✅

The MCP server supports **two authentication methods**:

### Method 1: Sign Up (New Account)

Creates a new user + workspace in one command.

**Natural language**:

```
> signup with email john@example.com password securepass123 firstName John lastName Doe workspaceName "Acme Corp"
```

**Response will include**:

```
✅ Account created successfully!

📧 Email: john@example.com
🏢 Workspace: Acme Corp
🔐 JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI...

⚠️ IMPORTANT: Pass this token in all future requests:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

You can now use all CRM tools!
```

### Method 2: Sign In (Existing Account) ✅

Login with email and password you already have.

**Natural language**:

```
> login with email john@example.com password securepass123
```

**Alternative phrasings** (all work):

```
> signin with email john@example.com password securepass123
> authenticate with email john@example.com password securepass123
> sign in using email john@example.com and password securepass123
```

**Response will include**:

```
✅ Authentication successful!

📧 Email: john@example.com
🔐 JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI...

⚠️ IMPORTANT: Pass this token in all future requests:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Example curl:
curl -H "Authorization: Bearer eyJhbG..." http://localhost:3001/api/mcp/sse
```

### Step 5: Copy JWT Token for Subsequent Requests

**IMPORTANT**: After login/signup, you need to configure the JWT token for future requests.

#### Option A: Environment Variable (Recommended)

```powershell
# Copy JWT from login response, then:
$env:MCP_AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Restart Gemini CLI with auth token
gemini --mcp-config mcp-config.json --auth-token $env:MCP_AUTH_TOKEN
```

#### Option B: Update Config File

Modify `mcp-config.json`:

```json
{
  "mcpServers": {
    "synapse-crm": {
      "url": "http://localhost:3001/mcp/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

Then restart:

```powershell
gemini --mcp-config mcp-config.json
```

## Testing CRM Operations

### Now you can use natural language commands! 🎉

### Contacts Management

**Create contact**:

```
> create a contact named Alice Smith with email alice@acme.com and phone +1234567890
```

**List contacts**:

```
> show me all contacts
> list my contacts
> get all contacts in the system
```

**Search contacts**:

```
> find contacts with name Alice
> search for contacts at Acme Corp
```

**Update contact**:

```
> update contact ID abc123 to change email to newemail@example.com
```

**Delete contact**:

```
> delete contact with ID abc123
```

### Leads Management

**Create lead**:

```
> create a new lead for Bob Johnson email bob@startup.com company "Tech Startup"
```

**List leads**:

```
> show all leads
> list leads with status NEW
```

**Convert lead to contact**:

```
> convert lead ID xyz789 to a contact
> convert lead xyz789 and create a deal
```

**Update lead**:

```
> update lead xyz789 status to QUALIFIED
```

### Deals Management

**Create deal**:

```
> create a deal titled "Enterprise Contract" worth 50000 for contact ID abc123
```

**List deals**:

```
> show me all open deals
> list deals with status won
```

**Update deal**:

```
> update deal ID deal123 to move to stage proposal
> change deal deal123 value to 75000
```

### Tickets Management

**Create ticket**:

```
> create a support ticket titled "Login issue" with priority HIGH
> create ticket "Payment not working" priority URGENT for contact abc123
```

**List tickets**:

```
> show all open tickets
> list tickets with priority HIGH
```

**Update ticket**:

```
> update ticket ticket123 status to RESOLVED
> change ticket ticket123 priority to LOW
```

### Analytics

**Dashboard stats**:

```
> show me dashboard statistics
> get overview of CRM data
```

**Revenue report**:

```
> generate revenue report for this month
> show me yearly revenue report
```

## Complete Testing Workflow

### Scenario 1: New User Setup

```powershell
# 1. Start backend
cd "g:\Cse 327\synapse\server"
npm run start:dev

# 2. Start Gemini CLI (new terminal)
gemini --mcp-config mcp-config.json

# 3. Sign up
> signup with email alice@company.com password test123 firstName Alice lastName Johnson workspaceName "Alice Corp"

# 4. Copy JWT from response

# 5. Configure auth (update mcp-config.json with JWT)

# 6. Restart Gemini CLI
gemini --mcp-config mcp-config.json

# 7. Test CRM operations
> create a contact named Bob Smith email bob@test.com
> list my contacts
> show dashboard stats
```

### Scenario 2: Existing User Login

```powershell
# 1. Start backend
cd "g:\Cse 327\synapse\server"
npm run start:dev

# 2. Start Gemini CLI
gemini --mcp-config mcp-config.json

# 3. Login with existing credentials ✅
> login with email alice@company.com password test123

# 4. Copy JWT from response

# 5. Update mcp-config.json with JWT

# 6. Restart Gemini CLI
gemini --mcp-config mcp-config.json

# 7. Continue working with your existing data
> list my contacts  # Shows contacts you created before
> show dashboard stats  # Shows your workspace stats
```

### Scenario 3: Multi-Tenant Testing

**Terminal 1 - Tenant A (Alice)**:

```powershell
# Login as Tenant A
> login with email alice@company.com password test123

# Create data for Tenant A
> create contact named Charlie Brown email charlie@alice-corp.com
> create lead for David Wilson company "Wilson Inc"
> list my contacts  # Shows only Alice's contacts
```

**Terminal 2 - Tenant B (Bob)**:

```powershell
# Login as Tenant B
> login with email bob@startup.com password test456

# Create data for Tenant B
> create contact named Emma Davis email emma@bob-startup.com
> create deal titled "New Project" worth 25000
> list my contacts  # Shows only Bob's contacts (NOT Charlie Brown)
```

**Verify isolation**:

- Alice's workspace: Shows Charlie, David
- Bob's workspace: Shows Emma only
- ✅ Data isolation working!

## Troubleshooting

### Error: "Authentication required"

**Problem**: JWT token not configured or expired.

**Solution**:

```powershell
# 1. Login again to get fresh JWT
> login with email your@email.com password yourpassword

# 2. Copy new JWT token

# 3. Update mcp-config.json with new token

# 4. Restart Gemini CLI
```

### Error: "MCP Server not found"

**Problem**: Backend not running or wrong URL.

**Solution**:

```powershell
# Check backend is running
cd "g:\Cse 327\synapse\server"
npm run start:dev

# Test endpoint manually
curl http://localhost:3001/api/mcp/sse

# Check mcp-config.json has correct URL
```

### Error: "Invalid credentials"

**Problem**: Wrong email or password.

**Solution**:

```powershell
# If you forgot password, create new account:
> signup with email newemail@test.com password newpass123 firstName Your lastName Name workspaceName "Your Company"
```

### Error: "Tool not found"

**Problem**: MCP tools not registered properly.

**Solution**:

```powershell
# Check backend logs for:
# ✅ Registered 27 MCP tools (2 auth + 25 CRM) with JWT-based multi-tenancy

# If missing, restart backend:
cd "g:\Cse 327\synapse\server"
npm run start:dev
```

## Environment Variables Summary

```powershell
# Required for Gemini CLI
$env:GEMINI_API_KEY = "AIzaSyC..."  # Your Google AI API key

# Optional for authentication
$env:MCP_AUTH_TOKEN = "eyJhbG..."  # JWT token from login
```

## MCP Config File Template

**`mcp-config.json`** (without JWT):

```json
{
  "mcpServers": {
    "synapse-crm": {
      "url": "http://localhost:3001/api/mcp/sse",
      "transport": "sse"
    }
  }
}
```

**`mcp-config.json`** (with JWT after login):

```json
{
  "mcpServers": {
    "synapse-crm": {
      "url": "http://localhost:3001/api/mcp/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NmY3ZDY..."
      }
    }
  }
}
```

## Available MCP Tools (27 Total)

### Authentication (2)

- `auth_sign_in` - Login with existing email/password ✅
- `auth_sign_up` - Create new account + workspace

### Contacts (5)

- `list_contacts` - Show all contacts
- `get_contact_by_id` - Get specific contact
- `create_contact` - Add new contact
- `update_contact` - Modify contact details
- `delete_contact` - Remove contact

### Leads (6)

- `list_leads` - Show all leads
- `get_lead` - Get specific lead
- `create_lead` - Add new lead
- `update_lead` - Modify lead details
- `delete_lead` - Remove lead
- `convert_lead` - Convert lead to contact/deal

### Deals (5)

- `list_deals` - Show all deals
- `get_deal` - Get specific deal
- `create_deal` - Add new deal
- `update_deal` - Modify deal details
- `delete_deal` - Remove deal

### Tickets (5)

- `create_ticket` - Create support ticket
- `list_tickets` - Show all tickets
- `get_ticket` - Get specific ticket
- `update_ticket` - Modify ticket details
- `delete_ticket` - Remove ticket

### Analytics (2)

- `get_dashboard_stats` - Overall CRM statistics
- `get_revenue_report` - Revenue analysis

## Command Reference Cheat Sheet

```bash
# Authentication
login with email <email> password <password>
signup with email <email> password <password> firstName <name> workspaceName <workspace>

# Contacts
create contact named <name> email <email> phone <phone>
list contacts
update contact <id> email <newemail>
delete contact <id>

# Leads
create lead for <name> email <email> company <company>
list leads
convert lead <id>
update lead <id> status <status>

# Deals
create deal titled <title> worth <amount> for contact <contactId>
list deals
update deal <id> value <amount>

# Tickets
create ticket titled <title> priority <priority>
list tickets with status <status>
update ticket <id> status <status>

# Analytics
show dashboard stats
generate revenue report
```

## Next Steps

After successful testing:

1. ✅ Verify multi-tenant isolation works
2. ✅ Test all CRUD operations
3. ✅ Confirm existing user login works
4. Document any issues or improvements needed
5. Move to Phase 2 (Web/App Chatbot)

## Tips for Best Experience

1. **Keep JWT token handy**: Save it in a text file for easy copy-paste
2. **Use descriptive names**: Makes testing easier to track
3. **Test in separate terminals**: Simulate multiple tenants simultaneously
4. **Check backend logs**: See actual MCP tool calls and tenant extraction
5. **Natural language works**: Gemini understands variations of commands

## Support

If you encounter issues:

1. Check backend logs: `cd server && npm run start:dev`
2. Verify JWT token hasn't expired (24h default)
3. Ensure Supabase environment variables are set
4. Test with curl first (simpler debugging)
5. Review `MCP_JWT_TESTING_GUIDE.md` for curl examples

---

**Ready to test!** Start the backend, configure Gemini CLI, and try logging in with your existing email/password. 🚀
