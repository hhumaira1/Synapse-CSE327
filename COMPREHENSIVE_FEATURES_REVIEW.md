# 🎯 SynapseCRM - Comprehensive Features Review

> **Multi-Tenant AI-Powered CRM Platform**  
> Complete feature walkthrough across Backend (NestJS), Frontend (Next.js), and Android (Kotlin/Compose)

---

## 📱 Technology Stack

### Backend
- **Framework**: NestJS 11
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 6.18+
- **Authentication**: Supabase OAuth (migrated from Clerk)
- **VoIP**: LiveKit + Supabase Realtime
- **AI**: Google Gemini API

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui + Tailwind CSS 4
- **Authentication**: Supabase Auth
- **State Management**: React hooks + Context API

### Android
- **Language**: Kotlin
- **UI**: Jetpack Compose (fully modern, no XML layouts)
- **Architecture**: Clean Architecture (Data, Domain, Presentation)
- **Dependency Injection**: Dagger Hilt

---

## 🔐 Authentication System (Supabase OAuth)

### Backend Implementation
**Location**: `server/src/supabase-auth/`

#### Auth Endpoints (`auth/auth.controller.ts`)
- **POST /auth/signup** - Register new user with email/password
- **POST /auth/signin** - Login with email/password
- **POST /auth/signout** - Logout current user
- **POST /auth/reset-password** - Send password reset email
- **GET /auth/me** - Get current authenticated user
- **POST /auth/onboard** - Complete onboarding after signup

#### Core Services
- **SupabaseAuthService**: JWT token verification, user management
- **SupabaseAuthGuard**: Protects all API routes with JWT validation
- **CurrentUser Decorator**: Extract user from request in controllers

#### Features
✅ Email/password authentication  
✅ JWT token-based authorization  
✅ Multi-tenant workspace creation  
✅ User onboarding workflow  
✅ Password reset functionality  
✅ Session management  

### Frontend Implementation
**Location**: `Frontend/src/app/auth/`

- **Signin page** (`auth/signin/page.tsx`)
- **Signup page** (`auth/signup/page.tsx`)
- **Reset password** (`auth/reset-password/page.tsx`)
- **Auth callback** (`auth/callback/route.ts`)
- **Supabase client** (`lib/supabase/client.ts`)

### Android Implementation
**Location**: `Synapse/app/src/main/java/com/example/synapse/presentation/auth/`

- **LoginScreen** - Email/password login
- **SignUpScreen** - New user registration
- **OnboardingScreen** - Workspace setup
- **WorkspaceSelectorScreen** - Multi-workspace selection

---

## 🏢 Core CRM Features

### 1. Contacts Management
**Backend**: `server/src/contacts/`  
**Frontend**: `Frontend/src/app/(dashboard)/contacts/`  
**Android**: `Synapse/.../presentation/contacts/`

#### API Endpoints (Protected with Supabase Guard)
- **POST /contacts** - Create new contact
- **GET /contacts** - List all contacts (tenant-isolated)
- **GET /contacts/:id** - Get contact details
- **PATCH /contacts/:id** - Update contact
- **DELETE /contacts/:id** - Delete contact (Admin/Manager only)

#### Features
- Full CRUD operations
- Tenant-based data isolation
- Role-based access control
- Contact details (name, email, phone, company, notes)
- Contact activity tracking

---

### 2. Leads Management
**Backend**: `server/src/leads/`  
**Frontend**: `Frontend/src/app/(dashboard)/leads/` + `components/leads/`  
**Android**: `Synapse/.../presentation/leads/`

#### API Endpoints
- **POST /leads** - Create lead
- **GET /leads** - List leads (with filters: status, contactId, source)
- **GET /leads/:id** - Get lead details
- **POST /leads/:id/convert** - Convert lead to deal
- **PATCH /leads/:id** - Update lead
- **DELETE /leads/:id** - Delete lead

#### Features
- Lead status tracking (NEW, CONTACTED, QUALIFIED, LOST, CONVERTED)
- Source attribution (website, referral, advertisement, etc.)
- Lead scoring
- **Lead conversion** to deals with automatic contact linking
- Lead notes and history
- Filtering by status, contact, source

---

### 3. Deals Management
**Backend**: `server/src/deals/`  
**Frontend**: `Frontend/src/app/(dashboard)/deals/` + `components/deals/`  
**Android**: `Synapse/.../presentation/deals/`

#### API Endpoints
- **POST /deals** - Create deal
- **GET /deals** - List deals (filters: stageId, pipelineId, contactId)
- **GET /deals/stats/:pipelineId** - Get pipeline statistics
- **GET /deals/:id** - Get deal details
- **PATCH /deals/:id/move** - Move deal to different stage
- **PATCH /deals/:id** - Update deal
- **DELETE /deals/:id** - Delete deal

#### Features
- Deal value/amount tracking
- **Pipeline stages** (drag-and-drop movement)
- Deal status (OPEN, WON, LOST)
- Expected close dates
- **Pipeline statistics** (conversion rates, total value)
- Deal owner assignment
- Contact association
- Deal probability scoring

---

### 4. Pipelines & Stages
**Backend**: `server/src/pipelines/` + `server/src/stages/`  
**Frontend**: `Frontend/src/app/(dashboard)/pipelines/` + `components/pipelines/`  
**Android**: `Synapse/.../presentation/pipelines/`

#### API Endpoints
**Pipelines**:
- **POST /pipelines** - Create pipeline
- **GET /pipelines** - List all pipelines
- **GET /pipelines/:id** - Get pipeline with stages
- **PATCH /pipelines/:id** - Update pipeline
- **DELETE /pipelines/:id** - Delete pipeline

