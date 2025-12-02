import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ZammadModule } from '../zammad/zammad.module';

@Module({
  imports: [forwardRef(() => ZammadModule)],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule { }

