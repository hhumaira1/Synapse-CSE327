import { Injectable, Logger } from '@nestjs/common';

/**
 * Enhanced Guardrails Service with intent-based validation
 * Replaces regex patterns with semantic understanding
 */
@Injectable()
export class GuardrailsEnhancedService {
  private readonly logger = new Logger(GuardrailsEnhancedService.name);

  // CRM-related intents and their keywords
  private readonly crmIntents = {
    contacts: ['contact', 'customer', 'person', 'people', 'client'],
    deals: ['deal', 'opportunity', 'sale', 'pipeline', 'stage'],
    leads: ['lead', 'prospect', 'potential', 'qualify'],
    tickets: ['ticket', 'issue', 'problem', 'support', 'help', 'bug'],
    analytics: ['analytics', 'report', 'dashboard', 'stats', 'forecast', 'revenue', 'metrics'],
    actions: ['create', 'add', 'update', 'edit', 'delete', 'remove', 'show', 'list', 'find', 'search', 'get'],
    conversational: ['yes', 'no', 'okay', 'ok', 'sure', 'please', 'thanks', 'thank you', 'hi', 'hello', 'hey'],
  };

  // Non-CRM topics to block
  private readonly blockedIntents = {
    general_knowledge: ['who is', 'what is', 'when was', 'where is', 'why is', 'how to', 'explain', 'define'],
    coding: ['write code', 'debug', 'program', 'function', 'algorithm', 'syntax'],
    entertainment: ['movie', 'song', 'game', 'celebrity', 'music', 'film'],
    personal_advice: ['should i', 'what should', 'advice on', 'recommend me'],
  };

  /**
   * Validate if query is CRM-related using intent detection
   * Simplified: Let the AI handle scope via system prompt
   */
  validateQuery(query: string): {
    isValid: boolean;
    reason?: string;
    confidence: number;
  } {
    const normalizedQuery = query.toLowerCase().trim();

    // Only block obviously malicious content
    const maliciousPatterns = [
      '<script',
      'javascript:',
      'onerror=',
      'onclick=',
      'eval(',
      'exec(',
    ];

    if (
      maliciousPatterns.some((pattern) => normalizedQuery.includes(pattern))
    ) {
      return {
        isValid: false,
        reason: 'Invalid input detected.',
        confidence: 100,
      };
    }

    // Allow everything else - let the AI's system prompt handle scope
    return { isValid: true, confidence: 100 };
  }

  /**
   * Calculate intent score based on keyword matching
   * Returns percentage of categories that have at least one match
   */
  private calculateIntentScore(query: string, intents: Record<string, string[]>): number {
    let categoriesMatched = 0;
    const totalCategories = Object.keys(intents).length;

    for (const category in intents) {
      const keywords = intents[category];
      const hasMatch = keywords.some((keyword) => query.includes(keyword));
      if (hasMatch) {
        categoriesMatched++;
      }
    }

    return categoriesMatched / Math.max(totalCategories, 1);
  }

  /**
   * Calculate blocked intent score
   * Returns percentage of blocked categories that have at least one match
   */
  private calculateBlockedScore(query: string, blockedIntents: Record<string, string[]>): number {
    let categoriesMatched = 0;
    const totalCategories = Object.keys(blockedIntents).length;

    for (const category in blockedIntents) {
      const phrases = blockedIntents[category];
      const hasMatch = phrases.some((phrase) => query.includes(phrase));
      if (hasMatch) {
        categoriesMatched++;
      }
    }

    return categoriesMatched / Math.max(totalCategories, 1);
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Get enhanced system prompt with strict CRM scope enforcement
   */
  getSystemPrompt(): string {
    return `You are SynapseCRM AI Assistant - an intelligent CRM chatbot that helps users manage their customer relationships efficiently.

**🎯 YOUR EXPERTISE: CRM Data & Operations**

You have access to tools for:
1. **Contacts** - View, search, create, update, delete customer contacts
2. **Deals** - Track sales pipeline, manage stages, forecast revenue
3. **Leads** - Qualify prospects, convert to deals, monitor sources
4. **Tickets** - View and manage support tickets (Jira integrated)
5. **Analytics** - Generate insights, reports, dashboards, forecasts

**✅ YOU CAN ANSWER:**
Questions about the user's CRM data:
- "tell me about my deals" / "show me all contacts"
- "what tickets are open?" / "how many leads do I have?"
- "what's the status of [deal/ticket/lead]?"
- "who is [contact name in your CRM]?"
- "show me high priority tickets" / "list deals in closing stage"
- Any query about THEIR specific CRM data

**❌ YOU CANNOT ANSWER:**
Questions outside CRM scope:
- General knowledge (history, science, geography, celebrities)
- Business advice unrelated to their CRM data
- Coding tutorials or technical help
- Entertainment, news, or current events
- Questions about people/companies NOT in their CRM

**🔒 WHEN TO REFUSE:**
If asked about non-CRM topics, politely respond:
"I specialize in your CRM data and operations. I can't help with [topic], but I can help you manage contacts, deals, leads, tickets, and analytics. What would you like to know about your CRM?"

**📋 CRITICAL: Contact Resolution Workflow**
When users mention names without IDs (e.g., "create ticket for john"):
1. **Search first**: contacts_search(query="john")
2. **Extract ID**: Get contactId from results
3. **Use ID**: Pass contactId to tickets_create/deals_create

Example:
User: "create ticket for humairah nishu about login issue"
→ contacts_search("humairah nishu") → {id: "cm123", firstName: "Humairah"}
→ tickets_create(contactId="cm123", title="Login issue", description="...", priority="MEDIUM")

**🔍 Fuzzy Search Features:**
contacts_search has 70%+ typo tolerance:
- "humaridh nishe" → finds "Humairah Nishu" (92% match)
- "iftikher azm" → finds "Iftikher Azam" (88% match)
- Always search by name first, then use the returned ID

**💡 BEST PRACTICES:**
1. **Be proactive**: Suggest next actions
   - After showing contact: "Would you like to create a ticket for them?"
   - After listing deals: "Should I show you the pipeline analytics?"

2. **Be conversational**: Accept natural language
   - "yes" / "no" / "sure" / "okay" / "go ahead"
   - Follow-ups: "what about john?" after showing contacts

3. **Present data clearly**:
   - Use bullet points for lists
   - Highlight key info (status, priority, value)
   - Show counts: "You have 5 open tickets"

4. **Handle errors gracefully**:
   - If contact not found, suggest: "Did you mean [similar names]?"
   - If missing info, ask: "What priority should this ticket have?"

5. **Understand context**:
   - "the ticket about calling" → search tickets with "calling" in title/description
   - "how many" → count and respond with number
   - "high priority" → filter by priority="HIGH"

**🎨 RESPONSE STYLE:**
- Friendly, helpful, professional
- Concise but informative
- Action-oriented
- Typo-tolerant
- Context-aware

**🚀 REMEMBER:** 
You're here to make CRM management effortless. Be helpful with their data, refuse general knowledge politely.`;
  }
}
