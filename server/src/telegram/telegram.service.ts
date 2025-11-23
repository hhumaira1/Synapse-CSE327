import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { TelegramAuthService } from './telegram-auth.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import type { Update } from 'telegraf/types';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf<Context<Update>>;

  constructor(
    private configService: ConfigService,
    private telegramAuthService: TelegramAuthService,
    private chatbotService: ChatbotService,
  ) {
    let token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    this.logger.log(`Initializing Telegram bot... Token found: ${!!token}`);

    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not found. Telegram bot disabled.');
      return;
    }

    // Remove quotes if present (ConfigService might read them as part of the value)
    token = token.replace(/^["']|["']$/g, '');
    this.logger.log(`Token length: ${token.length} characters`);

    this.logger.log('Creating Telegraf instance...');
    this.bot = new Telegraf(token, {
      telegram: {
        apiRoot: 'https://api.telegram.org',
      },
    });
    this.setupHandlers();
    this.logger.log('Telegram bot handlers configured');
  }

  onModuleInit() {
    this.logger.log('onModuleInit called');

    if (!this.bot) {
      this.logger.warn('Telegram bot not initialized - skipping launch');
      return;
    }

    // Check if webhook URL is configured
    const webhookDomain = this.configService.get<string>('TELEGRAM_WEBHOOK_DOMAIN');

    if (webhookDomain) {
      // Webhook mode
      this.logger.log('Using webhook mode with domain: ' + webhookDomain);
      const webhookPath = `/api/telegram/webhook/${this.configService.get<string>('TELEGRAM_BOT_TOKEN')}`;
      const webhookUrl = `${webhookDomain}${webhookPath}`;

      this.bot.telegram
        .setWebhook(webhookUrl, {
          drop_pending_updates: true,
          allowed_updates: ['message', 'callback_query'],
        })
        .then(() => {
          this.logger.log('✅ Telegram webhook set successfully!');
          this.logger.log(`Webhook URL: ${webhookUrl}`);
        })
        .catch((error: Error) => {
          this.logger.error('❌ Failed to set webhook:', error?.message);
        });
    } else {
      // Polling mode (fallback)
      this.logger.log('Using polling mode (webhook domain not configured)');
      this.logger.log('Launching Telegram bot...');

      const launchTimeout = setTimeout(() => {
        this.logger.warn(
          '⚠️ Telegram bot launch taking longer than expected (10s timeout)',
        );
        this.logger.warn(
          'Possible causes: Network issues, firewall blocking, or Telegram API unreachable',
        );
      }, 10000);

      this.bot
        .launch({
          dropPendingUpdates: true,
          allowedUpdates: ['message', 'callback_query'],
        })
        .then(() => {
          clearTimeout(launchTimeout);
          this.logger.log('✅ Telegram bot successfully started and listening!');
        })
        .catch((error: Error) => {
          clearTimeout(launchTimeout);
          const errorMsg = error?.message || 'Unknown error';
          this.logger.error('❌ Failed to start Telegram bot:', errorMsg);

          if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
            this.logger.error('❌ Invalid bot token - check TELEGRAM_BOT_TOKEN');
          } else if (
            errorMsg.includes('ETIMEDOUT') ||
            errorMsg.includes('timeout')
          ) {
            this.logger.error('❌ Connection timeout - Telegram API unreachable');
            this.logger.error(
              '   Check: Internet connection, firewall, proxy settings',
            );
          } else if (
            errorMsg.includes('ENOTFOUND') ||
            errorMsg.includes('getaddrinfo')
          ) {
            this.logger.error('❌ DNS error - Cannot resolve api.telegram.org');
          } else if (errorMsg.includes('ECONNREFUSED')) {
            this.logger.error(
              '❌ Connection refused - Network/firewall blocking',
            );
          }

          this.logger.warn(
            'Server continues without bot (API endpoints still work)',
          );
        });
    }
  }

  private setupHandlers() {
    this.logger.log('Setting up bot handlers...');
    
    // Handle /start command with deep link code
    this.bot.start(async (ctx) => {
      this.logger.log(`📨 Received /start command from ${ctx.from.id}`);
      const telegramId = ctx.from.id.toString();
      const code = ctx.startPayload; // Extract code from /start CODE

      this.logger.log(`Start payload: ${code || 'NONE'}`);

      if (!code) {
        await ctx.reply(
          '👋 Welcome to SynapseCRM Bot!\n\n' +
            'To get started, please link your account:\n' +
            '1. Visit your SynapseCRM dashboard\n' +
            '2. Go to Settings → Integrations\n' +
            '3. Click "Connect Telegram Bot"\n\n' +
            'Then come back and click the link we provide!',
        );
        return;
      }

      try {
        this.logger.log(`Attempting to link account with code: ${code}`);
        // Verify code and link account
        const { userId } = await this.telegramAuthService.verifyAndLinkAccount(
          code,
          telegramId,
          {
            username: ctx.from.username,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
          },
        );

        await ctx.reply(
          '✅ Account linked successfully!\n\n' +
            'You can now manage your CRM with natural language. Try asking:\n' +
            '• "show me my contacts"\n' +
            '• "create a deal for john smith worth $5000"\n' +
            '• "what tickets are open?"\n' +
            '• "show me revenue this month"\n\n' +
            'Just chat naturally - no commands needed! 🚀',
        );

        this.logger.log(
          `Account linked: Telegram ${telegramId} → User ${userId}`,
        );
      } catch (error) {
        this.logger.error('Failed to link account:', error);
        await ctx.reply(
          '❌ Failed to link account. The code may be invalid or expired.\n\n' +
            'Please generate a new link from your dashboard.',
        );
      }
    });

    // Handle all text messages (natural language)
    this.bot.on('text', async (ctx) => {
      this.logger.log(`📨 Received text message from ${ctx.from.id}: "${ctx.message.text}"`);
      const telegramId = ctx.from.id.toString();
      const message = ctx.message.text;

      // Skip if it's a command
      if (message.startsWith('/')) {
        this.logger.log('Skipping command message');
        return;
      }

      try {
        // Get user authentication
        const user =
          await this.telegramAuthService.getUserByTelegramId(telegramId);

        if (!user) {
          await ctx.reply(
            '❌ Please link your account first.\n\n' +
              'Visit your SynapseCRM dashboard:\n' +
              'Settings → Integrations → Connect Telegram Bot',
          );
          return;
        }

        // Show typing indicator
        await ctx.sendChatAction('typing');

        // Create a unique conversation ID for Telegram (separate from web chat)
        const telegramConversationId = `telegram_${telegramId}`;

        // Call ChatbotService (SAME AS WEB!)
        const response = await this.chatbotService.chat(
          { message, conversationId: telegramConversationId },
          user.userId,
          user.tenantId,
        );

        // Format response for Telegram
        const formattedResponse = this.formatResponse(response.response);

        // Send response
        await ctx.reply(formattedResponse, { parse_mode: 'Markdown' });

        // Send suggested actions as inline keyboard (if any)
        if (response.suggestedActions && response.suggestedActions.length > 0) {
          const keyboard = response.suggestedActions
            .slice(0, 3)
            .map((action: { label: string; prompt: string }) => [
              {
                text: action.label,
                callback_data: `action:${action.prompt}`,
              },
            ]);

          await ctx.reply('💡 Quick actions:', {
            reply_markup: {
              inline_keyboard: keyboard,
            },
          });
        }
      } catch (error) {
        this.logger.error('Error processing message:', error);
        await ctx.reply(
          '❌ Sorry, I encountered an error processing your request.\n\n' +
            'Please try again or contact support if the issue persists.',
        );
      }
    });

    // Handle inline keyboard button clicks
    this.bot.on('callback_query', async (ctx) => {
      if (!('data' in ctx.callbackQuery)) return;
      
      const callbackData = ctx.callbackQuery.data;

      if (callbackData?.startsWith('action:')) {
        const prompt = callbackData.replace('action:', '');

        // Acknowledge the button click
        await ctx.answerCbQuery();

        // Process as a new message
        await ctx.reply(`💬 ${prompt}`);

        const telegramId = ctx.from.id.toString();
        const user =
          await this.telegramAuthService.getUserByTelegramId(telegramId);

        if (user) {
          await ctx.sendChatAction('typing');

          // Use same Telegram conversation ID for consistency
          const telegramConversationId = `telegram_${telegramId}`;

          const response = await this.chatbotService.chat(
            { message: prompt, conversationId: telegramConversationId },
            user.userId,
            user.tenantId,
          );

          const formattedResponse = this.formatResponse(response.response);
          await ctx.reply(formattedResponse, { parse_mode: 'Markdown' });
        }
      }
    });
  }

  /**
   * Format chatbot response for Telegram Markdown
   */
  private formatResponse(text: string): string {
    // Escape special Markdown characters
    const formatted = text
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');

    // Convert tables to simple format (if present)
    // This is a basic implementation - can be enhanced

    return formatted;
  }

  /**
   * Send message to specific Telegram user (for notifications)
   */
  async sendMessage(telegramId: string, text: string): Promise<void> {
    if (!this.bot) return;

    try {
      await this.bot.telegram.sendMessage(telegramId, text, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      this.logger.error(`Failed to send message to ${telegramId}:`, error);
    }
  }

  /**
   * Get bot instance for advanced operations
   */
  getBot(): Telegraf<Context<Update>> | undefined {
    return this.bot;
  }
}
