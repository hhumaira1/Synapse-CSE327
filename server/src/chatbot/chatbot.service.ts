import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GeminiService, ToolCall } from './gemini.service';
import { GuardrailsService } from './guardrails.service';
import { GuardrailsEnhancedService } from './guardrails-enhanced.service';
import { EntityResolverService } from './entity-resolver.service';
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
    private guardrailsService: GuardrailsService,
    private guardrailsEnhanced: GuardrailsEnhancedService,
    private entityResolver: EntityResolverService,
    private contactsService: ContactsService,
    private dealsService: DealsService,
    private leadsService: LeadsService,
    private ticketsService: TicketsService,
    private analyticsService: AnalyticsService,
    private prisma: PrismaService,
  ) {
    // Initialize Gemini model with enhanced system prompt and tools
    const systemPrompt = this.guardrailsEnhanced.getSystemPrompt();
    const tools = this.geminiService.getCRMTools();
    this.geminiService.initializeModel(systemPrompt, tools);
    this.logger.log('ChatbotService initialized with Enhanced Guardrails');
  }

  /**
   * Main chat handler
   */
  async chat(
    chatDto: ChatMessageDto,
    userId: string,
    tenantId: string,
  ): Promise<ChatResponseDto> {
    const { message, conversationId } = chatDto;

    // Sanitize input
    const sanitizedMessage = this.guardrailsEnhanced.sanitizeInput(message);

    // Enhanced guardrail check with intent detection
    const validation = this.guardrailsEnhanced.validateQuery(sanitizedMessage);
    if (!validation.isValid) {
      this.logger.warn(
        `Blocked non-CRM query from user ${userId} (confidence: ${validation.confidence}%): ${sanitizedMessage}`,
      );
      return {
        response: validation.reason || 'Query blocked by guardrails',
        conversationId: conversationId || 'temp',
        timestamp: new Date(),
      };
    }

    this.logger.log(
      `Processing query: ${sanitizedMessage.substring(0, 100)}`,
    );

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
        },
        include: { messages: true },
      });
    }

    // Build conversation history for Gemini (map 'assistant' to 'model')
    const history = conversation.messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }],
    }));

    // Send to Gemini
    const geminiResponse = await this.geminiService.chat(
      sanitizedMessage,
      history,
    );

    // Save user message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: sanitizedMessage,
      },
    });

    // Handle tool calls
    const toolsUsed: string[] = [];
    let finalResponse = geminiResponse.text;

    if (geminiResponse.toolCalls && geminiResponse.toolCalls.length > 0) {
      this.logger.log(`Executing ${geminiResponse.toolCalls.length} tool(s)`);

      const toolResults: any[] = [];

      for (const toolCall of geminiResponse.toolCalls) {
        toolsUsed.push(toolCall.name);
        const result = await this.executeTool(toolCall, userId, tenantId);

        // Gemini API expects specific function_response format
        toolResults.push({
          functionResponse: {
            name: toolCall.name,
            response: {
              result: result,
            },
          },
        });
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

    // Auto-generate title for new conversations (after first exchange)
    if (conversation.messages.length === 0) {
      const generatedTitle = await this.generateConversationTitle(sanitizedMessage);
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
      suggestedActions: this.generateSuggestedActions(toolsUsed, sanitizedMessage),
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
   * Execute CRM tool based on tool call
   */
  private async executeTool(
    toolCall: ToolCall,
    userId: string,
    tenantId: string,
  ): Promise<any> {
    const { name, arguments: args } = toolCall;

    this.logger.log(`Executing tool: ${name} with args:`, args);

    try {
      switch (name) {
        case 'contacts_list':
          return await this.contactsService.findAll(tenantId);

        case 'contacts_create':
          return await this.contactsService.create(tenantId, args as any);

        case 'deals_list':
          return await this.dealsService.findAll(tenantId, args);

        case 'deals_create':
          return await this.dealsService.create(tenantId, args as any);

        case 'leads_list':
          return await this.leadsService.findAll(tenantId, args);

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
          return await this.ticketsService.findAll(tenantId, args);

        case 'tickets_create':
          try {
            return await this.ticketsService.create(tenantId, args as any);
          } catch (error) {
            // If contact not found, try fuzzy matching
            if (error.message?.includes('Contact not found') && args.contactName) {
              const matches = await this.entityResolver.searchContacts(args.contactName, tenantId, 3);
              if (matches.length > 0) {
                const suggestions = matches
                  .map((m, i) => `${i + 1}. ${m.entity.firstName} ${m.entity.lastName} (${Math.round(m.confidence)}% match)`)
                  .join(', ');
                return { 
                  error: `Couldn't find contact '${args.contactName}'. Did you mean: ${suggestions}?`,
                  suggestions: matches.map(m => ({
                    id: m.entity.id,
                    name: `${m.entity.firstName} ${m.entity.lastName}`,
                    confidence: Math.round(m.confidence)
                  }))
                };
              }
            }
            throw error;
          }

        case 'analytics_dashboard':
          return await this.analyticsService.getDashboard(tenantId);

        // ===== NEW CRUD OPERATIONS =====
        case 'contacts_update':
          return await this.contactsService.update(tenantId, args.contactId, args as any);

        case 'contacts_delete':
          await this.contactsService.remove(tenantId, args.contactId);
          return { success: true, message: `Contact ${args.contactId} deleted` };

        case 'contacts_search':
          // Use fuzzy matching for search
          return await this.entityResolver.searchContacts(
            args.query,
            tenantId,
            10,
          );

        case 'deals_update':
          return await this.dealsService.update(tenantId, args.dealId, args as any);

        case 'deals_delete':
          await this.dealsService.remove(tenantId, args.dealId);
          return { success: true, message: `Deal ${args.dealId} deleted` };

        case 'deals_move_stage':
          return await this.dealsService.moveStage(tenantId, args.dealId, args.stageId);

        case 'leads_update':
          return await this.leadsService.update(tenantId, args.leadId, args as any);

        case 'leads_delete':
          await this.leadsService.remove(tenantId, args.leadId);
          return { success: true, message: `Lead ${args.leadId} deleted` };

        case 'tickets_update':
          return await this.ticketsService.update(tenantId, args.ticketId, args as any);

        case 'tickets_delete':
          await this.ticketsService.remove(tenantId, args.ticketId);
          return { success: true, message: `Ticket ${args.ticketId} deleted` };

        case 'tickets_close':
          return await this.ticketsService.update(tenantId, args.ticketId, {
            status: 'CLOSED',
            resolution: args.resolution,
          } as any);

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
