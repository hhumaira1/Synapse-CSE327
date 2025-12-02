# Testing System Prompt with Confirmation Mode

## Test the Updated Behavior

After updating the system prompt, test with Gemini CLI:

### Test 1: Login
```
You: Login as admin@example.com password test123

Expected:
Gemini: I'll log you in as admin@example.com. Should I proceed?

You: yes

Expected:
Gemini: [executes login tool]
✅ Logged in as admin@example.com
Role: ADMIN
```

### Test 2: List Contacts
```
You: Show me all contacts

Expected:
Gemini: I'll retrieve your contacts list. Should I proceed?

You: yes

Expected:
Gemini: [executes contacts_list tool]
Here are your contacts...
```

### Test 3: Create Contact
```
You: Create a contact named Jane Smith with email jane@example.com

Expected:
Gemini: I'll create a new contact with:
- Name: Jane Smith
- Email: jane@example.com
Should I proceed?

You: yes

Expected:
Gemini: [executes contacts_create tool]
✅ Contact created successfully!
```

### Test 4: Delete (Should Show Warning)
```
You: Delete contact ABC123

Expected:
Gemini: ⚠️ I'll delete contact ABC123. This is permanent. Are you sure you want to proceed?

You: yes

Expected:
Gemini: [executes contacts_delete tool]
Contact deleted.
```

### Test 5: Say No
```
You: Show all deals

Expected:
Gemini: I'll retrieve your deals list. Should I proceed?

You: no

Expected:
Gemini: Okay, I won't retrieve the deals. Let me know if you need anything else!
```

---

## Important Notes

### For Gemini CLI:
The system prompt **may not be fully enforced** in Gemini CLI because it uses MCP directly. The CLI client controls tool execution autonomously.

**Solution:** You may need to tell Gemini CLI at session start:
```
> Important: Before executing any tool, always ask me "Should I proceed?" and wait for my confirmation.
```

### For Web/Android/Telegram Chatbots:
The system prompt **WILL be enforced** because these use the Gemini API with `system_instruction` parameter. They will automatically ask for confirmation.

---

## If Gemini CLI Still Auto-Executes

If Gemini CLI continues to auto-execute despite the system prompt:

1. **Start each session with:**
```
> Rules: Always ask "Should I proceed?" before executing any tool. Never auto-execute.
```

2. **Or use the Web chatbot** which will strictly follow the system prompt

3. **Or build a custom CLI client** that enforces confirmation

---

## Universal Behavior

This confirmation mode will work **universally** across:
- ✅ Web chatbot (uses Gemini API with system prompt)
- ✅ Android chatbot (uses Gemini API with system prompt)
- ✅ Telegram bot (uses Gemini API with system prompt)
- ⚠️ Gemini CLI (may need session-level instruction)

The system prompt is now configured to prevent auto-execution!
