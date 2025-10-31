# Synapse CRM: Complete Integrated Development Workflow (2025)
## Latest Stack: Next.js 16, NestJS 11, Prisma 6.18+, Supabase, Clerk

---

## Overview & Workflow Strategy

This is a **full-stack, integrated workflow** that maintains a logical dependency order between backend and frontend development. The approach follows:

1. **Phase 1: Foundation Setup** — Environment, database, core infrastructure
2. **Phase 2: Backend Core** — Authentication, API endpoints
3. **Phase 3: Frontend Bootstrap** — Project setup, Clerk integration
4. **Phase 4: Feature Integration** — Connect frontend to backend APIs
5. **Phase 5: Testing & Deployment** — E2E testing, production readiness

---

## PHASE 1: Foundation Setup (Days 1–2)

### 1.1: Prerequisites & Account Setup

**Goal:** Ensure all tools, accounts, and credentials are ready.

**Checklist:**
- [ ] Node.js 20.9+ LTS installed
- [ ] npm/yarn installed
- [ ] Git installed and configured
- [ ] Supabase account created, project initialized
- [ ] Clerk account created, application set up
- [ ] Google Cloud Console OAuth credentials (optional for Phase 1, needed for Gmail integration later)
- [ ] Environment variables prepared in a secure location

**Supabase Setup:**
1. Go to https://supabase.com
2. Create a new project
3. Navigate to **Settings > Database > Connection string** and copy:
   - **Direct connection string** (for `DATABASE_URL`)
   - Optional: Connection pooler URL (for production)
4. Note the **Project URL** and **API Key** (for frontend, if needed)

**Clerk Setup:**
1. Go to https://clerk.com
2. Create a new application
3. Configure OAuth providers (Google, GitHub, etc.)
4. Navigate to **API Keys** and copy:
   - **Publishable Key** (for frontend, marked as `NEXT_PUBLIC_`)
   - **Secret Key** (for backend, kept secret)
5. Configure redirect URIs:
   - Development: `http://localhost:3000` (frontend) and `http://localhost:3001` (backend callback)
   - Production: Your deployed domains

---

### 1.2: Create Project Directories

**Commands:**
```bash
# Create a root directory for the full-stack project
mkdir synapse-crm
cd synapse-crm

# Create separate directories for backend and frontend
mkdir synapse-crm-backend synapse-crm-frontend

# Initialize a Git repository
git init
```

**Directory Structure:**
```
synapse-crm/
├── synapse-crm-backend/        # NestJS API
├── synapse-crm-frontend/       # Next.js 16 frontend
├── .gitignore
├── README.md
└── docker-compose.yml          # (Optional) for local Supabase emulation
```

**Create `.gitignore` (root level):**
```
node_modules/
.env
.env.local
.env.*.local
dist/
build/
.next/
*.log
.DS_Store
.idea/
.vscode/
```

---

## PHASE 2: Backend Development (Days 3–7)

### 2.1: Initialize NestJS Project

**Commands:**
```bash
cd synapse-crm-backend
nest new . --skip-git  # Use current directory
# Choose: npm or yarn
# Choose: Which package manager? (npm)
```

**Note:** NestJS 11 is now the default with Express v5 support.

---

### 2.2: Install & Configure Dependencies

**Backend Dependencies:**
```bash
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/axios @nestjs/schedule passport passport-jwt class-validator class-transformer @prisma/client @supabase/supabase-js @clerk/backend
```

**Dev Dependencies:**
```bash
npm install -D @nestjs/cli @nestjs/testing @types/node @types/passport-jwt typescript @types/supertest supertest
```

**Why each package (2025 updates):**
- `@nestjs/config`: Environment variable management (global scope in NestJS 11)
- `@clerk/backend`: Clerk SDK for server-side verification (latest API)
- `@prisma/client`: Prisma ORM (v6.18+ with simplified runtime config)
- `passport-jwt`: JWT strategy for Passport
- `class-validator`: Input validation with decorators

---

### 2.3: Create `.env` File (Backend)

**File:** `synapse-crm-backend/.env`