**Stages**:
- **POST /stages** - Create stage
- **GET /stages** - List stages by pipeline
- **PATCH /stages/:id** - Update stage (name, order)
- **DELETE /stages/:id** - Delete stage

#### Features
- Multiple sales pipelines
- Customizable stages per pipeline
- Stage ordering/positioning
- Deal movement between stages
- Visual Kanban board (Frontend)

---

## 🎫 Support & Ticketing

### Tickets System
**Backend**: `server/src/tickets/`  
**Frontend**: `Frontend/src/app/(dashboard)/tickets/` + `components/tickets/`  
**Android**: `Synapse/.../presentation/tickets/`

#### API Endpoints
- **POST /tickets** - Create ticket
- **GET /tickets** - List tickets (filters: status, priority, assignedUserId, contactId, portalCustomerId)
- **GET /tickets/:id** - Get ticket details
- **PATCH /tickets/:id** - Update ticket
- **DELETE /tickets/:id** - Delete ticket
- **POST /tickets/:id/comments** - Add comment to ticket

#### Features
- Ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- User assignment
- Contact or Portal Customer association
- **Ticket comments** with author tracking
- Rich filtering options
- Email notifications (planned)

---

## 🎯 MCP Strategy Guide: Decision Framework

### **Should You Use MCP for All Chatbots?**

**TL;DR: No. Use MCP ONLY for external AI clients, NOT for your existing chatbots.**

---

### 📊 **Decision Matrix**

| Scenario | Use MCP? | Use Direct API? | Reason |
|----------|:--------:|:---------------:|--------|
| **Web Chatbot UI** | ❌ | ✅ | Already optimized, no benefit from MCP |
| **Android Chat UI** | ❌ | ✅ | Offline-first, MCP adds latency |
| **Telegram Bot** | ❌ | ✅ | Direct service call is faster |
| **Gemini CLI** | ✅ | ❌ | MCP is designed for this |
| **Claude Desktop** | ✅ | ❌ | Native MCP support |
| **Terminal/Voice AI** | ✅ | ❌ | MCP provides tool interface |
| **Custom AI Agent** | ✅ | ❌ | MCP standardizes access |

---

### ⚖️ **Pros & Cons Analysis**

#### **Option 1: Use MCP for All Chatbots**

**Pros:**
- ✅ Unified interface for all AI interactions
- ✅ Easier to add new AI clients
- ✅ Standardized tool definitions

**Cons:**
- ❌ **Extra latency**: User → Frontend → MCP Server → Backend (3 hops)
- ❌ **No offline support**: MCP server must be running
- ❌ **Complexity**: Need to manage Python MCP server + Node backend
- ❌ **Lost features**: Can't cache in Room DB (Android), no localStorage (Web)
- ❌ **Overhead**: MCP protocol parsing adds ~50-100ms per request
- ❌ **Deployment**: Two separate servers to deploy/maintain

#### **Option 2: Direct API for UI Chatbots, MCP for External Clients (Current)**

**Pros:**
- ✅ **Optimal performance**: Direct API calls, minimal latency
- ✅ **Offline-first**: Android can queue messages locally
- ✅ **Simple deployment**: One backend server
- ✅ **Best UX**: Real-time updates, instant responses
- ✅ **Flexibility**: Can use both approaches when needed

**Cons:**
- ⚠️ Two different codepaths to maintain (but backend logic is shared)

---

### 🏗️ **Current Architecture (Recommended)**

```
┌─────────────────────────────────────────────────────┐
│                  YOUR CURRENT SETUP                 │
│               (Already Optimal!)                    │
└─────────────────────────────────────────────────────┘

For End Users (Web/Android/Telegram):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Web/Android/Telegram → Direct API → NestJS Backend
                                          ↓
                                  Same ChatbotService
                                          ↓
                                     Gemini AI


For Developers/AI Tools (CLI/Voice):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gemini CLI → MCP Server → NestJS Backend
                               ↓
                          All Modules
                        (Contacts, Deals, etc)
```

**Why This Works:**
- End users get **fast, reliable** chat experience
- Developers get **powerful CLI** for automation
- Both use **same backend** (code reuse)
- **Best of both worlds** ✨

---

### 💡 **Recommendation**

**Keep your current architecture! Here's why:**

1. **Your chatbots are already production-ready**
   - Web: Real-time, markdown rendering, localStorage
   - Android: Offline-first with Room DB
   - Telegram: Direct service integration

2. **MCP serves a different purpose**
   - Not designed for UI chatbots
   - Designed for AI clients (CLI, desktop apps, agents)

3. **No migration needed**
   - Current implementation is correct
   - MCP adds value for NEW use cases, not existing ones

---

### 🚀 **When to Expand MCP Usage**

**Use MCP for these NEW scenarios:**

✅ **1. Developer Productivity**
```bash
# Manage CRM from terminal
$ gemini chat "show my tickets"
$ gemini chat "create contact John Doe, john@acme.com"
```

✅ **2. Automation Scripts**
```python
# Python script using MCP
from mcp import Client
client.call_tool("create_lead", {"company": "Acme"})
```

✅ **3. Voice Assistants** (Future)
```
"Hey Siri, show my open deals in CRM"
  → Siri → MCP Server → Your CRM
```

✅ **4. Slack/Discord Bots**
```
/crm show contacts
  → Slack bot → MCP Server → Your CRM
```

**Don't replace existing chatbots with MCP**

---

### 📋 **Implementation Checklist**

