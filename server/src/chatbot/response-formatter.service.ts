import { Injectable } from '@nestjs/common';

/**
 * Response Formatter Service
 * 
 * Formats chatbot responses with proper markdown, structure, and visual elements
 * to make them look professional in the chat UI.
 */

@Injectable()
export class ResponseFormatterService {
  /**
   * Format a list of items (contacts, leads, deals, tickets)
   */
  formatList(
    items: any[],
    entityType: string,
    options?: {
      showStats?: boolean;
      maxItems?: number;
      includeFields?: string[];
    },
  ): string {
    const maxItems = options?.maxItems || 10;
    const displayItems = items.slice(0, maxItems);
    const remaining = items.length - maxItems;

    if (items.length === 0) {
      return `No ${entityType}s found. Try creating one or adjusting your search criteria.`;
    }

    // Header with count
    let response = `### 📋 ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}s (${items.length})\n\n`;

    // Format based on entity type
    displayItems.forEach((item, index) => {
      response += this.formatListItem(item, entityType, index + 1);
    });

    // Show remaining count
    if (remaining > 0) {
      response += `\n*... and ${remaining} more. Use filters to narrow results.*\n`;
    }

    return response;
  }

  /**
   * Format a single list item
   */
  private formatListItem(item: any, entityType: string, index: number): string {
    switch (entityType.toLowerCase()) {
      case 'contact':
        return this.formatContactItem(item, index);
      case 'lead':
        return this.formatLeadItem(item, index);
      case 'deal':
        return this.formatDealItem(item, index);
      case 'ticket':
        return this.formatTicketItem(item, index);
      default:
        return `${index}. ${JSON.stringify(item)}\n`;
    }
  }

  /**
   * Format contact list item
   */
  private formatContactItem(contact: any, index: number): string {
    const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact';
    const email = contact.email ? `📧 ${contact.email}` : '';
    const phone = contact.phone ? `📱 ${contact.phone}` : '';
    const company = contact.company ? `🏢 ${contact.company}` : '';
    
    let line = `**${index}. ${name}**`;
    const details = [email, phone, company].filter(Boolean).join(' • ');
    if (details) line += `\n   ${details}`;
    
    return line + '\n\n';
  }

  /**
   * Format lead list item
   */
  private formatLeadItem(lead: any, index: number): string {
    const title = lead.title || 'Untitled Lead';
    const value = lead.value ? `💰 $${lead.value.toLocaleString()}` : '';
    const status = lead.status ? `🏷️ ${lead.status}` : '';
    const contact = lead.contact ? `👤 ${lead.contact.firstName} ${lead.contact.lastName}`.trim() : '';
    
    let line = `**${index}. ${title}**`;
    const details = [value, status, contact].filter(Boolean).join(' • ');
    if (details) line += `\n   ${details}`;
    
    return line + '\n\n';
  }

  /**
   * Format deal list item
   */
  private formatDealItem(deal: any, index: number): string {
    const title = deal.title || 'Untitled Deal';
    const value = deal.value ? `💰 $${deal.value.toLocaleString()}` : '';
    const probability = deal.probability ? `📊 ${deal.probability}%` : '';
    const stage = deal.stage?.name ? `📍 ${deal.stage.name}` : '';
    const contact = deal.contact ? `👤 ${deal.contact.firstName} ${deal.contact.lastName}`.trim() : '';
    
    let line = `**${index}. ${title}**`;
    const details = [value, probability, stage, contact].filter(Boolean).join(' • ');
    if (details) line += `\n   ${details}`;
    
    return line + '\n\n';
  }

  /**
   * Format ticket list item
   */
  private formatTicketItem(ticket: any, index: number): string {
    const title = ticket.title || 'Untitled Ticket';
    const status = ticket.status ? `🔖 ${ticket.status}` : '';
    const priority = this.getPriorityEmoji(ticket.priority);
    const contact = ticket.contact ? `👤 ${ticket.contact.firstName} ${ticket.contact.lastName}`.trim() : '';
    
    let line = `**${index}. ${title}**`;
    const details = [priority, status, contact].filter(Boolean).join(' • ');
    if (details) line += `\n   ${details}`;
    
    return line + '\n\n';
  }

  /**
   * Format a single entity detail view
   */
  formatEntityDetail(entity: any, entityType: string): string {
    switch (entityType.toLowerCase()) {
      case 'contact':
        return this.formatContactDetail(entity);
      case 'lead':
        return this.formatLeadDetail(entity);
      case 'deal':
        return this.formatDealDetail(entity);
      case 'ticket':
        return this.formatTicketDetail(entity);
      default:
        return JSON.stringify(entity, null, 2);
    }
  }

