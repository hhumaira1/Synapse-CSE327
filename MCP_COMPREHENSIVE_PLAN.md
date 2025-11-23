# Synapse CRM - Comprehensive MCP Implementation Plan

**Date**: November 23, 2025  
**Goal**: Natural language CRM interactions across 3 clients with automatic authentication  
**Clients**: Gemini CLI, Web Chatbot, Android Chatbot, Telegram Bot

---

## 📊 Executive Summary

### Current State
- ✅ 16 MCP tools implemented (auth, contacts, leads, deals, tickets)
- ✅ Python MCP server with stdio transport
- ✅ Manual JWT passing required
- ❌ No session persistence
- ❌ No natural language auth flow

### Target State
- 🎯 **50+ MCP tools** covering all CRM entities
- 🎯 **Session-based authentication** (login once, use all tools)
- 🎯 **Natural language prompts** ("show my deals" vs manual JWT)
- 🎯 **4 client implementations** (Gemini CLI, Web, Android, Telegram)
- 🎯 **Multi-tenant isolation** with automatic context switching

---

## 🛠️ Complete Tool Inventory (50+ Tools)

### Authentication & Session (4 tools)
1. **login** - `"Login as admin@example.com password test123"` → Stores session
2. **logout** - `"Logout"` → Clears session
3. **whoami** - `"Who am I?"` → Shows current user
4. **switch_tenant** - `"Switch to tenant XYZ"` → Multi-tenant support

### Contacts (7 tools)
5. **contact_list** - `"Show all contacts"` / `"Find contacts from Acme Corp"`
6. **contact_create** - `"Create contact John Doe, john@acme.com"`
7. **contact_get** - `"Show contact details for John Doe"`
8. **contact_update** - `"Update John's phone to 555-1234"`
9. **contact_delete** - `"Delete contact John Doe"`
10. **contact_search** - `"Search contacts by email domain gmail.com"`
11. **contact_merge** - `"Merge contact A with contact B"` (future)

### Leads (6 tools)
12. **lead_list** - `"Show NEW leads"` / `"All leads from Website source"`
13. **lead_create** - `"Create lead: Acme Corp opportunity"`
14. **lead_update** - `"Move lead XYZ to QUALIFIED status"`
15. **lead_convert** - `"Convert lead XYZ to deal"`
16. **lead_assign** - `"Assign lead XYZ to Sarah"`
17. **lead_bulk_update** - `"Mark all NEW leads as CONTACTED"`

### Pipelines & Stages (8 tools)
18. **pipeline_list** - `"Show all pipelines"`
19. **pipeline_create** - `"Create pipeline: Enterprise Sales"`
20. **pipeline_update** - `"Rename pipeline XYZ to Custom Pipeline"`
21. **pipeline_delete** - `"Delete pipeline XYZ"`
22. **stage_list** - `"Show stages for pipeline XYZ"`
23. **stage_create** - `"Add stage Negotiation to pipeline XYZ"`
24. **stage_update** - `"Reorder stages in pipeline XYZ"`
25. **stage_delete** - `"Remove stage XYZ"`

### Deals (8 tools)
26. **deal_list** - `"Show all deals"` / `"Deals over $10,000"`
27. **deal_create** - `"Create $50k deal with Acme Corp"`
28. **deal_get** - `"Show deal XYZ details"`
29. **deal_update** - `"Move deal XYZ to Negotiation stage"`
30. **deal_delete** - `"Delete deal XYZ"`
31. **deal_close_won** - `"Mark deal XYZ as won"`
32. **deal_close_lost** - `"Mark deal XYZ as lost, reason: budget"`
33. **deal_forecast** - `"Forecast revenue for next quarter"`

### Interactions (6 tools)
34. **interaction_list** - `"Show interactions for contact XYZ"`
35. **interaction_create** - `"Log email to John: discussed pricing"`
36. **interaction_get** - `"Show interaction XYZ"`
37. **interaction_update** - `"Update interaction XYZ notes"`
38. **interaction_delete** - `"Delete interaction XYZ"`
39. **interaction_timeline** - `"Show timeline for deal XYZ"`

