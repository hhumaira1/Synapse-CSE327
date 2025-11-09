import { Module } from '@nestjs/common';
import { WebRTCGateway } from './webrtc.gateway';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [WebRTCGateway],
  exports: [WebRTCGateway],
})
export class WebRTCModule {}
