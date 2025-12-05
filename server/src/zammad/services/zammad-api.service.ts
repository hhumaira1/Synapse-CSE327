import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

// Zammad API Types
export interface ZammadConfig {
    baseUrl: string;
    apiToken: string;
}

export interface ZammadOrganization {
    id: number;
    name: string;
    active: boolean;
    shared: boolean;
    domain?: string;
    note?: string;
}

export interface ZammadTicket {
    id: number;
    number: string; // Ticket number (e.g., "12345")
    title: string;
    organization_id?: number;
    customer_id: string | number;
    state: string; // 'new', 'open', 'pending reminder', 'pending close', 'closed'
    priority: string; // '1 low', '2 normal', '3 high'
    created_at: string;
    updated_at: string;
}

export interface CreateZammadTicketRequest {
    title: string;
    group: string; // Group name (required)
    customer_id?: string | number; // User ID or email with 'guess:email@example.com'
    organization_id?: number;
    state?: string; // Default: 'new'
    priority?: string; // Default: '2 normal'
    article: {
        subject?: string;
        body: string;
        type: string; // 'note', 'email', 'phone'
        internal: boolean;
    };
}

/**
 * Zammad API Client Service
 * Handles all HTTP communication with Zammad REST API v1
 * 
 * API Documentation: https://docs.zammad.org/en/latest/api/intro.html
 */
@Injectable()
export class ZammadApiService {
    private readonly logger = new Logger(ZammadApiService.name);
    private axiosInstance: AxiosInstance;
    private zammadConfig: ZammadConfig;

    constructor() {
        this.initializeFromEnv();
    }

    /**
     * Initialize from environment variables
     */
    private initializeFromEnv() {
        const baseUrl = process.env.ZAMMAD_URL;
        const apiToken = process.env.ZAMMAD_API_TOKEN;

        if (baseUrl && apiToken) {
            this.initialize({ baseUrl, apiToken });
        } else {
            this.logger.warn('Zammad not configured. Set ZAMMAD_URL and ZAMMAD_API_TOKEN in environment.');
        }
    }

    /**
     * Initialize the Zammad API client with configuration
     */
    initialize(config: ZammadConfig) {
        this.zammadConfig = config;
        this.axiosInstance = axios.create({
            baseURL: config.baseUrl,
            headers: {
                'Authorization': `Token token=${config.apiToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 120000, // 2 minutes timeout for slow operations
        });

        this.logger.log(`Zammad API initialized: ${config.baseUrl}`);
    }

    /**
     * Check if Zammad is configured and ready
     */
    isConfigured(): boolean {
        return !!this.axiosInstance && !!this.zammadConfig;
    }

    /**
     * Get the API token (for SSO purposes)
     */
    getApiToken(): string {
        return this.zammadConfig?.apiToken || '';
    }

    /**
     * Test connection to Zammad
     */
    async testConnection(): Promise<boolean> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.get('/api/v1/users/me');
            this.logger.log('Zammad connection successful');
            return response.status === 200;
        } catch (error) {
            this.logger.error('Zammad connection failed:', error.message);
            return false;
        }
    }

    // ==================== ORGANIZATIONS ====================

    /**
     * Create a new organization in Zammad
     */
    async createOrganization(name: string, domain?: string, note?: string): Promise<ZammadOrganization> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.post('/api/v1/organizations', {
                name,
                domain,
                note,
                active: true,
            });

            this.logger.log(`Created organization in Zammad: ${name} (ID: ${response.data.id})`);
            return response.data;
        } catch (error) {
            this.logger.error('Failed to create organization in Zammad:', error.response?.data || error.message);
            throw new HttpException(
                `Failed to create organization in Zammad: ${error.response?.data?.error || error.message}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Get organization by ID
     */
    async getOrganization(id: number): Promise<ZammadOrganization> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.get(`/api/v1/organizations/${id}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get organization ${id}:`, error.message);
            throw new HttpException('Failed to get organization from Zammad', HttpStatus.NOT_FOUND);
        }
    }

    /**
     * List all organizations
     */
    async listOrganizations(): Promise<ZammadOrganization[]> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.get('/api/v1/organizations');
            return response.data;
        } catch (error) {
            this.logger.error('Failed to list organizations:', error.message);
            throw new HttpException('Failed to list organizations from Zammad', HttpStatus.BAD_REQUEST);
        }
    }

    // ==================== TICKETS ====================

