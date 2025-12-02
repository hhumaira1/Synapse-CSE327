# Phase 2 Context Management - Testing Guide

## ✅ Implementation Status
**Backend Status**: ✅ Running on port 3001  
**Database**: ✅ Conversation.metadata field added  
**Context Service**: ✅ ContextManagerService fully implemented  
**Integration**: ✅ All tool cases updated to store context

---

## 🧪 Quick Test Scenarios

### Test 1: Contact Search → Lead Creation (Pronoun Reference)
This tests if the chatbot remembers a contact from a search and uses it in a follow-up query.

```
Query 1: "Find NBM sir"
Expected: Chatbot searches contacts, stores "NBM sir" in context as lastEntity

Query 2: "Create a lead with him worth $1000"
Expected: Chatbot retrieves NBM sir from context.lastEntity, creates lead
```

**What's happening behind the scenes**:
1. `contacts_search` executes → Stores results in `context.lastSearchResults`
2. Top result stored as `context.lastEntity` with 30-minute TTL
3. Context saved to `conversation.metadata` in database
4. Next message loads context from metadata
5. `leads_create` uses `context.lastEntity.id` for contactId

---

### Test 2: List Contacts → Create Deal (Ordinal Reference)
This tests if the chatbot remembers list results and can reference them by position.

```
Query 1: "Show me all contacts"
Expected: Lists all contacts, stores array in context.lastSearchResults

Query 2: "Create a deal with the first one for $5000"
Expected: Retrieves contact at index 0, creates deal
```

**What's happening behind the scenes**:
1. `contacts_list` executes → Stores all results in `context.lastSearchResults`
2. `extractEntityReferencesFromText()` detects "first one" → ordinalIndex = 0
3. `getEntityByIndex(0)` retrieves contact from `context.lastSearchResults.results[0]`
4. `deals_create` uses retrieved contact ID

---

### Test 3: Multi-Turn Workflow (Context Persistence)
This tests if context persists across multiple messages.

```
Query 1: "Find Iftikher Azam"
Expected: Searches and stores contact

Query 2: "What's his email?"
Expected: Uses context to show email (if implemented in future)

Query 3: "Create a ticket for Iftikher about software bug"
Expected: Uses cached contact from Query 1 (fuzzy match on "Iftikher")
```

**What's happening behind the scenes**:
1. Query 1: Contact stored in `context.contacts['iftikher azam']` with TTL
2. Query 3: `getContactFromContext('Iftikher')` fuzzy matches cached entry
3. Ticket created using cached contact ID (no new search needed)

---

### Test 4: Context Expiration (TTL Validation)
This tests if expired context is properly cleaned up.

```
Query 1: "Show me leads"
Expected: Lists leads, stores in context with 30-minute TTL

[Wait 31 minutes]

Query 2: "Show me the first lead"
Expected: "No recent search results found" (context expired)
```

**What's happening behind the scenes**:
1. `cleanExpiredContext()` runs on every request
2. Checks `lastSearchResults.timestamp` age
3. If age > 30 minutes, removes from context
4. `getEntityByIndex()` returns null (expired)

---

## 🔍 Debugging Tools

### Check Context in Database
```bash
cd server
npx prisma studio
# Navigate to: Conversations → Select any conversation → Check 'metadata' column
```

**Expected metadata structure**:
```json
{
  "contacts": {
    "nbm sir": {
      "id": "cm4lrqc7d0001...",
      "name": "NBM sir",
      "email": "nbm@example.com",
      "lastAccessedAt": "2025-12-03T02:00:00.000Z"
    }
  },
  "lastSearchResults": {
    "entityType": "contact",
    "results": [
      { "id": "cm4lrqc7d0001...", "name": "NBM sir", "score": 95.2 }
    ],
    "query": "NBM sir",
    "timestamp": "2025-12-03T02:00:00.000Z"
  },
  "lastEntity": {
    "type": "contact",
    "id": "cm4lrqc7d0001...",
    "name": "NBM sir",
    "timestamp": "2025-12-03T02:00:00.000Z"
  }
}
```

### Check Backend Logs
Watch for context-related log messages:
```bash
# Look for these debug logs:
"Detected pronoun reference in user message"
"Detected ordinal reference: index 0"
"Stored contact in context: NBM sir (cm4lrqc7d0001...)"
"Stored search results: 3 contact(s) for query 'John'"
```

### Test Context Manager Methods (Unit Test)
```typescript
// server/src/chatbot/context-manager.service.spec.ts
it('should store and retrieve contact from context', () => {
  const context = contextManager.createEmptyContext();
  contextManager.storeContact(context, {
    id: 'test-id',
    name: 'John Smith',
    email: 'john@example.com',
  });
  
  const retrieved = contextManager.getContactFromContext(context, 'john');
  expect(retrieved.id).toBe('test-id');
});
```

---

## 🚨 Known Issues to Watch For

### Issue 1: MCP Server Not Passing Context
**Symptom**: Context works for Telegram (direct calls) but not for Web chatbot (MCP calls)  
**Cause**: MCP HTTP calls don't pass context parameter  
**Fix**: Update `mcp-client.service.ts` to accept and return context in tool responses

### Issue 2: Pronoun Ambiguity
**Symptom**: "it" refers to wrong entity when multiple recent interactions  
**Cause**: `lastEntity` is overwritten on every tool call  
**Mitigation**: Last entity is always most recent (by design)

### Issue 3: No Cross-Conversation Context
**Symptom**: Context lost when switching conversations  
**Cause**: Context is conversation-scoped (stored in `conversation.metadata`)  
**By Design**: Privacy/isolation requirement

---

## 📊 Success Metrics

After testing, verify:
- ✅ Contact search → Lead creation works without repeating contact name
- ✅ List results → "the first one" reference resolves correctly
- ✅ Context persists across page refresh (stored in DB)
- ✅ Expired context (>30 min) is cleaned automatically
- ✅ No errors in backend logs during context operations

---

## 🎯 Next Phase: Smart Entity Resolution (Phase 3)

Once testing confirms Phase 2 works, implement:
1. **Auto-use contacts with 90%+ confidence**
   - No confirmation needed for high-confidence matches
   - Example: "Create deal with Jon" → Auto-uses "John Smith" (95% match)

2. **"Did you mean?" prompts for 70-89% matches**
   - Show top 3 matches with confirmation buttons
   - Example: "Create ticket for Jon" → "Did you mean: John Smith, Jon Doe, or John Lee?"

3. **Learning from corrections**
   - Track user selections when multiple matches shown
   - Increase fuzzy match scores for confirmed pairs
   - Example: User always picks "John Smith" for "Jon" → Next time auto-use

---

## 🔗 Related Documentation
- Implementation: `PHASE2_CONTEXT_MANAGEMENT_COMPLETE.md`
- Roadmap: `CHATBOT_ENHANCEMENT_PLAN.md` (original plan)
- Code: `server/src/chatbot/context-manager.service.ts`
- Integration: `server/src/chatbot/chatbot.service.ts` (lines 100-110, 216-218, 415-590)

---

**Ready for Testing!** Start with Test 1 above to verify basic context management works.