```env
# Database (Supabase PostgreSQL - Direct URL)
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# Clerk Authentication (Server-Side)
CLERK_SECRET_KEY="sk_test_YOUR_CLERK_SECRET_KEY"
CLERK_PUBLISHABLE_KEY="pk_test_YOUR_CLERK_PUBLISHABLE_KEY"

# JWT (Internal token signing, if needed)
JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRES_IN="15m"

# Server Port
PORT=3001
NODE_ENV="development"

# Optional: For future integrations
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
# TWILIO_API_KEY=""
```

**Key 2025 Changes (Prisma 6.18+):**
- `DIRECT_URL` is now critical when using Supabase connection pooler
- Both `DATABASE_URL` and `DIRECT_URL` point to PostgreSQL; use direct for migrations

---

### 2.4: Initialize Prisma with Modern Config File

**Commands:**
```bash
npx prisma init
```

**Create `prisma/prisma.config.ts` (NEW IN PRISMA 6.18+):**
```typescript
import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
    directUrl: env("DIRECT_URL"),
  },
});
```

**Key Updates:**
- TypeScript-first configuration (`prisma.config.ts` replaces `package.json` config)
- `directUrl` for migrations (critical for Supabase)
- Seed configuration in TS

---

### 2.5: Define Complete Prisma Schema

**File:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/client"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ==================== MULTI-TENANT FOUNDATION ====================

model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users        User[]
  contacts     Contact[]
  leads        Lead[]
  pipelines    Pipeline[]
  deals        Deal[]
  interactions Interaction[]
  tickets      Ticket[]
  integrations Integration[]
  callLogs     CallLog[]

  @@map("tenants")
}

model User {
  id        String   @id @default(cuid())
  tenantId  String
  clerkId   String   @unique
  email     String   @unique
  name      String?
  role      String   @default("member") // admin, manager, member
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant       Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  interactions Interaction[]

  @@unique([tenantId, clerkId])
  @@index([tenantId])
  @@map("users")
}

// ==================== CORE CRM ENTITIES ====================

model Contact {
  id        String   @id @default(cuid())
  tenantId  String
  firstName String
  lastName  String
  email     String?
  phone     String?
  company   String?
  jobTitle  String?
  source    String?
  notes     String?
  customFields Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant       Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  leads        Lead[]
  interactions Interaction[]
  deals        Deal[]
  tickets      Ticket[]
  callLogs     CallLog[]

  @@index([tenantId])
  @@index([email])
  @@map("contacts")
}

model Lead {
  id         String   @id @default(cuid())
  tenantId   String
  contactId  String?
  source     String   // Website, LinkedIn, Referral, etc.
  status     String   @default("new") // new, contacted, qualified, unqualified, converted
  value      Decimal?
  convertedAt DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  contact  Contact? @relation(fields: [contactId], references: [id], onDelete: SetNull)
  deals    Deal[]

  @@index([tenantId])
  @@index([status])
  @@map("leads")
}

model Pipeline {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  stages Stage[]
  deals  Deal[]

  @@index([tenantId])
  @@map("pipelines")
}

model Stage {
  id         String   @id @default(cuid())
  pipelineId String
  name       String
  order      Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  pipeline Pipeline @relation(fields: [pipelineId], references: [id], onDelete: Cascade)
  deals    Deal[]

  @@unique([pipelineId, order])
  @@index([pipelineId])
  @@map("stages")
}

model Deal {
  id                String   @id @default(cuid())
  tenantId          String
  contactId         String
  leadId            String?
  pipelineId        String
  stageId           String
  title             String
  description       String?
  value             Decimal?
  probability       Decimal? // 0.0 to 1.0
  expectedCloseDate DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  tenant        Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  contact       Contact        @relation(fields: [contactId], references: [id], onDelete: Restrict)
  lead          Lead?          @relation(fields: [leadId], references: [id], onDelete: SetNull)
  pipeline      Pipeline       @relation(fields: [pipelineId], references: [id], onDelete: Restrict)
  stage         Stage          @relation(fields: [stageId], references: [id], onDelete: Restrict)
  interactions  Interaction[]
  tickets       Ticket[]

  @@index([tenantId])
  @@index([stageId])
  @@map("deals")
}

