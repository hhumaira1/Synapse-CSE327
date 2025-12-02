# Chat Storage Implementation - Complete Guide

## ✅ Chat Storage Status: FULLY IMPLEMENTED

The SynapseCRM chatbot now **properly stores all conversations and messages** to the PostgreSQL database via the backend API.

## Architecture Flow

```
User sends message
    ↓
Frontend ChatWindow
    ↓
POST /api/chatbot/chat (Backend)
    ↓
ChatbotService (NestJS)
    ├─ Validates with guardrails
    ├─ Gets/Creates Conversation in DB
    ├─ Saves user Message to DB
    ├─ Calls Gemini AI (uses MCP tools)
    ├─ Saves assistant Message to DB
    └─ Returns response with conversationId
    ↓
Frontend updates UI
    ↓
localStorage caches messages
```

## Database Schema

### Conversation Table
```prisma
model Conversation {
  id        String    @id @default(cuid())
  userId    String    // User who owns this conversation
  tenantId  String    // Multi-tenant isolation
  title     String?   // Auto-generated from first message
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  tenant    Tenant    @relation(...)
  user      User      @relation(...)
  messages  Message[] // One-to-many relationship
  
  @@index([userId])
  @@index([tenantId])
  @@index([updatedAt])
}
```

### Message Table
```prisma
model Message {
  id             String       @id @default(cuid())
  conversationId String       // Links to conversation
  role           String       // "user" or "assistant"
  content        String       // The actual message text
  createdAt      DateTime     @default(now())
  
  conversation   Conversation @relation(...)
  
  @@index([conversationId])
  @@index([createdAt])
}
```

## Backend Implementation

### ChatbotService (`server/src/chatbot/chatbot.service.ts`)

#### 1. Main Chat Handler
```typescript
async chat(chatDto: ChatMessageDto, userId: string, tenantId: string) {
  // Get or create conversation
  if (conversationId) {
    conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
  } else {
    conversation = await prisma.conversation.create({
      data: { userId, tenantId, title: message.substring(0, 50) }
    });
  }
  
  // Save user message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content: sanitizedMessage
    }
  });
  
  // Get AI response (Gemini + MCP tools)
  const response = await geminiService.chat(message, history);
  
  // Save assistant response
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: response
    }
  });
  
  return {
    response,
    conversationId: conversation.id,
    timestamp: new Date()
  };
}
```

#### 2. List Conversations
```typescript
async listConversations(userId: string) {
  return await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1 // Last message preview
      }
    }
  });
}
```

#### 3. Get Conversation History
```typescript
async getConversationHistory(conversationId: string, userId: string) {
  return await prisma.conversation.findUnique({
    where: { id: conversationId, userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } }
    }
  });
}
```

#### 4. Delete Conversation
```typescript
async deleteConversation(conversationId: string, userId: string) {
  // Verify ownership
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, userId }
  });
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  // Delete (messages cascade deleted automatically)
  await prisma.conversation.delete({
    where: { id: conversationId }
  });
}
```

### API Endpoints (`server/src/chatbot/chatbot.controller.ts`)

```typescript
@Controller('chatbot')
@UseGuards(SupabaseAuthGuard)
export class ChatbotController {
  
  // Send message and get response
  @Post('chat')
  async chat(@Body() chatDto: ChatMessageDto, @CurrentUser() user) {
    return await chatbotService.chat(chatDto, user.id, user.tenantId);
  }
  
  // List all conversations
  @Get('conversations')
  async listConversations(@CurrentUser() user) {
    return await chatbotService.listConversations(user.id);
  }
  
  // Get specific conversation with messages
  @Get('conversations/:id')
  async getConversation(@Param('id') id: string, @CurrentUser() user) {
    return await chatbotService.getConversationHistory(id, user.id);
  }
  
  // Delete conversation
  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: string, @CurrentUser() user) {
    return await chatbotService.deleteConversation(id, user.id);
  }
}
```

## Frontend Implementation

### ChatWindow Component (Updated)

#### 1. Send Message
```typescript
const handleSend = async (message: string) => {
  // Get JWT token
  const { data: { session } } = await supabase.auth.getSession();
  
  // Call backend API (stores to database)
  const response = await fetch('http://localhost:3001/api/chatbot/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      message,
      conversationId: conversationId || undefined
    })
  });
  
  const data = await response.json();
  
  // Update conversation ID for new chats
  if (data.conversationId) {
    setConversationId(data.conversationId);
  }
  
  // Display assistant response
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: data.response,
    timestamp: new Date(data.timestamp)
  }]);
};
```