**If you decide to expand MCP usage:**

- [x] MCP Server already created (`mcp-server-python/`)
- [x] 25 tools implemented (login, contacts, leads, deals, tickets)
- [x] Session management working
- [x] Works with Gemini CLI
- [ ] Configure for production (add to deployment)
- [ ] Document for team (how to use Gemini CLI)
- [ ] Add more tools if needed (analytics, reports)

**For existing chatbots (no action needed):**

- [x] Web chatbot: Direct API ✅
- [x] Android chatbot: Direct API ✅  
- [x] Telegram bot: Direct service call ✅
- [x] All working optimally

---

### 🎓 **Summary**

**Current State:**
- ✅ Chatbots use **direct API** (correct approach)
- ✅ MCP Server exists for **CLI/external clients** (bonus feature)

**Recommendation:**
- ✅ **Keep it as is** - no changes needed
- ✅ **Promote MCP Server** to developers for terminal usage
- ✅ **Don't migrate** existing chatbots to MCP

**Your architecture is already following best practices!** 🎉

---

## 💬 Communication Features

### 1. AI Chatbot (Gemini-Powered)
**Backend**: `server/src/chatbot/`  
**Frontend**: `Frontend/src/components/chatbot/`  
**Android**: `Synapse/.../presentation/chatbot/`  
**Telegram**: Via `server/src/telegram/` + MCP Server

#### API Endpoints
- **POST /chatbot/chat** - Send message to chatbot
- **GET /chatbot/conversations** - List user conversations
- **GET /chatbot/conversations/:id** - Get conversation history
- **DELETE /chatbot/conversations/:id** - Delete conversation

#### Backend Services
- **ChatbotService** (16KB) - Main chat orchestration
- **GeminiService** (14KB) - Google Gemini API integration
- **EntityResolverService** (6KB) - Resolve entities (contacts, deals)
- **GuardrailsEnhancedService** (7KB) - Content safety, PII detection

#### Core Features
✅ **Conversational AI** with Google Gemini  
✅ **Context-aware responses** (tenant-specific data)  
✅ **Entity resolution** - chatbot can lookup contacts, deals, leads  
✅ **Safety guardrails** - PII detection, content filtering  
✅ **Multi-turn conversations** - conversation history tracking  
✅ **Tenant isolation** - chatbot knows only your company data  

#### Chatbot Capabilities
- Answer questions about CRM data
- Lookup contact information
- Provide deal/pipeline insights
- Create support tickets (planned)
- Customer support assistance

---

### 1. AI Chatbot (Gemini-Powered)
**Backend**: `server/src/chatbot/`  
**Frontend**: `Frontend/src/components/chatbot/`  
**Android**: `Synapse/.../presentation/chatbot/`  
**Telegram**: Via `server/src/telegram/`

#### API Endpoints
- **POST /chatbot/chat** - Send message to chatbot
- **GET /chatbot/conversations** - List user conversations  
- **GET /chatbot/conversations/:id** - Get conversation history
- **DELETE /chatbot/conversations/:id** - Delete conversation

#### Backend Services
- **ChatbotService** (16KB) - Main chat orchestration
- **GeminiService** (14KB) - Google Gemini API integration
- **EntityResolverService** (6KB) - Resolve entities (contacts, deals)
- **GuardrailsEnhancedService** (7KB) - Content safety, PII detection

#### Core Features
✅ **Conversational AI** with Google Gemini  
✅ **Context-aware responses** (tenant-specific data)  
✅ **Entity resolution** - chatbot can lookup contacts, deals, leads  
✅ **Safety guardrails** - PII detection, content filtering  
✅ **Multi-turn conversations** - conversation history tracking  
✅ **Tenant isolation** - chatbot knows only your company data  

#### Chatbot Capabilities
- Answer questions about CRM data
- Lookup contact information
- Provide deal/pipeline insights
- Create support tickets (planned)
- Customer support assistance

---

## 🔄 Chatbot Architecture: Two Approaches

### **IMPORTANT: Understanding the Architecture**

Your project has **TWO DIFFERENT WAYS** AI interacts with the CRM:

1. **Internal Chatbots** (Web, Android, Telegram) → **Direct REST API** to `/api/chatbot/*`
2. **External AI Clients** (Gemini CLI, Claude Desktop) → **MCP Server** → REST API

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHATBOT ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

APPROACH 1: INTERNAL CHATBOTS (Built into your app)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Web App (React)                  Android App (Compose)
     │                                   │
     │   Direct HTTP                     │   Direct HTTP
     │   POST /api/chat                  │   Retrofit API call
     ↓                                   ↓
Next.js API Route (/api/chat/route.ts)  → Proxies to ↓
                                                      ↓
        ┌─────────────────────────────────────────────┐
        │   NestJS Backend: /api/chatbot/chat         │
        │   - Validates Supabase JWT                  │
        │   - Calls GeminiService                     │
        │   - Stores conversation in PostgreSQL       │
        └─────────────────────────────────────────────┘
                          ↑
                          │   Direct HTTP with JWT
                          │   POST /api/chatbot/chat
                          │
                    Telegram Bot
                    (Telegraf.js)


APPROACH 2: EXTERNAL AI CLIENTS (Command-line, desktop apps)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gemini CLI          Claude Desktop        Custom MCP Client
     │                     │                      │
     │  MCP Protocol       │  MCP Protocol        │  MCP Protocol
     │  (stdio/SSE)        │  (stdio/SSE)         │  (stdio/SSE)
     ↓                     ↓                      ↓
