import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  JiraConfig,
  JiraIssue,
  CreateJiraIssueRequest,
  CreateJiraIssueResponse,
  AddJiraCommentRequest,
  JiraTransition,
} from '../interfaces/jira-types';

/**
 * Jira API Client Service
 * Handles all HTTP communication with Jira Cloud REST API v3
 *
 * API Documentation: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
 */
@Injectable()
export class JiraApiService {
  private readonly logger = new Logger(JiraApiService.name);
  private axiosInstance: AxiosInstance | null = null;
  private config: JiraConfig | null = null;

  constructor() {
    // Auto-initialize from environment variables if configured
    this.initializeFromEnv();
  }

  /**
   * Initialize from environment variables (global config for all tenants)
   */
  private initializeFromEnv() {
    const enabled = process.env.JIRA_ENABLED === 'true';
    const baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;
    const projectKey = process.env.JIRA_PROJECT_KEY;

    if (enabled && baseUrl && email && apiToken && projectKey) {
      this.logger.log('Initializing Jira from environment variables');
      this.initialize({ baseUrl, email, apiToken, projectKey, isActive: true });
    }
  }

  /**
   * Initialize the Jira API client with configuration
   */
  initialize(config: JiraConfig) {
    this.config = config;

    // Create Basic Auth header
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      'base64',
    );

    this.axiosInstance = axios.create({
      baseURL: `${config.baseUrl}/rest/api/3`,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    this.logger.log(`Jira API initialized: ${config.baseUrl}`);
  }

  /**
   * Check if Jira is configured and ready
   */
  isConfigured(): boolean {
    return this.axiosInstance !== null;
  }

  /**
   * Test connection to Jira
   */
  async testConnection(): Promise<boolean> {
    if (!this.axiosInstance || !this.config) {
      throw new HttpException(
        'Jira API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Try to fetch project info to test connection
      const response = await this.axiosInstance.get(
        `/project/${this.config.projectKey}`,
      );
      return response.status === 200;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Jira connection test failed:', errorMsg);
      return false;
    }
  }

  /**
   * Create a new issue in Jira
   */
  async createIssue(
    request: CreateJiraIssueRequest,
  ): Promise<CreateJiraIssueResponse> {
    if (!this.axiosInstance) {
      throw new HttpException(
        'Jira API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      this.logger.log(
        `Creating Jira issue: ${request.fields.summary}`,
      );

      const response =
        await this.axiosInstance.post<CreateJiraIssueResponse>(
          '/issue',
          request,
        );

      this.logger.log(`Jira issue created: ${response.data.key}`);
      return response.data;
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.errorMessages?.join(', ') ||
        error?.message ||
        'Unknown error';
      this.logger.error('Failed to create Jira issue:', errorMsg);
      throw new HttpException(
        `Failed to create Jira issue: ${errorMsg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get issue details from Jira
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    if (!this.axiosInstance) {
      throw new HttpException(
        'Jira API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await this.axiosInstance.get<JiraIssue>(
        `/issue/${issueKey}`,
      );
      return response.data;
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.errorMessages?.join(', ') ||
        error?.message ||
        'Unknown error';
      this.logger.error(`Failed to get Jira issue ${issueKey}:`, errorMsg);
      throw new HttpException(
        `Failed to get Jira issue: ${errorMsg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update issue (change priority, etc.)
   */
  async updateIssue(issueKey: string, fields: any): Promise<void> {
    if (!this.axiosInstance) {
      throw new HttpException(
        'Jira API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.axiosInstance.put(`/issue/${issueKey}`, { fields });
      this.logger.log(`Jira issue ${issueKey} updated`);
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.errorMessages?.join(', ') ||
        error?.message ||
        'Unknown error';
      this.logger.error(`Failed to update Jira issue ${issueKey}:`, errorMsg);
      throw new HttpException(
        `Failed to update Jira issue: ${errorMsg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Transition issue to new status
   */
  async transitionIssue(issueKey: string, statusName: string): Promise<void> {
    if (!this.axiosInstance) {
      throw new HttpException(
        'Jira API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Get available transitions
      const transitionsResponse = await this.axiosInstance.get<{
        transitions: JiraTransition[];
      }>(`/issue/${issueKey}/transitions`);

      const availableTransitions = transitionsResponse.data.transitions;

      // Find the transition that matches the target status
      const transition = availableTransitions.find(
        (t) => t.to.name.toLowerCase() === statusName.toLowerCase(),
      );

      if (!transition) {
        const availableStatuses = availableTransitions
          .map((t) => t.to.name)
          .join(', ');
        this.logger.warn(
          `Transition to "${statusName}" not available for ${issueKey}. Available: ${availableStatuses}`,
        );
        throw new HttpException(
          `Status "${statusName}" is not available. Available transitions: ${availableStatuses}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Execute transition
      await this.axiosInstance.post(`/issue/${issueKey}/transitions`, {
        transition: { id: transition.id },
      });

      this.logger.log(`Jira issue ${issueKey} transitioned to ${statusName}`);
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.errorMessages?.join(', ') ||
        error?.message ||
        'Unknown error';
      this.logger.error(
        `Failed to transition Jira issue ${issueKey}:`,
        errorMsg,
      );
      throw new HttpException(
        `Failed to transition Jira issue: ${errorMsg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Add comment to issue
   */
  async addComment(
    issueKey: string,
    comment: string,
  ): Promise<void> {
    if (!this.axiosInstance) {
      throw new HttpException(
        'Jira API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const request: AddJiraCommentRequest = {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: comment,
                },
              ],
            },
          ],
        },
      };

      await this.axiosInstance.post(
        `/issue/${issueKey}/comment`,
        request,
      );

      this.logger.log(`Comment added to Jira issue ${issueKey}`);
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.errorMessages?.join(', ') ||
        error?.message ||
        'Unknown error';
      this.logger.error(
        `Failed to add comment to Jira issue ${issueKey}:`,
        errorMsg,
      );
      throw new HttpException(
        `Failed to add comment to Jira issue: ${errorMsg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * List issues in project (for syncing)
   */
  async listIssues(maxResults: number = 100): Promise<JiraIssue[]> {
    if (!this.axiosInstance || !this.config) {
      throw new HttpException(
        'Jira API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await this.axiosInstance.get<{ issues: JiraIssue[] }>(
        '/search',
        {
          params: {
            jql: `project = ${this.config.projectKey} ORDER BY created DESC`,
            maxResults,
          },
        },
      );

      return response.data.issues;
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.errorMessages?.join(', ') ||
        error?.message ||
        'Unknown error';
      this.logger.error('Failed to list Jira issues:', errorMsg);
      throw new HttpException(
        `Failed to list Jira issues: ${errorMsg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get project key
   */
  getProjectKey(): string | null {
    return this.config?.projectKey || null;
  }
}
