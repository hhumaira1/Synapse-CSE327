import { Module } from '@nestjs/common';
import { JiraApiService } from './services/jira-api.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [JiraApiService],
  exports: [JiraApiService],
})
export class JiraModule {}
