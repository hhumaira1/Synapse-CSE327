# ✅ Chatbot MCP Integration Complete

## Architecture Overview

The chatbot now uses a **three-tier architecture** with the MCP server as middleware:

```
┌─────────────────────────────┐
│  Frontend (Next.js)         │
│  • ChatWindow Component     │
│  • User Interface           │
└──────────┬──────────────────┘
           │ HTTP + JWT
           │ POST /api/chatbot/chat
           ↓
┌─────────────────────────────┐
│  Backend (NestJS)           │
│  • ChatbotService           │
│  • Gemini AI Integration    │
│  • Conversation Storage     │
│  • McpClientService ✨      │
└──────────┬──────────────────┘
           │ HTTP + JWT
           │ POST /mcp/call-tool
           ↓
┌─────────────────────────────┐
│  MCP Server (Python)        │
│  • 56 CRM Tools             │
│  • JWT Validation           │
│  • RBAC Enforcement         │
│  • Guardrails               │
└──────────┬──────────────────┘
           │ HTTP + JWT
           │ GET/POST /api/*
           ↓
┌─────────────────────────────┐
│  Backend API (NestJS)       │
│  • Contacts Service         │
│  • Deals Service            │
│  • Leads Service            │
│  • Tickets Service          │
│  • Analytics Service        │
└─────────────────────────────┘
```

## Complete Message Flow

### Example: "Show all my contacts"

**Step 1: User sends message**
```
User types in ChatWindow: "Show all my contacts"
```

**Step 2: Frontend → Backend**
```typescript
POST http://localhost:3001/api/chatbot/chat
Headers: { Authorization: "Bearer <jwt>" }
Body: {
  message: "Show all my contacts",
  conversationId: "conv_123" // or undefined for new chat
}
```

**Step 3: Backend ChatbotService**
```typescript
// 1. Validates with guardrails (CRM-only scope)
// 2. Gets/Creates Conversation in database
// 3. Saves user Message to database
// 4. Loads conversation history
// 5. Sends to Gemini AI with 56 CRM tool definitions
```

**Step 4: Gemini AI Response**
```typescript
{
  text: "",
  toolCalls: [{
    name: "contacts_list",
    arguments: {}
  }]
}
```

**Step 5: Backend → MCP Server**
```typescript
POST http://localhost:5000/mcp/call-tool
Headers: { Authorization: "Bearer <jwt>" }
Body: {
  tool_name: "contacts_list",
  arguments: {}
}
```

**Step 6: MCP Server Processing**
```python
# 1. Validates JWT token
# 2. Checks RBAC permissions (user role)
# 3. Enforces guardrails (CRM-only)
# 4. Calls backend API: GET /api/contacts
```

**Step 7: MCP → Backend API**
```typescript
GET http://localhost:3001/api/contacts
Headers: { Authorization: "Bearer <jwt>" }
```

**Step 8: Backend Returns Data**
```json
[
  { "id": "abc123", "firstName": "John", "lastName": "Doe", "email": "john@example.com" },
  { "id": "def456", "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com" }
]
```

**Step 9: MCP Formats Response**
```
📇 Found 2 contacts:
• John Doe (ID: abc123)
• Jane Smith (ID: def456)
```

**Step 10: Backend Receives MCP Result**
```typescript
// Sends formatted result back to Gemini
geminiService.sendToolResponse(history, toolResults)
```

**Step 11: Gemini Generates Final Response**
```
"I found 2 contacts in your system: John Doe and Jane Smith. 
Would you like to see more details about any of them?"
```

**Step 12: Backend Saves & Returns**
```typescript
// 1. Saves assistant Message to database
// 2. Auto-generates conversation title (if new)
// 3. Returns response to frontend

{
  response: "I found 2 contacts...",
  conversationId: "conv_123",
  toolsUsed: ["contacts_list"],
  timestamp: "2025-12-03T10:30:00Z",
  suggestedActions: [...]
}
```

**Step 13: Frontend Displays**
```
ChatWindow shows assistant message + suggested actions
```

## Code Changes Made

### 1. Created `McpClientService` (Backend)

**File**: `server/src/chatbot/mcp-client.service.ts`

```typescript
@Injectable()
export class McpClientService {
  private readonly mcpServerUrl = 'http://localhost:5000';
  
  async callTool(
    toolName: string,
    arguments_: Record<string, any>,
    jwt: string
  ): Promise<string> {
    const response = await axios.post('/mcp/call-tool', {
      tool_name: toolName,
      arguments: arguments_
    }, {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    
    return response.data.result[0].text;
  }
}
```

### 2. Updated `ChatbotController`

**File**: `server/src/chatbot/chatbot.controller.ts`

```typescript
@Post('chat')
async chat(
  @Body() chatDto: ChatMessageDto,
  @CurrentUser('id') supabaseUserId: string,
  @Headers('authorization') authorization: string, // ✨ Extract JWT
) {
  const jwt = authorization?.replace('Bearer ', '') || '';
  return await chatbotService.chat(chatDto, user.id, user.tenantId, jwt); // ✨ Pass JWT
}
```

### 3. Updated `ChatbotService`

**File**: `server/src/chatbot/chatbot.service.ts`

