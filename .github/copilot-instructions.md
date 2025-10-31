# SynapseCRM - AI Coding Agent Instructions

> **Development Approach**: Backend-first workflow. Complete the backend API (Phases 1-4) before starting frontend integration.

## Project Overview
**SynapseCRM** is a full-stack AI-powered CRM platform built as a monorepo with Next.js 16 frontend and NestJS 11 backend. The project follows a **multi-tenant architecture** designed to manage contacts, leads, deals, tickets, and integrations with external services (Gmail, VoIP, ticketing systems).

## Architecture

### Monorepo Structure
```
synapsecrm/
├── Frontend/           # Next.js 16 app (React 19, Tailwind CSS 4)
├── server_backend/     # NestJS 11 API (Express, Prisma ORM)
└── synapse-crm-workflow.md  # Complete development workflow documentation
```

**Critical Separation**: Frontend and backend are **separate applications** with independent dependencies. Never cross-reference imports between them—they communicate only via HTTP API calls.

### Tech Stack (2025)
- **Frontend**: Next.js 16.0.0, React 19.2.0, Tailwind CSS 4, shadcn/ui (New York style), Lucide icons
- **Backend**: NestJS 11, Prisma 6.18+ (with `prisma.config.ts`), Clerk Authentication, Supabase PostgreSQL
- **Shared Patterns**: TypeScript strict mode, ESM modules (`"module": "nodenext"`), class-validator for DTOs

## Development Workflows

