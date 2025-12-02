import { Injectable, Logger } from '@nestjs/common';

/**
 * Context Manager Service
 * 
 * Manages conversation context to enable multi-turn workflows.
 * Stores entity references (contacts, leads, deals) and search results
 * so users can reference entities across messages without repeating searches.
 * 
 * Examples:
 * - User: "Find John Smith" -> Store contact ID
 * - User: "Create a deal with him" -> Use stored contact ID
 * - User: "Show me leads" -> Store lead IDs
 * - User: "Convert the first one" -> Use stored lead ID
 */

export interface ConversationContext {
  // Recently referenced entities (by name/query)
  contacts?: {
    [key: string]: {
      id: string;
      name: string;
      email?: string;
      lastAccessedAt: string;
    };
  };
  leads?: {
    [key: string]: {
      id: string;
      title: string;
      contactId?: string;
      lastAccessedAt: string;
    };
  };
  deals?: {
    [key: string]: {
      id: string;
      title: string;
      contactId?: string;
      lastAccessedAt: string;
    };
  };
  tickets?: {
    [key: string]: {
      id: string;
      title: string;
      contactId?: string;
      lastAccessedAt: string;
    };
  };

  // Last search/list results (for "the first one", "the second", etc.)
  lastSearchResults?: {
    entityType: 'contact' | 'lead' | 'deal' | 'ticket';
    results: Array<{
      id: string;
      name?: string;
      title?: string;
      score?: number; // Fuzzy match score
    }>;
    query?: string;
    timestamp: string;
  };

  // Last referenced entity (for "it", "that", "this")
  lastEntity?: {
    type: 'contact' | 'lead' | 'deal' | 'ticket';
    id: string;
    name?: string;
    timestamp: string;
  };

  // Pending operations (for confirmations)
  pendingOperation?: {
    action: string; // 'delete', 'convert', 'move', etc.
    entityType: string;
    entityId: string;
    params?: Record<string, any>;
    timestamp: string;
  };
}

@Injectable()
export class ContextManagerService {
  private readonly logger = new Logger(ContextManagerService.name);
  private readonly CONTEXT_TTL_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Initialize empty context
   */
  createEmptyContext(): ConversationContext {
    return {
      contacts: {},
      leads: {},
      deals: {},
      tickets: {},
    };
  }