### Tickets (8 tools)
40. **ticket_list** - `"Show OPEN tickets"` / `"HIGH priority tickets"`
41. **ticket_create** - `"Create ticket: Login issue, HIGH priority"`
42. **ticket_get** - `"Show ticket #12345"`
43. **ticket_update** - `"Move ticket #12345 to IN_PROGRESS"`
44. **ticket_assign** - `"Assign ticket #12345 to Mike"`
45. **ticket_resolve** - `"Resolve ticket #12345"`
46. **ticket_comment** - `"Add comment to ticket #12345: Fixed login bug"`
47. **ticket_close** - `"Close ticket #12345"`

### Analytics & Reports (9 tools)
48. **analytics_dashboard** - `"Show dashboard overview"`
49. **analytics_revenue** - `"Show revenue metrics"`
50. **analytics_win_loss** - `"Show win/loss ratio"`
51. **analytics_conversion** - `"Show conversion rates"`
52. **analytics_velocity** - `"Show sales velocity"`
53. **analytics_pipeline_health** - `"Check pipeline health"`
54. **analytics_top_performers** - `"Show top performers"`
55. **analytics_forecast** - `"Forecast revenue for next month"`
56. **analytics_time_series** - `"Show time series data"`

### Users & Teams (6 tools)
57. **user_list** - `"Show all team members"`
58. **user_invite** - `"Invite user sarah@company.com as MANAGER"`
59. **user_update_role** - `"Make John an ADMIN"`
60. **user_deactivate** - `"Deactivate user John"`
61. **user_pending_invites** - `"Show pending invitations"`
62. **user_cancel_invite** - `"Cancel invitation for sarah@company.com"`

### Portal Customers (5 tools)
63. **portal_customer_list** - `"Show portal customers"`
64. **portal_customer_invite** - `"Invite portal customer client@acme.com"`
65. **portal_customer_deactivate** - `"Deactivate portal access for client@acme.com"`
66. **portal_tickets** - `"Show tickets from portal customers"`
67. **portal_customer_link** - `"Link portal customer to contact XYZ"`

### Call Logs (5 tools)
68. **call_list** - `"Show recent calls"`
69. **call_create** - `"Log call to John: 15 min discussion about pricing"`
70. **call_get** - `"Show call XYZ details"`
71. **call_update** - `"Update call XYZ with transcription"`
72. **call_stats** - `"Show call statistics"`

### Integrations (4 tools)
73. **integration_list** - `"Show active integrations"`
74. **integration_activate** - `"Enable Gmail integration"`
75. **integration_deactivate** - `"Disable osTicket integration"`
76. **integration_status** - `"Check integration sync status"`

---

## 🔐 Natural Language Authentication Flow

### Current Flow (Manual, Tedious)
```bash
# Step 1: Login
gemini chat "Sign in as admin@example.com password test123"
# Response: JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Step 2: Copy JWT manually
# Step 3: Use tool with JWT
gemini chat "List contacts with JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# ❌ PAINFUL - Users hate this!
```

### New Flow (Natural, Seamless)
```bash
# Step 1: Login once
> "Login as admin@example.com password test123"
✅ Logged in as Admin User (admin@example.com)
✅ Tenant: Acme Corporation
✅ Session saved - use tools without JWT!

# Step 2: Use tools naturally
> "Show all contacts"
✅ Found 45 contacts (showing first 10)...

> "Create contact John Doe, john@acme.com"
✅ Contact created successfully!

> "Show my deals"
✅ You have 12 deals (3 in negotiation, 5 in discovery)...

> "Forecast revenue for next month"
✅ Expected revenue: $125,000 (based on 8 deals)...

> "Who am I?"
✅ Admin User (admin@example.com)
✅ Role: ADMIN
✅ Tenant: Acme Corporation

> "Logout"
✅ Logged out successfully
```

### Implementation Strategy

#### Session Storage Architecture
```python
# sessions.json (file-based for Gemini CLI)
{
  "gemini_cli_session": {
    "user_id": "user_abc123",
    "email": "admin@example.com",
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tenant_id": "tenant_xyz789",
    "tenant_name": "Acme Corporation",
    "role": "ADMIN",
    "expires_at": "2025-11-24T10:00:00Z",
    "created_at": "2025-11-23T10:00:00Z"
  }
}
```

