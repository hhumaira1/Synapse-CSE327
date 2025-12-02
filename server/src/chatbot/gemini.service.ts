import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, FunctionDeclaration } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface GeminiResponse {
  text: string;
  toolCalls?: ToolCall[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 4000; // 4 seconds between requests (15 RPM = 1 request per 4 seconds)

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in environment variables');
      throw new Error('Missing GEMINI_API_KEY');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.logger.log('Gemini AI initialized with rate limiting (15 RPM)');
  }

  /**
   * Initialize model with system prompt and tools
   */
  initializeModel(systemPrompt: string, tools: FunctionDeclaration[]) {
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
    });

    this.logger.log(`Model initialized with ${tools.length} tools`);
  }

  /**
   * Rate-limited request wrapper with exponential backoff retry
   */
  private async rateLimitedRequest<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    const waitTime = Math.max(0, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);

    if (waitTime > 0) {
      this.logger.debug(`Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        this.lastRequestTime = Date.now();
        return await fn();
      } catch (error: any) {
        const isRateLimitError = error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource exhausted');
        
        if (isRateLimitError && attempt < retries - 1) {
          const backoffTime = Math.min(30000, 1000 * Math.pow(2, attempt)); // Exponential backoff, max 30s
          this.logger.warn(`Rate limit hit (attempt ${attempt + 1}/${retries}). Retrying in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Send message to Gemini and get response
   */
  async chat(
    message: string,
    conversationHistory: Array<{
      role: string;
      parts: Array<{ text: string }>;
    }>,
  ): Promise<GeminiResponse> {
    return this.rateLimitedRequest(async () => {
      try {
        const chat = this.model.startChat({
          history: conversationHistory,
        });

        const result = await chat.sendMessage(message);
        const response = result.response;

        // Check for function calls
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
          this.logger.log(
            `Tool calls requested: ${functionCalls.map((fc: any) => fc.name).join(', ')}`,
          );

          return {
            text: '',
            toolCalls: functionCalls.map((fc: any) => ({
              name: fc.name,
              arguments: fc.args,
            })),
          };
        }

        // Regular text response
        const text = response.text();
        this.logger.log(`Response generated: ${text.substring(0, 100)}...`);

        return { text };
      } catch (error: any) {
        this.logger.error('Gemini API error:', error);
        
        // Return user-friendly error messages
        if (error.status === 429 || error.message?.includes('Resource exhausted')) {
          throw new Error('AI_RATE_LIMIT');
        } else if (error.status === 401 || error.message?.includes('API key')) {
          throw new Error('AI_AUTH_ERROR');
        } else if (error.status >= 500) {
          throw new Error('AI_SERVER_ERROR');
        }
        
        throw new Error('AI_UNKNOWN_ERROR');
      }
    });
  }

  /**
   * Send tool response back to Gemini
   */
  async sendToolResponse(
    conversationHistory: Array<{ role: string; parts: any[] }>,
    toolResults: Array<{ functionResponse: { name: string; response: any } }>,
  ): Promise<string> {
    try {
      // Don't include tool results in history - send them directly
      const chat = this.model.startChat({
        history: conversationHistory,
      });

      const result = await chat.sendMessage(toolResults);
      return result.response.text();
    } catch (error) {
      this.logger.error('Error sending tool response:', error);
      throw new Error('Failed to process tool response');
    }
  }

  /**
   * Define CRM tool schemas for Gemini function calling
   */
  getCRMTools(): FunctionDeclaration[] {
    return [
      {
        name: 'contacts_list',
        description:
          'List all contacts for the current user. Returns contact details including name, email, phone, company.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {},
          required: [],
        },
      },
      {
        name: 'contacts_create',
        description: 'Create a new contact with provided details.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            firstName: { type: 'STRING' as any, description: 'REQUIRED: First name' },
            lastName: { type: 'STRING' as any, description: 'Optional: Last name' },
            email: { type: 'STRING' as any, description: 'Optional: Email address' },
            phone: { type: 'STRING' as any, description: 'Optional: Phone number' },
            company: { type: 'STRING' as any, description: 'Optional: Company name' },
            jobTitle: { type: 'STRING' as any, description: 'Optional: Job title' },
            notes: { type: 'STRING' as any, description: 'Optional: Additional notes' },
          },
          required: ['firstName'],
        },
      },
      {
        name: 'deals_list',
        description:
          'List all deals for the current user. Returns deal title, value, stage, contact info.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            pipelineId: {
              type: 'STRING' as any,
              description: 'Optional: Filter by pipeline ID',
            },
          },
          required: [],
        },
      },
      {
        name: 'deals_create',
        description: 'Create a new deal. MUST provide pipelineId and stageId - call pipelines_list first to get available pipelines, then stages_list to get stages for that pipeline.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any, description: 'REQUIRED: Deal title' },
            contactId: { type: 'STRING' as any, description: 'REQUIRED: Associated contact ID' },
            pipelineId: { type: 'STRING' as any, description: 'REQUIRED: Pipeline ID (use pipelines_list to get available pipelines)' },
            stageId: { type: 'STRING' as any, description: 'REQUIRED: Initial stage ID (use stages_list with pipelineId to get stages)' },
            value: { type: 'NUMBER' as any, description: 'Optional: Deal value in dollars' },
            probability: { type: 'NUMBER' as any, description: 'Optional: Win probability (0-100)' },
            expectedCloseDate: { type: 'STRING' as any, description: 'Optional: Expected close date (ISO format)' },
            notes: { type: 'STRING' as any, description: 'Optional: Additional notes' },
          },
          required: ['title', 'contactId', 'pipelineId', 'stageId'],
        },
      },
      {
        name: 'leads_list',
        description:
          'List all leads for the current user. Returns lead title, status, source, contact info.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            status: {
              type: 'STRING' as any,
              description:
                'Optional: Filter by status (NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED)',
            },
          },
          required: [],
        },
      },
      {
        name: 'leads_convert',
        description: 'Convert a lead to a deal. MUST provide pipelineId and stageId - use pipelines_list and stages_list to get them. The deal will inherit title and value from the lead.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            leadId: { type: 'STRING' as any, description: 'REQUIRED: Lead ID to convert' },
            pipelineId: { type: 'STRING' as any, description: 'REQUIRED: Pipeline ID (use pipelines_list)' },
            stageId: { type: 'STRING' as any, description: 'REQUIRED: Initial stage ID (use stages_list)' },
            probability: { type: 'NUMBER' as any, description: 'Optional: Win probability (0-100)' },
            expectedCloseDate: { type: 'STRING' as any, description: 'Optional: Expected close date (ISO format)' },
          },
          required: ['leadId', 'pipelineId', 'stageId'],
        },
      },
      {
        name: 'tickets_list',
        description:
          'List all support tickets. Returns ticket title, status, priority, contact info.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            status: {
              type: 'STRING' as any,
              description:
                'Optional: Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)',
            },
            priority: {
              type: 'STRING' as any,
              description:
                'Optional: Filter by priority (LOW, MEDIUM, HIGH, URGENT)',
            },
          },
          required: [],
        },
      },
      {
        name: 'tickets_create',
        description: 'Create a new support ticket.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any, description: 'REQUIRED: Ticket title (min 5 characters)' },
            description: { type: 'STRING' as any, description: 'Optional: Ticket description (min 10 characters if provided)' },
            priority: { type: 'STRING' as any, description: 'REQUIRED: Priority level (LOW, MEDIUM, HIGH, URGENT)' },
            source: { type: 'STRING' as any, description: 'REQUIRED: Ticket source (EMAIL, PHONE, CHAT, PORTAL, WEB_FORM, SOCIAL_MEDIA, OTHER)' },
            contactId: { type: 'STRING' as any, description: 'REQUIRED: Associated contact ID' },
            dealId: { type: 'STRING' as any, description: 'Optional: Associated deal ID' },
            assignedUserId: { type: 'STRING' as any, description: 'Optional: User ID to assign ticket to' },
          },
          required: ['title', 'priority', 'source', 'contactId'],
        },
      },
      {
        name: 'analytics_dashboard',
        description:
          'Get dashboard analytics including contact count, deal count, revenue, win rate.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {},
          required: [],
        },
      },
      {
        name: 'pipelines_list',
        description: 'List all sales pipelines. Use this to get pipelineId when creating deals.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {},
          required: [],
        },
      },
      {
        name: 'stages_list',
        description: 'List all stages in a pipeline. Use this to get stageId when creating deals. If no pipelineId provided, returns stages for the first available pipeline.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            pipelineId: {
              type: 'STRING' as any,
              description: 'Optional: Pipeline ID to get stages for',
            },
          },
          required: [],
        },
      },
      // ===== NEW CRUD OPERATIONS =====
      {
        name: 'contacts_update',
        description: 'Update an existing contact details.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            contactId: { type: 'STRING' as any, description: 'Contact ID to update' },
            firstName: { type: 'STRING' as any, description: 'First name' },
            lastName: { type: 'STRING' as any, description: 'Last name' },
            email: { type: 'STRING' as any, description: 'Email address' },
            phone: { type: 'STRING' as any, description: 'Phone number' },
            company: { type: 'STRING' as any, description: 'Company name' },
            jobTitle: { type: 'STRING' as any, description: 'Job title' },
          },
          required: ['contactId'],
        },
      },
      {
        name: 'contacts_delete',
        description: 'Delete a contact permanently. Use with caution.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            contactId: { type: 'STRING' as any, description: 'Contact ID to delete' },
          },
          required: ['contactId'],
        },
      },
      {
        name: 'contacts_search',
        description: 'Search contacts by name, email, company, or phone. Supports partial matching.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            query: { type: 'STRING' as any, description: 'Search query (name, email, company, phone)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'deals_update',
        description: 'Update deal details like title, value, or probability.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            dealId: { type: 'STRING' as any, description: 'Deal ID to update' },
            title: { type: 'STRING' as any, description: 'Deal title' },
            value: { type: 'NUMBER' as any, description: 'Deal value in dollars' },
            probability: { type: 'NUMBER' as any, description: 'Win probability (0-100)' },
          },
          required: ['dealId'],
        },
      },
      {
        name: 'deals_delete',
        description: 'Delete a deal permanently. Use with caution.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            dealId: { type: 'STRING' as any, description: 'Deal ID to delete' },
          },
          required: ['dealId'],
        },
      },
      {
        name: 'deals_move',
        description: 'Move a deal to a different stage in the pipeline.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            dealId: { type: 'STRING' as any, description: 'Deal ID to move' },
            stageId: { type: 'STRING' as any, description: 'Target stage ID' },
          },
          required: ['dealId', 'stageId'],
        },
      },
      {
        name: 'leads_update',
        description: 'Update lead details like status, source, or estimated value.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            leadId: { type: 'STRING' as any, description: 'REQUIRED: Lead ID to update' },
            title: { type: 'STRING' as any, description: 'Optional: Lead title' },
            contactId: { type: 'STRING' as any, description: 'Optional: Associated contact ID' },
            status: { type: 'STRING' as any, description: 'Optional: Status (NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED)' },
            source: { type: 'STRING' as any, description: 'Optional: Lead source' },
            value: { type: 'NUMBER' as any, description: 'Optional: Estimated value in dollars' },
            notes: { type: 'STRING' as any, description: 'Optional: Additional notes' },
          },
          required: ['leadId'],
        },
      },
      {
        name: 'leads_delete',
        description: 'Delete a lead permanently. Use with caution.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            leadId: { type: 'STRING' as any, description: 'Lead ID to delete' },
          },
          required: ['leadId'],
        },
      },
      {
        name: 'tickets_update',
        description: 'Update ticket status, priority, or assignee.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            ticketId: { type: 'STRING' as any, description: 'Ticket ID to update' },
            title: { type: 'STRING' as any, description: 'Ticket title' },
            description: { type: 'STRING' as any, description: 'Ticket description' },
            status: { type: 'STRING' as any, description: 'Status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)' },
            priority: { type: 'STRING' as any, description: 'Priority (LOW, MEDIUM, HIGH, URGENT)' },
          },
          required: ['ticketId'],
        },
      },
      {
        name: 'tickets_delete',
        description: 'Delete a ticket permanently. Use with caution.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            ticketId: { type: 'STRING' as any, description: 'Ticket ID to delete' },
          },
          required: ['ticketId'],
        },
      },
      // ===== CRITICAL ADDITIONS =====
      {
        name: 'leads_create',
        description: 'Create a new lead. MUST provide contactId (get from contacts_search or contacts_list first), title, and source.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            contactId: { type: 'STRING' as any, description: 'REQUIRED: Associated contact ID. Use contacts_search or contacts_list to find contact first.' },
            title: { type: 'STRING' as any, description: 'REQUIRED: Lead title (e.g., "Software Engineering Lead")' },
            source: { type: 'STRING' as any, description: 'REQUIRED: Lead source (e.g., "Cold Call", "Website", "Referral", "Email Campaign")' },
            value: { type: 'NUMBER' as any, description: 'Optional: Estimated deal value in dollars (e.g., 1000)' },
            notes: { type: 'STRING' as any, description: 'Optional: Additional notes about the lead' },
          },
          required: ['contactId', 'title', 'source'],
        },
      },
      {
        name: 'contacts_get',
        description: 'Get detailed information about a specific contact by ID.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            contactId: { type: 'STRING' as any, description: 'Contact ID' },
          },
          required: ['contactId'],
        },
      },
      {
        name: 'deals_get',
        description: 'Get detailed information about a specific deal by ID.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            dealId: { type: 'STRING' as any, description: 'Deal ID' },
          },
          required: ['dealId'],
        },
      },
      {
        name: 'tickets_get',
        description: 'Get detailed information about a specific ticket including comments.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            ticketId: { type: 'STRING' as any, description: 'Ticket ID' },
          },
          required: ['ticketId'],
        },
      },

      {
        name: 'analytics_revenue',
        description: 'Get detailed revenue analytics with forecasts, trends, and breakdown by pipeline.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            timeRange: { type: 'STRING' as any, description: 'Time range (THIS_MONTH, LAST_MONTH, THIS_QUARTER, THIS_YEAR)' },
          },
          required: [],
        },
      },
      {
        name: 'users_list',
        description: 'List all users in the workspace with their roles and status (ADMIN only).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            role: { type: 'STRING' as any, description: 'Filter by role (ADMIN, MANAGER, MEMBER)' },
          },
          required: [],
        },
      },
      {
        name: 'leads_get',
        description: 'Get detailed information about a specific lead by ID.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            leadId: { type: 'STRING' as any, description: 'Lead ID' },
          },
          required: ['leadId'],
        },
      },
      {
        name: 'tickets_comment',
        description: 'Add a comment to a support ticket.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            ticketId: { type: 'STRING' as any, description: 'Ticket ID' },
            comment: { type: 'STRING' as any, description: 'Comment text' },
          },
          required: ['ticketId', 'comment'],
        },
      },
      {
        name: 'tickets_assign',
        description: 'Assign a ticket to a specific user.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            ticketId: { type: 'STRING' as any, description: 'Ticket ID' },
            userId: { type: 'STRING' as any, description: 'User ID to assign to' },
          },
          required: ['ticketId', 'userId'],
        },
      },
      {
        name: 'analytics_pipeline',
        description: 'Get pipeline conversion analytics including conversion rates by stage.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            pipelineId: { type: 'STRING' as any, description: 'Pipeline ID to analyze (optional)' },
          },
          required: [],
        },
      },
      {
        name: 'users_get',
        description: 'Get detailed information about a specific user (ADMIN only).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            userId: { type: 'STRING' as any, description: 'User ID' },
          },
          required: ['userId'],
        },
      },
      {
        name: 'users_invite',
        description: 'Invite a new user to the workspace by email (ADMIN only).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            email: { type: 'STRING' as any, description: 'Email address of user to invite' },
            role: { type: 'STRING' as any, description: 'Role to assign (ADMIN, MANAGER, MEMBER)' },
            firstName: { type: 'STRING' as any, description: 'First name' },
            lastName: { type: 'STRING' as any, description: 'Last name' },
          },
          required: ['email', 'role'],
        },
      },
      {
        name: 'users_update_role',
        description: 'Update a user\'s role in the workspace (ADMIN only).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            userId: { type: 'STRING' as any, description: 'User ID' },
            role: { type: 'STRING' as any, description: 'New role (ADMIN, MANAGER, MEMBER)' },
          },
          required: ['userId', 'role'],
        },
      },
      {
        name: 'users_deactivate',
        description: 'Deactivate a user account (ADMIN only).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            userId: { type: 'STRING' as any, description: 'User ID to deactivate' },
          },
          required: ['userId'],
        },
      },
      {
        name: 'pipelines_create',
        description: 'Create a new sales pipeline (ADMIN only).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            name: { type: 'STRING' as any, description: 'Pipeline name' },
            description: { type: 'STRING' as any, description: 'Pipeline description' },
          },
          required: ['name'],
        },
      },
      {
        name: 'pipelines_update',
        description: 'Update an existing pipeline (ADMIN only).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            pipelineId: { type: 'STRING' as any, description: 'Pipeline ID' },
            name: { type: 'STRING' as any, description: 'New pipeline name' },
            description: { type: 'STRING' as any, description: 'New description' },
          },
          required: ['pipelineId'],
        },
      },
      {
        name: 'pipelines_delete',
        description: 'Delete a pipeline permanently (ADMIN only). Use with caution.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            pipelineId: { type: 'STRING' as any, description: 'Pipeline ID to delete' },
          },
          required: ['pipelineId'],
        },
      },
      {
        name: 'stages_create',
        description: 'Create a new stage in a pipeline (ADMIN only).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            pipelineId: { type: 'STRING' as any, description: 'Pipeline ID' },
            name: { type: 'STRING' as any, description: 'Stage name' },
            order: { type: 'NUMBER' as any, description: 'Stage order/position' },
          },
          required: ['pipelineId', 'name', 'order'],
        },
      },
      {
        name: 'stages_update',
        description: 'Update an existing stage (ADMIN only).',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            stageId: { type: 'STRING' as any, description: 'Stage ID' },
            name: { type: 'STRING' as any, description: 'New stage name' },
            order: { type: 'NUMBER' as any, description: 'New stage order' },
          },
          required: ['stageId'],
        },
      },
      {
        name: 'portal_customers_list',
        description: 'List all customer portal users.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            status: { type: 'STRING' as any, description: 'Filter by status (ACTIVE, INACTIVE)' },
          },
          required: [],
        },
      },
      {
        name: 'portal_tickets_list',
        description: 'List tickets submitted through the customer portal.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            customerId: { type: 'STRING' as any, description: 'Filter by customer ID' },
            status: { type: 'STRING' as any, description: 'Filter by status (OPEN, RESOLVED)' },
          },
          required: [],
        },
      },
      {
        name: 'portal_tickets_create',
        description: 'Create a ticket from the customer portal.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            customerId: { type: 'STRING' as any, description: 'Customer portal ID' },
            title: { type: 'STRING' as any, description: 'Ticket title' },
            description: { type: 'STRING' as any, description: 'Issue description' },
            priority: { type: 'STRING' as any, description: 'Priority (LOW, MEDIUM, HIGH)' },
          },
          required: ['customerId', 'title', 'description'],
        },
      },
    ];
  }
}
