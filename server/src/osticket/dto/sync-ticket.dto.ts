import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SyncTicketDto {
  @IsString()
  ticketId: string;

  @IsOptional()
  @IsBoolean()
  force?: boolean; // Force sync even if already synced
}

export class OsTicketWebhookDto {
  @IsString()
  event: string;

  @IsString()
  timestamp: string;

  @IsOptional()
  ticket?: {
    id: number;
    number: string;
    subject: string;
  };

  @IsOptional()
  user?: {
    id: number;
    name: string;
    email: string;
  };

  @IsOptional()
  message?: string;
}