#### Tool Execution Flow with Auto-Auth
```python
async def execute_tool(name: str, args: dict) -> list[TextContent]:
    """Execute tool with automatic JWT injection"""
    
    # Check if session exists
    session = load_session("gemini_cli_session")
    
    if not session or session_expired(session):
        return [TextContent(
            type="text",
            text="❌ Not logged in. Please login first:\n"
                 "Example: 'Login as admin@example.com password test123'"
        )]
    
    # Automatically inject JWT from session
    args["jwt"] = session["jwt"]
    
    # Execute tool normally
    return await tool_handler(name, args)
```

---

## 🎯 Client Implementation Plans

### 1. Gemini CLI (Natural Language Terminal)

#### Architecture
```
User Terminal
     ↓ (natural language)
Gemini CLI
     ↓ (stdio)
Python MCP Server (enhanced)
     ↓ (HTTP + JWT)
NestJS Backend
     ↓
PostgreSQL
```

#### Features
- ✅ Session persistence in `~/.synapse/sessions.json`
- ✅ Natural language prompts (no JSON, no JWT)
- ✅ Context-aware responses
- ✅ Multi-turn conversations
- ✅ Automatic re-authentication on token expiry

#### Example Commands
```bash
# Authentication
> "Login as admin@acme.com password secure123"
> "Who am I?"
> "Logout"

# Contacts
> "Show all contacts"
> "Find contacts from Microsoft"
> "Create contact Jane Smith, jane@microsoft.com, phone 555-9999"
> "Update Jane's company to Google"

# Leads
> "Show qualified leads"
> "Create lead: Enterprise opportunity at Tesla"
> "Convert lead #123 to deal"

# Deals
> "Show deals over $50,000"
> "Move deal #456 to Negotiation"
> "Mark deal #456 as won"
> "Forecast next quarter revenue"

# Tickets
> "Show open high priority tickets"
> "Create ticket: Email sync broken, HIGH priority"
> "Assign ticket #789 to Sarah"

# Analytics
> "Show dashboard"
> "What's my win rate?"
> "Show top performers"
```

#### Implementation Steps
1. **Enhance server.py** with session management
2. **Update all 76 tools** to auto-inject JWT
3. **Add login/logout/whoami** tools
4. **Test with Gemini CLI** using natural prompts
5. **Document natural language patterns**

#### Session Management
```python
import json
import os
from datetime import datetime, timedelta
from pathlib import Path

SESSION_FILE = Path.home() / ".synapse" / "sessions.json"

def save_session(session_id: str, data: dict):
    """Save session to file"""
    SESSION_FILE.parent.mkdir(exist_ok=True)
    sessions = {}
    if SESSION_FILE.exists():
        sessions = json.loads(SESSION_FILE.read_text())
    sessions[session_id] = data
    SESSION_FILE.write_text(json.dumps(sessions, indent=2))

def load_session(session_id: str) -> dict | None:
    """Load session from file"""
    if not SESSION_FILE.exists():
        return None
    sessions = json.loads(SESSION_FILE.read_text())
    return sessions.get(session_id)

def delete_session(session_id: str):
    """Delete session"""
    if not SESSION_FILE.exists():
        return
    sessions = json.loads(SESSION_FILE.read_text())
    if session_id in sessions:
        del sessions[session_id]
        SESSION_FILE.write_text(json.dumps(sessions, indent=2))
```

---

### 2. Web Chatbot (React + Next.js Frontend)

#### Architecture
```
Browser (Next.js Frontend)
     ↓ (WebSocket/SSE)
Python MCP Server (WebSocket mode)
     ↓ (HTTP + JWT)
NestJS Backend
     ↓
PostgreSQL
```

