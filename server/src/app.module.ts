import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { ClerkModule } from './clerk/clerk.module';
import { AuthModule } from './auth/auth.module';
import { PortalAuthModule } from './portal/auth/portal-auth.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { PortalModule } from './portal/portal.module';
import { ContactsModule } from './contacts/contacts.module';
import { PipelinesModule } from './pipelines/pipelines.module';
import { StagesModule } from './stages/stages.module';
import { LeadsModule } from './leads/leads.module';
import { DealsModule } from './deals/deals.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    DatabaseModule,
    ClerkModule,
    AuthModule,
    PortalAuthModule,
    UsersModule,
    PortalModule,
    ContactsModule,
    PipelinesModule,
    StagesModule,
    LeadsModule,
    DealsModule,
    AnalyticsModule,
    TicketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