┌──────────────────────────────────────────────────────┐
│         Python MCP Server (mcp-server-python/)       │
│  - Exposes 25 CRM tools (login, list_contacts, etc) │
│  - Translates MCP calls → HTTP REST API calls        │
│  - Manages JWT session (~/.synapse-session.json)     │
└──────────────────────────────────────────────────────┘
                          ↓
                    HTTP REST API
           POST /api/auth/signin (login)
           GET /api/contacts (list_contacts)
           POST /api/leads (create_lead)
                          ↓
        ┌─────────────────────────────────────────────┐
        │   NestJS Backend API (Port 3001)            │
        │   - Same /api endpoints as Web/Android      │
        │   - Validates JWT (doesn't know about MCP)  │
        └─────────────────────────────────────────────┘
```

---

### Platform-Specific Implementations

#### 🌐 **Web Chatbot (Next.js)** - Uses Direct API

**Location**: `Frontend/src/components/chatbot/`

**How It Works**:
```typescript
// User types message in ChatWindow component
↓
// Frontend calls Next.js API route
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message, conversationId }),
  headers: { 'Content-Type': 'application/json' }
})
↓
// Next.js API route (app/api/chat/route.ts) proxies to backend
const response = await fetch(`${BACKEND_URL}/api/chatbot/chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,  // ← JWT from Supabase
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ message, conversationId })
})
↓
// Backend NestJS processes chat
// Returns: { response, conversationId, suggestedActions }
```

**Components** (8 total):
- **ChatWindow** - Main chat container
- **ChatInput** - Message input field
- **MessageList** - Displays conversation
- **ChatSidebar** - Conversation history
- **SuggestedActions** - AI-suggested quick actions
- **TypingIndicator** - Shows bot is thinking
- **ChatHeader** - Header with controls
- **ChatBubble** - Individual message styling

**Features**:
- ✅ Real-time message display
- ✅ Markdown rendering in responses
- ✅ Persistent conversations (localStorage)
- ✅ Mobile-responsive
- ✅ Dark/light theme

**Does NOT use MCP** - Direct API calls to backend

---

#### 📱 **Android Chatbot (Kotlin/Compose)** - Uses Direct API

**Location**: `Synapse/.../presentation/chatbot/`

**How It Works**:
```kotlin
// User sends message
chatViewModel.sendMessage(userInput)
↓
// ViewModel calls repository
chatRepository.sendMessage(message, conversationId)
↓
// Repository makes HTTP call via Retrofit
@POST("/api/chatbot/chat")
suspend fun sendMessage(
    @Header("Authorization") token: String,  // ← JWT
    @Body request: ChatRequest
): ChatResponse
↓
// Backend processes (same NestJS backend as web)
// Returns: ChatResponse(response, conversationId, suggestedActions)
```

**Architecture**:
- **ChatScreen.kt** - Jetpack Compose UI
- **ChatViewModel.kt** - State management (StateFlow)
- **ChatRepository** - API calls + offline caching
- **Room Database** - Local message storage

**Features**:
- ✅ Offline-first (messages cached in Room)
- ✅ Auto-retry failed messages when online
- ✅ Material Design 3 UI
- ✅ Push notifications for responses
- ✅ Real-time sync with server

**Does NOT use MCP** - Direct Retrofit API calls to backend

---

#### 💬 **Telegram Bot** - Uses Direct API

**Location**: `server/src/telegram/telegram.service.ts`

**How It Works**:
```typescript
// User sends message to Telegram bot
User: "show my contacts"
↓
// Telegram webhook calls NestJS TelegramService
bot.on('message', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const message = ctx.message.text;
  
  // Get authenticated user by Telegram ID
  const user = await telegramAuthService.getUserByTelegramId(telegramId);
  
  // Call SAME chatbot service as web/Android
  const response = await chatbotService.chat(
    { message, conversationId: `telegram_${telegramId}` },
    user.id,
    user.tenantId
  );
  
  // Send response back to Telegram
  await ctx.reply(response.response, { parse_mode: 'Markdown' });
});
```

**Flow**:
1. User sends message via Telegram
2. Telegram Bot (Telegraf.js) receives webhook
3. Bot gets CRM user linked to Telegram ID
4. **Directly calls** `ChatbotService.chat()` (same as web/Android)
5. Formats response for Telegram markdown
6. Sends reply to user

**Commands**:
- `/start` - Link Telegram account to CRM
- `/help` - Show available commands
- Any text - Sends to chatbot AI

**Does NOT use MCP** - Direct internal service call to `ChatbotService`

---

### ✅ **Summary: Internal Chatbots vs MCP**

| Feature | Web/Android/Telegram Chatbots | MCP Server |
|---------|-------------------------------|------------|
| **Purpose** | Built-in UI for end users | API for AI clients (Gemini CLI, etc) |
| **Architecture** | Direct REST API calls | MCP Protocol → REST API |
| **Authentication** | Supabase JWT in headers | JWT in session file |
| **Backend** | `/api/chatbot/*` endpoints | `/api/*` endpoints (all modules) |
| **Conversation Storage** | PostgreSQL (shared) | Not stored (stateless tools) |
| **AI Model** | Gemini (server-side) | Client's AI (Gemini, Claude, etc) |
| **Use Case** | Chat interface in app | Control CRM via AI CLI/voice |

**Key Insight**: 
- **Web/Android/Telegram chatbots** = Frontend interfaces calling the same backend `ChatbotService`
- **MCP Server** = Separate Python server exposing CRM operations as tools for external AI clients

---

### 🤖 **When to Use MCP Server?**

**MCP Server is ONLY for external AI clients**:

✅ **Use MCP Server when:**
- Using **Gemini CLI** (`gemini chat "show my contacts"`)
- Using **Claude Desktop** with MCP integration
- Building **custom AI agents** that need CRM access
- Want **voice AI** to control CRM (future)
- Building **Slack/Discord bots** with AI
- Want **terminal-based** CRM management

❌ **Don't need MCP Server for:**
- Web chatbot (uses Next.js `/api/chat` route)
- Android chatbot (uses Retrofit API calls)
- Telegram bot (uses direct service calls)
- Custom web UI (use REST API directly)

**Example MCP Usage**:
```bash
# In terminal with Gemini CLI
$ gemini chat "login as admin@company.com password test123"
✅ Logged in! Session saved.

$ gemini chat "show me my top 5 contacts"
📋 Your top 5 contacts:
1. John Doe - john@acme.com (ACME Corp)
2. Jane Smith - jane@techco.com (TechCo)
...

$ gemini chat "create a new lead for Startup Inc"
✅ Lead created! ID: lead_abc123
   Company: Startup Inc
   Status: NEW
```

---

### 🔗 **Can MCP Server Be Used for All Chatbots?**

**Short Answer: No, and you don't need to.**

**Why?**
1. **Web/Android chatbots** are already optimized for UI
   - Real-time updates
   - Markdown rendering
   - Conversation history
   - Offline support (Android)

2. **MCP adds unnecessary overhead** for UI chatbots
   - Extra hop: UI → MCP → Backend (3 layers)
   - Current: UI → Backend (2 layers)
   - MCP is designed for CLI/AI agents, not UI

3. **Telegram bot** can use MCP if you want, but direct API is simpler
   - Current: Telegram → ChatbotService (internal call)
   - With MCP: Telegram → MCP Server → Backend API
   - No benefit unless you want to use external AI instead of Gemini

**Best Practice**:
- ✅ Keep Web/Android/Telegram using **direct API** (current implementation is correct)
- ✅ Use **MCP Server** for CLI tools, AI agents, external integrations
- ✅ Both approaches can **coexist** (they use same backend)

---

### 2. VoIP Calling (LiveKit + Supabase Realtime)
**Backend**: `server/src/voip/`  
**Frontend**: `Frontend/src/components/voip/` + `contexts/VoipContext.tsx`  
**Android**: `Synapse/.../presentation/voip/`

#### API Endpoints
- **POST /voip/start-call** - Initiate call to user
- **POST /voip/accept** - Accept incoming call
- **POST /voip/reject** - Reject incoming call
- **POST /voip/end** - End active call
- **POST /voip/token** - Generate LiveKit access token
- **GET /voip/history** - Get call history
- **GET /voip/agents/available** - List available agents (for portal customers)

#### Architecture
- **LiveKit** for WebRTC media handling
- **Supabase Realtime** for call signaling (call_started, accepted, rejected, ended events)
- **Call logging** in database with duration tracking
- **Automatic room cleanup** after calls end

#### Features
✅ **One-to-one voice calls** between CRM users  
✅ **Portal customer → Agent calls**  
✅ **Incoming call notifications** with Supabase Realtime  
✅ **Call history** with timestamps and duration  
✅ **Available agents** listing for customers  
✅ **Real-time signaling** (no WebSocket server needed)  
✅ **Call recording** support (LiveKit feature)  

#### Frontend Components
- **CallButton** - Initiate calls
- **IncomingCallModal** - Handle incoming calls
- **AgentSelector** - Select agent to call (portal customers)
- **VoipContext** - Global call state management

---

### 3. Telegram Bot Integration
**Backend**: `server/src/telegram/`

#### Features
- Telegram bot for notifications
- Customer support via Telegram
- Ticket creation from Telegram messages
- Real-time updates to CRM users

---

### 4. MCP Server (Model Context Protocol)
**Location**: `mcp-server-python/`  
**Language**: Python 3.11+  
**Status**: ✅ Production Ready

#### What Is It?

A **command-line tool** that lets you control your CRM using natural language via AI assistants (Gemini CLI, Claude Desktop, etc).

**Example Usage:**
```bash
# Install Gemini CLI
$ gemini chat "login as admin@company.com password test123"
✅ Logged in!

# Natural language commands
$ gemini chat "show my contacts"
$ gemini chat "create lead for Acme Corp"
$ gemini chat "what are my open tickets?"
```

---

#### How It Works (Simple Version)

```
You type command in terminal
     ↓
Gemini CLI (AI understands your intent)
     ↓
MCP Server (translates to API calls)
     ↓
Your NestJS Backend (same API as web/Android)
     ↓
Returns data → MCP formats → Shows in terminal
```

**No separate database, no separate AI** - just a bridge to your existing backend.

---

#### 25 Available Commands

**Authentication:**
- `login` - Sign in to CRM
- `logout` - Sign out
- `whoami` - Show current user

**CRM Operations (22 tools):**
- Contacts: `list_contacts`, `get_contact`, `create_contact`, `update_contact`, `delete_contact`
- Leads: `list_leads`, `get_lead`, `create_lead`, `update_lead`, `convert_lead`, `delete_lead`
- Deals: `list_deals`, `get_deal`, `create_deal`, `update_deal`, `move_deal`, `delete_deal`
- Tickets: `list_tickets`, `get_ticket`, `create_ticket`, `update_ticket`, `add_ticket_comment`

---

#### Key Features

✅ **Automatic session management** - Login once, stay logged in
✅ **Natural language** - No need to remember API endpoints
✅ **Works with any MCP client** - Gemini CLI, Claude Desktop, custom tools
✅ **Uses your existing backend** - No duplicate code
✅ **Secure** - Same JWT authentication as web/Android

---

#### Quick Start

**1. Configure Gemini CLI** (`.gemini/settings.json`):
```json
{
  "mcpServers": {
    "synapse": {
      "command": "python",
      "args": ["G:/Cse 327/synapse/mcp-server-python/server_streamlined.py"]
    }
  }
}
```

**2. Start using:**
```bash
$ gemini chat "login as your@email.com password yourpass"
$ gemini chat "show all contacts"
$ gemini chat "create a ticket: App crash on login"
```

**That's it!** No MCP server to deploy separately - it runs on-demand when Gemini CLI needs it.

---

#### Universal MCP Client Support

**✅ Works with:**
- **Gemini CLI** (Google)
- **Claude Desktop** (Anthropic)  
- **Custom Python/Node clients** (using MCP SDK)
- **Future integrations** (VSCode, Slack, Discord)

**Why?** MCP is a standard protocol (like HTTP), so any MCP-compliant client can use your server.

---

#### Actual Project Files

**Two versions available:**

1. **`server.py`** - Basic (16 tools)
2. **`server_streamlined.py`** - **Recommended** (25 tools + better UX)

**Dependencies** (`requirements.txt`):
```txt
mcp>=1.0.0
httpx>=0.27.0
python-dotenv>=1.0.0
orjson>=3.9.0
```

**Configuration** (`.env`):
```bash
BACKEND_URL=http://localhost:3001
BACKEND_API_PREFIX=/api
LOG_LEVEL=INFO
```

**Session file:** `~/.synapse-session.json` (auto-created after login)

---

#### Production Deployment

**Option 1: On-Demand (Recommended for CLI)**
- MCP server runs only when client needs it
- No separate deployment
- Used by: Gemini CLI, Claude Desktop

**Option 2: Always-Running Server (For web integrations)**
- Deploy as separate service
- Expose via HTTP/SSE
- Used by: Custom web clients, Slack bots

**Current setup uses Option 1** - no deployment needed for CLI usage!

#### How MCP Connects to Backend

**Connection Architecture**:

The MCP Server acts as a **middleware layer** that translates MCP protocol calls into standard REST API requests:

```
MCP Client (Gemini CLI, Claude Desktop, etc.)
    ↓ [MCP Protocol via stdio/SSE]
Python MCP Server
    ↓ [HTTP/REST with JWT tokens]
NestJS Backend API (Supabase Auth)
    ↓ [Prisma ORM queries]
PostgreSQL Database (Supabase)
```

**Step-by-Step Flow**:

1. **MCP Client → MCP Server**: Client sends tool call (e.g., `list_contacts`)
2. **Authentication**: MCP Server loads JWT from session file
3. **API Translation**: Server converts tool call to REST endpoint:
   - Tool: `list_contacts` → API: `GET /api/contacts?limit=10`
4. **HTTP Request**: Makes authenticated request with headers:
   ```python
   headers = {
       'Authorization': f'Bearer {jwt_token}',
       'Content-Type': 'application/json'
   }
   response = await httpx.get(f'{BACKEND_URL}/api/contacts', headers=headers)
   ```
5. **Backend Processing**: NestJS validates JWT via SupabaseAuthGuard, processes request
6. **Response Formatting**: MCP Server converts JSON to natural language
7. **Return to Client**: Formatted response sent back via MCP protocol

**Authentication Flow**:

```python
# When user calls 'login' tool:
1. MCP Server → POST /api/auth/signin {email, password}
2. Backend validates credentials with Supabase
3. Backend returns: {user, session: {access_token: "JWT_HERE"}}
4. MCP Server saves to ~/.synapse-session.json:
   {
     "email": "admin@company.com",
     "jwt": "eyJhbGciOiJIUzI1NiIs...",
     "user": {"id": "...", "name": "John Doe"},
     "tenant": {"id": "...", "name": "Acme Corp"}
   }
5. All subsequent API calls auto-include this JWT token
```

**Key Technical Points**:

✅ **Stateless Backend**: NestJS doesn't know about MCP; it only sees normal REST API calls  
✅ **JWT Authentication**: Every request includes `Authorization: Bearer <token>` header  
✅ **Async HTTP**: Uses `httpx` for non-blocking concurrent requests  
✅ **Error Handling**: Connection timeouts, 401 errors, network failures handled gracefully  
✅ **Tenant Isolation**: Backend extracts `tenantId` from JWT, enforces data isolation  

---

#### Universal MCP Client Compatibility

**The MCP Server works with ANY MCP-compliant client** because it follows the official MCP specification:

**✅ Tested and Working**:
- **Gemini CLI** - Google's command-line MCP client
- **Claude Desktop** - Anthropic's desktop app
- **Custom Python clients** - Using `mcp` SDK
- **HTTP/SSE clients** - Via Server-Sent Events transport

**🔄 Coming Soon**:
- **VSCode Extension** - MCP tools in editor
- **Telegram Bot** - Natural language CRM via Telegram
- **Slack Bot** - Team collaboration with CRM
- **Mobile Apps** - Direct MCP integration

**Why It Works with Any Client**:

The MCP protocol is **standardized** (like HTTP):
- **Discovery**: Clients can list available tools via `tools/list`
- **Execution**: Clients call tools via `tools/call` with JSON arguments
- **Schemas**: Each tool has OpenAPI-like schema for validation
- **Transport**: Supports stdio, Server-Sent Events (SSE), WebSockets

**Example - Adding New MCP Client**:

```typescript
// ANY MCP client can use Synapse CRM tools:
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const client = new Client({
  name: "my-crm-client",
  version: "1.0.0"
});

// Connect to MCP server
await client.connect(transport);

// List available tools
const { tools } = await client.listTools();
// Returns: [login, list_contacts, create_deal, ...]

// Call any tool
const result = await client.callTool({
  name: "list_contacts",
  arguments: { limit: 5 }
});
```

**No Lock-In**: Switch MCP clients anytime without changing the MCP Server code!

---

#### Technical Details

**Dependencies**:
- `mcp>=1.0.0` - Official Anthropic MCP SDK
- `httpx>=0.27.0` - Async HTTP client for API calls
- `python-dotenv>=1.0.0` - Environment configuration
- `orjson>=3.9.0` - Fast JSON parsing

**Configuration** (`.env`):
```bash
BACKEND_URL=http://localhost:3001
BACKEND_API_PREFIX=/api
MCP_SERVER_NAME=Synapse CRM
LOG_LEVEL=INFO
```

**Session Storage**:
- Saved to `~/.synapse-session.json`
- Contains: `email`, `jwt`, `user` details, `tenant` info
- Automatically loaded on server start

#### Benefits

🎯 **For Developers**:
- No need to write REST API code for every operation
- Natural language interface to CRM
- Rapid prototyping and testing

🎯 **For Users**:
- Conversational CRM access via Gemini CLI
- Telegram bot integration (coming soon)
- Voice commands via AI assistants (future)

🎯 **For Integration**:
- Standardized protocol (MCP)
- Works with any MCP-compatible client
- Easy to extend with new tools

---

## 🔗 Integrations

### Jira Integration
**Backend**: `server/src/jira/`

#### API Endpoints
- **POST /jira/webhook** - Receive Jira webhooks
- Bidirectional sync (planned/in-progress)

#### Features
- Webhook handling for Jira events
- Issue synchronization
- Two-way sync between Jira and CRM tickets

---

## 📊 Analytics
**Backend**: `server/src/analytics/`  
**Frontend**: `Frontend/src/app/(dashboard)/analytics/`  
**Android**: `Synapse/.../presentation/dashboard/`

#### Features
- **Dashboard metrics** (deals won/lost, revenue, pipeline value)
- **Pipeline conversion rates**
- **Lead source analytics**
- **User activity tracking**
- **Sales forecasting** (planned)

---

## 🌐 Customer Portal
**Backend**: `server/src/portal/`  
**Frontend**: `Frontend/src/app/portal/`  
**Android**: `Synapse/.../presentation/portal/`

#### API Endpoints (Portal Customers Controller)
- **POST /portal/customers/invite** - Invite customer to portal
- **GET /portal/customers** - List portal customers
- **POST /portal/customers/accept** - Accept portal invitation
- **DELETE /portal/customers/:id** - Revoke portal access

#### Features
- **Customer self-service portal** - Customers can view their data
- **Portal invitations** via email
- **Access token authentication**
- **Ticket creation** from portal
- **Call agents** directly from portal
- **View own tickets** and history
- **Separate authentication** from CRM users

---

## 🏗️ Multi-Tenancy Architecture

### How It Works
Every user belongs to a **Tenant** (workspace/company). All data is isolated by `tenantId`:

```
Tenant (workspace)
  ├── Users (employees with roles: ADMIN, MANAGER, MEMBER)
  ├── Contacts
  ├── Leads
  ├── Deals
  ├── Pipelines + Stages
  ├── Tickets
  ├── Portal Customers
  └── Call Logs
```

### Security
✅ **Automatic tenant filtering** in all queries  
✅ **Supabase user → CRM user mapping** via `supabaseUserId`  
✅ **Role-based access control** (Admin, Manager, Member)  
✅ **No cross-tenant data leaks** - enforced at database level  

### User Roles
- **ADMIN**: Full access, user management, deletion rights
- **MANAGER**: Create/edit/assign, limited deletion
- **MEMBER**: View and create, no deletion

---

## 📲 Android App Features

### Screens Implemented
**Location**: `Synapse/app/src/main/java/com/example/synapse/presentation/`

1. **LandingPage** - Initial screen
2. **Auth Flow**:
   - LoginScreen
   - SignUpScreen
   - OnboardingScreen
   - WorkspaceSelectorScreen
3. **Dashboard**:
   - OwnerDashboard - Main analytics view
4. **CRM**:
   - ContactsScreen (list + detail)
   - LeadsScreen (list + create + detail)
   - DealsScreen (list + create + detail)
   - PipelinesScreen
5. **Support**:
   - TicketsScreen (list + detail)
   - CreateTicketScreen
6. **Communication**:
   - ChatScreen (AI Chatbot)
   - VoIP calling (in-app voice calls)
7. **Portal**:
   - PortalDashboard
   - PortalTicketsScreen
   - PortalAcceptScreen
8. **Settings**:
   - SettingsScreen

### Data Layer
**Location**: `Synapse/.../data/`

- **API clients** (10 services)
- **Local database** (Room)
- **Model classes** (15 data models)
- **Repositories** (13 repositories for each feature)
- **Auth handling** (Supabase Auth)
- **Preferences** storage

### Features
✅ **Native Kotlin** with Jetpack Compose  
✅ **Offline-first** with Room database  
✅ **Supabase Auth** integration  
✅ **Real-time updates** via Supabase  
✅ **VoIP calling** on mobile  
✅ **Full feature parity** with web app  
✅ **Modern UI/UX** with Material Design 3  

---

## 🔄 Real-Time Features (Supabase Realtime)

### Implemented
- **VoIP call signaling** (`call_events` table)
- **Incoming call notifications**
- **Call status updates** (accepted, rejected, ended)

### Planned
- Ticket updates broadcast
- Live chat notifications
- Deal movement notifications
- User presence (online/offline status)

---

## 📋 Complete API Endpoint Summary

### Authentication (6 endpoints)
- `/auth/signup`, `/auth/signin`, `/auth/signout`, `/auth/reset-password`, `/auth/me`, `/auth/onboard`

### CRM (30+ endpoints)
- `/contacts/*` (5 endpoints)
- `/leads/*` (6 endpoints)
- `/deals/*` (7 endpoints)
- `/pipelines/*` (5 endpoints)
- `/stages/*` (5 endpoints)

### Support (7 endpoints)
- `/tickets/*` (6 endpoints)
- `/tickets/:id/comments`

### Communication (12 endpoints)
- `/chatbot/*` (4 endpoints)
- `/voip/*` (8 endpoints)

### Portal (4 endpoints)
- `/portal/customers/*`

### Integrations (1+ endpoints)
- `/jira/webhook`

**Total**: **60+ API endpoints**

---

## 🎨 Frontend Pages & Components

### Pages
**Location**: `Frontend/src/app/`

- `/` - Landing page
- `/auth/*` - Authentication flows
- `/onboard` - Workspace setup
- `/select-workspace` - Multi-workspace selector
- `/dashboard` - Main dashboard
- `/contacts` - Contact management
- `/leads` - Lead management
- `/deals` - Deal pipeline view
- `/pipelines` - Pipeline configuration
- `/tickets` - Support tickets
- `/analytics` - Analytics dashboard
- `/settings` - User & workspace settings
- `/portal` - Customer portal
- `/portal-customers` - Portal user management
- `/calls` - Call history
- `/test-voip` - VoIP testing page

### Component Categories
**Location**: `Frontend/src/components/`

- **chatbot/** (8 components) - AI chat interface
- **deals/** (4 components) - Deal cards, forms
- **leads/** (5 components) - Lead management UI
- **pipelines/** (4 components) - Kanban boards
- **portal/** (3 components) - Portal invitations
- **settings/** (3 components) - Settings UI
- **tickets/** (4 components) - Ticket views, dialogs
- **voip/** (6 components) - Call buttons, modals
- **ui/** (13 components) - shadcn/ui components

---

## 🚀 Key Differentiators

### 1. **Supabase-First Architecture**
- OAuth authentication (no third-party auth service)
- Realtime signaling for VoIP
- PostgreSQL database with row-level security
- Instant APIs via Supabase

### 2. **AI-Powered Assistance**
- Gemini chatbot with CRM context
- Entity resolution (chatbot understands your data)
- Safety guardrails and PII protection

### 3. **Embedded VoIP**
- No external softphone needed
- Browser-to-browser calls (WebRTC)
- Mobile app voice calling
- Portal customer → agent direct calls

### 4. **True Multi-Tenancy**
- Complete data isolation
- Multiple workspaces per user
- Tenant-aware everything

### 5. **Cross-Platform**
- Web app (Next.js)
- Native Android (Kotlin/Compose)
- Consistent UX across platforms

---

## ✅ Feature Completeness

| Feature Category | Backend | Frontend | Android |
|-----------------|:-------:|:--------:|:-------:|
| **Authentication** | ✅ | ✅ | ✅ |
| **Contacts** | ✅ | ✅ | ✅ |
| **Leads** | ✅ | ✅ | ✅ |
| **Deals** | ✅ | ✅ | ✅ |
| **Pipelines** | ✅ | ✅ | ✅ |
| **Tickets** | ✅ | ✅ | ✅ |
| **AI Chatbot** | ✅ | ✅ | ✅ |
| **VoIP Calls** | ✅ | ✅ | ✅ |
| **Customer Portal** | ✅ | ✅ | ✅ |
| **Analytics** | ✅ | ✅ | ✅ |
| **Settings** | ✅ | ✅ | ✅ |

---

## 🔧 Development Status

### ✅ Production-Ready Features
- Complete authentication system with Supabase OAuth
- Full CRM pipeline (Contacts → Leads → Deals)
- Ticket management with comments
- AI chatbot with Gemini
- VoIP calling with LiveKit
- Customer portal
- Multi-tenancy with role-based access
- Android native app

### 🚧 In Progress
- Jira bidirectional sync
- Email notifications
- Advanced analytics

### 📋 Planned
- Calendar integration
- Email inbox sync (Gmail, Outlook)
- Mobile app for iOS
- Advanced reporting
- Workflow automation

---

## 📖 Summary

**Synapse CRM** is a comprehensive, multi-tenant CRM platform with:

- **Modern authentication** via Supabase OAuth (migrated from Clerk)
- **Complete CRM lifecycle**: Contacts → Leads → Deals → Pipelines
- **Advanced support** with tickets and comments
- **AI-powered assistance** using Google Gemini
- **Built-in VoIP** with LiveKit and Supabase Realtime
- **Customer portal** for self-service
- **Native Android app** with full feature parity
- **60+ API endpoints** fully protected with tenant isolation
- **Clean architecture** across all three platforms

The project demonstrates modern full-stack development with cutting-edge technologies and a focus on real-time, AI-enhanced business workflows.

---

**Version**: 2.0 (Supabase OAuth)  
**Last Updated**: November 24, 2025  
**Status**: ✅ Production Ready