#### UI Components
```tsx
// Frontend/src/components/chatbot/ChatbotWidget.tsx
'use client'

import { useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ChatbotWidget() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const { sendMessage, isConnected } = useWebSocket()

  const handleSend = async () => {
    if (!input.trim()) return

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])

    // Send to MCP server
    const response = await sendMessage(input)

    // Add assistant response
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMsg])

    setInput('')
  }

  return (
    <Card className="w-full max-w-2xl h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold">Synapse CRM Assistant</h2>
        <p className="text-sm text-muted-foreground">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              'p-3 rounded-lg',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                : 'bg-muted max-w-[80%]'
            )}
          >
            <p>{msg.content}</p>
            <span className="text-xs opacity-70">
              {msg.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about contacts, deals, tickets..."
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </Card>
  )
}
```

#### WebSocket Hook
```tsx
// Frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react'

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000/mcp')
    
    ws.onopen = () => {
      setIsConnected(true)
      console.log('MCP WebSocket connected')
    }
    
    ws.onclose = () => {
      setIsConnected(false)
      console.log('MCP WebSocket disconnected')
    }
    
    wsRef.current = ws
    
    return () => ws.close()
  }, [])

  const sendMessage = async (message: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      // Send message
      wsRef.current.send(JSON.stringify({
        type: 'execute_tool',
        tool: 'chat',
        args: { message },
      }))

      // Wait for response
      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data)
        wsRef.current?.removeEventListener('message', handler)
        resolve(data.content)
      }

      wsRef.current.addEventListener('message', handler)
    })
  }

  return { sendMessage, isConnected }
}
```

#### Session Management (Web)
```tsx
// Frontend/src/lib/session.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionStore {
  jwt: string | null
  userId: string | null
  email: string | null
  tenantId: string | null
  tenantName: string | null
  role: string | null
  login: (data: any) => void
  logout: () => void
}

export const useSession = create<SessionStore>()(
  persist(
    (set) => ({
      jwt: null,
      userId: null,
      email: null,
      tenantId: null,
      tenantName: null,
      role: null,
      login: (data) => set({
        jwt: data.jwt,
        userId: data.userId,
        email: data.email,
        tenantId: data.tenantId,
        tenantName: data.tenantName,
        role: data.role,
      }),
      logout: () => set({
        jwt: null,
        userId: null,
        email: null,
        tenantId: null,
        tenantName: null,
        role: null,
      }),
    }),
    {
      name: 'synapse-session',
    }
  )
)
```

#### Implementation Steps
1. **Create WebSocket transport** in MCP server
2. **Build ChatbotWidget** component with shadcn/ui
3. **Implement useWebSocket** hook
4. **Add session persistence** with Zustand
5. **Test end-to-end** with natural language

---

### 3. Android Chatbot (Kotlin + Jetpack Compose)

#### Architecture
```
Android App (Jetpack Compose)
     ↓ (WebSocket via OkHttp)
Python MCP Server (WebSocket mode)
     ↓ (HTTP + JWT)
NestJS Backend
     ↓
PostgreSQL
```

#### UI Components
```kotlin
// Synapse/app/src/main/java/com/synapse/crm/features/chatbot/ChatbotScreen.kt
@Composable
fun ChatbotScreen(
    viewModel: ChatbotViewModel = hiltViewModel()
) {
    val messages by viewModel.messages.collectAsState()
    val inputText by viewModel.inputText.collectAsState()
    val isConnected by viewModel.isConnected.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("CRM Assistant") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White
                ),
                actions = {
                    Text(
                        text = if (isConnected) "🟢 Connected" else "🔴 Offline",
                        color = Color.White,
                        modifier = Modifier.padding(end = 16.dp)
                    )
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Messages List
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(16.dp),
                reverseLayout = true
            ) {
                items(messages.reversed()) { message ->
                    ChatMessage(message = message)
                }
            }

            // Input Field
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextField(
                    value = inputText,
                    onValueChange = { viewModel.updateInput(it) },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Ask about contacts, deals...") },
                    keyboardOptions = KeyboardOptions(
                        imeAction = ImeAction.Send
                    ),
                    keyboardActions = KeyboardActions(
                        onSend = { viewModel.sendMessage() }
                    )
                )
                Spacer(modifier = Modifier.width(8.dp))
                IconButton(onClick = { viewModel.sendMessage() }) {
                    Icon(Icons.Default.Send, contentDescription = "Send")
                }
            }
        }
    }
}

@Composable
fun ChatMessage(message: ChatMessage) {
    val alignment = if (message.isUser) Alignment.End else Alignment.Start
    val backgroundColor = if (message.isUser) 
        MaterialTheme.colorScheme.primary 
    else 
        MaterialTheme.colorScheme.surfaceVariant

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        contentAlignment = alignment
    ) {
        Card(
            modifier = Modifier.widthIn(max = 300.dp),
            colors = CardDefaults.cardColors(
                containerColor = backgroundColor
            )
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = message.content,
                    color = if (message.isUser) Color.White else Color.Black
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = message.timestamp.format("HH:mm"),
                    style = MaterialTheme.typography.labelSmall,
                    color = if (message.isUser) 
                        Color.White.copy(alpha = 0.7f) 
                    else 
                        Color.Black.copy(alpha = 0.7f)
                )
            }
        }
    }
}
```

