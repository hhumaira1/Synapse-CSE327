import { Global, Module } from '@nestjs/common';
import { ClerkService } from './clerk/clerk.service';
import { ClerkAuthGuard } from './guards/clerk-auth/clerk-auth.guard';

@Global()
@Module({
  providers: [ClerkService, ClerkAuthGuard],
  exports: [ClerkService, ClerkAuthGuard],
})
export class ClerkModule {}
