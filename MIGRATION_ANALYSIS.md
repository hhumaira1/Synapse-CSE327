# SynapseCRM Migration & Enhancement Analysis

## 🔐 1. CLERK → SUPABASE AUTH MIGRATION

### Current State Analysis

**Clerk Usage Found:**

- **Backend**: 15+ controllers using `ClerkAuthGuard`
- **Frontend**: 8+ files using `@clerk/nextjs`
- **Android**: Not yet implemented (currently empty auth files)

### Supabase Auth vs Clerk Comparison

| Feature                        | Clerk                     | Supabase Auth               | Winner               |
| ------------------------------ | ------------------------- | --------------------------- | -------------------- |
| **Android SDK**          | Limited, community-driven | Official, well-maintained   | ✅**Supabase** |
| **Maturity**             | 3 years old               | 5+ years (PostgreSQL-based) | ✅**Supabase** |
| **Pricing**              | $25/month (10k MAU)       | Free (50k MAU)              | ✅**Supabase** |
| **Email/Password**       | ✅                        | ✅                          | Tie                  |
| **OAuth (Google, etc)**  | ✅                        | ✅                          | Tie                  |
| **Phone Auth**           | ✅                        | ✅                          | Tie                  |
| **Row Level Security**   | ❌                        | ✅                          | ✅**Supabase** |
| **React Native/Android** | ⚠️ Basic                | ✅ Excellent                | ✅**Supabase** |
| **JWT Tokens**           | ✅                        | ✅                          | Tie                  |
| **Session Management**   | ✅                        | ✅                          | Tie                  |
| **Built-in DB**          | ❌                        | ✅ PostgreSQL               | ✅**Supabase** |

**Recommendation**: ✅ **SWITCH TO SUPABASE AUTH**

### Migration Effort Estimate

#### Backend Changes (NestJS)

**Files to Modify: ~35 files**

1. **Remove Clerk Module** (5 files)

   - `server/src/clerk/*` → DELETE
   - Remove from all module imports
2. **Create Supabase Auth Module** (8 new files)

   ```
   server/src/supabase-auth/
   ├── supabase-auth.module.ts
   ├── supabase-auth.service.ts
   ├── guards/supabase-auth.guard.ts
   ├── decorators/current-user.decorator.ts
   └── strategies/supabase.strategy.ts
   ```
3. **Update All Controllers** (Replace `ClerkAuthGuard` → `SupabaseAuthGuard`)

   - Contacts: 1 file
   - Leads: 1 file
   - Deals: 1 file
   - Tickets: 1 file
   - Pipelines: 1 file
   - Analytics: 1 file
   - Twilio: 1 file
   - Jira: 1 file
   - osTicket: 1 file
   - **Total: 9 controllers**
4. **Update Auth Service** (1 file)

   - Change `clerkId` to `supabaseUserId` in User model
   - Update `getUserDetails()` method
5. **Database Migration**

   ```prisma
   model User {
     id              String   @id @default(uuid())
   - clerkId         String   @unique
   + supabaseUserId  String   @unique @map("supabase_user_id")
   ```

**Effort**: 2-3 days (with testing)

#### Frontend Changes (Next.js)

**Files to Modify: ~12 files**

1. **Replace Clerk Packages**

   ```bash
   npm uninstall @clerk/nextjs
   npm install @supabase/ssr @supabase/supabase-js
   ```
2. **Update Files**

   - `lib/api.ts` - Replace `useAuth()` from Clerk → Supabase session
   - `middleware.ts` - Replace Clerk middleware → Supabase middleware
   - `hooks/useUserData.ts` - Change `clerkId` → `supabaseUserId`
   - `app/sign-in/page.tsx` - New Supabase sign-in UI
   - `app/sign-up/page.tsx` - New Supabase sign-up UI
   - All pages using `useUser()` - Replace with Supabase hooks

**Effort**: 1-2 days

#### Android App Changes