#### 2. Load Conversation
```typescript
const handleSelectConversation = async (id: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    `http://localhost:3001/api/chatbot/conversations/${id}`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    }
  );
  
  const data = await response.json();
  setConversationId(id);
  setMessages(data.messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.createdAt)
  })));
};
```

### ChatSidebar Component

Loads conversation list from backend:

```typescript
const loadConversations = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    'http://localhost:3001/api/chatbot/conversations',
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    }
  );
  
  const data = await response.json();
  setConversations(data);
};
```

## Storage Strategy

### Database (PostgreSQL)
- **Primary storage** - All conversations and messages
- **Multi-tenant** - Isolated by `tenantId`
- **User-scoped** - Each user only sees their own conversations
- **Persistent** - Data survives browser/app restarts
- **Searchable** - Indexed for fast queries

### LocalStorage (Browser)
- **Secondary cache** - Only for current active conversation
- **Quick restore** - Preserves UI state on page refresh
- **Temporary** - Cleared when starting new chat
- **Not authoritative** - Backend is source of truth

## Key Features

✅ **Persistent Storage** - All chats saved to database
✅ **Conversation Management** - Create, list, load, delete
✅ **Message History** - Complete context preserved
✅ **Multi-Tenant Isolation** - Data separation by workspace
✅ **Auto-Title Generation** - First message becomes title
✅ **Cascade Delete** - Deleting conversation removes all messages
✅ **JWT Authentication** - Secure API access
✅ **Timestamp Tracking** - `createdAt` and `updatedAt` on conversations

## Testing Chat Storage

### 1. Start New Conversation
```
1. Open chatbot
2. Send: "Show all my contacts"
3. Check database: Should see new Conversation + 2 Messages (user + assistant)
```

### 2. Continue Conversation
```
1. Send another message in same chat
2. Check database: Should see new Messages with same conversationId
```

### 3. Load Past Conversation
```
1. Click conversation in sidebar
2. Should see all previous messages loaded from database
```

### 4. Delete Conversation
```
1. Click delete icon on conversation
2. Check database: Conversation + all Messages should be deleted
```

## Database Queries (For Verification)

### Check All Conversations
```sql
SELECT 
  c.id, 
  c.title, 
  c."userId", 
  c."createdAt",
  COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON m."conversationId" = c.id
GROUP BY c.id
ORDER BY c."updatedAt" DESC;
```

### Check Messages in Conversation
```sql
SELECT 
  role,
  LEFT(content, 50) as content_preview,
  "createdAt"
FROM messages
WHERE "conversationId" = 'YOUR_CONVERSATION_ID'
ORDER BY "createdAt" ASC;
```

### Check User's Conversations
```sql
SELECT 
  c.id,
  c.title,
  c."createdAt",
  COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON m."conversationId" = c.id
WHERE c."userId" = 'YOUR_USER_ID'
GROUP BY c.id
ORDER BY c."updatedAt" DESC;
```

## Data Flow Example

**User**: "Show all my contacts"

1. Frontend sends to backend:
   ```json
   {
     "message": "Show all my contacts",
     "conversationId": null
   }
   ```

2. Backend creates conversation:
   ```sql
   INSERT INTO conversations (id, userId, tenantId, title)
   VALUES ('conv_123', 'user_456', 'tenant_789', 'Show all my contacts');
   ```

3. Backend saves user message:
   ```sql
   INSERT INTO messages (id, conversationId, role, content)
   VALUES ('msg_001', 'conv_123', 'user', 'Show all my contacts');
   ```

4. Backend calls Gemini → MCP → Backend API → Gets contacts

5. Backend saves assistant response:
   ```sql
   INSERT INTO messages (id, conversationId, role, content)
   VALUES ('msg_002', 'conv_123', 'assistant', '📇 Found 5 contacts...');
   ```

6. Backend returns:
   ```json
   {
     "response": "📇 Found 5 contacts: John Doe, Jane Smith...",
     "conversationId": "conv_123",
     "timestamp": "2025-12-03T10:30:00Z"
   }
   ```

7. Frontend displays response and saves `conversationId`

8. Next message uses same `conversationId` to continue conversation

## Benefits

1. **Persistent** - Chats survive app restarts
2. **Searchable** - Can add full-text search later
3. **Analytics** - Track conversation patterns, popular queries
4. **Multi-Device** - Access same conversations from web, mobile, desktop
5. **Audit Trail** - Complete history of all interactions
6. **Context Preservation** - Gemini gets full conversation history
7. **Data Backup** - Database backups protect all chat data

## Next Steps

- [ ] Add conversation search/filter
- [ ] Implement conversation title editing
- [ ] Add conversation sharing (if needed)
- [ ] Export conversations to PDF/CSV
- [ ] Add conversation analytics dashboard
- [ ] Implement conversation archiving

---

**Status**: ✅ Chat storage fully implemented and working
**Date**: December 3, 2025
