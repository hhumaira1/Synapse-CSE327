# Gemini CLI MCP Setup Guide

## ✅ RBAC Update Complete

Added **MANAGER** role with permissions:
- ✅ All MEMBER permissions (read, create, update)
- ✅ Can DELETE contacts, deals, leads, tickets
- ✅ Can VIEW users (list, get)
- ❌ Cannot manage users (invite, update roles, deactivate)
- ❌ Cannot configure pipelines/stages
- ❌ Cannot manage webhooks

**Role Hierarchy:**
```
ADMIN > MANAGER > MEMBER
```

---

## 🚀 Gemini CLI MCP Configuration

### Step 1: Find Gemini CLI Config Location

The Gemini CLI uses a configuration file. Common locations:

**Windows:**
```
C:\Users\<YourUsername>\.gemini\mcp_servers.json
```

**Alternative (if using Gemini Desktop):**
```
%APPDATA%\Google\Gemini\mcp_servers.json
```

**Check where Gemini stores config:**
```bash
gemini config --help
# OR
gemini info
```

### Step 2: Create/Edit MCP Servers Config

Create or edit `mcp_servers.json`:

```json
{
  "mcpServers": {
    "synapse-crm": {
      "command": "python",
      "args": ["G:/Cse 327/synapse/mcp-server-python/server_unified.py"],
      "env": {
        "BACKEND_URL": "http://localhost:3001",
        "BACKEND_API_PREFIX": "/api",
        "MCP_HTTP_PORT": "5000",
        "LOG_LEVEL": "INFO"
      }
    }
  }
}
```

**IMPORTANT:** Update the path to match your system:
- Use **forward slashes** `/` even on Windows
- Use **absolute path** to server_unified.py

### Step 3: Restart Gemini CLI

```bash
# If Gemini CLI is running, restart it
# The service will pick up the new MCP server config
```

### Step 4: Test Connection

Open Gemini CLI and try:

```
> Hello! Can you see the synapse-crm MCP server?
```

Gemini should respond that it can see the MCP server with 56 tools.

### Step 5: Test Authentication

**First Login (Required):**
```
> Login as admin@example.com password test123
```

Expected response:
```
✅ Logged in as admin@example.com
Role: ADMIN
Session saved! You can now use CRM tools.
```

### Step 6: Test CRM Operations

```
> Show me all contacts

> Create a contact named John Doe with email john@acme.com

> List all my deals

> Create a ticket with title "Login issue" for contact ABC123 with HIGH priority

> Show analytics dashboard
```

---

## 🔧 Troubleshooting

### "MCP server not found"
```bash
# Check config file exists
cat ~/.gemini/mcp_servers.json

# Verify Python path
which python
# OR
where python

# Test server manually
python "G:/Cse 327/synapse/mcp-server-python/server_unified.py"
```

### "Permission denied" or "Command not found"
```bash
# Make sure Python is in PATH
python --version

# Try using full Python path
# Windows example:
"C:/Users/<YourName>/AppData/Local/Programs/Python/Python312/python.exe"
```

### Server starts but Gemini can't connect
1. Check server logs for stdio connection
2. Ensure no other MCP server is using the same name "synapse-crm"
3. Try renaming to "synapse" or "crm" in config

### "Not authenticated" errors
```
> Login as your@email.com password yourpassword
```

Session expires after 24 hours - just login again!

---

## 📋 Quick Reference

### Config File Template (Windows)

Save as: `C:\Users\<YourUsername>\.gemini\mcp_servers.json`

```json
{
  "mcpServers": {
    "synapse-crm": {
      "command": "python",
      "args": ["G:/Cse 327/synapse/mcp-server-python/server_unified.py"]
    }
  }
}
```

### Example Commands

| Command | What it does |
|---------|-------------|
| `Login as admin@example.com password test123` | Login and save session |
| `Logout` | Clear session |
| `Whoami` | Show current user |
| `Show all contacts` | List contacts |
| `Create contact Jane Smith, jane@example.com` | Create contact |
| `List my deals` | Show deals |
| `Show analytics dashboard` | View analytics |
| `Create ticket: Login broken, HIGH priority` | Create ticket |

---

## ✨ Pro Tips

1. **Natural Language:** You can use natural language! Gemini will figure out which tool to call.
   ```
   "Show me all contacts from Acme Corp"
   "Create a $50k deal with contact ABC123"
   "What tickets are assigned to me?"
   ```

2. **Session Persistence:** After logging in once, you stay logged in for 24 hours!

3. **Role Testing:** Test with different user accounts to verify RBAC:
   - Login as ADMIN: Can do everything
   - Login as MANAGER: Can delete records, view users
   - Login as MEMBER: Cannot delete or manage users

4. **Backend Must Be Running:** Make sure your NestJS backend is running on `http://localhost:3001`

---

## 🎯 Next Steps After Setup

1. **Test Basic Operations**
   - Login
   - List contacts
   - Create a contact
   - Logout

2. **Test RBAC**
   - Login as MEMBER, try to delete → Should fail
   - Login as MANAGER, try to delete → Should work
   - Login as ADMIN, try everything → All should work

3. **Test Complex Queries**
   - "Show me all deals in the Sales pipeline"
   - "Create a new lead and convert it to a deal"
   - "Show team performance analytics"

---

## 📞 Need Help?

If MCP server connection fails:
1. Verify backend is running: `http://localhost:3001/api`
2. Test server manually: `python server_unified.py`
3. Check logs in terminal where server is running
4. Ensure no firewall blocking stdio communication

**Server is currently running on stdio! Ready to accept Gemini CLI connections.** ✅