### Frontend (Next.js 16)
- **Run dev**: `cd Frontend && npm run dev` (port 3000)
- **Build**: `npm run build && npm start`
- **Key Dependencies**: `@radix-ui/react-slot`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`
- **UI Components**: Located in `src/components/ui/` (shadcn/ui), imported via `@/components/ui/*`
- **Path Aliases**: `@/*` maps to `src/*` (defined in `tsconfig.json`)

**Next.js 16 Specifics (CRITICAL)**:
- Uses **React 19 Server Components** by default—client components must use `"use client"` directive
- **Turbopack** is the default bundler (faster than Webpack)
- **Async params/searchParams**: Page components MUST await route params in Next.js 16
  ```tsx
  // CORRECT (Next.js 16):
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```

### Backend (NestJS 11)
- **Run dev**: `cd server_backend && npm run start:dev` (port 3001 per workflow doc)
- **Generate resources**: `nest generate module <name>`, `nest generate service <name>/<name>`, etc.
- **Test**: `npm run test` (Jest with `ts-jest`)
- **Key Dependencies**: `@clerk/backend`, `@prisma/client`, `@nestjs/passport`, `@nestjs/axios`, `class-validator`

**NestJS 11 Specifics**:
- Uses **Express 5** by default (breaking change from v10)
- **Module Resolution**: `"module": "nodenext"` requires `.js` extensions in imports OR `tsconfig-paths` (currently using latter)
- **Decorators**: Must enable `"emitDecoratorMetadata": true` and `"experimentalDecorators": true`

### Database & Authentication
- **Prisma ORM**: Version 6.18+ uses **TypeScript config file** (`prisma.config.ts`) instead of `package.json` configuration
  - Schema location: `prisma/schema.prisma`
  - Migrations: `prisma/migrations/`
  - Client output: `prisma/generated/client` (custom location)
  - Commands: `npx prisma generate`, `npx prisma db push`, `npx prisma studio`
  
- **Authentication Strategy**: **Clerk** for user authentication (JWT tokens)
  - Backend verifies tokens via `@clerk/backend` in `ClerkAuthGuard`
  - Frontend uses `@clerk/nextjs` (NOT YET INSTALLED—document specifies it but `package.json` missing it)
  - Multi-tenant isolation: Every entity has `tenantId` foreign key

- **Database**: Supabase PostgreSQL with **direct connection URL** for migrations
  ```env
  DATABASE_URL="postgresql://..."
  DIRECT_URL="postgresql://..."  # Critical for Supabase connection pooler
  ```

**Required Backend Environment Variables** (`server_backend/.env`):
```env
# Database (Supabase PostgreSQL - get from Supabase dashboard)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Clerk Authentication (get from Clerk dashboard)
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."

# Server Configuration
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"  # For CORS
```

## Project-Specific Conventions

### Multi-Tenant Pattern (CRITICAL - READ FIRST)
**Every database entity MUST include `tenantId`** for data isolation:
```prisma
model Contact {
  id        String   @id @default(cuid())
  tenantId  String
  // ... other fields
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@index([tenantId])
}
```

**API Endpoints** must:
1. Extract tenant from authenticated user via `ClerkAuthGuard`
2. Filter all queries by `tenantId` (see `ContactService.findAll()` example in workflow doc)
3. Use `findFirst` or `findMany` with `where: { tenantId, ... }` to prevent cross-tenant data leaks

**Example Service Method (Backend)**:
```typescript
async findAll(tenantId: string, filters?: any) {
  return this.prisma.contact.findMany({
    where: { tenantId, ...filters },  // Always include tenantId
    include: { leads: true },
  });
}
```

**Example Controller Method (Backend)**:
```typescript
@Get()
@UseGuards(ClerkAuthGuard)  // Verifies JWT token
async findAll(
  @Query() filters: any,
  @CurrentUser('sub') clerkId: string,  // Extract from JWT
) {
  const user = await this.authService.getUserDetails(clerkId);
  const tenantId = user.tenantId;  // Get tenant from user
  return this.contactService.findAll(tenantId, filters);
}
```

### DTO & Validation (Backend)
- **Backend**: Use `class-validator` decorators (`@IsString()`, `@IsEmail()`, etc.) on DTOs
- **Enable globally**: `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))` in `main.ts`
- **Update DTOs**: Extend `PartialType(CreateDto)` from `@nestjs/mapped-types`

**Example DTO**:
```typescript
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateContactDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;
  
  // tenantId NOT in DTO - extracted from auth context
}
```

### Frontend Styling
- **Tailwind CSS 4** with **PostCSS** (`@tailwindcss/postcss`)
- **Color Scheme**: Primary gradient from `[#6366f1]` (indigo) to `[#a855f7]` (purple), secondary `[#3b82f6]` (blue)
- **Component Pattern**: shadcn/ui with `class-variance-authority` for variants
  ```tsx
  import { cn } from "@/lib/utils";  // Tailwind merge utility
  <Button className={cn("base-styles", conditionalClasses)} />
  ```

### File Naming & Structure
- **Frontend**: 
  - Routes: `app/(dashboard)/contacts/page.tsx` (grouped routes use parentheses)
  - Components: PascalCase files (e.g., `Button.tsx`)
  - Server Components: Default (no `"use client"`)
  - Client Components: Must have `"use client"` directive at top
  
- **Backend**:
  - Modules: `src/<feature>/<feature>.module.ts`
  - Services: `src/<feature>/<feature>.service.ts`
  - Controllers: `src/<feature>/<feature>.controller.ts`
  - DTOs: `src/<feature>/dto/<action>-<entity>.dto.ts`

## Critical Integration Points

### Frontend ↔ Backend Communication
1. **API Base URL**: `http://localhost:3001/api` (configured in `.env.local` as `NEXT_PUBLIC_API_BASE_URL`)
2. **CORS**: Backend must enable CORS for `http://localhost:3000` via `app.enableCors()` in `main.ts`
3. **Authentication Headers**: Frontend sends `Authorization: Bearer <clerk-token>` on every request
4. **Data Fetching**: Use `@tanstack/react-query` (workflow doc specifies but NOT installed in Frontend yet)

### External Integrations (Future)
Per workflow doc, Phase 2 features include:
- **Gmail Integration**: Sync emails to `Interaction` model
- **VoIP**: Store calls in `CallLog` model
- **Ticket Systems**: Link osTicket/Helpy via `Integration` model with `externalId`

## Common Commands Reference

### Frontend
```powershell
cd Frontend
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint check
```

### Backend
```powershell
cd server_backend
npm run start:dev        # Watch mode
npm run test             # Run Jest tests
npm run test:e2e         # E2E tests
nest generate module <name>  # Scaffold new module
npx prisma studio        # Open database GUI
```

## Testing Strategy
- **Backend**: Jest unit tests (`.spec.ts`) + Supertest E2E (`test/*.e2e-spec.ts`)
- **Frontend**: Not configured yet (workflow doc suggests E2E testing in Phase 5)
- **Database**: Use `npx prisma db push` for rapid iteration (migrations for production)

## Known Gotchas

1. **Missing Frontend Dependencies**: Workflow doc specifies `@clerk/nextjs`, `@tanstack/react-query`, `axios`, `zustand`, `react-hook-form` but `package.json` only has base Next.js deps. Install before implementing auth/data fetching.

2. **Prisma 6.18+ Config**: Must create `prisma/prisma.config.ts` with `directUrl` for Supabase:
   ```ts
   export default defineConfig({
     datasource: { url: env("DATABASE_URL"), directUrl: env("DIRECT_URL") }
   });
   ```

3. **Next.js 16 Async Params**: Pages using `params` or `searchParams` must declare them as `Promise<T>` and await them.

4. **NestJS Port**: Workflow doc sets backend to port **3001** (not default 3000) to avoid conflict with frontend.

5. **No Prisma Schema Exists Yet**: Workflow doc contains complete schema with 12+ models (Tenant, User, Contact, Lead, Pipeline, Stage, Deal, Interaction, Ticket, Integration, CallLog) but schema file not in repo. Initialize Prisma first.

## Workflow Documentation
**Critical Reference**: Read `synapse-crm-workflow.md` for:
- Complete 5-phase development roadmap (Foundation → Backend → Frontend → Integration → Deployment)
- Environment setup steps (Supabase, Clerk account creation)
- Full Prisma schema definitions
- Example API endpoint implementations (Contact CRUD, Auth flow)
- Dependency graphs and troubleshooting guide

**When Starting New Features**:
1. Check if backend API exists (workflow doc has examples for Contact, Lead, Deal, etc.)
2. Verify frontend has required packages installed before implementing UI
3. Follow multi-tenant pattern (always filter by `tenantId`)
4. Use `ClerkAuthGuard` on all protected backend routes
5. Use shadcn/ui components (`@/components/ui/*`) for consistent styling

## Development Priority: Backend-First Approach

**Current Focus**: Build complete backend API before frontend integration.

### Backend Development Order (Start Here)

#### Phase 1: Database Foundation
```powershell
cd server_backend
npx prisma init  # Creates prisma/ directory and schema.prisma
```
1. **Create `prisma/prisma.config.ts`** (see workflow doc section 2.4)
2. **Copy complete schema** from `synapse-crm-workflow.md` into `prisma/schema.prisma` (12 models: Tenant, User, Contact, Lead, Pipeline, Stage, Deal, Interaction, Ticket, Integration, CallLog)
3. **Set environment variables** in `server_backend/.env`:
   - `DATABASE_URL` (Supabase PostgreSQL)
   - `DIRECT_URL` (Supabase direct connection)
   - `CLERK_SECRET_KEY`
   - `CLERK_PUBLISHABLE_KEY`
4. Run `npx prisma generate && npx prisma db push`

#### Phase 2: Core Infrastructure
```powershell
nest generate module database
nest generate service database/prisma
```
1. **PrismaService** (see workflow doc section 2.7) - handles DB connection lifecycle
2. **Configure `app.module.ts`** - import DatabaseModule, ConfigModule
3. **Update `main.ts`**:
   - Enable global ValidationPipe
   - Enable CORS for `http://localhost:3000`
   - Set global prefix to `'api'`
   - Change port to 3001

#### Phase 3: Authentication Module
```powershell
nest generate module auth
nest generate service auth/clerk
nest generate guard auth/clerk-auth
nest generate service auth/auth
nest generate controller auth/auth
```
1. **ClerkService** - wrapper around `@clerk/backend` client
2. **ClerkAuthGuard** - validates JWT tokens from `Authorization: Bearer <token>`
3. **CurrentUser decorator** - extracts user from request
4. **AuthService** - syncs Clerk users with database, handles tenant creation
5. **AuthController** - `/api/auth/onboard` and `/api/auth/me` endpoints

#### Phase 4: Feature Modules (Build in Order)
Each module follows same pattern - see workflow doc section 2.9 for Contact example:

1. **Contact Module** (Start here - simplest CRUD)
   ```powershell
   nest generate module contact
   nest generate service contact/contact
   nest generate controller contact/contact
   nest generate class contact/dto/create-contact.dto --no-spec
   nest generate class contact/dto/update-contact.dto --no-spec
   ```
   - DTOs with `class-validator` decorators
   - Service methods MUST filter by `tenantId`
   - Controller uses `@UseGuards(ClerkAuthGuard)`
   - Extract tenantId via `AuthService.getUserDetails(clerkId)`

2. **Lead Module** (after Contact)
3. **Pipeline & Stage Modules** (together - Stage depends on Pipeline)
4. **Deal Module** (after Pipeline/Stage)
5. **Interaction Module**
6. **Ticket Module**
7. **Integration & CallLog Modules** (Phase 2 features)

#### Testing Backend Endpoints
```powershell
# Start backend
npm run start:dev

# Test with curl or Postman
curl -X GET http://localhost:3001/api/auth/me `
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### Frontend Development (After Backend is Stable)

**Wait until backend Phase 4 is complete** before starting frontend integration.

#### Phase 1: Install Missing Dependencies
```powershell
cd Frontend
npm install @clerk/nextjs axios @tanstack/react-query react-hook-form zustand
```

#### Phase 2: Authentication Setup
1. Create `.env.local` with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_API_BASE_URL`
2. Wrap app in `<ClerkProvider>` (update `layout.tsx`)
3. Create React Query provider
4. Build sign-in/sign-up pages
5. Create onboarding flow

#### Phase 3: Feature Pages (Match Backend Modules)
1. Dashboard with stats (calls backend APIs)
2. Contacts page with list/create/edit
3. Leads, Deals, Tickets pages
4. Form components with `react-hook-form`

## Current Project State (as of Oct 31, 2025)
- ✅ Frontend: Basic Next.js 16 app with landing page, shadcn/ui setup
- ✅ Backend: NestJS 11 boilerplate with Clerk/Prisma dependencies installed
- ❌ Database: Prisma schema not initialized (no `schema.prisma` file)
- ❌ Authentication: Clerk integration code not implemented (guards, services missing)
- ❌ API Endpoints: No feature modules (Contact, Lead, Deal, etc.) created yet
- 🎯 **Next Action**: Initialize Prisma and create database schema (Backend Phase 1)
