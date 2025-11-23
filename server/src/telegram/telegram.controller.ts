import { Controller, Post, Get, UseGuards, Body, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramService } from './telegram.service';
import { SupabaseAuthGuard } from '../supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../supabase-auth/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';
import { GenerateLinkResponseDto, TelegramStatusDto } from './dto/telegram.dto';

@Controller('telegram')
export class TelegramController {
  constructor(
    private telegramAuthService: TelegramAuthService,
    private telegramService: TelegramService,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate deep link for Telegram account linking
   */
  @Post('generate-link')
  @UseGuards(SupabaseAuthGuard)
  async generateLink(
    @CurrentUser('id') supabaseUserId: string,
  ): Promise<GenerateLinkResponseDto> {
    const user = await this.authService.getUserDetails(supabaseUserId);

    const { code, expiresAt } = await this.telegramAuthService.generateLinkCode(
      user.id,
    );

    let botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');
    
    // Remove quotes if present
    if (botUsername) {
      botUsername = botUsername.replace(/^["']|["']$/g, '');
    }

    // Use https://t.me format for better compatibility (works on all platforms)
    const deepLink = `https://t.me/${botUsername}?start=${code}`;

    return {
      deepLink,
      code,
      expiresAt,
    };
  }

  /**
   * Check Telegram connection status
   */
  @Get('status')
  @UseGuards(SupabaseAuthGuard)
  async getStatus(
    @CurrentUser('id') supabaseUserId: string,
  ): Promise<TelegramStatusDto> {
    const user = await this.authService.getUserDetails(supabaseUserId);

    const status = await this.telegramAuthService.checkTelegramStatus(user.id);

    return status;
  }

  /**
   * Disconnect Telegram account
   */
  @Post('disconnect')
  @UseGuards(SupabaseAuthGuard)
  async disconnect(
    @CurrentUser('id') supabaseUserId: string,
  ): Promise<{ success: boolean }> {
    const user = await this.authService.getUserDetails(supabaseUserId);

    await this.telegramAuthService.disconnectTelegram(user.id);

    return { success: true };
  }

  /**
   * Webhook endpoint for Telegram updates (no auth - public endpoint)
   * Token in URL path for security (prevents unauthorized webhook calls)
   */
  @Post('webhook/:token')
  async webhook(
    @Param('token') token: string,
    @Body() update: any,
  ): Promise<{ ok: boolean }> {
    // Verify token matches configured bot token (security check)
    const configuredToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN')?.replace(/^["']|["']$/g, '');
    
    if (token !== configuredToken) {
      console.error('❌ Webhook token mismatch - unauthorized request');
      return { ok: false };
    }

    console.log('📥 Received webhook update:', JSON.stringify(update, null, 2));

    const bot = this.telegramService.getBot();
    if (bot) {
      try {
        await bot.handleUpdate(update);
        console.log('✅ Update processed successfully');
      } catch (error) {
        console.error('❌ Error processing update:', error);
      }
    } else {
      console.error('❌ Bot not initialized');
    }
    
    return { ok: true };
  }
}