  /**
   * Format contact detail view
   */
  private formatContactDetail(contact: any): string {
    const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact';
    
    let response = `### 👤 ${name}\n\n`;
    
    if (contact.email) response += `📧 **Email:** ${contact.email}\n`;
    if (contact.phone) response += `📱 **Phone:** ${contact.phone}\n`;
    if (contact.company) response += `🏢 **Company:** ${contact.company}\n`;
    if (contact.position) response += `💼 **Position:** ${contact.position}\n`;
    
    if (contact.tags && contact.tags.length > 0) {
      response += `\n🏷️ **Tags:** ${contact.tags.join(', ')}\n`;
    }
    
    if (contact._count) {
      response += `\n**Activity:**\n`;
      if (contact._count.leads) response += `• ${contact._count.leads} lead(s)\n`;
      if (contact._count.deals) response += `• ${contact._count.deals} deal(s)\n`;
      if (contact._count.tickets) response += `• ${contact._count.tickets} ticket(s)\n`;
    }
    
    return response;
  }

  /**
   * Format lead detail view
   */
  private formatLeadDetail(lead: any): string {
    const title = lead.title || 'Untitled Lead';
    
    let response = `### 🎯 ${title}\n\n`;
    
    if (lead.value) response += `💰 **Value:** $${lead.value.toLocaleString()}\n`;
    if (lead.status) response += `🏷️ **Status:** ${lead.status}\n`;
    if (lead.source) response += `📍 **Source:** ${lead.source}\n`;
    
    if (lead.contact) {
      const contactName = `${lead.contact.firstName} ${lead.contact.lastName}`.trim();
      response += `\n👤 **Contact:** ${contactName}\n`;
      if (lead.contact.email) response += `   📧 ${lead.contact.email}\n`;
    }
    
    if (lead.notes) {
      response += `\n📝 **Notes:**\n${lead.notes}\n`;
    }
    
    return response;
  }

  /**
   * Format deal detail view
   */
  private formatDealDetail(deal: any): string {
    const title = deal.title || 'Untitled Deal';
    
    let response = `### 💼 ${title}\n\n`;
    
    if (deal.value) response += `💰 **Value:** $${deal.value.toLocaleString()}\n`;
    if (deal.probability) response += `📊 **Probability:** ${deal.probability}%\n`;
    if (deal.expectedCloseDate) {
      const closeDate = new Date(deal.expectedCloseDate).toLocaleDateString();
      response += `📅 **Expected Close:** ${closeDate}\n`;
    }
    
    if (deal.stage) {
      response += `📍 **Stage:** ${deal.stage.name}\n`;
    }
    
    if (deal.pipeline) {
      response += `🔄 **Pipeline:** ${deal.pipeline.name}\n`;
    }
    
    if (deal.contact) {
      const contactName = `${deal.contact.firstName} ${deal.contact.lastName}`.trim();
      response += `\n👤 **Contact:** ${contactName}\n`;
      if (deal.contact.email) response += `   📧 ${deal.contact.email}\n`;
    }
    
    if (deal.notes) {
      response += `\n📝 **Notes:**\n${deal.notes}\n`;
    }
    
    return response;
  }

  /**
   * Format ticket detail view
   */
  private formatTicketDetail(ticket: any): string {
    const title = ticket.title || 'Untitled Ticket';
    
    let response = `### 🎫 ${title}\n\n`;
    
    if (ticket.status) response += `🔖 **Status:** ${ticket.status}\n`;
    if (ticket.priority) response += `${this.getPriorityEmoji(ticket.priority)} **Priority:** ${ticket.priority}\n`;
    
    if (ticket.contact) {
      const contactName = `${ticket.contact.firstName} ${ticket.contact.lastName}`.trim();
      response += `\n👤 **Contact:** ${contactName}\n`;
      if (ticket.contact.email) response += `   📧 ${ticket.contact.email}\n`;
    }
    
    if (ticket.description) {
      response += `\n📝 **Description:**\n${ticket.description}\n`;
    }
    
    if (ticket.comments && ticket.comments.length > 0) {
      response += `\n💬 **Comments:** ${ticket.comments.length}\n`;
    }
    
    return response;
  }

  /**
   * Format success message
   */
  formatSuccess(action: string, entity: any, entityType: string): string {
    const emoji = this.getActionEmoji(action);
    const name = this.getEntityName(entity, entityType);
    
    let response = `### ${emoji} Success!\n\n`;
    response += `${this.capitalize(action)} **${name}** successfully.\n\n`;
    
    // Add quick view of the entity
    response += this.formatEntityDetail(entity, entityType);
    
    return response;
  }

