# MCP Server JWT-Based Multi-Tenancy Testing Guide

## Overview
Phase 1B implementation complete: JWT-based authentication with dynamic tenant routing. All 27 MCP tools now support multi-tenancy.

## What Was Implemented

### ✅ Complete Changes (Phase 1B)
1. **Controller Updates** (`mcp.controller.ts`)
   - Extract JWT from `Authorization: Bearer <token>` header
   - Store in `res.locals.jwt` for TenantContextService
   - Added CORS headers for authorization

2. **CrmTools Refactoring** (`tools/crm.tools.ts`)
   - All 22 methods now accept `tenantId` as first parameter
   - Removed hardcoded `'mcp-tenant'` strings
   - Methods updated: listContacts, getContactById, createContact, updateContact, deleteContact, listLeads, getLead, createLead, updateLead, deleteLead, convertLead, listDeals, getDeal, createDeal, updateDeal, deleteDeal, createTicket, listTickets, getTicket, updateTicket, deleteTicket, getDashboardStats, getRevenueReport

3. **MCP Service Rewrite** (`mcp.service.ts`)
   - Simplified auth tools (auth_sign_in, auth_sign_up return JWT)
   - All 25 CRM tool handlers extract tenantId via `getTenantIdOrThrow()`
   - JWT-based tenant extraction (no session storage in Phase 1B)
   - Complete tools: list_contacts, get_contact_by_id, create_contact, update_contact, delete_contact, list_leads, get_lead, create_lead, update_lead, delete_lead, convert_lead, list_deals, get_deal, create_deal, update_deal, delete_deal, create_ticket, list_tickets, get_ticket, update_ticket, delete_ticket, get_dashboard_stats, get_revenue_report

4. **TenantContextService** (`services/tenant-context.service.ts`)
   - JWT extraction: Verifies with Supabase → looks up internal user → returns tenantId
   - Error handling for missing/invalid tokens
   - Ready for future Telegram support

## Authentication Flow

### Step 1: Sign Up (New User)
```bash
# Create new account
curl -X POST http://localhost:3001/api/mcp/sse \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "auth_sign_up",
      "arguments": {
        "email": "tenant1@example.com",
        "password": "password123",
        "firstName": "John",
        "lastName": "Doe",
        "workspaceName": "Acme Corp"
      }
    }
  }'

# Response includes JWT token:
# 🔐 JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Sign In (Existing User)
```bash
# Login with existing account
curl -X POST http://localhost:3001/api/mcp/sse \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "auth_sign_in",
      "arguments": {
        "email": "tenant1@example.com",
        "password": "password123"
      }
    }
  }'

# Save the JWT token from response
```

### Step 3: Use CRM Tools with JWT
```bash
# Create contact (tenant-specific)
curl -X POST http://localhost:3001/api/mcp/sse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "create_contact",
      "arguments": {
        "firstName": "Alice",
        "lastName": "Smith",
        "email": "alice@example.com",
        "phone": "+1234567890",
        "company": "Tech Startup"
      }
    }
  }'

# List contacts (only sees data from your tenant)
curl -X POST http://localhost:3001/api/mcp/sse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "list_contacts",
      "arguments": {
        "limit": 10
      }
    }
  }'
```

## Multi-Tenant Testing Checklist

### Test Case 1: Create Two Tenants
1. Sign up tenant1 with email `tenant1@example.com`
2. Sign up tenant2 with email `tenant2@example.com`
3. Save both JWT tokens

### Test Case 2: Data Isolation
1. Using tenant1 JWT: Create contact "Alice Smith"
2. Using tenant2 JWT: Create contact "Bob Johnson"
3. Using tenant1 JWT: List contacts → Should only see "Alice Smith"
4. Using tenant2 JWT: List contacts → Should only see "Bob Johnson"

### Test Case 3: Cross-Tenant Access Denial
1. Create a contact using tenant1 JWT
2. Get the contact ID from response
3. Try to access that contact using tenant2 JWT → Should get "Not found" error

### Test Case 4: All CRM Operations
For each tenant, test:
- ✅ Contacts: Create, List, Get by ID, Update, Delete
- ✅ Leads: Create, List, Get, Update, Delete, Convert
- ✅ Deals: Create, List, Get, Update, Delete
- ✅ Tickets: Create, List, Get, Update, Delete
- ✅ Analytics: Dashboard stats, Revenue report

## Testing with Gemini CLI

### Install Gemini CLI (if not installed)
```powershell
# Install via npm
npm install -g @modelcontextprotocol/gemini-cli

