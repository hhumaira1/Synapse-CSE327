/**
 * Gemini Client for Web Chatbot
 * Uses Google Generative AI with MCP tools
 */

import { GoogleGenerativeAI, FunctionDeclaration } from '@google/generative-ai';
import { mcpClient, MCPTool } from '../mcp/client';

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export class GeminiMCPClient {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private systemPrompt: string;
    private jwt: string;

    constructor(apiKey: string, jwt: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.jwt = jwt;

        // Strict CRM-focused system prompt matching MCP server guardrails
        this.systemPrompt = `You are SynapseCRM AI Assistant - a specialized chatbot for CRM operations ONLY.

Your sole purpose is helping users manage their CRM data:
- 📇 Contacts (customers, clients, people) - view, create, update, search
- 💼 Deals (sales pipeline, opportunities) - track progress, move stages, forecast revenue
- 🎯 Leads (prospects, potential customers) - qualify, convert to deals
- 🎫 Tickets (support issues) - manage customer support, assign, comment
- 📊 Analytics (reports, dashboards, forecasts) - visualize metrics, track performance
- 👥 Users (workspace management) - invite, manage roles (ADMIN only)
- 🔄 Pipelines & Stages - configure sales workflows

CRITICAL RULES:
1. ONLY answer CRM-related queries. For non-CRM questions, politely decline.
2. When presenting data to users, format it in a user-friendly way:
   - Show names, emails, companies, values, statuses
   - Hide technical fields (IDs, timestamps, tenantIds) from user view
   - BUT extract and store IDs internally for follow-up operations
3. When users ask to "create" or "update" something, use the appropriate MCP tools
4. Always use natural language - be conversational and helpful
5. For ambiguous requests, ask clarifying questions

Example user flow:
User: "Show my contacts"
→ Use contacts_list tool
→ Extract IDs from response
→ Show user-friendly list with names and emails
→ If user says "create a deal with John", use the stored contact ID

You have access to 56 CRM tools via MCP server. Use them to help users accomplish their tasks.`;
    }

    async initialize() {
        // Get tools from MCP server
        const mcpTools = await mcpClient.listTools();

        // Convert MCP tools to Gemini function declarations
        const functionDeclarations: FunctionDeclaration[] = mcpTools.map((tool: MCPTool) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
        }));

        // Initialize model with tools
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: this.systemPrompt,
            tools: [{ functionDeclarations }],
        });
    }

    async chat(message: string, history: ChatMessage[] = []): Promise<string> {
        if (!this.model) {
            await this.initialize();
        }

        // Start chat with history
        const chat = this.model.startChat({ history });

        // Send message
        let result = await chat.sendMessage(message);
        let response = result.response;

        // Handle function calls
        while (response.functionCalls && response.functionCalls.length > 0) {
            const functionCall = response.functionCalls[0];

            // Execute tool via MCP
            const toolResult = await mcpClient.callTool(
                functionCall.name,
                functionCall.args || {},
                this.jwt
            );

            // Send function response back to Gemini
            result = await chat.sendMessage([{
                functionResponse: {
                    name: functionCall.name,
                    response: { result: toolResult },
                },
            }]);

            response = result.response;
        }

        // Return final text response
        return response.text();
    }
}