#### ViewModel with WebSocket
```kotlin
// Synapse/app/src/main/java/com/synapse/crm/features/chatbot/ChatbotViewModel.kt
@HiltViewModel
class ChatbotViewModel @Inject constructor(
    private val mcpWebSocketClient: MCPWebSocketClient,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _inputText = MutableStateFlow("")
    val inputText: StateFlow<String> = _inputText.asStateFlow()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    init {
        connectToMCPServer()
        loadSession()
    }

    private fun connectToMCPServer() {
        viewModelScope.launch {
            mcpWebSocketClient.connect("ws://10.0.2.2:5000/mcp") // Android emulator
            mcpWebSocketClient.connectionState.collect { connected ->
                _isConnected.value = connected
            }
        }
    }

    private fun loadSession() {
        viewModelScope.launch {
            val session = sessionManager.getSession()
            if (session != null) {
                addMessage(ChatMessage(
                    content = "✅ Resumed session as ${session.email}",
                    isUser = false,
                    timestamp = LocalDateTime.now()
                ))
            } else {
                addMessage(ChatMessage(
                    content = "👋 Welcome! Please login to get started.\nExample: 'Login as admin@example.com password test123'",
                    isUser = false,
                    timestamp = LocalDateTime.now()
                ))
            }
        }
    }

    fun updateInput(text: String) {
        _inputText.value = text
    }

    fun sendMessage() {
        val text = _inputText.value.trim()
        if (text.isEmpty()) return

        // Add user message
        addMessage(ChatMessage(
            content = text,
            isUser = true,
            timestamp = LocalDateTime.now()
        ))

        // Clear input
        _inputText.value = ""

        // Send to MCP server
        viewModelScope.launch {
            try {
                val response = mcpWebSocketClient.sendMessage(text)
                addMessage(ChatMessage(
                    content = response,
                    isUser = false,
                    timestamp = LocalDateTime.now()
                ))
            } catch (e: Exception) {
                addMessage(ChatMessage(
                    content = "❌ Error: ${e.message}",
                    isUser = false,
                    timestamp = LocalDateTime.now()
                ))
            }
        }
    }

    private fun addMessage(message: ChatMessage) {
        _messages.value = _messages.value + message
    }

    override fun onCleared() {
        super.onCleared()
        mcpWebSocketClient.disconnect()
    }
}
```

