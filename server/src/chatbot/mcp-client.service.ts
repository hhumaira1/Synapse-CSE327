import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface MCPToolCall {
  tool_name: string;
  arguments: Record<string, any>;
}

export interface MCPResponse {
  result: Array<{
    type: string;
    text: string;
  }>;
}

@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name);
  private readonly mcpServerUrl: string;
  private readonly httpClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.mcpServerUrl = this.configService.get<string>('MCP_SERVER_URL', 'http://localhost:5000');
    
    this.httpClient = axios.create({
      baseURL: this.mcpServerUrl,
      timeout: 30000, // 30 seconds
    });

    this.logger.log(`MCP Client initialized - Server: ${this.mcpServerUrl}`);
  }

  /**
   * Call an MCP tool with JWT authentication
   */
  async callTool(
    toolName: string,
    arguments_: Record<string, any>,
    jwt: string,
  ): Promise<string> {
    try {
      this.logger.log(`Calling MCP tool: ${toolName}`);

      const response = await this.httpClient.post<MCPResponse>(
        '/mcp/call-tool',
        {
          tool_name: toolName,
          arguments: arguments_,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
          },
        },
      );

      if (response.data.result && response.data.result.length > 0) {
        return response.data.result[0].text;
      }

      return '';
    } catch (error) {
      this.logger.error(`MCP tool call failed (${toolName}):`, error.response?.data || error.message);
      throw new Error(`MCP tool ${toolName} failed: ${error.message}`);
    }
  }

  /**
   * List all available MCP tools
   */
  async listTools(): Promise<any[]> {
    try {
      const response = await this.httpClient.get('/mcp/tools');
      return response.data.tools || [];
    } catch (error) {
      this.logger.error('Failed to list MCP tools:', error.message);
      return [];
    }
  }

  /**
   * Health check for MCP server
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      this.logger.warn('MCP server health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get MCP server info
   */
  getMcpServerUrl(): string {
    return this.mcpServerUrl;
  }
}
