import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  OsTicketConfig,
  OsTicketTicket,
  CreateOsTicketRequest,
  CreateOsTicketResponse,
  OsTicketReplyRequest,
  OsTicketUpdateRequest,
} from '../interfaces/osticket-types';

/**
 * osTicket API Client Service
 * Handles all HTTP communication with osTicket REST API
 *
 * API Documentation: https://github.com/osTicket/plugin-api
 */
@Injectable()
export class OsTicketApiService {
  private readonly logger = new Logger(OsTicketApiService.name);
  private axiosInstance: AxiosInstance | null = null;
  private config: OsTicketConfig | null = null;

  constructor() {
    // Auto-initialize from environment variables if configured
    this.initializeFromEnv();
  }

  /**
   * Initialize from environment variables (global config for all tenants)
   */
  private initializeFromEnv() {
    const enabled = process.env.OSTICKET_ENABLED === 'true';
    const baseUrl = process.env.OSTICKET_BASE_URL;
    const apiKey = process.env.OSTICKET_API_KEY;

    if (enabled && baseUrl && apiKey) {
      this.logger.log('Initializing osTicket from environment variables');
      this.initialize({ baseUrl, apiKey, isActive: true });
    }
  }

  /**
   * Initialize the osTicket API client with configuration
   */
  initialize(config: OsTicketConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl.endsWith('/api')
        ? config.baseUrl
        : `${config.baseUrl}/api`,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    this.logger.log(`osTicket API initialized: ${config.baseUrl}`);
  }

  /**
   * Check if osTicket is configured and ready
   */
  isConfigured(): boolean {
    return this.axiosInstance !== null;
  }

  /**
   * Test connection to osTicket
   */
  async testConnection(): Promise<boolean> {
    if (!this.axiosInstance) {
      throw new HttpException(
        'osTicket API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Try to fetch tickets (limit 1) to test connection
      const response = await this.axiosInstance.get('/tickets.json', {
        params: { limit: 1 },
      });
      return response.status === 200;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('osTicket connection test failed:', errorMsg);
      return false;
    }
  }

  /**
   * Create a new ticket in osTicket
   */
  async createTicket(
    request: CreateOsTicketRequest,
  ): Promise<CreateOsTicketResponse> {
    if (!this.axiosInstance) {
      throw new HttpException(
        'osTicket API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await this.axiosInstance.post<CreateOsTicketResponse>(
        '/tickets.json',
        request,
      );

      this.logger.log(
        `Created osTicket ticket: ${response.data.number} (ID: ${response.data.ticket_id})`,
      );

      return response.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to create osTicket ticket:', errorMsg);
      throw new HttpException(
        `Failed to create osTicket ticket: ${errorMsg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get a ticket from osTicket by ticket number
   */
  async getTicket(ticketNumber: string): Promise<OsTicketTicket> {
    if (!this.axiosInstance) {
      throw new HttpException(
        'osTicket API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await this.axiosInstance.get<OsTicketTicket>(
        `/tickets/${ticketNumber}.json`,
      );

      return response.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get osTicket ticket ${ticketNumber}:`,
        errorMsg,
      );
      throw new HttpException(
        `Failed to get osTicket ticket: ${errorMsg}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Add a reply/comment to an osTicket ticket
   */
  async addReply(
    ticketNumber: string,
    request: OsTicketReplyRequest,
  ): Promise<void> {
    if (!this.axiosInstance) {
      throw new HttpException(
        'osTicket API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.axiosInstance.post(
        `/tickets/${ticketNumber}/reply.json`,
        request,
      );

      this.logger.log(`Added reply to osTicket ticket ${ticketNumber}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to add reply to osTicket ticket ${ticketNumber}:`,
        errorMsg,
      );
      throw new HttpException(
        `Failed to add reply: ${errorMsg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update an osTicket ticket (status, priority, assignee, etc.)
   */
  async updateTicket(
    ticketNumber: string,
    request: OsTicketUpdateRequest,
  ): Promise<void> {
    if (!this.axiosInstance) {
      throw new HttpException(
        'osTicket API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.axiosInstance.put(`/tickets/${ticketNumber}.json`, request);

      this.logger.log(`Updated osTicket ticket ${ticketNumber}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to update osTicket ticket ${ticketNumber}:`,
        errorMsg,
      );
      throw new HttpException(
        `Failed to update osTicket: ${errorMsg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * List tickets from osTicket with optional filters
   */
  async listTickets(params?: {
    status?: number;
    limit?: number;
    offset?: number;
  }): Promise<OsTicketTicket[]> {
    if (!this.axiosInstance) {
      throw new HttpException(
        'osTicket API not initialized',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await this.axiosInstance.get<OsTicketTicket[]>(
        '/tickets.json',
        { params },
      );

      return response.data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to list osTicket tickets:', errorMsg);
      throw new HttpException(
        `Failed to list osTicket tickets: ${errorMsg}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Close an osTicket ticket
   */
  async closeTicket(ticketNumber: string): Promise<void> {
    await this.updateTicket(ticketNumber, {
      status: 3, // Closed status
    });
  }

  /**
   * Check if API is initialized
   */
  isInitialized(): boolean {
    return this.axiosInstance !== null && this.config !== null;
  }

  /**
   * Get current configuration
   */
  getConfig(): OsTicketConfig | null {
    return this.config;
  }
}