#### WebSocket Client
```kotlin
// Synapse/app/src/main/java/com/synapse/crm/data/websocket/MCPWebSocketClient.kt
class MCPWebSocketClient @Inject constructor(
    private val okHttpClient: OkHttpClient
) {
    private var webSocket: WebSocket? = null
    private val _connectionState = MutableStateFlow(false)
    val connectionState: StateFlow<Boolean> = _connectionState.asStateFlow()

    private val messageCallbacks = mutableMapOf<String, CompletableDeferred<String>>()

    fun connect(url: String) {
        val request = Request.Builder().url(url).build()
        
        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d("MCPWebSocket", "Connected to MCP server")
                _connectionState.value = true
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d("MCPWebSocket", "Received: $text")
                handleMessage(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d("MCPWebSocket", "Closing: $code - $reason")
                _connectionState.value = false
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e("MCPWebSocket", "Connection failed", t)
                _connectionState.value = false
            }
        })
    }

    suspend fun sendMessage(message: String): String {
        val messageId = UUID.randomUUID().toString()
        val deferred = CompletableDeferred<String>()
        messageCallbacks[messageId] = deferred

        val payload = JSONObject().apply {
            put("id", messageId)
            put("type", "execute_tool")
            put("tool", "chat")
            put("args", JSONObject().put("message", message))
        }

        webSocket?.send(payload.toString()) ?: throw Exception("WebSocket not connected")

        return withTimeout(30000) {
            deferred.await()
        }
    }

    private fun handleMessage(text: String) {
        val json = JSONObject(text)
        val messageId = json.getString("id")
        val content = json.getString("content")
        
        messageCallbacks[messageId]?.complete(content)
        messageCallbacks.remove(messageId)
    }

    fun disconnect() {
        webSocket?.close(1000, "User disconnected")
    }
}
```

#### Session Management (Android)
```kotlin
// Synapse/app/src/main/java/com/synapse/crm/data/session/SessionManager.kt
@Singleton
class SessionManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val prefs = context.getSharedPreferences("synapse_session", Context.MODE_PRIVATE)

    data class Session(
        val jwt: String,
        val userId: String,
        val email: String,
        val tenantId: String,
        val tenantName: String,
        val role: String,
        val expiresAt: Long
    )

    fun saveSession(session: Session) {
        prefs.edit().apply {
            putString("jwt", session.jwt)
            putString("userId", session.userId)
            putString("email", session.email)
            putString("tenantId", session.tenantId)
            putString("tenantName", session.tenantName)
            putString("role", session.role)
            putLong("expiresAt", session.expiresAt)
            apply()
        }
    }

    fun getSession(): Session? {
        val jwt = prefs.getString("jwt", null) ?: return null
        val expiresAt = prefs.getLong("expiresAt", 0L)
        
        // Check if expired
        if (System.currentTimeMillis() > expiresAt) {
            clearSession()
            return null
        }

        return Session(
            jwt = jwt,
            userId = prefs.getString("userId", "") ?: "",
            email = prefs.getString("email", "") ?: "",
            tenantId = prefs.getString("tenantId", "") ?: "",
            tenantName = prefs.getString("tenantName", "") ?: "",
            role = prefs.getString("role", "") ?: "",
            expiresAt = expiresAt
        )
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
```

#### Implementation Steps
1. **Add WebSocket dependency** to `build.gradle.kts`
2. **Create MCPWebSocketClient** with OkHttp
3. **Build ChatbotScreen** with Jetpack Compose
4. **Implement SessionManager** with SharedPreferences
5. **Test on emulator** with `10.0.2.2:5000`

---

### 4. Telegram Bot (Python telegram-bot)

#### Architecture
```
Telegram App
     ↓ (Telegram Bot API)
Python Telegram Bot Handler
     ↓ (Direct function calls)
Python MCP Server (library mode)
     ↓ (HTTP + JWT)
NestJS Backend
     ↓
PostgreSQL
```

