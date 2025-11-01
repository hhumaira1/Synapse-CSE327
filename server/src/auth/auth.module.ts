import { Module } from '@nestjs/common';
import { AuthService } from './services/auth/auth.service';
import { AuthController } from './controllers/auth/auth.controller';
import { ClerkService } from 'src/clerk/clerk/clerk.service';
import { ClerkAuthGuard } from 'src/clerk/guards/clerk-auth/clerk-auth.guard';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Module({
  providers: [AuthService, ClerkService, ClerkAuthGuard, PrismaService],
  controllers: [AuthController],
  exports: [AuthService, ClerkService, ClerkAuthGuard, PrismaService],
})
export class AuthModule {}
