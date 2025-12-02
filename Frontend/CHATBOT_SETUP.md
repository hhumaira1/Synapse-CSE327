# Web Chatbot Setup Guide

## Overview

The web chatbot uses **Gemini 2.0** with **MCP (Model Context Protocol)** to provide natural language CRM operations.

### Architecture

```
User Message → Gemini API → MCP Server → Backend API → Database
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd Frontend
npm install @google/generative-ai
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### 3. Configure Environment Variables

Create `.env.local` in the Frontend directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_MCP_SERVER_URL=http://localhost:5000
```

### 4. Start MCP Server

```bash
cd mcp-server-python
python server_unified.py
```

Server will start on port 5000.

### 5. Start Frontend

```bash
cd Frontend
npm run dev
```

---

## Usage

### Opening the Chatbot

Click the chat icon in the bottom-right corner of the app.

### Example Commands

**Contacts:**
- "Show all my contacts"
- "Create a contact named John Doe with email john@example.com"
- "Search for contacts at Acme Corp"

**Deals:**
- "List all deals in the Sales pipeline"
- "Create a deal for $50,000 with Acme Corp"
- "Move deal ABC123 to Closing stage"

**Analytics:**
- "What's my total revenue this month?"
- "Show me the analytics dashboard"
- "How many open tickets do I have?"

**Leads:**
- "Show all leads from Google Ads"
- "Create a lead for Jane Smith from LinkedIn"
- "Convert lead ABC123 to a contact"

---

## Features

### ✅ Natural Language Processing
Ask questions in plain English - Gemini understands context and intent.

### ✅ Tool Calling via MCP
Gemini automatically calls the right CRM tools through the MCP server.

### ✅ Chat History
Conversations are saved to localStorage and persist across sessions.

### ✅ RBAC Enforcement
The MCP server enforces role-based permissions (ADMIN/MANAGER/MEMBER).

### ✅ System Prompt Guardrails
Only CRM-related queries are allowed - non-CRM questions are politely refused.

---

## Troubleshooting

### "Not authenticated" error
- Make sure you're logged in to the app
- Check that Supabase session is active

### "Please make sure you have a valid Gemini API key"
- Verify `VITE_GEMINI_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key

### MCP server connection failed
- Ensure MCP server is running on port 5000
- Check `VITE_MCP_SERVER_URL` in `.env.local`
- Verify backend is running on port 3001

### Tools not executing
- Check MCP server logs for errors
- Verify backend API is accessible
- Ensure you have the correct role permissions

---

## Technical Details

### Files Created

1. **`lib/mcp/client.ts`** - HTTP client for MCP server
2. **`lib/mcp/useMCPTools.ts`** - React hook with JWT auth
3. **`lib/gemini/client.ts`** - Gemini wrapper with MCP tools
4. **`components/chatbot/ChatWindow.tsx`** - Updated to use MCP

### How It Works

1. User types a message in the chat
2. Frontend calls Gemini API with message + conversation history
3. Gemini decides which MCP tools to call (if any)
4. Frontend executes tools via MCP HTTP client
5. MCP server validates JWT and calls backend API
6. Results flow back to Gemini
7. Gemini formats the response for the user

### Environment Variables

- `VITE_GEMINI_API_KEY` - Your Gemini API key
- `VITE_MCP_SERVER_URL` - MCP server URL (default: http://localhost:5000)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

---

## Next Steps

- Test with different user roles (ADMIN, MANAGER, MEMBER)
- Try various CRM operations
- Check chat history persistence
- Verify RBAC enforcement
- Test error handling