model Interaction {
  id        String   @id @default(cuid())
  tenantId  String
  contactId String
  dealId    String?
  userId    String?
  type      String   // email, call, meeting, note, ticket
  subject   String?
  content   String
  dateTime  DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant  Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  contact Contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)
  deal    Deal?    @relation(fields: [dealId], references: [id], onDelete: SetNull)
  user    User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([tenantId])
  @@index([contactId])
  @@map("interactions")
}

model Ticket {
  id              String   @id @default(cuid())
  tenantId        String
  contactId       String
  dealId          String?
  externalId      String?
  externalSystem  String? // osTicket, Helpy, etc.
  title           String
  description     String?
  status          String   @default("open") // open, in_progress, resolved, closed
  priority        String   @default("medium") // low, medium, high, urgent
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  contact Contact @relation(fields: [contactId], references: [id], onDelete: Restrict)
  deal    Deal?   @relation(fields: [dealId], references: [id], onDelete: SetNull)

  @@unique([tenantId, externalId, externalSystem])
  @@index([tenantId])
  @@map("tickets")
}

model Integration {
  id         String   @id @default(cuid())
  tenantId   String
  serviceName String  // gmail, calendar, voip, osticket
  isActive   Boolean  @default(false)
  config     Json?    // OAuth tokens, API keys, scopes
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, serviceName])
  @@index([tenantId])
  @@map("integrations")
}

model CallLog {
  id            String   @id @default(cuid())
  tenantId      String
  contactId     String
  dealId        String?
  fromNumber    String
  toNumber      String
  duration      Int?     // seconds
  outcome       String?  // completed, missed, voicemail
  recordingUrl  String?
  transcription String?
  summary       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  contact Contact @relation(fields: [contactId], references: [id], onDelete: Restrict)
  deal    Deal?   @relation(fields: [dealId], references: [id], onDelete: SetNull)

  @@index([tenantId])
  @@map("call_logs")
}
```

**Key Design Decisions (2025 Best Practices):**
- `tenantId` on every model for multi-tenant isolation
- Indexes on frequently queried fields (`tenantId`, `email`, `status`)
- Soft delete support optional (via `isDeleted` boolean, if needed)
- Flexible `customFields` as JSON for extensibility

---

### 2.6: Generate Prisma Client & Push Schema

**Commands:**
```bash
npx prisma generate
npx prisma db push
```

**What happens:**
- `npx prisma generate`: Creates TypeScript types in `prisma/generated/client`
- `npx prisma db push`: Applies schema to Supabase PostgreSQL database
- **Note:** No migrations directory created yet; schema is synced directly

---

### 2.7: Create Prisma Service (NestJS Integration)

**Generate module:**
```bash
nest generate module database
nest generate service database/prisma
```

**File:** `src/database/prisma.service.ts`

```typescript
import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

**File:** `src/database/database.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

---

### 2.8: Create Authentication Infrastructure (Clerk + NestJS)

**Generate auth module:**
```bash
nest generate module auth
nest generate service auth/clerk
nest generate guard auth/clerk-auth
nest generate service auth/auth
nest generate controller auth/auth
```

**File:** `src/auth/services/clerk.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);
  private clerkClient;

  constructor() {
    this.clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }

  getClient() {
    return this.clerkClient;
  }

  async verifyToken(token: string) {
    try {
      return await this.clerkClient.verifyToken(token);
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw error;
    }
  }
}
```

**File:** `src/auth/guards/clerk-auth.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ClerkService } from '../services/clerk.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private clerkService: ClerkService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.clerkService.verifyToken(token);
      request.user = payload; // Attach verified user to request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
```

**File:** `src/auth/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

