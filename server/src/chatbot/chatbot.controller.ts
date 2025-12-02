import { Controller, Post, Get, Delete, Body, UseGuards, Param, Headers } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { SupabaseAuthGuard } from '../supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../supabase-auth/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';
import { ChatMessageDto, ChatResponseDto } from './dto/chat.dto';

@Controller('chatbot')
@UseGuards(SupabaseAuthGuard)
export class ChatbotController {
  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService,
  ) {}

  @Post('chat')
  async chat(
    @Body() chatDto: ChatMessageDto,
    @CurrentUser('id') supabaseUserId: string,
    @Headers('authorization') authorization: string,
  ): Promise<ChatResponseDto> {
    // Get user details (userId + tenantId)
    const user = await this.authService.getUserDetails(supabaseUserId);

    // Extract JWT token from Authorization header
    const jwt = authorization?.replace('Bearer ', '') || '';

    return await this.chatbotService.chat(chatDto, user.id, user.tenantId, jwt);
  }

  @Get('conversations')
  async listConversations(@CurrentUser('id') supabaseUserId: string) {
    const user = await this.authService.getUserDetails(supabaseUserId);
    return await this.chatbotService.listConversations(user.id);
  }

  @Get('conversations/:id')
  async getConversation(
    @Param('id') conversationId: string,
    @CurrentUser('id') supabaseUserId: string,
  ) {
    const user = await this.authService.getUserDetails(supabaseUserId);
    return await this.chatbotService.getConversationHistory(
      conversationId,
      user.id,
    );
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @Param('id') conversationId: string,
    @CurrentUser('id') supabaseUserId: string,
  ) {
    const user = await this.authService.getUserDetails(supabaseUserId);
    return await this.chatbotService.deleteConversation(
      conversationId,
      user.id,
    );
  }
}
