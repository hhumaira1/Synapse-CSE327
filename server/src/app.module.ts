import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { ClerkModule } from './clerk/clerk.module';
import { AuthModule } from './auth/auth.module';
import { PortalAuthModule } from './portal/auth/portal-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    ClerkModule,
    AuthModule,
    PortalAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