**Files to Create: ~8 files** (Currently empty, so EASIER)

1. **Add Supabase SDK**

   ```kotlin
   implementation("io.github.jan-tennert.supabase:postgrest-kt:2.0.0")
   implementation("io.github.jan-tennert.supabase:gotrue-kt:2.0.0")
   ```
2. **Create Auth Module**

   ```
   app/src/main/java/com/example/synapse/
   ├── data/auth/
   │   ├── SupabaseAuthManager.kt
   │   └── AuthRepository.kt
   ├── presentation/auth/
   │   ├── SignInScreen.kt
   │   ├── SignUpScreen.kt
   │   └── AuthViewModel.kt
   ```

**Effort**: 2 days (MUCH easier than Clerk Android)

### Total Migration Time: **5-7 days**

---

## 🎫 2. JIRA INTEGRATION ANALYSIS

### Current Implementation Review

**How It Works Now:**

1. **Write-through cache**: When you create a ticket in SynapseCRM, it creates in Jira
2. **One-way sync**: SynapseCRM → Jira ✅
3. **No webhooks**: Changes in Jira don't sync back ❌

**What's Missing:**

- ❌ Jira webhooks to receive updates
- ❌ Bidirectional sync (Jira → SynapseCRM)
- ❌ Automatic sync on Jira status/comment changes

### Why Jira Changes Don't Appear

**Current Flow:**

```
User creates ticket in SynapseCRM
    ↓
Backend calls POST /jira/issue
    ↓
Jira issue created (externalId stored)
    ↓
✅ Ticket appears in both systems

BUT:

User updates ticket in Jira
    ↓
❌ No webhook listener in SynapseCRM
    ↓
❌ Change NOT reflected in SynapseCRM
```

### Solution: Add Jira Webhooks

**Implementation Plan:**

1. **Create Webhook Controller** (NEW FILE)

   ```typescript
   // server/src/jira/controllers/jira-webhook.controller.ts
   @Controller('jira/webhooks')
   export class JiraWebhookController {

     @Post('issue-updated')
     async handleIssueUpdate(@Body() webhook: JiraWebhookPayload) {
       // Extract issue key from webhook
       const issueKey = webhook.issue.key;

       // Find ticket by externalId
       const ticket = await this.prisma.ticket.findFirst({
         where: { externalId: issueKey }
       });

       // Update ticket status, comments, etc.
       await this.ticketsService.update(ticket.id, {
         status: this.mapJiraStatus(webhook.issue.fields.status.name),
         // ... other fields
       });
     }
   }
   ```
2. **Configure Webhook in Jira**

   - Go to Jira Settings → System → Webhooks
   - Add URL: `https://your-backend.com/api/jira/webhooks/issue-updated`
   - Events: Issue Updated, Issue Commented, Status Changed
3. **Add Webhook Verification** (security)

   ```typescript
   // Verify webhook signature
   const signature = req.headers['x-hub-signature'];
   const isValid = this.verifyWebhookSignature(body, signature);
   ```

**Effort**: 1 day

### Multi-Customer Jira Accounts

**Current Problem**: Single global Jira config in `.env`

**Solution**: Per-Tenant Jira Configuration

1. **Add Integration Model** (ALREADY EXISTS ✅)

   ```prisma
   model Integration {
     id         String @id @default(uuid())
     tenantId   String
     type       String // "JIRA"
     config     Json   // Store credentials per tenant
     isActive   Boolean
   }
   ```
2. **Update Jira Service**

   ```typescript
   async initialize(tenantId: string) {
     const integration = await this.prisma.integration.findFirst({
       where: { tenantId, type: 'JIRA', isActive: true }
     });

     if (integration) {
       this.axiosInstance = axios.create({
         baseURL: integration.config.baseUrl,
         headers: {
           Authorization: `Basic ${Buffer.from(
             `${integration.config.email}:${integration.config.apiToken}`
           ).toString('base64')}`
         }
       });
     }
   }
   ```