    /**
     * Create a new ticket in Zammad
     */
    async createTicket(request: CreateZammadTicketRequest): Promise<ZammadTicket> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.post('/api/v1/tickets', request);
            this.logger.log(`Created ticket in Zammad: #${response.data.number}`);
            return response.data;
        } catch (error) {
            this.logger.error('Failed to create ticket in Zammad:', error.response?.data || error.message);
            throw new HttpException(
                `Failed to create ticket in Zammad: ${error.response?.data?.error || error.message}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Get ticket details from Zammad
     */
    async getTicket(id: number): Promise<ZammadTicket> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.get(`/api/v1/tickets/${id}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get ticket ${id}:`, error.message);
            throw new HttpException('Failed to get ticket from Zammad', HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Update ticket in Zammad
     */
    async updateTicket(id: number, updates: Partial<ZammadTicket>): Promise<ZammadTicket> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.put(`/api/v1/tickets/${id}`, updates);
            this.logger.log(`Updated ticket in Zammad: #${id}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to update ticket ${id}:`, error.response?.data || error.message);
            throw new HttpException(
                `Failed to update ticket in Zammad: ${error.response?.data?.error || error.message}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Add article (comment) to ticket
     */
    async addArticle(ticketId: number, body: string, internal: boolean = false): Promise<any> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.put(`/api/v1/tickets/${ticketId}`, {
                article: {
                    body,
                    type: 'note',
                    internal,
                },
            });

            this.logger.log(`Added article to ticket #${ticketId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to add article to ticket ${ticketId}:`, error.message);
            throw new HttpException('Failed to add article to ticket in Zammad', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * List tickets for an organization
     */
    async listTicketsByOrganization(organizationId: number): Promise<ZammadTicket[]> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.get('/api/v1/tickets/search', {
                params: {
                    query: `organization_id:${organizationId}`,
                    limit: 100,
                },
            });

            return response.data.tickets || [];
        } catch (error) {
            this.logger.error(`Failed to list tickets for organization ${organizationId}:`, error.message);
            throw new HttpException('Failed to list tickets from Zammad', HttpStatus.BAD_REQUEST);
        }
    }

    // ==================== USERS ====================

    /**
     * Create or get user by email (for customer tickets)
     */
    async getOrCreateUser(email: string, firstname: string, lastname: string, organizationId?: number): Promise<any> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            // Try to find user first
            const searchResponse = await this.axiosInstance.get('/api/v1/users/search', {
                params: { query: email },
            });

            if (searchResponse.data && searchResponse.data.length > 0) {
                return searchResponse.data[0];
            }

            // Create new user
            const createResponse = await this.axiosInstance.post('/api/v1/users', {
                firstname,
                lastname,
                email,
                organization_id: organizationId,
                roles: ['Customer'],
            });

            this.logger.log(`Created user in Zammad: ${email}`);
            return createResponse.data;
        } catch (error) {
            this.logger.error(`Failed to get/create user ${email}:`, error.message);
            throw new HttpException('Failed to get/create user in Zammad', HttpStatus.BAD_REQUEST);
        }
    }

    // ==================== SSO & AUTO-LOGIN ====================

    /**
     * Create one-time auto-login token for user
     * Used for SSO - user clicks link in CRM, auto-logs into Zammad
     * 
     * Note: Zammad requires using the admin API token for authentication.
     * Returns the admin token which will be used with username parameter.
     */
    async createAutoLoginToken(zammadUserId: number): Promise<string> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            // Verify user exists in Zammad first
            const user = await this.getUser(zammadUserId);
            if (!user) {
                throw new HttpException('User not found in Zammad', HttpStatus.NOT_FOUND);
            }

            // Return the admin API token (will be used with username for auth)
            const token = this.getApiToken();
            
            this.logger.log(`Generated auto-login credentials for user ${zammadUserId} (${user.email})`);
            return token;
        } catch (error) {
            this.logger.error(`Failed to create auto-login token for user ${zammadUserId}:`, error.response?.data || error.message);
            throw new HttpException(
                `Failed to create login token: ${error.message}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Search for user by email
     */
    async searchUserByEmail(email: string): Promise<any> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.get('/api/v1/users/search', {
                params: { query: email },
            });

            if (response.data && response.data.length > 0) {
                return response.data[0];
            }

            return null;
        } catch (error) {
            this.logger.error(`Failed to search user by email:`, error.message);
            return null;
        }
    }

    /**
     * Get user by ID
     */
    async getUser(userId: number): Promise<any> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.get(`/api/v1/users/${userId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to get user ${userId}:`, error.message);
            throw new HttpException('Failed to get user from Zammad', HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Update user
     */
    async updateUser(userId: number, updates: any): Promise<any> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.put(`/api/v1/users/${userId}`, updates);
            this.logger.log(`Updated user ${userId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to update user ${userId}:`, error.message);
            throw new HttpException('Failed to update user in Zammad', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Create user
     */
    async createUser(userData: {
        firstname: string;
        lastname: string;
        email: string;
        organization_id?: number;
        roles?: string[];
        group_ids?: number[];
    }): Promise<any> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.post('/api/v1/users', userData);
            this.logger.log(`Created user ${userData.email}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to create user:`, error.message);
            throw new HttpException('Failed to create user in Zammad', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Get all roles
     */
    async getRoles(): Promise<any[]> {
        if (!this.isConfigured()) {
            throw new HttpException('Zammad not configured', HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            const response = await this.axiosInstance.get('/api/v1/roles');
            return response.data;
        } catch (error) {
            this.logger.error('Failed to get roles:', error.message);
            return [];
        }
    }
}
