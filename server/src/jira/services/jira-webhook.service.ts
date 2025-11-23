import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  TicketStatus,
  TicketPriority,
} from 'prisma/generated/client';
import {
  JIRA_TO_INTERNAL_STATUS,
  JIRA_TO_INTERNAL_PRIORITY,
} from '../interfaces/jira-types';
import * as crypto from 'crypto';

/* Jira Webhook Service */
@Injectable()
export class JiraWebhookService {
  private readonly logger = new Logger(JiraWebhookService.name);
  private readonly webhookSecret = process.env.JIRA_WEBHOOK_SECRET;

  constructor(private readonly prisma: PrismaService) {}

  /* Verify webhook authenticity
   * Uses webhook secret from environment variables*/
  async verifyWebhook(
    payload: any,
    webhookId: string,
    signature?: string,
  ): Promise<boolean> {
    // If no secret configured, skip verification (dev mode)
    if (!this.webhookSecret) {
      this.logger.warn(
        'JIRA_WEBHOOK_SECRET not set - skipping signature verification',
      );
      return true;
    }

    // Verify signature if provided
    if (signature) {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const expectedSignature = hmac
        .update(JSON.stringify(payload))
        .digest('hex');

      return signature === `sha256=${expectedSignature}`;
    }

    // Verify webhook ID matches configured secret (simpler method)
    return webhookId === this.webhookSecret;
  }

  /**
   * Handle issue created in Jira
   * Sync to local database if not already cached
   */
  async handleIssueCreated(payload: any): Promise<void> {
    const { issue } = payload;
    const issueKey = issue.key;

    this.logger.log(`Processing issue created: ${issueKey}`);

    try {
      // Check if already exists in cache
      const existingTicket = await this.prisma.ticket.findFirst({
        where: {
          externalId: issueKey,
          externalSystem: 'jira',
        },
      });

      if (existingTicket) {
        this.logger.log(`Issue ${issueKey} already exists in cache`);
        return;
      }

      // Note: We don't auto-create tickets from Jira webhooks
      // Only tickets created via our API are cached
      // This prevents duplicate entries from external Jira issues
      this.logger.log(
        `Issue ${issueKey} created externally - skipping cache creation`,
      );
    } catch (error) {
      this.logger.error(`Failed to handle issue created:`, error);
      throw error;
    }
  }

