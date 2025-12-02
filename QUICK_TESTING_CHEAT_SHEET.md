# 🧪 Quick Testing Cheat Sheet

**Use these prompts to test your chatbot in 5 minutes!**

---

## ✅ Essential Tests (10 prompts)

```
1. "Show me all contacts"
   → Should list contacts with emojis 📋

2. "Create a contact named John Smith with email john@test.com"
   → Should show success message ✅

3. "Find John"
   → Should show search results with match scores (95%, 87%, etc.)

4. "Create a $5000 lead for John Smith"
   → Should create lead and show formatted response 💰

5. "Show me all leads"
   → Should list leads with values and statuses 💼

6. "Convert the first lead to a deal"
   → Should convert and show deal details

7. "Show me all deals"
   → Should list deals with pipeline stages 💰

8. "Create a ticket: Login broken, HIGH priority, for John Smith"
   → Should create ticket with priority indicator 🎫

9. "Show analytics dashboard"
   → Should display formatted metrics 📊

10. "Update John Smith's email to john.new@test.com"
    → Should confirm update ✅
```

---

## 🔄 Context Testing (Multi-turn)

```
Step 1: "Find NBM sir"
Step 2: "Create a $1000 lead with him"
Step 3: "Convert that lead to a deal"
Step 4: "Move it to Negotiation stage"
```

**Expected**: Chatbot remembers "him" = NBM sir, "that lead" = created lead, "it" = converted deal

---

## ❌ Guardrails Testing (Should BLOCK)

```
"What's the weather?"          → ⚠️ Blocked
"Tell me a joke"               → ⚠️ Blocked  
"Calculate 25 * 34"            → ⚠️ Blocked
"Who won the Oscar?"           → ⚠️ Blocked
```

**Expected**: Polite message redirecting to CRM operations

---

## 🔒 RBAC Testing

**As MEMBER**:
```
"Show me all contacts"     → ✅ Works
"Create a lead"            → ✅ Works
"Delete contact #cm123"    → ❌ "Permission denied. Admin access required."
```

**As ADMIN**:
```
"Delete contact #cm123"    → ✅ Works
"Remove deal #deal456"     → ✅ Works
```

---

## 📋 Expected Output Examples

### Contact List
```markdown
### 📋 Contacts (3)

**1. John Smith**
   📧 john@test.com • 📱 +1234567890

**2. Jane Doe**
   📧 jane@example.com
```

### Search Results
```markdown
### 🔍 Search Results for "John"

**1. John Smith** (95% match)
   📧 john@test.com

**2. Johnny Doe** (78% match)
   📧 johnny@example.com
```

### Success Message
```markdown
✅ Contact created successfully!

**John Smith**
📧 john@test.com
📱 +1234567890
```

---

## 🚀 Quick Start Commands

### Start All Services
```powershell
# Terminal 1: Backend
cd server
npm run start:dev

# Terminal 2: MCP Server (Optional - for web chatbot)
cd mcp-server-python
python server_streamlined.py

# Terminal 3: Frontend
cd Frontend
npm run dev
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- MCP Server: http://localhost:5000

---

## ✅ Success Checklist

- [ ] All CRUD operations work (create, read, update, delete)
- [ ] Context persists across messages ("him", "that", "the first one")
- [ ] Responses show emojis and markdown formatting
- [ ] Search returns match scores
- [ ] Lists paginate at 10 items
- [ ] Non-CRM queries are blocked
- [ ] Admin operations require admin role
- [ ] Response time < 3 seconds

---

## 🐛 Common Issues

**Issue**: "Tool execution failed"
**Fix**: Check backend is running on port 3001

**Issue**: No emojis displaying
**Fix**: Ensure frontend uses emoji-compatible font

**Issue**: "Permission denied" for all operations
**Fix**: Login with correct credentials, check user role

**Issue**: Context not working
**Fix**: Ensure conversation.metadata field exists in DB

---

## 📞 Support

- Full Testing Guide: `CHATBOT_REVIEW_AND_TESTING.md`
- Implementation Docs: `server/RESPONSE_FORMATTING_COMPLETE.md`
- Phase 2 Context: `server/PHASE2_CONTEXT_MANAGEMENT_COMPLETE.md`
- Enhancement Plan: `CHATBOT_ENHANCEMENT_PLAN.md`

**Test these 10 prompts and you're good to go!** ✅
