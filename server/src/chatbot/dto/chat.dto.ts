import { IsString, IsOptional, IsArray } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class ChatResponseDto {
  response: string;
  conversationId: string;
  toolsUsed?: string[];
  timestamp: Date;
  suggestedActions?: SuggestedAction[];
}

export class SuggestedAction {
  label: string;
  prompt: string;
  icon?: string;
  category?: 'create' | 'view' | 'update' | 'analyze';
}

export class ConversationHistoryDto {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