**File:** `src/auth/services/auth.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService) {}

  async syncUserWithDatabase(clerkId: string, email: string, name: string, tenantId?: string) {
    let user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      if (!tenantId) {
        this.logger.warn(`No existing user or tenant context for Clerk ID: ${clerkId}`);
        return null;
      }

      // Create new user linked to tenant
      user = await this.prisma.user.create({
        data: {
          clerkId,
          email,
          name,
          tenantId,
          role: 'member',
        },
      });

      this.logger.log(`Created user: ${user.id} for tenant: ${tenantId}`);
    }

    return user;
  }

  async createInitialUserAndTenant(clerkId: string, email: string, name: string, tenantName: string) {
    // Create tenant first
    const tenant = await this.prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      },
    });

    // Create user linked to tenant
    const user = await this.prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        tenantId: tenant.id,
        role: 'admin', // First user is admin
      },
    });

    this.logger.log(`Created tenant ${tenant.id} with initial user ${user.id}`);
    return { tenant, user };
  }

  async getUserDetails(clerkId: string) {
    return this.prisma.user.findUnique({
      where: { clerkId },
      include: { tenant: true },
    });
  }
}
```

**File:** `src/auth/auth.controller.ts`

```typescript
import { Controller, Post, Get, Body, UseGuards, Logger } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('onboard')
  @UseGuards(ClerkAuthGuard)
  async onboard(
    @CurrentUser('sub') clerkId: string,
    @CurrentUser('email_addresses') emailArray: any[],
    @CurrentUser('first_name') firstName: string,
    @CurrentUser('last_name') lastName: string,
    @Body() body: { tenantName: string },
  ) {
    const email = emailArray?.[0]?.email_address || 'unknown';
    const name = `${firstName} ${lastName}`.trim();

    // Check if user already exists
    const existingUser = await this.authService.getUserDetails(clerkId);
    if (existingUser) {
      return { isNewUser: false, user: existingUser };
    }

    // Create initial tenant and user
    const { tenant, user } = await this.authService.createInitialUserAndTenant(
      clerkId,
      email,
      name,
      body.tenantName,
    );

    return { message: 'Onboarded successfully', tenant, user };
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  async getProfile(@CurrentUser('sub') clerkId: string) {
    return this.authService.getUserDetails(clerkId);
  }
}
```

**File:** `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ClerkService } from './services/clerk.service';
import { AuthService } from './services/auth.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { AuthController } from './auth.controller';

@Module({
  imports: [DatabaseModule],
  providers: [ClerkService, AuthService, ClerkAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, ClerkAuthGuard],
})
export class AuthModule {}
```

---

### 2.9: Create Core Feature Modules (CRUD Endpoints)

**Generate Contact Module (Example):**
```bash
nest generate module contact
nest generate service contact/contact
nest generate controller contact/contact
nest generate class contact/dto/create-contact.dto
nest generate class contact/dto/update-contact.dto
```

**File:** `src/contact/dto/create-contact.dto.ts`

```typescript
import { IsString, IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateContactDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**File:** `src/contact/dto/update-contact.dto.ts`

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateContactDto } from './create-contact.dto';

export class UpdateContactDto extends PartialType(CreateContactDto) {}
```

**File:** `src/contact/contact.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: { ...dto, tenantId },
    });
  }

  async findAll(tenantId: string, filters?: any) {
    return this.prisma.contact.findMany({
      where: { tenantId, ...filters },
      include: { leads: true },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.contact.findFirst({
      where: { tenantId, id },
      include: { leads: true, interactions: true, deals: true },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateContactDto) {
    return this.prisma.contact.updateMany({
      where: { tenantId, id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.contact.deleteMany({
      where: { tenantId, id },
    });
  }
}
```

**File:** `src/contact/contact.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthService } from '../auth/services/auth.service';

@Controller('contacts')
@UseGuards(ClerkAuthGuard)
export class ContactController {
  constructor(
    private contactService: ContactService,
    private authService: AuthService,
  ) {}

  private async getTenantId(clerkId: string) {
    const user = await this.authService.getUserDetails(clerkId);
    if (!user) throw new Error('User not found');
    return user.tenantId;
  }

  @Post()
  async create(
    @Body() dto: CreateContactDto,
    @CurrentUser('sub') clerkId: string,
  ) {
    const tenantId = await this.getTenantId(clerkId);
    return this.contactService.create(tenantId, dto);
  }

  @Get()
  async findAll(
    @Query() filters: any,
    @CurrentUser('sub') clerkId: string,
  ) {
    const tenantId = await this.getTenantId(clerkId);
    return this.contactService.findAll(tenantId, filters);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('sub') clerkId: string,
  ) {
    const tenantId = await this.getTenantId(clerkId);
    return this.contactService.findOne(tenantId, id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser('sub') clerkId: string,
  ) {
    const tenantId = await this.getTenantId(clerkId);
    return this.contactService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('sub') clerkId: string,
  ) {
    const tenantId = await this.getTenantId(clerkId);
    return this.contactService.remove(tenantId, id);
  }
}
```