  /**
   * Store contact in context
   */
  storeContact(
    context: ConversationContext,
    contact: { id: string; name: string; email?: string },
  ): ConversationContext {
    if (!context.contacts) context.contacts = {};

    const key = contact.name.toLowerCase();
    context.contacts[key] = {
      ...contact,
      lastAccessedAt: new Date().toISOString(),
    };

    // Also store as last entity
    context.lastEntity = {
      type: 'contact',
      id: contact.id,
      name: contact.name,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(`Stored contact in context: ${contact.name} (${contact.id})`);
    return context;
  }

  /**
   * Store lead in context
   */
  storeLead(
    context: ConversationContext,
    lead: { id: string; title: string; contactId?: string },
  ): ConversationContext {
    if (!context.leads) context.leads = {};

    const key = lead.title.toLowerCase();
    context.leads[key] = {
      ...lead,
      lastAccessedAt: new Date().toISOString(),
    };

    context.lastEntity = {
      type: 'lead',
      id: lead.id,
      name: lead.title,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(`Stored lead in context: ${lead.title} (${lead.id})`);
    return context;
  }

  /**
   * Store deal in context
   */
  storeDeal(
    context: ConversationContext,
    deal: { id: string; title: string; contactId?: string },
  ): ConversationContext {
    if (!context.deals) context.deals = {};

    const key = deal.title.toLowerCase();
    context.deals[key] = {
      ...deal,
      lastAccessedAt: new Date().toISOString(),
    };

    context.lastEntity = {
      type: 'deal',
      id: deal.id,
      name: deal.title,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(`Stored deal in context: ${deal.title} (${deal.id})`);
    return context;
  }

  /**
   * Store ticket in context
   */
  storeTicket(
    context: ConversationContext,
    ticket: { id: string; title: string; contactId?: string },
  ): ConversationContext {
    if (!context.tickets) context.tickets = {};

    const key = ticket.title.toLowerCase();
    context.tickets[key] = {
      ...ticket,
      lastAccessedAt: new Date().toISOString(),
    };

    context.lastEntity = {
      type: 'ticket',
      id: ticket.id,
      name: ticket.title,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(`Stored ticket in context: ${ticket.title} (${ticket.id})`);
    return context;
  }

  /**
   * Store search results in context
   */
  storeSearchResults(
    context: ConversationContext,
    entityType: 'contact' | 'lead' | 'deal' | 'ticket',
    results: Array<{ id: string; name?: string; title?: string; score?: number }>,
    query?: string,
  ): ConversationContext {
    context.lastSearchResults = {
      entityType,
      results,
      query,
      timestamp: new Date().toISOString(),
    };

    // Store top result as last entity
    if (results.length > 0) {
      const topResult = results[0];
      context.lastEntity = {
        type: entityType,
        id: topResult.id,
        name: topResult.name || topResult.title,
        timestamp: new Date().toISOString(),
      };

      // Also store in entity-specific context
      if (entityType === 'contact' && topResult.name) {
        this.storeContact(context, { id: topResult.id, name: topResult.name });
      }
    }

    this.logger.debug(
      `Stored search results: ${results.length} ${entityType}(s) for query "${query || 'N/A'}"`,
    );
    return context;
  }

  /**
   * Get contact from context by name/query (fuzzy match)
   */
  getContactFromContext(
    context: ConversationContext,
    query: string,
  ): { id: string; name: string; email?: string } | null {
    if (!context.contacts) return null;

    const lowerQuery = query.toLowerCase();

    // Exact match
    if (context.contacts[lowerQuery]) {
      return context.contacts[lowerQuery];
    }

    // Partial match
    const matches = Object.entries(context.contacts).filter(([key]) =>
      key.includes(lowerQuery) || lowerQuery.includes(key),
    );

    if (matches.length > 0) {
      return matches[0][1];
    }

    return null;
  }

  /**
   * Get last entity (for "it", "that", "this")
   */
  getLastEntity(context: ConversationContext): {
    type: 'contact' | 'lead' | 'deal' | 'ticket';
    id: string;
    name?: string;
  } | null {
    if (!context.lastEntity) return null;

    // Check if still valid (within TTL)
    const age = Date.now() - new Date(context.lastEntity.timestamp).getTime();
    if (age > this.CONTEXT_TTL_MS) {
      this.logger.debug('Last entity expired (TTL exceeded)');
      return null;
    }

    return context.lastEntity;
  }

  /**
   * Get entity from search results by index (for "the first one", "the second", etc.)
   */
  getEntityByIndex(
    context: ConversationContext,
    index: number,
  ): { id: string; name?: string; title?: string } | null {
    if (!context.lastSearchResults) return null;

    // Check if still valid (within TTL)
    const age = Date.now() - new Date(context.lastSearchResults.timestamp).getTime();
    if (age > this.CONTEXT_TTL_MS) {
      this.logger.debug('Search results expired (TTL exceeded)');
      return null;
    }

    if (index < 0 || index >= context.lastSearchResults.results.length) {
      return null;
    }

    return context.lastSearchResults.results[index];
  }

  /**
   * Store pending operation (for confirmations)
   */
  storePendingOperation(
    context: ConversationContext,
    action: string,
    entityType: string,
    entityId: string,
    params?: Record<string, any>,
  ): ConversationContext {
    context.pendingOperation = {
      action,
      entityType,
      entityId,
      params,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(
      `Stored pending operation: ${action} ${entityType} ${entityId}`,
    );
    return context;
  }

  /**
   * Get pending operation and clear it
   */
  consumePendingOperation(context: ConversationContext): {
    action: string;
    entityType: string;
    entityId: string;
    params?: Record<string, any>;
  } | null {
    if (!context.pendingOperation) return null;

    // Check if still valid (within 5 minutes for confirmations)
    const age = Date.now() - new Date(context.pendingOperation.timestamp).getTime();
    if (age > 5 * 60 * 1000) {
      this.logger.debug('Pending operation expired');
      context.pendingOperation = undefined;
      return null;
    }

    const operation = context.pendingOperation;
    context.pendingOperation = undefined;
    return operation;
  }

  /**
   * Clean expired entries from context
   */
  cleanExpiredContext(context: ConversationContext): ConversationContext {
    const now = Date.now();

    // Clean contacts
    if (context.contacts) {
      Object.keys(context.contacts).forEach((key) => {
        const age = now - new Date(context.contacts![key].lastAccessedAt).getTime();
        if (age > this.CONTEXT_TTL_MS) {
          delete context.contacts![key];
        }
      });
    }

    // Clean leads
    if (context.leads) {
      Object.keys(context.leads).forEach((key) => {
        const age = now - new Date(context.leads![key].lastAccessedAt).getTime();
        if (age > this.CONTEXT_TTL_MS) {
          delete context.leads![key];
        }
      });
    }

    // Clean deals
    if (context.deals) {
      Object.keys(context.deals).forEach((key) => {
        const age = now - new Date(context.deals![key].lastAccessedAt).getTime();
        if (age > this.CONTEXT_TTL_MS) {
          delete context.deals![key];
        }
      });
    }

    // Clean tickets
    if (context.tickets) {
      Object.keys(context.tickets).forEach((key) => {
        const age = now - new Date(context.tickets![key].lastAccessedAt).getTime();
        if (age > this.CONTEXT_TTL_MS) {
          delete context.tickets![key];
        }
      });
    }

    return context;
  }

  /**
   * Extract entity references from text for context enrichment
   * Looks for pronouns like "it", "that", "this", "him", "her", "them"
   * and ordinals like "first", "second", "last"
   */
  extractEntityReferencesFromText(text: string): {
    hasPronoun: boolean;
    hasOrdinal: boolean;
    ordinalIndex?: number;
  } {
    const lowerText = text.toLowerCase();

    // Pronouns
    const pronouns = ['it', 'that', 'this', 'him', 'her', 'them'];
    const hasPronoun = pronouns.some((p) => 
      new RegExp(`\\b${p}\\b`).test(lowerText)
    );

    // Ordinals
    const ordinalMap: Record<string, number> = {
      'first': 0,
      '1st': 0,
      'second': 1,
      '2nd': 1,
      'third': 2,
      '3rd': 2,
      'fourth': 3,
      '4th': 3,
      'fifth': 4,
      '5th': 4,
      'last': -1,
    };

    let hasOrdinal = false;
    let ordinalIndex: number | undefined;

    Object.entries(ordinalMap).forEach(([word, index]) => {
      if (new RegExp(`\\b${word}(\\s+one)?\\b`).test(lowerText)) {
        hasOrdinal = true;
        ordinalIndex = index;
      }
    });

    return { hasPronoun, hasOrdinal, ordinalIndex };
  }
}