  /**
   * Format error message
   */
  formatError(message: string, suggestions?: string[]): string {
    let response = `### ⚠️ Oops!\n\n`;
    response += `${message}\n`;
    
    if (suggestions && suggestions.length > 0) {
      response += `\n**Suggestions:**\n`;
      suggestions.forEach((suggestion, index) => {
        response += `${index + 1}. ${suggestion}\n`;
      });
    }
    
    return response;
  }

  /**
   * Format search results with scores
   */
  formatSearchResults(
    results: any[],
    entityType: string,
    query: string,
  ): string {
    if (results.length === 0) {
      return this.formatError(
        `No ${entityType}s found matching "${query}".`,
        [
          `Try a different search term`,
          `Check for typos in "${query}"`,
          `Use partial names (e.g., "John" instead of "John Smith")`,
        ],
      );
    }

    let response = `### 🔍 Search Results for "${query}"\n\n`;
    response += `Found **${results.length}** ${entityType}(s):\n\n`;

    results.forEach((result, index) => {
      const name = result.name || this.getEntityName(result, entityType);
      const score = result.score ? ` *(${Math.round(result.score)}% match)*` : '';
      
      response += `**${index + 1}. ${name}**${score}\n`;
      
      // Add preview info
      if (result.email) response += `   📧 ${result.email}\n`;
      if (result.phone) response += `   📱 ${result.phone}\n`;
      if (result.company) response += `   🏢 ${result.company}\n`;
      if (result.value) response += `   💰 $${result.value.toLocaleString()}\n`;
      
      response += '\n';
    });

    return response;
  }

  /**
   * Format analytics/stats
   */
  formatStats(stats: any): string {
    let response = `### 📊 Analytics Dashboard\n\n`;

    if (stats.totalContacts !== undefined) {
      response += `👥 **Contacts:** ${stats.totalContacts}\n`;
    }
    if (stats.totalLeads !== undefined) {
      response += `🎯 **Leads:** ${stats.totalLeads}\n`;
    }
    if (stats.totalDeals !== undefined) {
      response += `💼 **Deals:** ${stats.totalDeals}\n`;
    }
    if (stats.totalValue !== undefined) {
      response += `💰 **Total Value:** $${stats.totalValue.toLocaleString()}\n`;
    }
    if (stats.wonDeals !== undefined) {
      response += `✅ **Won Deals:** ${stats.wonDeals}\n`;
    }
    if (stats.lostDeals !== undefined) {
      response += `❌ **Lost Deals:** ${stats.lostDeals}\n`;
    }
    if (stats.winRate !== undefined) {
      response += `📈 **Win Rate:** ${stats.winRate}%\n`;
    }

    return response;
  }

  /**
   * Helper: Get priority emoji
   */
  private getPriorityEmoji(priority: string): string {
    const priorityMap: Record<string, string> = {
      URGENT: '🔴 URGENT',
      HIGH: '🟠 HIGH',
      MEDIUM: '🟡 MEDIUM',
      LOW: '🟢 LOW',
    };
    return priorityMap[priority?.toUpperCase()] || priority;
  }

  /**
   * Helper: Get action emoji
   */
  private getActionEmoji(action: string): string {
    const actionMap: Record<string, string> = {
      created: '✅',
      updated: '✏️',
      deleted: '🗑️',
      moved: '➡️',
      converted: '🔄',
    };
    return actionMap[action.toLowerCase()] || '✅';
  }

  /**
   * Helper: Get entity name
   */
  private getEntityName(entity: any, entityType: string): string {
    switch (entityType.toLowerCase()) {
      case 'contact':
        return `${entity.firstName || ''} ${entity.lastName || ''}`.trim() || 'Unnamed Contact';
      case 'lead':
      case 'deal':
      case 'ticket':
        return entity.title || `Untitled ${entityType}`;
      default:
        return entity.name || entity.title || 'Unnamed';
    }
  }

  /**
   * Helper: Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Format confirmation prompt
   */
  formatConfirmation(action: string, entity: any, entityType: string): string {
    const name = this.getEntityName(entity, entityType);
    const emoji = action.toLowerCase().includes('delete') ? '⚠️' : '❓';
    
    let response = `### ${emoji} Confirmation Required\n\n`;
    response += `Are you sure you want to **${action}** ${entityType} "${name}"?\n\n`;
    
    if (action.toLowerCase().includes('delete')) {
      response += `⚠️ *This action cannot be undone.*\n`;
    }
    
    return response;
  }
}