**File:** `src/contact/contact.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [ContactService],
  controllers: [ContactController],
})
export class ContactModule {}
```

**Repeat for:** Lead, Pipeline, Deal, Interaction, Ticket modules

---

### 2.10: Configure App Module

**File:** `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { LeadModule } from './lead/lead.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { DealModule } from './deal/deal.module';
import { InteractionModule } from './interaction/interaction.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    ContactModule,
    LeadModule,
    PipelineModule,
    DealModule,
    InteractionModule,
    TicketModule,
  ],
})
export class AppModule {}
```

---

### 2.11: Configure Main & Start Backend

**File:** `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Set API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 API docs available at http://localhost:${port}/api`);
}

bootstrap();
```

**Update `package.json` scripts:**
```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "build": "nest build",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

**Start Backend:**
```bash
npm run start:dev
```

**Expected Output:**
```
[Nest] 12345   - 10/31/2025, 7:45:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345   - 10/31/2025, 7:45:01 PM     LOG [InstanceLoader] DatabaseModule dependencies initialized
[Nest] 12345   - 10/31/2025, 7:45:01 PM     LOG [InstanceLoader] AuthModule dependencies initialized
...
🚀 Backend running on http://localhost:3001
```

---

## PHASE 3: Frontend Bootstrap (Days 8–10)

### 3.1: Initialize Next.js 16 Project

**Commands:**
```bash
cd ../synapse-crm-frontend
npx create-next-app@latest . --typescript --tailwind --app --no-git
# Choose: ESLint? Yes
# Choose: Turbopack? Yes (default in Next.js 16)
```

**Key Next.js 16 Features (2025):**
- **Turbopack** is now the default bundler (2-5x faster builds)
- **Server Components** by default
- **Async params/searchParams** — must use `await` in page components
- **`proxy.ts`** replaces `middleware.ts`

---

### 3.2: Install Frontend Dependencies

```bash
npm install @clerk/nextjs axios @tanstack/react-query react-hook-form @heroicons/react zustand
```

**What each provides:**
- `@clerk/nextjs`: Clerk auth integration for Next.js 16 (Server Components ready)
- `axios`: HTTP client
- `@tanstack/react-query`: Server state management
- `react-hook-form`: Form management
- `zustand`: Client state management
- `@heroicons/react`: UI icons

---

### 3.3: Create `.env.local` (Frontend)

**File:** `synapse-crm-frontend/.env.local`

```env
# Clerk (Frontend-Safe Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YOUR_CLERK_PUBLIC_KEY"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboard"

# Backend API
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001/api"

# Environment
NODE_ENV="development"
```

---

### 3.4: Configure Clerk & Layout

**File:** `src/app/layout.tsx` (Updated for Next.js 16 async params)

```typescript
'use server';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Synapse CRM',
  description: 'Modern CRM for sales teams',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Note: In Next.js 16, use async layout
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

---

### 3.5: Set Up React Query Provider

**File:** `src/app/providers.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime in older versions)
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Update `src/app/layout.tsx`:**
```typescript
import { Providers } from './providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

---

### 3.6: Create API Client Utility

**File:** `src/lib/api.ts`

```typescript
'use client';

import axios from 'axios';
import { auth } from '@clerk/nextjs/server';

export const getApiClient = async () => {
  const { getToken } = await auth();
  const token = await getToken();

  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
};