```typescript
constructor(
  private mcpClient: McpClientService, // ✨ Inject MCP client
  // ... other services
) {}

async chat(
  chatDto: ChatMessageDto,
  userId: string,
  tenantId: string,
  jwt: string, // ✨ Accept JWT parameter
): Promise<ChatResponseDto> {
  // ... conversation management, Gemini call ...
  
  // ✨ Execute tools via MCP instead of direct service calls
  for (const toolCall of geminiResponse.toolCalls) {
    const mcpResult = await this.mcpClient.callTool(
      toolCall.name,
      toolCall.arguments,
      jwt // ✨ Pass JWT to MCP
    );
    
    toolResults.push({
      functionResponse: {
        name: toolCall.name,
        response: { result: JSON.parse(mcpResult) }
      }
    });
  }
  
  // Send results back to Gemini for natural language formatting
  finalResponse = await geminiService.sendToolResponse(history, toolResults);
  
  // Save to database and return
}
```

### 4. Updated `ChatbotModule`

**File**: `server/src/chatbot/chatbot.module.ts`

```typescript
@Module({
  providers: [
    ChatbotService,
    GeminiService,
    McpClientService, // ✨ Added MCP client
    // ... other services
  ],
})
export class ChatbotModule {}
```

### 5. Updated Frontend `ChatWindow`

**File**: `Frontend/src/components/chatbot/ChatWindow.tsx`

```typescript
const handleSend = async (message: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  // ✨ Call backend API (not Gemini directly)
  const response = await fetch('http://localhost:3001/api/chatbot/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`, // ✨ JWT
    },
    body: JSON.stringify({ message, conversationId })
  });
  
  const data = await response.json();
  setConversationId(data.conversationId); // ✨ Track conversation
  // Display response...
};
```

## Environment Variables

### Backend (`.env`)

```env
# Gemini AI
GEMINI_API_KEY="your_gemini_api_key"

# MCP Server
MCP_SERVER_URL="http://localhost:5000"

# Database, Supabase, etc.
```

### MCP Server (`.env`)

```env
# Backend API
BACKEND_URL="http://localhost:3001"
BACKEND_API_PREFIX="/api"

# HTTP Port
MCP_HTTP_PORT=5000
```

### Frontend (`.env.local`)

```env
# No MCP_SERVER_URL needed - frontend only talks to backend
NEXT_PUBLIC_GEMINI_API_KEY="your_gemini_api_key"
```

## Benefits of This Architecture

✅ **Separation of Concerns**
- Frontend: UI & UX
- Backend: Business logic, storage, orchestration
- MCP: Tool execution, RBAC, guardrails

✅ **Security**
- JWT validated at every layer
- RBAC enforced by MCP server
- Guardrails prevent unauthorized operations

✅ **Persistence**
- All conversations stored in PostgreSQL
- Full message history preserved
- Multi-device access

✅ **Flexibility**
- MCP server can be used by:
  - Web chatbot (via backend)
  - CLI tools (direct stdio)
  - Mobile apps (via backend)
  - Telegram bot (via backend)

✅ **Scalability**
- MCP server can be scaled independently
- Backend can cache MCP responses
- Conversation history enables context

✅ **Monitoring**
- Backend logs all tool calls
- MCP server logs all API calls
- Full audit trail

## Testing the Integration

### 1. Start All Services

```powershell
# Terminal 1: MCP Server
cd mcp-server-python
.\start-server.ps1

# Terminal 2: Backend
cd server
npm run start:dev

# Terminal 3: Frontend
cd Frontend
npm run dev
```

### 2. Test Chatbot

1. Open http://localhost:3000
2. Login
3. Open chatbot
4. Send: "Show all my contacts"

### 3. Verify Logs

**Frontend Console:**
```
Calling backend API: http://localhost:3001/api/chatbot/chat
```

**Backend Logs:**
```
[ChatbotService] Processing query: Show all my contacts
[ChatbotService] Executing 1 tool(s) via MCP
[McpClientService] Calling MCP tool: contacts_list
```

**MCP Server Logs:**
```
[HTTP] Tool: contacts_list
Calling backend API: GET /api/contacts
```

**Backend API Logs:**
```
[ContactsController] GET /contacts
Returning 5 contacts for tenant_123
```

### 4. Verify Database

```sql
-- Check conversation created
SELECT * FROM conversations ORDER BY "createdAt" DESC LIMIT 1;

-- Check messages saved
SELECT role, LEFT(content, 50), "createdAt"
FROM messages
WHERE "conversationId" = 'YOUR_CONV_ID'
ORDER BY "createdAt" ASC;
```

## Troubleshooting

### Error: "MCP server health check failed"

**Solution**: Start MCP server
```powershell
cd mcp-server-python
.\start-server.ps1
```

### Error: "MCP tool contacts_list failed"

**Check**:
1. MCP server running on port 5000?
2. Backend environment has `MCP_SERVER_URL`?
3. JWT token being passed correctly?

**Debug**:
```typescript
// Add logging to McpClientService
this.logger.log(`Calling ${this.mcpServerUrl}/mcp/call-tool`);
this.logger.log(`Tool: ${toolName}, JWT: ${jwt.substring(0, 20)}...`);
```

### Error: "Not authenticated"

**Solution**: 
1. Check JWT token in request headers
2. Verify Supabase session is valid
3. Check MCP server accepts the JWT

## Next Steps

- [ ] Add response caching in backend
- [ ] Implement tool call retry logic
- [ ] Add MCP health monitoring
- [ ] Create admin dashboard for tool usage
- [ ] Add rate limiting per user
- [ ] Implement tool call analytics

---

**Status**: ✅ Backend now uses MCP server for all tool calls
**Date**: December 3, 2025
