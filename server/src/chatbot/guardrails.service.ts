import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GuardrailsService {
  private readonly logger = new Logger(GuardrailsService.name);

  // CRM-related keywords that indicate valid queries
  private readonly CRM_KEYWORDS = [
    'contact',
    'contacts',
    'customer',
    'customers',
    'client',
    'clients',
    'deal',
    'deals',
    'opportunity',
    'opportunities',
    'sales',
    'pipeline',
    'lead',
    'leads',
    'prospect',
    'prospects',
    'ticket',
    'tickets',
    'tikect', // Common typo
    'support',
    'issue',
    'issues',
    'tenant',
    'tenants',
    'workspace',
    'workspaces',
    'analytics',
    'dashboard',
    'report',
    'reports',
    'forecast',
    'revenue',
    'email',
    'phone',
    'company',
    'organization',
    'create',
    'update',
    'delete',
    'list',
    'show',
    'get',
    'find',
    'search',
    'my',
    'all',
    'how many',
    'count',
    'total',
    // Conversational confirmations and follow-ups
    'yes',
    'no',
    'okay',
    'ok',
    'sure',
    'go on',
    'go ahead',
    'continue',
    'proceed',
    'confirm',
    'confirmed',
    'correct',
    'right',
    'exactly',
    'that',
    'it',
    'them',
    'those',
    'this',
    'these',
    'earlier',
    'before',
    'told',
    'mentioned',
    'said',
  ];

  // Patterns that should be blocked
  private readonly BLOCKED_PATTERNS = [
    'weather',
    'news',
    'joke',
    'recipe',
    'movie',
    'music',
    'song',
    'write code',
    'debug code',
    'programming tutorial',
    'math problem',
    'solve equation',
    'translate to',
    'wikipedia',
    'stock price',
    'cryptocurrency',
    'bitcoin',
    'sports score',
    'game result',
    'how to cook',
    'how to fix my car',
  ];

  /**
   * Validate if the user query is CRM-related
   * @param message User's message
   * @returns {isValid: boolean, reason?: string}
   */
  validateQuery(message: string): { isValid: boolean; reason?: string } {
    const messageLower = message.toLowerCase().trim();

    // Allow very short messages (3-20 chars) - likely conversational responses like "yes", "go on", "okay"
    if (messageLower.length >= 2 && messageLower.length <= 20) {
      return { isValid: true };
    }

    // Check for blocked patterns first
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (messageLower.includes(pattern)) {
        this.logger.warn(`Blocked query with pattern: ${pattern}`);
        return {
          isValid: false,
          reason: `I'm specialized in CRM operations only. I cannot help with ${pattern}-related queries. Please ask about contacts, deals, leads, tickets, or analytics.`,
        };
      }
    }

    // Check for CRM keywords
    const hasCrmKeyword = this.CRM_KEYWORDS.some((keyword) =>
      messageLower.includes(keyword),
    );

    if (hasCrmKeyword) {
      return { isValid: true };
    }

    // If no CRM keywords found, be cautious
    this.logger.warn(`Query lacks CRM keywords: ${message.substring(0, 50)}`);
    return {
      isValid: false,
      reason:
        '⚠️ I specialize in CRM operations like managing contacts, deals, leads, tickets, and viewing analytics. Could you rephrase your question to focus on these areas?',
    };
  }

  /**
   * Get system prompt for Gemini AI
   */
  getSystemPrompt(): string {
    return `You are SynapseCRM AI Assistant with FULL CONVERSATIONAL MEMORY. You remember EVERYTHING from the conversation history.

**CRITICAL: Context Awareness Rules**
1. **Always read the conversation history** before responding
2. **Remember names, entities, and details** mentioned in previous messages
3. **Handle pronouns intelligently**: "it", "that", "them", "the contact" refer to entities in history
4. **Complete partial requests** by combining current message with previous context
5. **Track ongoing multi-step operations** (e.g., collecting ticket details across messages)

**IMPORTANT: Working with Contact References**
When a user mentions a contact by NAME (e.g., "create ticket for humairah nishu"):
1. **Search conversation history** for recent contact lists that included this name
2. If found, extract the **contactId** from that previous message
3. If NOT in history, **call contacts_list FIRST** to search for the contact
4. Extract the contactId from search results
5. THEN call tickets_create with the contactId

**Example: Creating Ticket with Contact Name**
User: "show me all the contacts"
You: [Call contacts_list] "Found: humairah nishu (ID: abc123), Iftikher Azam (ID: xyz789)..."
User: "create a ticket for humairah nishu about calling issue, urgent"
You: [Remember contactId 'abc123' from previous message] [Call tickets_create with contactId: 'abc123']

**Example: Name Not in History**
User: "create a ticket for john doe about network issue"
You: [No john doe in history → Call contacts_list to search]
[If found: extract ID, call tickets_create]
[If not found: "I couldn't find a contact named 'john doe'. Would you like to create this contact first?"]

**Example Conversation Flow:**
User: "show my deals"
You: [Use deals_list] "Found 1 deal: 'murgi deal' for Iftikher Azam at ckash, worth $10,000"
User: "create a ticket for that contact about calling"
You: [Remember "Iftikher Azam" from previous response → search for contactId in history or call contacts_list]

User: "create a ticket for humairah nishu"
You: "What's the issue, description, and priority?"
User: "calling issue, medium priority"
You: [Remember name from 2 messages ago → get contactId → use tickets_create]

**Your CRM Capabilities:**
- Contacts: create (name/email/phone), list, search, update, delete
- Deals: create, update, move stages, list, track revenue
- Leads: create, qualify, convert to deals, list
- Tickets: create, update status/priority, add comments, list
- Analytics: dashboard stats, revenue forecast, win rates

**Natural Language Guidelines:**
✅ "I'll search for that contact first, then create the ticket" (transparent workflow)
✅ "Found humairah nishu in your contacts. Creating urgent ticket for calling issue."
✅ "I remember you mentioned Iftikher Azam earlier - creating ticket for him"
❌ "I need contact ID" (too technical - search for it automatically)
❌ Forgetting details mentioned 2-3 messages ago
❌ Asking for contactId when user gave you a name

**Your Restrictions:**
- ONLY CRM operations. Politely decline: weather, jokes, code, general knowledge, harmful content
- Always confirm destructive actions (delete)
- Provide natural language summaries

**Available Tools:** contacts_list, contacts_create, deals_list, deals_create, leads_list, leads_create, leads_convert, tickets_list, tickets_create, analytics_dashboard

BE CONVERSATIONAL. REMEMBER EVERYTHING. USE CONTEXT. SEARCH FOR CONTACT IDs AUTOMATICALLY.`;
  }

  /**
   * Sanitize user input to prevent injection attacks
   */
  sanitizeInput(message: string): string {
    // Remove potential SQL injection patterns
    let sanitized = message.replace(/['";\\]/g, '');

    // Limit length
    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 1000);
    }

    return sanitized.trim();
  }
}
