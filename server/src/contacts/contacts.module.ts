import { Module, forwardRef } from '@nestjs/common';
import { ContactsService } from './contacts/contacts.service';
import { ContactsController } from './contacts/contacts.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    SupabaseAuthModule,
    forwardRef(() => ChatbotModule),
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
