import { Module, forwardRef } from '@nestjs/common';
import { JiraApiService } from './services/jira-api.service';
import { JiraWebhookService } from './services/jira-webhook.service';
import { JiraSyncService } from './services/jira-sync.service';
import { JiraWebhooksController } from './controllers/jira-webhooks.controller';
import { DatabaseModule } from '../database/database.module';
import { TicketsModule } from '../tickets/tickets.module';
import { JiraSsoController } from './controllers/jira-sso.controller';
import { JiraBoardController } from './controllers/jira-board.controller';

@Module({
  imports: [DatabaseModule, forwardRef(() => TicketsModule)],
  controllers: [JiraWebhooksController, JiraSsoController, JiraBoardController],
  providers: [JiraApiService, JiraWebhookService, JiraSyncService],
  exports: [JiraApiService, JiraWebhookService, JiraSyncService],
})
export class JiraModule { }