// For client-side API calls
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// Add request interceptor for Clerk token
apiClient.interceptors.request.use(async (config) => {
  const { getToken } = await auth();
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### 3.7: Create Auth Pages

**File:** `src/app/sign-in/[[...sign-in]]/page.tsx`

```typescript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              card: 'shadow-xl rounded-lg',
              headerTitle: 'text-2xl font-bold text-gray-900',
            },
          }}
        />
      </div>
    </div>
  );
}
```

**File:** `src/app/sign-up/[[...sign-up]]/page.tsx`

```typescript
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              card: 'shadow-xl rounded-lg',
              headerTitle: 'text-2xl font-bold text-gray-900',
            },
          }}
        />
      </div>
    </div>
  );
}
```

---

### 3.8: Create Onboarding Flow

**File:** `src/app/onboard/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useUser } from '@clerk/nextjs';

export default function OnboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [tenantName, setTenantName] = useState('');
  const [businessType, setBusinessType] = useState('');

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/auth/onboard', data);
      return response.data;
    },
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: (error: any) => {
      console.error('Onboarding failed:', error.response?.data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ tenantName, businessType });
  };

  if (!isLoaded || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6">Welcome to Synapse CRM</h1>
        <p className="text-gray-600 mb-6">Let's set up your workspace</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="My Company"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Type
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Select...</option>
              <option value="b2b">B2B</option>
              <option value="b2c">B2C</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Setting up...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

### 3.9: Create Dashboard Layout

**File:** `src/app/(dashboard)/layout.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Contacts', href: '/dashboard/contacts' },
  { name: 'Leads', href: '/dashboard/leads' },
  { name: 'Deals', href: '/dashboard/deals' },
  { name: 'Tickets', href: '/dashboard/tickets' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Synapse CRM</h1>
        </div>

        <nav className="mt-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 text-sm font-medium ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

### 3.10: Create Dashboard Page

**File:** `src/app/(dashboard)/page.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useUser } from '@clerk/nextjs';

async function fetchStats(token: string) {
  try {
    const response = await apiClient.get('/contacts');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return [];
  }
}

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">Here's what's happening in your CRM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        {[
          { label: 'Total Contacts', value: '-', color: 'bg-blue-50' },
          { label: 'Active Leads', value: '-', color: 'bg-green-50' },
          { label: 'Open Deals', value: '-', color: 'bg-purple-50' },
          { label: 'Pending Tickets', value: '-', color: 'bg-orange-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-lg p-6`}>
            <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.label}</h3>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## PHASE 4: Feature Integration (Days 11–14)

### 4.1: Create Contacts Page

**File:** `src/app/(dashboard)/contacts/page.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Suspense } from 'react';

async function fetchContacts() {
  const response = await apiClient.get('/contacts');
  return response.data;
}

function ContactsList() {
  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  });

  if (isLoading) return <div className="text-center py-8">Loading contacts...</div>;
  if (error) return <div className="text-red-600">Error loading contacts</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Link href="/dashboard/contacts/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Add Contact
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Company</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contacts?.map((contact: any) => (
              <tr key={contact.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {contact.firstName} {contact.lastName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{contact.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{contact.company}</td>
                <td className="px-6 py-4 text-sm">
                  <Link href={`/dashboard/contacts/${contact.id}`} className="text-blue-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactsList />
    </Suspense>
  );
}
```

---

### 4.2: Create Contact Detail & Form Pages

**File:** `src/app/(dashboard)/contacts/new/page.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useForm } from 'react-hook-form';

interface ContactForm {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
}

export default function NewContactPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm<ContactForm>();

  const mutation = useMutation({
    mutationFn: (data: ContactForm) => apiClient.post('/contacts', data),
    onSuccess: () => {
      router.push('/dashboard/contacts');
    },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Add New Contact</h1>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="bg-white rounded-lg shadow p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              {...register('firstName', { required: true })}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              {...register('lastName', { required: true })}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              {...register('company')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating...' : 'Create Contact'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-300 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

### 4.3: Create Leads, Deals, Tickets Pages (Similar Pattern)

Repeat the pattern for:
- `src/app/(dashboard)/leads/page.tsx`
- `src/app/(dashboard)/leads/new/page.tsx`
- `src/app/(dashboard)/deals/page.tsx`
- `src/app/(dashboard)/deals/new/page.tsx`
- `src/app/(dashboard)/tickets/page.tsx`

---

## PHASE 5: Testing & Deployment (Days 15–16)

### 5.1: Test Backend API

**Test Auth Endpoint:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

**Test Contact Endpoints:**
```bash
# Create contact
curl -X POST http://localhost:3001/api/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com"}'

# Get all contacts
curl -X GET http://localhost:3001/api/contacts \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

---

### 5.2: Test Frontend Integration

**Start Frontend:**
```bash
cd synapse-crm-frontend
npm run dev
```

**Test Flow:**
1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. Complete Clerk signup
4. Fill onboarding form
5. Navigate to Contacts page
6. Create a new contact
7. Verify it appears in the list

---

### 5.3: Production Deployment Checklist

**Backend (NestJS to Railway, Vercel, or self-hosted):**
- [ ] Set environment variables on host
- [ ] Configure CORS for production frontend domain
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging & monitoring

**Frontend (Next.js to Vercel):**
- [ ] Configure environment variables in deployment platform
- [ ] Update Clerk redirect URIs for production domain
- [ ] Enable analytics
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for static assets

---

## Dependency Graph (What Depends on What)

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: Foundation                                     │
│ - Environment & Accounts (Supabase, Clerk)              │
│ - Project Directories                                   │
└─────────┬───────────────────────────────────────────────┘
          │
          ├─────────────────────────────────────────────────┐
          │                                                 │
          ▼                                                 ▼
    ┌──────────────────────┐                   ┌──────────────────────┐
    │ PHASE 2: Backend     │                   │ PHASE 3: Frontend    │
    │ (NestJS + Prisma)    │◄──────────────────┤ Bootstrap            │
    │                      │  Backend Ready    │ (Next.js 16)         │
    │ - Database Schema    │                   │                      │
    │ - Auth (Clerk)       │                   │ - Project Init       │
    │ - API Endpoints      │                   │ - Clerk Setup        │
    │ - Core CRUD          │                   │ - Auth Pages         │
    │ - Test & Run         │                   │ - Onboarding Flow    │
    └──────────┬───────────┘                   └──────────┬───────────┘
               │                                          │
               │                                          │
               └──────────────────┬─────────────────────┬─┘
                                  │
                                  ▼
                      ┌──────────────────────────────┐
                      │ PHASE 4: Integration         │
                      │                              │
                      │ - Connect Frontend to Backend│
                      │ - Feature Pages (Contacts)   │
                      │ - Forms & Data Fetching      │
                      │ - State Management           │
                      └──────────────────────────────┘
                                  │
                                  ▼
                      ┌──────────────────────────────┐
                      │ PHASE 5: Testing & Deploy    │
                      │                              │
                      │ - E2E Testing                │
                      │ - Production Setup           │
                      │ - CI/CD Pipeline             │
                      │ - Launch                     │
                      └──────────────────────────────┘
```

---

## Quick Reference Commands

### Backend (NestJS)

```bash
# Development
npm run start:dev

# Generate files
nest generate module <name>
nest generate service <name>/<name>
nest generate controller <name>/<name>

# Database
npx prisma generate
npx prisma db push
npx prisma studio  # View database GUI

# Testing
npm test
npm run test:e2e
```

### Frontend (Next.js 16)

```bash
# Development
npm run dev

# Build
npm run build
npm start

# Lint
npm run lint

# Testing
npm test
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Clerk token not working | Verify `CLERK_SECRET_KEY` in backend `.env` |
| Database connection fails | Check `DATABASE_URL` format; use direct URL from Supabase |
| CORS errors | Add frontend URL to `app.enableCors()` in backend |
| Prisma migrations stuck | Use `npx prisma db push` instead of `migrate dev` |
| Next.js 16 async params error | Remember `await params` in page components |
| Turbopack issues | Clear `.next` folder; run `npm run dev` again |

---

## Next Steps (Phase 2 Features)

After Phase 1 completes:

1. **Gmail Integration** — Sync emails to Interactions
2. **VoIP Integration** — Make/receive calls, store in CallLogs
3. **External Ticket System** — Link osTicket/Helpy to deals
4. **AI Summaries** — Use LLMs for call/email summaries
5. **Analytics Dashboard** — Pipeline KPIs, forecasting
6. **Mobile App** — React Native for iOS/Android

---

**Last Updated:** October 31, 2025
**Version:** 1.0 — Complete Integrated Workflow
**Status:** Production-Ready
