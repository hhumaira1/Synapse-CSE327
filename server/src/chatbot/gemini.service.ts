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

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in environment variables');
      throw new Error('Missing GEMINI_API_KEY');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.logger.log('Gemini AI initialized successfully');
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
   * Send message to Gemini and get response
   */
  async chat(
    message: string,
    conversationHistory: Array<{
      role: string;
      parts: Array<{ text: string }>;
    }>,
  ): Promise<GeminiResponse> {
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
    } catch (error) {
      this.logger.error('Gemini API error:', error);
      throw new Error('Failed to get response from Gemini AI');
    }
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
            firstName: { type: 'STRING' as any, description: 'First name' },
            lastName: { type: 'STRING' as any, description: 'Last name' },
            email: { type: 'STRING' as any, description: 'Email address' },
            phone: { type: 'STRING' as any, description: 'Phone number' },
            company: { type: 'STRING' as any, description: 'Company name' },
            jobTitle: { type: 'STRING' as any, description: 'Job title' },
          },
          required: ['firstName', 'lastName'],
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
        description: 'Create a new deal with provided details.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any, description: 'Deal title' },
            value: {
              type: 'NUMBER' as any,
              description: 'Deal value in dollars',
            },
            contactId: {
              type: 'STRING' as any,
              description: 'Associated contact ID',
            },
            pipelineId: { type: 'STRING' as any, description: 'Pipeline ID' },
            stageId: { type: 'STRING' as any, description: 'Initial stage ID' },
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
        description: 'Convert a lead to a deal.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            leadId: {
              type: 'STRING' as any,
              description: 'Lead ID to convert',
            },
            dealTitle: {
              type: 'STRING' as any,
              description: 'Title for the new deal',
            },
            dealValue: { type: 'NUMBER' as any, description: 'Deal value' },
            pipelineId: { type: 'STRING' as any, description: 'Pipeline ID' },
            stageId: { type: 'STRING' as any, description: 'Stage ID' },
          },
          required: ['leadId', 'dealTitle', 'pipelineId', 'stageId'],
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
            title: { type: 'STRING' as any, description: 'Ticket title' },
            description: {
              type: 'STRING' as any,
              description: 'Ticket description',
            },
            priority: {
              type: 'STRING' as any,
              description: 'Priority level (LOW, MEDIUM, HIGH, URGENT)',
            },
            contactId: {
              type: 'STRING' as any,
              description: 'Associated contact ID',
            },
          },
          required: ['title', 'description', 'priority', 'contactId'],
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
        name: 'deals_move_stage',
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
            leadId: { type: 'STRING' as any, description: 'Lead ID to update' },
            title: { type: 'STRING' as any, description: 'Lead title' },
            status: { type: 'STRING' as any, description: 'Status (NEW, CONTACTED, QUALIFIED, UNQUALIFIED)' },
            source: { type: 'STRING' as any, description: 'Lead source' },
            estimatedValue: { type: 'NUMBER' as any, description: 'Estimated value' },
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
      {
        name: 'tickets_close',
        description: 'Close a ticket and mark it as resolved.',
        parameters: {
          type: 'OBJECT' as any,
          properties: {
            ticketId: { type: 'STRING' as any, description: 'Ticket ID to close' },
            resolution: { type: 'STRING' as any, description: 'Resolution notes' },
          },
          required: ['ticketId', 'resolution'],
        },
      },
    ];
  }
}
