import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { GeminiService } from './gemini.service';
import { GuardrailsService } from './guardrails.service';
import { GuardrailsEnhancedService } from './guardrails-enhanced.service';
import { EntityResolverService } from './entity-resolver.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';
import { ContactsModule } from '../contacts/contacts.module';
import { DealsModule } from '../deals/deals.module';
import { LeadsModule } from '../leads/leads.module';
import { TicketsModule } from '../tickets/tickets.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    SupabaseAuthModule,
    ContactsModule,
    DealsModule,
    LeadsModule,
    TicketsModule,
    AnalyticsModule,
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    GeminiService,
    GuardrailsService,
    GuardrailsEnhancedService,
    EntityResolverService,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {}