3. **Add Integration Management UI**

   - Page: `Frontend/src/app/(dashboard)/settings/integrations`
   - Allow each customer to add their own Jira credentials

**Effort**: 2 days

---

## 📞 3. VOIP: SWITCH TO LIVEKIT

### Current Implementation (Twilio + Raw WebRTC)

**Files Using Twilio:**

- `server/src/twilio/*` - 4 files, 500+ LOC
- `Frontend/src/components/voip/*` - Complex WebRTC handling

**Problems:**

- ❌ Complex WebRTC peer connection management
- ❌ STUN/TURN server configuration needed
- ❌ NAT traversal issues
- ❌ Manual signaling with Socket.IO

### LiveKit Benefits

| Feature                    | Current (Twilio+WebRTC) | LiveKit             | Impact              |
| -------------------------- | ----------------------- | ------------------- | ------------------- |
| **Setup Complexity** | High (500+ LOC)         | Low (~50 LOC)       | ✅ 90% reduction    |
| **NAT Traversal**    | Manual STUN/TURN        | Built-in            | ✅ Automatic        |
| **Scalability**      | Limited                 | Infinite            | ✅ Production-ready |
| **Recording**        | Manual                  | Built-in            | ✅ 1-click          |
| **Transcription**    | Need separate service   | Built-in (Deepgram) | ✅ Free feature     |
| **Agent Support**    | ❌                      | ✅ AI Voice Agents  | ✅ NEW CAPABILITY   |
| **React SDK**        | ❌ DIY                  | ✅ Official         | ✅ Components ready |
| **Android SDK**      | ⚠️ Complex            | ✅ Official         | ✅ Easy integration |
| **Cost**             | $0.0085/min             | Free (self-hosted)  | ✅ 100% savings     |

### LiveKit Migration Plan

#### 1. Backend Changes

**Remove**: `server/src/twilio/*` (DELETE 4 files)

**Add**: LiveKit Server SDK

```bash
npm install livekit-server-sdk
```

**New File**: `server/src/livekit/livekit.service.ts`

```typescript
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private roomService: RoomServiceClient;
  
  constructor() {
    this.roomService = new RoomServiceClient(
      process.env.LIVEKIT_URL,
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );
  }
  
  // Generate token for user to join room
  async createToken(userId: string, roomName: string) {
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity: userId }
    );
    token.addGrant({ roomJoin: true, room: roomName });
    return token.toJwt();
  }
  
  // Create call room
  async createCallRoom(callId: string) {
    return this.roomService.createRoom({ name: callId });
  }
}
```

**Effort**: 1 day (vs 2 weeks for custom WebRTC)

#### 2. Frontend Changes

**Remove**: Complex WebRTC code in `components/voip/*`

**Add**: LiveKit React Components

```bash
npm install @livekit/components-react livekit-client
```

**New Component**: `components/voip/LiveKitCall.tsx`

```tsx
import { LiveKitRoom, VideoConference } from '@livekit/components-react';

export function LiveKitCall({ token, roomName }) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
```

**Effort**: 0.5 days (pre-built components!)

#### 3. Android Changes

**Add**: LiveKit Android SDK

```kotlin
implementation("io.livekit:livekit-android:2.0.0")
```

**New Screen**: `presentation/voip/CallScreen.kt`

```kotlin
@Composable
fun CallScreen(token: String, roomName: String) {
    val room = remember { Room() }
  
    LaunchedEffect(token) {
        room.connect(
            url = BuildConfig.LIVEKIT_URL,
            token = token
        )
    }
  
    // Use LiveKit Compose components
    LiveKitRoom(room = room) {
        VideoCallView()
    }
}
```

**Effort**: 1 day

### LiveKit Agent Features (AI Voice)

**What You Can Build:**

1. **AI Receptionist** - Answers calls, routes to correct department
2. **Call Summarization** - Auto-generates call notes
3. **Lead Qualification** - AI asks questions, scores leads
4. **Appointment Booking** - Voice-driven calendar integration

