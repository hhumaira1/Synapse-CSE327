/**
 * MCP Client for Web App
 * Connects to unified MCP server (server_unified.py) which then calls the backend API
 * 
 * Architecture:
 * Frontend (Gemini) → MCP Client → MCP Server (HTTP port 5000) → Backend API (port 3001)
 */

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}

export interface MCPToolResult {
    type: string;
    text: string;
}

export interface MCPResponse {
    result: MCPToolResult[];
}

export class MCPClient {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
    }

    /**
     * Call an MCP tool
     * MCP server handles JWT auth, RBAC, and backend API calls
     */
    async callTool(
        toolName: string,
        arguments_: Record<string, any>,
        jwt: string
    ): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/mcp/call-tool`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    tool_name: toolName,
                    arguments: arguments_,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `MCP call failed: ${response.statusText}`);
            }

            const data: MCPResponse = await response.json();

            // Extract text from result
            if (data.result && data.result.length > 0) {
                return data.result[0].text;
            }

            return '';
        } catch (error) {
            console.error(`MCP tool call failed (${toolName}):`, error);
            throw error;
        }
    }

    /**
     * List all available MCP tools (56 CRM tools)
     */
    async listTools(): Promise<MCPTool[]> {
        try {
            const response = await fetch(`${this.baseUrl}/mcp/tools`);

            if (!response.ok) {
                throw new Error(`Failed to list tools: ${response.statusText}`);
            }

            const data = await response.json();
            return data.tools || [];
        } catch (error) {
            console.error('Failed to list MCP tools:', error);
            return [];
        }
    }

    /**
     * Health check - verify MCP server is running
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });
            return response.ok;
        } catch (error) {
            console.warn('MCP server health check failed:', error);
            return false;
        }
    }
}

// Singleton instance
export const mcpClient = new MCPClient(
    process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:5000'
);
