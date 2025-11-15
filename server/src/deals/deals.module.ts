import { Module } from '@nestjs/common';
import { DealsService } from './deals/deals.service';
import { DealsController } from './deals/deals.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseAuthModule } from '../supabase-auth/supabase-auth.module';

@Module({
  imports: [DatabaseModule, AuthModule, SupabaseAuthModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