**Example: AI Call Assistant**

```python
# server/livekit-agent/main.py (separate Python service)
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.plugins import openai, deepgram, silero

async def entrypoint(ctx: JobContext):
    # Connect to call room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
  
    # Create AI agent
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),  # Voice activity detection
        stt=deepgram.STT(),      # Speech-to-text
        llm=openai.LLM(model="gpt-4"),
        tts=openai.TTS()         # Text-to-speech
    )
  
    # Agent joins call and handles conversation
    assistant.start(ctx.room)
```

**Effort**: 3 days for basic AI agent

### Total LiveKit Migration: **5-6 days** (saves weeks of WebRTC debugging)

---

## 🤖 4. MCP SERVER (MODEL CONTEXT PROTOCOL)

### What is MCP?

**Model Context Protocol** - Allows AI assistants (Claude, ChatGPT, etc.) to interact with your CRM.

### Use Cases for SynapseCRM

1. **AI CRM Assistant**

   - "Find all contacts in New York"
   - "Create a deal for John Doe worth $50k"
   - "Show me open tickets assigned to me"
2. **Natural Language Queries**

   - "What's my revenue forecast this quarter?"
   - "Schedule a call with top 5 leads"
3. **Automated Workflows**

   - "When a ticket is created, notify assigned user via SMS"
   - "If deal value > $10k, create calendar event"

### Implementation Architecture

```
┌─────────────────┐
│   Claude AI     │
│   (or ChatGPT)  │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────────┐
│   MCP Server        │
│   (TypeScript)      │
├─────────────────────┤
│ Tools:              │
│ - get_contacts      │
│ - create_deal       │
│ - search_tickets    │
│ - analyze_pipeline  │
└────────┬────────────┘
         │ HTTP/REST
         ▼
┌─────────────────────┐
│   NestJS Backend    │
│   (Your API)        │
└─────────────────────┘
```

### Implementation Plan

**New Directory**: `server/mcp-server/`

```typescript
// server/mcp-server/src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'synapse-crm',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
    resources: {},
  },
});

// Define CRM tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_contacts',
      description: 'Retrieve contacts from CRM',
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          limit: { type: 'number' }
        }
      }
    },
    {
      name: 'create_ticket',
      description: 'Create a new support ticket',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] }
        },
        required: ['title', 'description']
      }
    },
    // ... more tools
  ]
}));

// Execute tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'get_contacts':
      const response = await fetch('http://localhost:3001/api/contacts', {
        headers: { Authorization: `Bearer ${process.env.API_TOKEN}` }
      });
      return { content: [{ type: 'text', text: JSON.stringify(await response.json()) }] };
  
    case 'create_ticket':
      // ... handle ticket creation
      break;
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Configuration for Claude Desktop**:

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "synapse-crm": {
      "command": "node",
      "args": ["path/to/synapse/server/mcp-server/build/index.js"],
      "env": {
        "API_TOKEN": "your-backend-token"
      }
    }
  }
}
```

**Effort**: 2-3 days

### MCP Tools to Implement

| Tool Name              | Description            | Complexity |
| ---------------------- | ---------------------- | ---------- |
| `get_contacts`       | Search/list contacts   | Easy       |
| `create_contact`     | Add new contact        | Easy       |
| `get_leads`          | Search leads by status | Easy       |
| `convert_lead`       | Convert lead to deal   | Medium     |
| `create_deal`        | Create new deal        | Easy       |
| `get_tickets`        | Search tickets         | Easy       |
| `create_ticket`      | Create support ticket  | Easy       |
| `add_ticket_comment` | Add comment to ticket  | Easy       |
| `analyze_pipeline`   | Get revenue forecast   | Medium     |
| `schedule_call`      | Create call log entry  | Medium     |

---

## 📱 5. ANDROID APP WORK BREAKDOWN

### Current State