  /**
   * Handle issue updated in Jira
   * Update cached ticket with latest data
   */
  async handleIssueUpdated(payload: any): Promise<void> {
    const { issue, changelog } = payload;
    const issueKey = issue.key;

    this.logger.log(`Processing issue updated: ${issueKey}`);

    try {
      // Find cached ticket
      const ticket = await this.prisma.ticket.findFirst({
        where: {
          externalId: issueKey,
          externalSystem: 'jira',
        },
      });

      if (!ticket) {
        this.logger.log(`Issue ${issueKey} not in cache - ignoring update`);
        return;
      }

      // Extract updated fields from changelog
      const updateData: any = {};

      // Check for status change
      if (issue.fields?.status?.name) {
        const internalStatus =
          JIRA_TO_INTERNAL_STATUS[issue.fields.status.name];
        if (internalStatus) {
          updateData.status = internalStatus as TicketStatus;
          this.logger.log(
            `Status changed: ${issue.fields.status.name} → ${internalStatus}`,
          );
        }
      }

      // Check for priority change
      if (issue.fields?.priority?.name) {
        const internalPriority =
          JIRA_TO_INTERNAL_PRIORITY[issue.fields.priority.name];
        if (internalPriority) {
          updateData.priority = internalPriority as TicketPriority;
          this.logger.log(
            `Priority changed: ${issue.fields.priority.name} → ${internalPriority}`,
          );
        }
      }

      // Check for summary (title) change
      if (issue.fields?.summary) {
        updateData.title = issue.fields.summary;
      }

      // Check for description change
      if (issue.fields?.description) {
        const descriptionText = this.extractTextFromADF(
          issue.fields.description,
        );
        if (descriptionText) {
          updateData.description = descriptionText;
        }
      }

      // Update cached ticket if there are changes
      if (Object.keys(updateData).length > 0) {
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: updateData,
        });

        this.logger.log(
          `Updated cached ticket ${ticket.id} from Jira issue ${issueKey}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle issue updated:`, error);
      throw error;
    }
  }

  /**
   * Handle issue deleted in Jira
   * Remove from cache
   */
  async handleIssueDeleted(payload: any): Promise<void> {
    const { issue } = payload;
    const issueKey = issue.key;

    this.logger.log(`Processing issue deleted: ${issueKey}`);

    try {
      // Find and delete cached ticket
      const ticket = await this.prisma.ticket.findFirst({
        where: {
          externalId: issueKey,
          externalSystem: 'jira',
        },
      });

      if (ticket) {
        await this.prisma.ticket.delete({
          where: { id: ticket.id },
        });

        this.logger.log(
          `Deleted cached ticket ${ticket.id} (Jira issue ${issueKey} was deleted)`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle issue deleted:`, error);
      throw error;
    }
  }

  /**
   * Handle comment created in Jira
   * Sync comment to local database
   */
  async handleCommentCreated(payload: any): Promise<void> {
    const { issue, comment } = payload;
    const issueKey = issue.key;
    const commentId = comment.id;
    
    // Extract and clean comment text (remove quoted/embedded content)
    const rawText = this.extractTextFromADF(comment.body);
    const commentText = this.cleanCommentText(rawText);

    this.logger.log(`Processing comment created on issue: ${issueKey}`);
    this.logger.log(`Raw comment text: "${rawText}"`);
    this.logger.log(`Cleaned comment text: "${commentText}"`);

    try {
      // Find cached ticket
      const ticket = await this.prisma.ticket.findFirst({
        where: {
          externalId: issueKey,
          externalSystem: 'jira',
        },
      });

      if (!ticket) {
        this.logger.log(`Issue ${issueKey} not in cache - ignoring comment`);
        return;
      }

      // Skip if comment is empty after cleaning
      if (!commentText || commentText.trim().length === 0) {
        this.logger.log(`Comment is empty after cleaning - skipping`);
        return;
      }

      // IMPORTANT: Check if this comment was originated from CRM
      // Comments sent TO Jira have format "email@domain.com: message"
      // When the webhook comes back, we shouldn't sync it back to avoid duplicates
      const recentComments = await this.prisma.ticketComment.findMany({
        where: {
          ticketId: ticket.id,
          createdAt: {
            gte: new Date(Date.now() - 300000), // Within last 5 minutes
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      // Check if any recent comment matches (with or without prefix)
      for (const recentComment of recentComments) {
        // Check exact match
        if (recentComment.content === commentText) {
          this.logger.log(`Comment already exists in DB - skipping webhook sync`);
          return;
        }

        // Check if webhook comment matches a recent comment's content
        // (in case it came back with a different format)
        if (commentText.includes(recentComment.content) && 
            commentText.length - recentComment.content.length < 50) {
          this.logger.log(`Comment appears to be echo of recent CRM comment - skipping`);
          return;
        }

        // Check if a recent comment contains this text (might be the reverse)
        if (recentComment.content.includes(commentText) && 
            recentComment.content.length - commentText.length < 50) {
          this.logger.log(`Comment matches existing CRM comment - skipping`);
          return;
        }
      }

      // Additional check: If cleaned text matches any existing comment content exactly
      const existingComment = await this.prisma.ticketComment.findFirst({
        where: {
          ticketId: ticket.id,
          content: commentText,
          createdAt: {
            gte: new Date(Date.now() - 120000), // Within last 2 minutes
          },
        },
      });

      if (existingComment) {
        this.logger.log(`Exact comment match found - skipping duplicate`);
        return;
      }

      // Create comment in cache with generic "Support Team" name
      await this.prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          content: commentText,
          authorName: 'Support Team', // Generic name for all Jira replies
          isInternal: false,
          // No userId - comment from external Jira user
        },
      });

      this.logger.log(
        `Created comment from Jira on ticket ${ticket.id} (comment ID: ${commentId})`,
      );
    } catch (error) {
      this.logger.error(`Failed to handle comment created:`, error);
      throw error;
    }
  }

  /**
   * Handle comment updated in Jira
   */
  async handleCommentUpdated(payload: any): Promise<void> {
    const { issue, comment } = payload;
    const issueKey = issue.key;

    this.logger.log(`Processing comment updated on issue: ${issueKey}`);

    // For simplicity, we don't update existing comments
    // Could be enhanced to track comment IDs and update them
    this.logger.log(`Comment updates not synced - create new comment instead`);
  }

  /**
   * Handle comment deleted in Jira
   */
  async handleCommentDeleted(payload: any): Promise<void> {
    const { issue, comment } = payload;
    const issueKey = issue.key;

    this.logger.log(`Processing comment deleted on issue: ${issueKey}`);

    // For simplicity, we don't delete comments from cache
    // This preserves audit trail
    this.logger.log(`Comment deletions not synced - preserving audit trail`);
  }

  /**
   * Extract plain text from Atlassian Document Format (ADF)
   * Handles paragraphs, mentions, and other content types
   */
  private extractTextFromADF(adf: any): string {
    if (typeof adf === 'string') {
      return adf;
    }

    if (!adf || !adf.content) {
      return '';
    }

    let text = '';
    for (const node of adf.content) {
      // Handle paragraphs
      if (node.type === 'paragraph' && node.content) {
        let paragraphText = '';
        for (const contentNode of node.content) {
          if (contentNode.type === 'text') {
            paragraphText += contentNode.text;
          } else if (contentNode.type === 'mention' && contentNode.attrs?.text) {
            // Handle @mentions - just include the mention text
            paragraphText += contentNode.attrs.text;
          } else if (contentNode.type === 'inlineCard' && contentNode.attrs?.url) {
            // Handle inline links
            paragraphText += contentNode.attrs.url;
          }
        }
        if (paragraphText.trim()) {
          text += paragraphText.trim() + '\n';
        }
      }
      // Handle code blocks
      else if (node.type === 'codeBlock' && node.content) {
        for (const contentNode of node.content) {
          if (contentNode.type === 'text') {
            text += contentNode.text + '\n';
          }
        }
      }
      // Handle blockquotes (quoted content) - SKIP THESE to avoid duplication
      else if (node.type === 'blockquote') {
        // Skip quoted content - this is likely previous messages
        this.logger.debug('Skipping blockquote content to avoid duplication');
        continue;
      }
    }

    return text.trim();
  }

  /**
   * Clean comment text to remove embedded/quoted previous messages
   * Jira often includes previous comments in the thread
   */
  private cleanCommentText(text: string): string {
    if (!text) return '';

    // Split into lines for processing
    const lines = text.split('\n');
    const cleanedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines at the start
      if (cleanedLines.length === 0 && !trimmedLine) {
        continue;
      }

      // Pattern 1: Skip lines starting with ">" (quoted text)
      if (trimmedLine.startsWith('>')) {
        continue;
      }

      // Pattern 2: Skip "On [date], [name] wrote:" style quotes
      if (/^On .+ wrote:/i.test(trimmedLine)) {
        continue;
      }

      // Pattern 3: Skip horizontal separators
      if (/^[-_]{3,}$/.test(trimmedLine)) {
        continue;
      }

      // Pattern 4: Skip email-style headers (name@domain.com:)
      if (/^[\w.+-]+@[\w.-]+\.\w+\s*:\s*$/i.test(trimmedLine)) {
        continue;
      }

      // Pattern 5: Check if this line looks like "Name: message" or "email: message"
      // BUT only skip if it matches a known pattern of embedded content
      const hasColonPrefix = /^[^:\n]+:\s+.+/.test(trimmedLine);
      
      if (hasColonPrefix && cleanedLines.length === 0) {
        // This is at the start and has a colon - likely embedded header
        // Extract everything after the first colon
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          const contentAfterColon = line.substring(colonIndex + 1).trim();
          
          // If there's actual content after the colon, use that
          if (contentAfterColon) {
            cleanedLines.push(contentAfterColon);
          }
        }
        continue;
      }

      cleanedLines.push(line);
    }

    let cleanedText = cleanedLines.join('\n').trim();

    // Additional cleaning: Remove excessive newlines
    cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');

    // Final safety check: If the text still starts with a pattern like "name:" or "email:",
    // remove everything up to and including the colon
    cleanedText = cleanedText.replace(/^[^:\n]+:\s*/, '');

    return cleanedText.trim();
  }
}
