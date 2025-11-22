import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JiraWebhookService } from '../services/jira-webhook.service';

/**
 * Jira Webhooks Controller
 * Receives webhook events from Jira Cloud for real-time bidirectional sync
 * 
 * Setup in Jira:
 * 1. Go to Settings → System → Webhooks
 * 2. Create webhook: https://your-domain.com/api/jira/webhooks
 * 3. Select events: Issue (created, updated, deleted), Comment (created, updated, deleted)
 * 4. Add webhook secret in Jira settings and update JIRA_WEBHOOK_SECRET in .env
 */
@Controller('jira/webhooks')
export class JiraWebhooksController {
  private readonly logger = new Logger(JiraWebhooksController.name);

  constructor(private readonly webhookService: JiraWebhookService) {}

  /**
   * Handle incoming webhook events from Jira
   * Public endpoint (no auth guard) - validated via webhook secret
   */
  @Post()
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-atlassian-webhook-identifier') webhookId: string,
    @Headers('x-hub-signature') signature?: string,
  ) {
    this.logger.log(`Received Jira webhook: ${payload.webhookEvent}`);

    // Verify webhook authenticity
    const isValid = await this.webhookService.verifyWebhook(
      payload,
      webhookId,
      signature,
    );

    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    try {
      // Route to appropriate handler based on event type
      const { webhookEvent } = payload;

      switch (webhookEvent) {
        case 'jira:issue_created':
          await this.webhookService.handleIssueCreated(payload);
          break;

        case 'jira:issue_updated':
          await this.webhookService.handleIssueUpdated(payload);
          break;

        case 'jira:issue_deleted':
          await this.webhookService.handleIssueDeleted(payload);
          break;

        case 'comment_created':
          await this.webhookService.handleCommentCreated(payload);
          break;

        case 'comment_updated':
          await this.webhookService.handleCommentUpdated(payload);
          break;

        case 'comment_deleted':
          await this.webhookService.handleCommentDeleted(payload);
          break;

        default:
          this.logger.log(`Unhandled webhook event: ${webhookEvent}`);
      }

      return { 
        received: true, 
        event: webhookEvent,
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      this.logger.error('Failed to process webhook:', error);
      throw new HttpException(
        'Failed to process webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Test endpoint to verify webhook connectivity
   */
  @Post('test')
  async testWebhook(@Body() payload: any) {
    this.logger.log('Test webhook received:', JSON.stringify(payload, null, 2));
    return { 
      success: true, 
      message: 'Webhook endpoint is accessible',
      receivedAt: new Date().toISOString() 
    };
  }
}
