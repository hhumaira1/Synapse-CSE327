import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate a one-time deep link code for account linking
   */
  async generateLinkCode(
    userId: string,
  ): Promise<{ code: string; expiresAt: Date }> {
    // Generate unique 16-character code
    const code = crypto.randomBytes(8).toString('hex');

    // Expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.telegramLinkRequest.create({
      data: {
        code,
        userId,
        expiresAt,
      },
    });

    this.logger.log(`Generated link code for user ${userId}: ${code}`);
    return { code, expiresAt };
  }

  /**
   * Verify link code and create Telegram user connection
   */
  async verifyAndLinkAccount(
    code: string,
    telegramId: string,
    telegramData: {
      username?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<{ userId: string; tenantId: string }> {
    // Find valid link request
    const linkRequest = await this.prisma.telegramLinkRequest.findFirst({
      where: {
        code,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: {
        user: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!linkRequest) {
      throw new UnauthorizedException('Invalid or expired link code');
    }

    // Check if Telegram account already linked to a DIFFERENT user
    const existingLink = await this.prisma.telegramUser.findUnique({
      where: { telegramId },
    });

    if (existingLink && existingLink.userId !== linkRequest.userId) {
      throw new UnauthorizedException(
        'Telegram account already linked to another user',
      );
    }

    // If same user is reconnecting, delete old link first
    if (existingLink && existingLink.userId === linkRequest.userId) {
      await this.prisma.telegramUser.delete({
        where: { telegramId },
      });
    }

    // Create Telegram user link
    await this.prisma.telegramUser.create({
      data: {
        telegramId,
        userId: linkRequest.userId,
        username: telegramData.username,
        firstName: telegramData.firstName,
        lastName: telegramData.lastName,
      },
    });

    // Mark link request as used
    await this.prisma.telegramLinkRequest.update({
      where: { id: linkRequest.id },
      data: { usedAt: new Date() },
    });

    this.logger.log(
      `Successfully linked Telegram user ${telegramId} to user ${linkRequest.userId}`,
    );

    return {
      userId: linkRequest.user.id,
      tenantId: linkRequest.user.tenantId,
    };
  }

  /**
   * Get user details from Telegram ID
   */
  async getUserByTelegramId(
    telegramId: string,
  ): Promise<{ userId: string; tenantId: string } | null> {
    const telegramUser = await this.prisma.telegramUser.findUnique({
      where: { telegramId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            tenantId: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!telegramUser) {
      return null;
    }

    return {
      userId: telegramUser.user.id,
      tenantId: telegramUser.user.tenantId,
    };
  }

  /**
   * Check if user has Telegram connected
   */
  async checkTelegramStatus(userId: string): Promise<{
    connected: boolean;
    telegramUsername?: string;
    linkedAt?: Date;
  }> {
    const telegramUser = await this.prisma.telegramUser.findFirst({
      where: { userId, isActive: true },
    });

    return {
      connected: !!telegramUser,
      telegramUsername: telegramUser?.username || undefined,
      linkedAt: telegramUser?.createdAt,
    };
  }

  /**
   * Disconnect Telegram account
   */
  async disconnectTelegram(userId: string): Promise<void> {
    await this.prisma.telegramUser.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    this.logger.log(`Disconnected Telegram for user ${userId}`);
  }
}