- ✅ Data models created (Contact, Lead, Deal, Ticket)
- ✅ API service with Retrofit
- ✅ Repositories created
- ✅ ViewModels (Contact, Ticket)
- ✅ Basic UI screens (ContactsScreen, TicketsScreen, CreateTicketScreen)
- ❌ No authentication
- ❌ Navigation not connected
- ❌ No LiveKit integration

### Work Items with Supabase Auth + LiveKit

#### Phase 1: Authentication (2-3 days)

**Priority: HIGH**

1. **Add Supabase SDK** (0.5 days)

   ```kotlin
   implementation("io.github.jan-tennert.supabase:postgrest-kt:2.0.0")
   implementation("io.github.jan-tennert.supabase:gotrue-kt:2.0.0")
   implementation("io.ktor:ktor-client-android:2.3.0")
   ```
2. **Create Supabase Module** (1 day)

   ```
   data/auth/
   ├── SupabaseClient.kt          // Initialize Supabase
   ├── AuthRepository.kt          // Sign in/up/out methods
   └── TokenInterceptor.kt        // Add JWT to API calls
   ```
3. **Auth Screens** (1 day)

   ```
   presentation/auth/
   ├── SignInScreen.kt            // Email/password form
   ├── SignUpScreen.kt            // Registration form
   ├── ForgotPasswordScreen.kt    // Password reset
   └── AuthViewModel.kt           // Handle auth state
   ```
4. **Update NetworkModule** (0.5 days)

   - Replace AuthInterceptor to use Supabase session token

#### Phase 2: Navigation (1 day)

**Priority: HIGH**

1. **Create NavGraph** (0.5 days)

   ```kotlin
   @Composable
   fun AppNavigation() {
       val navController = rememberNavController()

       NavHost(navController, startDestination = "auth") {
           composable("auth") { SignInScreen() }
           composable("dashboard") { DashboardScreen() }
           composable("contacts") { ContactsScreen() }
           composable("tickets") { TicketsScreen() }
           composable("create_ticket") { CreateTicketScreen() }
           // ... more routes
       }
   }
   ```
2. **Bottom Navigation** (0.5 days)

   - Dashboard, Contacts, Leads, Deals, Tickets tabs

#### Phase 3: Complete CRM Features (3-4 days)

**Priority: MEDIUM**

1. **Dashboard** (1 day)

   - Stats cards
   - Recent contacts widget
   - Quick actions
2. **Leads Module** (1 day)

   - LeadsScreen with Kanban board
   - CreateLeadDialog
   - LeadViewModel
3. **Deals Module** (1 day)

   - DealsScreen with pipeline stages
   - CreateDealDialog
   - DealViewModel
4. **Contact Details** (0.5 days)

   - View/edit contact
   - Call/email buttons
5. **Ticket Details** (0.5 days)

   - View ticket with comments
   - Add comment
   - Change status

#### Phase 4: LiveKit Voice Calls (2 days)

**Priority: MEDIUM**

1. **Add LiveKit SDK** (0.5 days)

   ```kotlin
   implementation("io.livekit:livekit-android:2.0.0")
   implementation("io.livekit:livekit-android-compose:1.0.0")
   ```
2. **Call Screen** (1 day)

   ```kotlin
   @Composable
   fun CallScreen(contactId: String) {
       val room = remember { Room() }
       val viewModel: CallViewModel = hiltViewModel()

       LaunchedEffect(Unit) {
           val token = viewModel.getCallToken(contactId)
           room.connect(url = LIVEKIT_URL, token = token)
       }

       LiveKitRoom(room = room) {
           VideoCallView()
       }
   }
   ```
3. **Call History** (0.5 days)

   - List of past calls
   - Play recordings (if enabled)

#### Phase 5: Offline Support (2 days)

**Priority: LOW**

1. **Room Database** (1 day)

   - Cache contacts, leads, tickets locally
   - Sync when online
