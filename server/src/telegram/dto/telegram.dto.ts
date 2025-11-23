import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class GenerateLinkResponseDto {
  deepLink: string;
  code: string;
  expiresAt: Date;
}

export class TelegramStatusDto {
  connected: boolean;
  telegramUsername?: string;
  linkedAt?: Date;
}

export class TelegramWebhookDto {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}
