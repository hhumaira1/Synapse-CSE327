import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ClerkModule } from 'src/clerk/clerk.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [DatabaseModule, ClerkModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