2. **Sync Manager** (1 day)

   - WorkManager for background sync
   - Conflict resolution

### Total Android Effort: **10-12 days**

---

## 📊 OVERALL PROJECT TIMELINE

### Recommended Priority Order

1. **✅ Migrate to Supabase Auth** (5-7 days)

   - Blocks Android development
   - Easier to maintain
   - Better mobile support
2. **✅ Add Jira Webhooks** (1 day)

   - Fixes current sync issue
   - Quick win
3. **✅ Complete Android App** (10-12 days)

   - Core business value
   - Uses new auth system
4. **✅ Migrate to LiveKit** (5-6 days)

   - Simplifies VoIP
   - Enables AI agents
5. **✅ Multi-tenant Jira** (2 days)

   - Customer-specific feature
   - Can wait until needed
6. **✅ MCP Server** (2-3 days)

   - Future innovation
   - Not blocking

### Total Estimated Time: **25-31 days** (~5-6 weeks)

### Parallel Work Strategy

**Week 1-2**: Auth Migration

- Backend: Supabase auth module
- Frontend: Replace Clerk
- Android: Supabase SDK

**Week 3-4**: Android Core + Jira Fixes

- Android: CRM features
- Backend: Jira webhooks
- Backend: Multi-tenant Jira

**Week 5-6**: VoIP + AI

- All platforms: LiveKit migration
- Backend: MCP server
- Backend: LiveKit AI agent

---

## 🎯 FINAL RECOMMENDATIONS

### ✅ DO THIS:

1. **Switch to Supabase Auth** - Much better for Android
2. **Add Jira Webhooks** - Fix sync issue immediately
3. **Use LiveKit** - Save weeks of WebRTC pain
4. **Build MCP Server** - Differentiate with AI features

### ⚠️ CONSIDERATIONS:

- **Supabase Auth**: You already use Supabase for DB, makes sense
- **LiveKit**: Can self-host (free) or use cloud ($0.004/min)
- **MCP**: Cutting-edge feature, early adopter advantage

### 📦 DEPENDENCIES TO ADD:

**Backend**:

```bash
npm install @supabase/supabase-js livekit-server-sdk @modelcontextprotocol/sdk
npm uninstall @clerk/backend twilio
```

**Frontend**:

```bash
npm install @supabase/ssr @livekit/components-react livekit-client
npm uninstall @clerk/nextjs
```

**Android**:

```kotlin
// build.gradle.kts
implementation("io.github.jan-tennert.supabase:postgrest-kt:2.0.0")
implementation("io.github.jan-tennert.supabase:gotrue-kt:2.0.0")
implementation("io.livekit:livekit-android:2.0.0")
```

---

## 📋 DETAILED FILE CHANGE LIST

### Files to DELETE (Clerk removal):

- `server/src/clerk/*` (entire directory)
- `Frontend/src/middleware.ts` (Clerk-specific)
- All Clerk imports in 35+ files

### Files to CREATE:

- `server/src/supabase-auth/*` (8 new files)
- `server/src/livekit/*` (3 new files)
- `server/src/jira/controllers/jira-webhook.controller.ts`
- `server/mcp-server/` (entire new project)
- `Frontend/src/lib/supabase.ts`
- `Synapse/app/src/main/java/com/example/synapse/data/auth/*` (5 files)
- `Synapse/app/src/main/java/com/example/synapse/presentation/voip/*` (3 files)

### Files to MODIFY:

- All controllers (9 files) - Replace guard
- `prisma/schema.prisma` - Change clerkId → supabaseUserId
- `Frontend/src/lib/api.ts` - New auth hook
- 12 Frontend pages - Replace Clerk hooks
- `Synapse/app/src/main/java/com/example/synapse/di/NetworkModule.kt`

**Total Changes**: ~80 files (35 modify, 30 create, 15 delete)

---

Ready to start? I recommend beginning with Supabase Auth migration since it blocks Android development. Want me to start creating the Supabase auth module?