# Or use npx
npx @modelcontextprotocol/gemini-cli
```

### Configure Gemini CLI
Create `~/.mcp/config.json`:
```json
{
  "servers": {
    "synapse-crm": {
      "type": "sse",
      "url": "http://localhost:3001/api/mcp/sse"
    }
  }
}
```

### Test Flow with Gemini CLI
```bash
# Start Gemini CLI
gemini-cli

# Natural language commands (JWT will be in response, copy it):
> signup with email tenant1@example.com password test123 firstName John lastName Doe workspaceName "Acme Corp"

# Configure JWT for subsequent requests (method TBD - may need manual header configuration)
# Then test:
> list my contacts
> create contact Alice Smith email alice@acme.com
> show dashboard stats
```

## Environment Setup

### Required Backend Environment Variables
Ensure `server/.env` has:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### Start Backend Server
```powershell
cd g:\Cse 327\synapse\server
npm run start:dev
```

Server should log:
```
✅ Registered 27 MCP tools (2 auth + 25 CRM) with JWT-based multi-tenancy
MCP server initialized (JWT-based multi-tenant mode)
```

## Expected JWT Format

JWT token structure (decoded):
```json
{
  "sub": "supabase-user-uuid",
  "email": "tenant1@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "iss": "https://your-project.supabase.co/auth/v1",
  "iat": 1234567890,
  "exp": 1234654290
}
```

TenantContextService flow:
1. Extract JWT from `Authorization: Bearer <token>` header
2. Verify with Supabase Auth (`supabaseAuth.verifyToken(jwt)`)
3. Get Supabase user ID from JWT payload (`result.data.user.id`)
4. Look up internal user: `authService.getUserBySupabaseId(supabaseUserId)`
5. Return `user.tenantId`

## Troubleshooting

### Error: "Authentication required"
- Check JWT is passed in `Authorization: Bearer <token>` header
- Verify JWT hasn't expired (24h default for Supabase)
- Check backend logs for token verification errors

### Error: "Tenant not found"
- Ensure user exists in internal database (created via `auth_sign_up`)
- Check `AuthService.createUserFromSupabase` created tenant properly

### Data Shows from Wrong Tenant
- **BUG**: Check if any CrmTools method still has hardcoded `'mcp-tenant'`
- Verify `getTenantIdOrThrow()` is called in ALL tool handlers
- Check controller properly stores JWT in `res.locals.jwt`

### Lint Errors
Minor formatting warnings in `mcp.service.ts` (prettier/prettier) can be ignored - they don't affect functionality.

## Next Steps (Phase 1C)

1. **Manual Testing**: Use curl/Postman to verify multi-tenant isolation
2. **Gemini CLI Integration**: Test natural language commands with JWT auth
3. **Documentation**: Add examples to project README
4. **Performance**: Test with multiple concurrent tenants
5. **Security Audit**: Verify no tenant data leakage possible

## Phase 2 Preview: Web/App Chatbot

After Phase 1C validation, Phase 2 will:
- Create REST API wrapper around MCP tools (`/api/chatbot/*`)
- Frontend chatbot UI in `Frontend/src/components/chatbot/`
- Same JWT authentication (reuse existing auth system)
- Streaming responses for better UX
- Rate limiting per tenant

## Phase 3 Preview: Telegram Bot

- Telegram webhook integration
- Map Telegram user ID to tenant via database lookup
- Natural language command parsing
- Push notifications for updates
