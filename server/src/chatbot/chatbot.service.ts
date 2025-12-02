import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GeminiService, ToolCall } from './gemini.service';
import { GuardrailsEnhancedService } from './guardrails-enhanced.service';
import { EntityResolverService } from './entity-resolver.service';
import {
  ContextManagerService,
  ConversationContext,
} from './context-manager.service';
import { ResponseFormatterService } from './response-formatter.service';
import { McpClientService } from './mcp-client.service';
import { ChatMessageDto, ChatResponseDto } from './dto/chat.dto';
import { ContactsService } from 'src/contacts/contacts/contacts.service';
import { DealsService } from 'src/deals/deals/deals.service';
import { LeadsService } from 'src/leads/leads/leads.service';
import { TicketsService } from 'src/tickets/tickets/tickets.service';
import { AnalyticsService } from 'src/analytics/analytics/analytics.service';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private geminiService: GeminiService,
    private guardrailsEnhanced: GuardrailsEnhancedService,
    private entityResolver: EntityResolverService,
    private contextManager: ContextManagerService,
    private responseFormatter: ResponseFormatterService,
    private mcpClient: McpClientService,
    private contactsService: ContactsService,
    private dealsService: DealsService,
    private leadsService: LeadsService,
    private ticketsService: TicketsService,
    private analyticsService: AnalyticsService,
    private prisma: PrismaService,
  ) {
    // Initialize Gemini model with tools and formatting instructions
    const tools = this.geminiService.getCRMTools();
    const systemPrompt = `You are SynapseCRM AI Assistant - AUTONOMOUS CRM operations only.

🎯 **EXECUTION RULES:**
✅ **AUTO-EXECUTE** (no confirmation):
- Reading: contacts_list, deals_list, leads_list, tickets_list
- Creating: Automatically search → extract ID → create entity
- Multi-step: Chain tools in ONE response

⚠️ **ASK FIRST**: DELETE operations

🚨 **CRITICAL: Extract IDs from tool responses!**
When tool returns JSON like {"id": "abc123", "title": "software"}, REMEMBER the ID for next message.

📋 **🚨 MANDATORY OUTPUT FORMAT - YOU MUST FOLLOW THIS EXACTLY:**

**When you get a list of contacts from the tool, format it like this:**

📋 CONTACTS (3 found)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Iftikher 2 | CTV
  iftikherazam@gmail.com | 01627355279

• Humairah Nishu | TechCorp
  humairah@techcorp.com | 01712345678

• HR Humaira
  hr@example.com | 01812345678
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**When you create something successfully:**
✅ Contact created successfully: John Doe (john@example.com, 01712345678)

**When you get analytics data:**
📊 DASHBOARD OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Contacts: 45
Active Deals: 12 ($156,000)
Open Tickets: 8
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**When you search for something:**
🔍 SEARCH RESULTS for "iftikher"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Found 1 contact:
Iftikher 2 | CTV
iftikherazam@gmail.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**When there's an error:**
⚠️ Contact not found. Would you like to create this contact?

**🚨 CRITICAL FORMATTING RULES - NEVER SKIP THESE:**
1. ALWAYS start with emoji: 📋 for lists, 📊 for analytics, ✅ for success, 🔍 for search, ⚠️ for errors
2. ALWAYS use separator lines: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. ALWAYS use bullet points (•) for list items
4. ALWAYS format contacts as: Name | Company (on first line), then email | phone (on second line)
5. NEVER show technical IDs to users
6. NEVER say "I see a list" or "OK" - SHOW the formatted list directly

**WRONG EXAMPLES (NEVER DO THIS):**
❌ "OK. I see a list of your contacts with details like name, email, phone, company, and job title."
❌ "I found 3 contacts: hr humaira (CEO at ), Humaira Nishu (CEO at Humaira bakery), and iftikher azam (CTO at ckash)."

**RIGHT EXAMPLES (ALWAYS DO THIS):**
✅ Start with emoji and separator, show formatted list

**CRM ONLY. Decline: weather, jokes, code, general knowledge.**`;

    this.geminiService.initializeModel(systemPrompt, tools);
    this.logger.log(
      'ChatbotService initialized - Scope enforcement delegated to MCP Server',
    );
  }

  /**
   * Main chat handler
   */
  async chat(
    chatDto: ChatMessageDto,
    userId: string,
    tenantId: string,
    jwt: string,
  ): Promise<ChatResponseDto> {
    const { message, conversationId } = chatDto;

    // Sanitize input
    const sanitizedMessage = this.guardrailsEnhanced.sanitizeInput(message);

    // Security guardrail check (malicious patterns only)
    const validation = this.guardrailsEnhanced.validateQuery(sanitizedMessage);
    if (!validation.isValid) {
      this.logger.warn(
        `Blocked malicious input from user ${userId}: ${sanitizedMessage.substring(0, 50)}`,
      );
      return {
        response: validation.reason || 'Invalid input detected',
        conversationId: conversationId || 'temp',
        timestamp: new Date(),
      };
    }

    this.logger.log(`Processing query: ${sanitizedMessage.substring(0, 100)}`);

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }, // Get ALL messages for context
      });
    }

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          userId,
          tenantId,
          title: sanitizedMessage.substring(0, 50),
          metadata: this.contextManager.createEmptyContext() as any,
        },
        include: { messages: true },
      });
    }

    // Load conversation context
    let context: ConversationContext =
      (conversation.metadata as ConversationContext) ||
      this.contextManager.createEmptyContext();
    context = this.contextManager.cleanExpiredContext(context);

    // Check for entity references in user message
    const entityRefs =
      this.contextManager.extractEntityReferencesFromText(sanitizedMessage);
    if (entityRefs.hasPronoun) {
      this.logger.debug('Detected pronoun reference in user message');
    }
    if (entityRefs.hasOrdinal) {
      this.logger.debug(
        `Detected ordinal reference: index ${entityRefs.ordinalIndex}`,
      );
    }

    // Build conversation history for Gemini (map 'assistant' to 'model')
    const history = conversation.messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }],
    }));

    // Send to Gemini with error handling
    let geminiResponse: any;
    try {
      geminiResponse = await this.geminiService.chat(
        sanitizedMessage,
        history,
      );
    } catch (error: any) {
      this.logger.error('Gemini service error:', error.message);
      
      // Return user-friendly error messages
      const errorMessage = this.getErrorMessage(error);
      
      // Save user message even on error
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: sanitizedMessage,
        },
      });
      
      // Save error response
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: errorMessage,
        },
      });
      
      return {
        conversationId: conversation.id,
        response: errorMessage,
        toolsUsed: [],
        timestamp: new Date(),
      };
    }

    // Save user message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: sanitizedMessage,
      },
    });

    // Handle tool calls via MCP server (or direct if no JWT - for Telegram)
    const toolsUsed: string[] = [];
    let finalResponse = geminiResponse.text;
    const useMCP = jwt && jwt.trim() !== ''; // Use MCP only if JWT is provided

    if (geminiResponse.toolCalls && geminiResponse.toolCalls.length > 0) {
      this.logger.log(
        `Executing ${geminiResponse.toolCalls.length} tool(s) via ${useMCP ? 'MCP' : 'direct service calls'}`,
      );

      const toolResults: any[] = [];

      for (const toolCall of geminiResponse.toolCalls) {
        toolsUsed.push(toolCall.name);

        try {
          let result;

          if (useMCP) {
            // Use MCP server (Web chatbot with JWT)
            const mcpResult = await this.mcpClient.callTool(
              toolCall.name,
              toolCall.arguments,
              jwt,
            );

            // Parse JSON response from MCP if possible
            try {
              result = JSON.parse(mcpResult);
            } catch {
              result = mcpResult;
            }
          } else {
            // Fallback to direct service calls (Telegram without JWT)
            result = await this.executeTool(
              toolCall,
              userId,
              tenantId,
              context,
            );
          }

          // Gemini API expects specific function_response format
          toolResults.push({
            functionResponse: {
              name: toolCall.name,
              response: {
                result: result,
              },
            },
          });
        } catch (error) {
          this.logger.error(`Tool call failed for ${toolCall.name}:`, error);
          toolResults.push({
            functionResponse: {
              name: toolCall.name,
              response: {
                error: `Failed to execute ${toolCall.name}: ${error.message}`,
              },
            },
          });
        }
      }

      // Send tool results back to Gemini for final response
      // Don't add tool results to history - they're sent separately
      const updatedHistory = [
        ...history,
        { role: 'user', parts: [{ text: sanitizedMessage }] },
      ];

      finalResponse = await this.geminiService.sendToolResponse(
        updatedHistory,
        toolResults,
      );
    }

    // Save assistant response
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: finalResponse,
      },
    });

    // Save updated context to conversation metadata
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { metadata: context as any },
    });

    // Auto-generate title for new conversations (after first exchange)
    if (conversation.messages.length === 0) {
      const generatedTitle =
        await this.generateConversationTitle(sanitizedMessage);
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { title: generatedTitle },
      });
    }

    return {
      response: finalResponse,
      conversationId: conversation.id,
      toolsUsed,
      timestamp: new Date(),
      suggestedActions: this.generateSuggestedActions(
        toolsUsed,
        sanitizedMessage,
      ),
    };
  }

  /**
   * Generate proactive action suggestions based on context
   */
  private generateSuggestedActions(
    toolsUsed: string[],
    userMessage: string,
  ): any[] {
    const suggestions: any[] = [];

    // After viewing contacts, suggest creating one
    if (
      toolsUsed.includes('contacts_list') ||
      toolsUsed.includes('contacts_get')
    ) {
      suggestions.push({
        label: 'Create New Contact',
        prompt: 'create a new contact',
        icon: 'UserPlus',
        category: 'create',
      });
      suggestions.push({
        label: 'View Contact Stats',
        prompt: 'show me contact analytics',
        icon: 'BarChart',
        category: 'analyze',
      });
    }

    // After viewing deals, suggest creating or analyzing
    if (toolsUsed.includes('deals_list') || toolsUsed.includes('deals_get')) {
      suggestions.push({
        label: 'Create New Deal',
        prompt: 'create a new deal',
        icon: 'DollarSign',
        category: 'create',
      });
      suggestions.push({
        label: 'Revenue Forecast',
        prompt: 'show me revenue forecast for this month',
        icon: 'TrendingUp',
        category: 'analyze',
      });
    }

    // After viewing leads, suggest conversion
    if (toolsUsed.includes('leads_list') || toolsUsed.includes('leads_get')) {
      suggestions.push({
        label: 'Convert Lead to Deal',
        prompt: 'convert a lead to deal',
        icon: 'ArrowRight',
        category: 'update',
      });
      suggestions.push({
        label: 'Lead Conversion Rate',
        prompt: 'show me lead conversion analytics',
        icon: 'Percent',
        category: 'analyze',
      });
    }

    // After viewing tickets, suggest creating or analyzing
    if (
      toolsUsed.includes('tickets_list') ||
      toolsUsed.includes('tickets_get')
    ) {
      suggestions.push({
        label: 'Create New Ticket',
        prompt: 'create a new support ticket',
        icon: 'Ticket',
        category: 'create',
      });
      suggestions.push({
        label: 'Ticket Analytics',
        prompt: 'show me open tickets by priority',
        icon: 'Activity',
        category: 'analyze',
      });
    }

    // After creating something, suggest viewing the list
    if (
      toolsUsed.includes('contacts_create') ||
      toolsUsed.includes('deals_create') ||
      toolsUsed.includes('leads_create') ||
      toolsUsed.includes('tickets_create')
    ) {
      suggestions.push({
        label: 'View All Items',
        prompt: 'show me all ' + this.getEntityNameFromTool(toolsUsed[0]),
        icon: 'List',
        category: 'view',
      });
    }

    // General suggestions if no specific context
    if (suggestions.length === 0) {
      suggestions.push(
        {
          label: 'View Dashboard',
          prompt: 'show me my dashboard',
          icon: 'LayoutDashboard',
          category: 'view',
        },
        {
          label: 'Create Contact',
          prompt: 'create a new contact',
          icon: 'UserPlus',
          category: 'create',
        },
        {
          label: 'View Analytics',
          prompt: 'show me revenue analytics',
          icon: 'TrendingUp',
          category: 'analyze',
        },
      );
    }

    // Limit to 4 suggestions max
    return suggestions.slice(0, 4);
  }

  /**
   * Helper to extract entity name from tool name
   */
  private getEntityNameFromTool(toolName: string): string {
    if (toolName.includes('contact')) return 'contacts';
    if (toolName.includes('deal')) return 'deals';
    if (toolName.includes('lead')) return 'leads';
    if (toolName.includes('ticket')) return 'tickets';
    return 'items';
  }

  /**
   * Generate a concise title for a conversation using AI
   */
  private async generateConversationTitle(
    firstMessage: string,
  ): Promise<string> {
    try {
      const prompt = `Summarize this CRM query in exactly 5 words or less: "${firstMessage.substring(0, 100)}"`;

      // Use a simple chat without tools
      const response = await this.geminiService.chat(prompt, []);

      // Clean up response (remove quotes, limit length)
      const title = response.text
        .replace(/['"]/g, '')
        .replace(/\.$/, '')
        .substring(0, 50)
        .trim();

      return title || firstMessage.substring(0, 50);
    } catch (error) {
      this.logger.error('Failed to generate title:', error);
      return firstMessage.substring(0, 50);
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    const errorType = error.message || '';
    
    if (errorType.includes('AI_RATE_LIMIT')) {
      return "⚠️ I'm experiencing high demand right now. Please wait a few seconds and try again.\n\n💡 **Tip**: Gemini 2.0 Flash has a rate limit of 15 requests per minute. Your request will automatically retry.";
    } else if (errorType.includes('AI_AUTH_ERROR')) {
      return "⚠️ AI service authentication error. Please contact the administrator.";
    } else if (errorType.includes('AI_SERVER_ERROR')) {
      return "⚠️ AI service is temporarily unavailable. Please try again in a moment.";
    } else if (errorType.includes('AI_UNKNOWN_ERROR')) {
      return "⚠️ An unexpected error occurred. Please try rephrasing your question or contact support if the issue persists.";
    }
    
    return "⚠️ Sorry, I encountered an error processing your request. Please try again.";
  }

  /**
   * Execute CRM tool based on tool call (with context management)
   */
  private async executeTool(
    toolCall: ToolCall,
    userId: string,
    tenantId: string,
    context?: ConversationContext,
  ): Promise<any> {
    const { name, arguments: args } = toolCall;

    this.logger.log(`Executing tool: ${name} with args:`, args);

    try {
      let result;
      switch (name) {
        case 'contacts_list':
          result = await this.contactsService.findAll(tenantId);
          // Store contacts in context
          if (context && Array.isArray(result)) {
            this.contextManager.storeSearchResults(
              context,
              'contact',
              result.map((c: any) => ({
                id: c.id,
                name: `${c.firstName} ${c.lastName}`.trim(),
              })),
            );
          }
          // Format response
          return {
            data: result,
            formatted: this.responseFormatter.formatList(result, 'contact'),
          };

        case 'contacts_create':
          result = await this.contactsService.create(tenantId, args as any);
          // Store newly created contact in context
          if (context && result) {
            this.contextManager.storeContact(context, {
              id: result.id,
              name: `${result.firstName} ${result.lastName}`.trim(),
              email: result.email,
            });
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatSuccess(
              'created',
              result,
              'contact',
            ),
          };

        case 'contacts_get':
          result = await this.contactsService.findOne(tenantId, args.contactId);
          // Store retrieved contact in context
          if (context && result) {
            this.contextManager.storeContact(context, {
              id: result.id,
              name: `${result.firstName} ${result.lastName}`.trim(),
              email: result.email,
            });
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatEntityDetail(
              result,
              'contact',
            ),
          };

        case 'contacts_update':
          result = await this.contactsService.update(
            tenantId,
            args.contactId,
            args as any,
          );
          // Update contact in context
          if (context && result) {
            this.contextManager.storeContact(context, {
              id: result.id,
              name: `${result.firstName} ${result.lastName}`.trim(),
              email: result.email,
            });
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatSuccess(
              'updated',
              result,
              'contact',
            ),
          };

        case 'contacts_delete':
          await this.contactsService.remove(tenantId, args.contactId);
          return { success: true, message: `Contact deleted successfully` };

        case 'contacts_search':
          result = await this.entityResolver.searchContacts(
            args.query,
            tenantId,
            10,
          );
          // Store search results in context
          if (context && Array.isArray(result)) {
            this.contextManager.storeSearchResults(
              context,
              'contact',
              result.map((c: any) => ({
                id: c.id,
                name: c.name || `${c.firstName} ${c.lastName}`.trim(),
                score: c.score,
              })),
              args.query,
            );
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatSearchResults(
              result,
              'contact',
              args.query,
            ),
          };

        case 'deals_list':
          result = await this.dealsService.findAll(tenantId, args);
          if (context && Array.isArray(result)) {
            this.contextManager.storeSearchResults(
              context,
              'deal',
              result.map((d: any) => ({
                id: d.id,
                title: d.title,
                name: d.title,
              })),
            );
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatList(result, 'deal'),
          };

        case 'deals_create':
          result = await this.dealsService.create(tenantId, args as any);
          if (context && result) {
            this.contextManager.storeDeal(context, {
              id: result.id,
              title: result.title,
              contactId: result.contactId,
            });
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatSuccess(
              'created',
              result,
              'deal',
            ),
          };

        case 'deals_get':
          result = await this.dealsService.findOne(tenantId, args.dealId);
          if (context && result) {
            this.contextManager.storeDeal(context, {
              id: result.id,
              title: result.title,
              contactId: result.contactId,
            });
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatEntityDetail(
              result,
              'deal',
            ),
          };

        case 'deals_update':
          result = await this.dealsService.update(
            tenantId,
            args.dealId,
            args as any,
          );
          if (context && result) {
            this.contextManager.storeDeal(context, {
              id: result.id,
              title: result.title,
              contactId: result.contactId,
            });
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatSuccess(
              'updated',
              result,
              'deal',
            ),
          };

        case 'deals_delete':
          await this.dealsService.remove(tenantId, args.dealId);
          return { success: true, message: `Deal deleted successfully` };

        case 'deals_move':
          result = await this.dealsService.moveStage(
            tenantId,
            args.dealId,
            args.stageId,
          );
          if (context && result) {
            this.contextManager.storeDeal(context, {
              id: result.id,
              title: result.title,
              contactId: result.contactId,
            });
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatSuccess(
              'moved',
              result,
              'deal',
            ),
          };

        case 'leads_list':
          result = await this.leadsService.findAll(tenantId, args);
          if (context && Array.isArray(result)) {
            this.contextManager.storeSearchResults(
              context,
              'lead',
              result.map((l: any) => ({
                id: l.id,
                title: l.title,
                name: l.title,
              })),
            );
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatList(result, 'lead'),
          };

        case 'leads_create':
          result = await this.leadsService.create(tenantId, args as any);
          if (context && result) {
            this.contextManager.storeLead(context, {
              id: result.id,
              title: result.title,
              contactId: result.contactId,
            });
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatSuccess(
              'created',
              result,
              'lead',
            ),
          };

        case 'leads_get':
          result = await this.leadsService.findOne(tenantId, args.leadId);
          if (context && result) {
            this.contextManager.storeLead(context, {
              id: result.id,
              title: result.title,
              contactId: result.contactId,
            });
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatEntityDetail(
              result,
              'lead',
            ),
          };

        case 'leads_convert':
          return await this.leadsService.convert(
            tenantId,
            userId,
            args.leadId,
            {
              pipelineId: args.pipelineId,
              stageId: args.stageId,
              probability: 50,
            },
          );

        case 'tickets_list':
          result = await this.ticketsService.findAll(tenantId, args);
          if (context && Array.isArray(result)) {
            this.contextManager.storeSearchResults(
              context,
              'ticket',
              result.map((t: any) => ({
                id: t.id,
                title: t.subject,
                name: t.subject,
              })),
            );
          }
          return {
            data: result,
            formatted: this.responseFormatter.formatList(result, 'ticket'),
          };

        case 'tickets_create':
          try {
            result = await this.ticketsService.create(tenantId, args as any);
            return {
              data: result,
              formatted: this.responseFormatter.formatSuccess(
                'created',
                result,
                'ticket',
              ),
            };
          } catch (error) {
            // If contact not found, try fuzzy matching
            if (
              error.message?.includes('Contact not found') &&
              args.contactName
            ) {
              const matches = await this.entityResolver.searchContacts(
                args.contactName,
                tenantId,
                3,
              );
              if (matches.length > 0) {
                const suggestions = matches
                  .map(
                    (m, i) =>
                      `${i + 1}. ${m.entity.firstName} ${m.entity.lastName} (${Math.round(m.confidence)}% match)`,
                  )
                  .join(', ');
                return {
                  error: `Couldn't find contact '${args.contactName}'. Did you mean: ${suggestions}?`,
                  suggestions: matches.map((m) => ({
                    id: m.entity.id,
                    name: `${m.entity.firstName} ${m.entity.lastName}`,
                    confidence: Math.round(m.confidence),
                  })),
                };
              }
            }
            throw error;
          }

        case 'tickets_get':
          result = await this.ticketsService.findOne(tenantId, args.ticketId);
          return {
            data: result,
            formatted: this.responseFormatter.formatEntityDetail(
              result,
              'ticket',
            ),
          };

        case 'tickets_update':
          result = await this.ticketsService.update(
            tenantId,
            args.ticketId,
            args as any,
          );
          return {
            data: result,
            formatted: this.responseFormatter.formatSuccess(
              'updated',
              result,
              'ticket',
            ),
          };

        case 'tickets_delete':
          await this.ticketsService.remove(tenantId, args.ticketId);
          return { success: true, message: `Ticket deleted successfully` };

        case 'tickets_comment':
          // addComment expects (tenantId, ticketId, userId, commentDto)
          return await this.ticketsService.addComment(
            tenantId,
            args.ticketId,
            userId,
            { text: args.comment } as any,
          );

        case 'leads_update':
          return await this.leadsService.update(
            tenantId,
            args.leadId,
            args as any,
          );

        case 'leads_delete':
          await this.leadsService.remove(tenantId, args.leadId);
          return { success: true, message: `Lead deleted successfully` };

        case 'analytics_dashboard':
          result = await this.analyticsService.getDashboard(tenantId);
          return {
            data: result,
            formatted: this.responseFormatter.formatStats(result),
          };

        case 'analytics_revenue':
          result = await this.analyticsService.getRevenueForecast(
            tenantId,
            args.timeRange || 'month',
          );
          return {
            data: result,
            formatted: this.responseFormatter.formatStats(result),
          };

        // All cases now consolidated above - no duplicates

        default:
          this.logger.warn(`Unknown tool: ${name}`);
          return { error: `Tool ${name} not implemented` };
      }
    } catch (error) {
      this.logger.error(`Tool execution error for ${name}:`, error);
      return { error: `Failed to execute ${name}: ${error.message}` };
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: string, userId: string) {
    return await this.prisma.conversation.findUnique({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * List user conversations
   */
  async listConversations(userId: string) {
    return await this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string) {
    // Verify the conversation belongs to the user
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Delete the conversation (messages will be cascade deleted)
    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true, message: 'Conversation deleted successfully' };
  }
}