#### Bot Implementation
```python
# telegram-bot/bot.py
import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)
from dotenv import load_dotenv
import sys
sys.path.append('../mcp-server-python')
from server import SynapseCRMServer

load_dotenv()

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Initialize MCP server in library mode
mcp_server = SynapseCRMServer()

# User sessions (per Telegram user ID)
user_sessions = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    await update.message.reply_text(
        f"👋 Welcome to Synapse CRM, {user.first_name}!\n\n"
        f"Please login to get started:\n"
        f"Example: `/login admin@example.com password123`\n\n"
        f"Or use /help to see available commands."
    )

async def login(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /login command"""
    user_id = update.effective_user.id
    
    # Parse arguments: /login email password
    if len(context.args) < 2:
        await update.message.reply_text(
            "❌ Usage: /login email password\n"
            "Example: /login admin@example.com password123"
        )
        return
    
    email = context.args[0]
    password = context.args[1]
    
    # Execute login via MCP server
    result = await mcp_server.auth_sign_in({"email": email, "password": password})
    response = result[0].text
    
    if "✅" in response:
        # Extract JWT from response
        jwt = response.split("JWT Token: ")[1].split("\n")[0]
        
        # Save session
        user_sessions[user_id] = {
            "email": email,
            "jwt": jwt,
            "timestamp": datetime.now()
        }
        
        await update.message.reply_text(
            f"✅ Logged in successfully as {email}!\n\n"
            f"You can now use natural language commands:\n"
            f"• 'Show all contacts'\n"
            f"• 'Create contact John Doe'\n"
            f"• 'Show my deals'\n"
            f"• 'Forecast next month'"
        )
    else:
        await update.message.reply_text(response)

async def logout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /logout command"""
    user_id = update.effective_user.id
    
    if user_id in user_sessions:
        del user_sessions[user_id]
        await update.message.reply_text("✅ Logged out successfully")
    else:
        await update.message.reply_text("❌ You are not logged in")

async def whoami(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /whoami command"""
    user_id = update.effective_user.id
    
    if user_id not in user_sessions:
        await update.message.reply_text("❌ Not logged in")
        return
    
    session = user_sessions[user_id]
    await update.message.reply_text(
        f"✅ Logged in as: {session['email']}\n"
        f"Session created: {session['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}"
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle natural language messages"""
    user_id = update.effective_user.id
    message = update.message.text
    
    # Check if logged in
    if user_id not in user_sessions:
        await update.message.reply_text(
            "❌ Please login first: /login email password"
        )
        return
    
    session = user_sessions[user_id]
    jwt = session["jwt"]
    
    # Parse natural language and route to appropriate tool
    response = await route_message(message, jwt)
    await update.message.reply_text(response, parse_mode='Markdown')

async def route_message(message: str, jwt: str) -> str:
    """Route natural language message to MCP tool"""
    msg_lower = message.lower()
    
    # Contact operations
    if "show" in msg_lower and "contact" in msg_lower:
        result = await mcp_server.contact_list({"jwt": jwt})
        return result[0].text
    
    elif "create contact" in msg_lower:
        # Parse: "create contact John Doe, john@example.com"
        # Simple parsing - production needs NLU
        parts = message.split("contact")[1].strip().split(",")
        if len(parts) >= 2:
            name_parts = parts[0].strip().split()
            firstName = name_parts[0] if len(name_parts) > 0 else ""
            lastName = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
            email = parts[1].strip()
            
            result = await mcp_server.contact_create({
                "jwt": jwt,
                "firstName": firstName,
                "lastName": lastName,
                "email": email
            })
            return result[0].text
    
    # Deal operations
    elif "show" in msg_lower and ("deal" in msg_lower or "deals" in msg_lower):
        result = await mcp_server.deal_list({"jwt": jwt})
        return result[0].text
    
    # Analytics
    elif "dashboard" in msg_lower:
        result = await mcp_server.analytics_dashboard({"jwt": jwt})
        return result[0].text
    
    elif "forecast" in msg_lower:
        result = await mcp_server.analytics_forecast({"jwt": jwt})
        return result[0].text
    
    # Default
    return (
        "❌ I didn't understand that command.\n\n"
        "Try:\n"
        "• 'Show all contacts'\n"
        "• 'Show my deals'\n"
        "• 'Show dashboard'\n"
        "• 'Forecast revenue'"
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    help_text = """
🤖 *Synapse CRM Bot Commands*

*Authentication:*
/login email password - Login to your CRM
/logout - Logout from CRM
/whoami - Show current session

*Natural Language:*
Just type what you want to do!

*Examples:*
• "Show all contacts"
• "Create contact John Doe, john@example.com"
• "Show my deals"
• "Show dashboard"
• "Forecast next month revenue"
• "Show open tickets"
• "Create ticket: Login issue, HIGH priority"

*Quick Actions:*
/contacts - List contacts
/deals - List deals
/tickets - List tickets
/dashboard - Show dashboard
    """
    await update.message.reply_text(help_text, parse_mode='Markdown')

# Quick action commands
async def contacts(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if user_id not in user_sessions:
        await update.message.reply_text("❌ Please login first: /login email password")
        return
    jwt = user_sessions[user_id]["jwt"]
    result = await mcp_server.contact_list({"jwt": jwt})
    await update.message.reply_text(result[0].text)

async def deals(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if user_id not in user_sessions:
        await update.message.reply_text("❌ Please login first: /login email password")
        return
    jwt = user_sessions[user_id]["jwt"]
    result = await mcp_server.deal_list({"jwt": jwt})
    await update.message.reply_text(result[0].text)

async def tickets(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if user_id not in user_sessions:
        await update.message.reply_text("❌ Please login first: /login email password")
        return
    jwt = user_sessions[user_id]["jwt"]
    result = await mcp_server.ticket_list({"jwt": jwt})
    await update.message.reply_text(result[0].text)

async def dashboard(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if user_id not in user_sessions:
        await update.message.reply_text("❌ Please login first: /login email password")
        return
    jwt = user_sessions[user_id]["jwt"]
    result = await mcp_server.analytics_dashboard({"jwt": jwt})
    await update.message.reply_text(result[0].text, parse_mode='Markdown')

def main():
    """Start the bot"""
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not found in .env")
        return
    
    # Create application
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("login", login))
    application.add_handler(CommandHandler("logout", logout))
    application.add_handler(CommandHandler("whoami", whoami))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("contacts", contacts))
    application.add_handler(CommandHandler("deals", deals))
    application.add_handler(CommandHandler("tickets", tickets))
    application.add_handler(CommandHandler("dashboard", dashboard))
    
    # Handle all text messages (natural language)
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Start bot
    logger.info("Starting Synapse CRM Telegram Bot...")
    application.run_polling()

if __name__ == '__main__':
    main()
```

#### Setup Steps
1. **Create bot with BotFather** on Telegram
2. **Get bot token** and add to `.env`
3. **Install dependencies**: `pip install python-telegram-bot`
4. **Run bot**: `python bot.py`
5. **Test commands** in Telegram app

---

## 📈 Implementation Priority

### Phase 1: Enhanced MCP Server (Week 1)
- ✅ Add session management to `server.py`
- ✅ Implement 76 tools (all CRM entities)
- ✅ Add natural language auth (login/logout/whoami)
- ✅ Auto-inject JWT from session
- ✅ Test with Gemini CLI

### Phase 2: Web Chatbot (Week 2)
- ✅ Create WebSocket transport
- ✅ Build ChatbotWidget with Compose/shadcn
- ✅ Implement session persistence with Zustand
- ✅ Add to dashboard page
- ✅ Test end-to-end

### Phase 3: Android Chatbot (Week 3)
- ✅ Setup WebSocket with OkHttp
- ✅ Build UI with Jetpack Compose
- ✅ Implement SessionManager
- ✅ Test on emulator and device

### Phase 4: Telegram Bot (Week 4)
- ✅ Create bot with BotFather
- ✅ Implement command handlers
- ✅ Add natural language routing
- ✅ Test with multiple users

---

## 🎯 Success Metrics

### Technical Metrics
- ✅ All 76 tools implemented and tested
- ✅ Session persistence working across all clients
- ✅ JWT auto-injection successful
- ✅ Natural language parsing accuracy >80%
- ✅ Multi-tenant isolation verified

### User Experience Metrics
- ✅ Login once, use everywhere
- ✅ No manual JWT copying
- ✅ Natural language commands work
- ✅ Response time <2 seconds
- ✅ Error messages are helpful

---

## 📝 Next Steps

### Immediate (Today)
1. **Review this plan** with team
2. **Prioritize tools** (which 50+ tools to implement first)
3. **Start Phase 1** (enhanced MCP server)

### This Week
1. **Complete enhanced server.py** with session management
2. **Implement all 76 tools**
3. **Test with Gemini CLI** using natural language
4. **Document natural language patterns**

### This Month
1. **Deploy all 4 clients**
2. **User testing** with real CRM scenarios
3. **Gather feedback** and iterate
4. **Production deployment**

---

**Ready to start implementation!** 🚀
