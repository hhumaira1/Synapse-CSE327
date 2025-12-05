# SynapseCRM - AI Coding Agent Instructions

> **Development Approach**: Backend-first workflow. Build and test backend APIs before frontend integration.

## Project Overview
**SynapseCRM** is a multi-tenant AI-powered CRM platform with Next.js 16 frontend and NestJS 11 backend. The system manages contacts, leads, deals, tickets, and portal customers with strict tenant isolation at the database level.

## Architecture

### Monorepo Structure (ACTUAL)
```
synapse/
├── Frontend/           # Next.js 16 (React 19, Tailwind CSS 4, shadcn/ui)
├── server/             # NestJS 11 API (Express 5, Prisma 6.18+)
├── synapse-crm-workflow.md      # Complete 5-phase development guide
└── tech-stack-2025-changes.md   # Migration notes for Next.js 16, NestJS 11, Prisma 6.18+
```

**Critical**: Directories are `Frontend/` and `server/`, NOT `server_backend/`. Backend runs on port **3001** by default (not 3000 as docs suggest).

### Tech Stack (2025)
- **Frontend**: Next.js 16.0.0, React 19.2.0, Tailwind CSS 4, shadcn/ui (New York style), Lucide icons
- **Backend**: NestJS 11, Prisma 6.18+ (with `prisma.config.ts`), Supabase Authentication, Supabase PostgreSQL
- **Mobile**: Android app with LiveKit VoIP integration
- **Database**: 13 Prisma models with enums (Tenant, User, Contact, Lead, Pipeline, Stage, Deal, Interaction, Ticket, Integration, CallLog, PortalCustomer)
- **Shared Patterns**: TypeScript strict mode, ESM modules, class-validator for DTOs

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
- **Run dev**: `cd server && npm run start:dev` (port 3001 by default)
- **Generate resources**: `nest generate module <name>`, `nest generate service <name>/<name>`, etc.
- **Test**: `npm run test` (Jest with `ts-jest`)
- **Key Dependencies**: `@supabase/supabase-js`, `@prisma/client`, `@nestjs/passport`, `@nestjs/axios`, `class-validator`, `livekit-server-sdk`

**NestJS 11 Specifics**:
- Uses **Express 5** by default (breaking change from v10)
- **Wildcard routes** must be named: use `@Get('/*splat')` NOT `@Get('/*')`
- **Module Resolution**: Uses `tsconfig-paths` for path aliases (no manual `.js` extensions needed)
- **Decorators**: Already enabled in `tsconfig.json`

### Database & Authentication
- **Prisma ORM**: Version 6.18+ uses **TypeScript config file** (`prisma.config.ts` at project root)
  - Schema location: `server/prisma/schema.prisma`
  - Client output: `server/prisma/generated/client` (custom location)
  - Commands: `npx prisma generate`, `npx prisma db push`, `npx prisma studio`
  
- **Authentication Strategy**: **Supabase OAuth**
  - Backend will verify tokens via `@supabase/supabase-js` in `SupabaseAuthGuard`
  - Frontend will use `@supabase/ssr` (already installed)
  - Multi-tenant isolation: Every entity has `tenantId` foreign key

- **Database**: Supabase PostgreSQL with **direct connection URL** for migrations
  ```env
  DATABASE_URL="postgresql://..."
  DIRECT_URL="postgresql://..."  # Critical for Supabase connection pooler
  ```

**Required Backend Environment Variables** (`server/.env`):
```env
# Database (Supabase PostgreSQL - get from Supabase dashboard)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Supabase Authentication (get from Supabase dashboard)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Server Configuration
PORT=3001  # Change from default 3000 to avoid frontend conflict
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"  # For CORS
```

## Project-Specific Conventions

### Multi-Tenant Pattern (CRITICAL - READ FIRST)
**Every database entity MUST include `tenantId`** for data isolation. The Prisma schema defines enums for type safety:

```prisma
enum UserRole { ADMIN, MANAGER, MEMBER }
enum LeadStatus { NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED }
enum TicketStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED }
enum TicketPriority { LOW, MEDIUM, HIGH, URGENT }
```

**API Endpoints** must:
1. Extract tenant from authenticated user via `SupabaseAuthGuard`
2. Filter all queries by `tenantId`—use `findFirst` or `findMany` with `where: { tenantId, ... }` to prevent cross-tenant data leaks
3. Use TypeScript enums instead of strings for status fields

**Example Service Method**:
```typescript
import { LeadStatus } from 'prisma/generated/client';

async findAll(tenantId: string, filters?: any) {
  return this.prisma.lead.findMany({
    where: { 
      tenantId, 
      status: LeadStatus.NEW,  // Type-safe enum
      ...filters 
    },
    include: { contact: true, deals: true },
  });
}
```

**Example Controller Method (Backend)**:
```typescript
@Get()
@UseGuards(SupabaseAuthGuard)  // Verifies JWT token
async findAll(
  @Query() filters: any,
  @CurrentUser('id') supabaseUserId: string,  // Extract from JWT
) {
  const user = await this.authService.getUserDetails(supabaseUserId);
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
3. **Authentication Headers**: Frontend sends `Authorization: Bearer <supabase-jwt>` on every request
4. **Data Fetching**: Use `@tanstack/react-query` (already installed and configured)

### External Integrations (Future)
Per workflow doc, Phase 2 features include:
- **Gmail Integration**: Sync emails to `Interaction` model
- **VoIP**: Store calls in `CallLog` model ✅ (LiveKit fully implemented)
- **Ticket Systems**: Link osTicket/Helpy via `Integration` model with `externalId`

### VoIP Implementation (LiveKit)
**Status**: ✅ Fully implemented across Backend, Frontend, and Android

**Backend Features**:
- LiveKit room management and token generation
- Call state management with WebSocket signaling
- Call logging and recording storage in Supabase
- Multi-tenant call routing and permissions
- Real-time call status updates

**Frontend Features**:
- LiveKit React components for audio calls
- Call UI with mute/unmute, speaker toggle
- Incoming call notifications and modal
- Call history and contact integration
- WebRTC signaling via Socket.IO

**Android Features**:
- LiveKit Android SDK integration
- CallConnectionService for native call UI
- Socket.IO for signaling
- Audio routing (earpiece/speakerphone)
- Firebase push notifications for incoming calls

**Configuration**:
- Add `LIVEKIT_API_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` to backend `.env`
- Frontend connects to LiveKit via `NEXT_PUBLIC_LIVEKIT_URL`

### Common Commands Reference

### Frontend
```powershell
cd Frontend
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint check
```

### Backend
```powershell
cd server
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

1. **Directory Names**: Backend is in `server/` NOT `server_backend/`. Workflow docs reference outdated paths.

2. **Default Backend Port**: `main.ts` uses port 3001 by default to avoid frontend conflict.

3. **Prisma Client Path**: Generated client is at `prisma/generated/client`. Import as:
   ```typescript
   import { PrismaClient, UserRole } from 'prisma/generated/client';
   ```

4. **Frontend Auth**: Supabase authentication fully implemented with `@supabase/ssr` and `@tanstack/react-query`

5. **Prisma Config Location**: `prisma.config.ts` is at **project root** (`server/prisma.config.ts`), not inside `prisma/` directory.

6. **Next.js 16 Async Params**: Pages using `params` or `searchParams` must declare them as `Promise<T>` and await them.

7. **Enum Usage**: Always use Prisma-generated TypeScript enums (e.g., `TicketStatus.OPEN`) instead of strings for type safety.

## Workflow Documentation
**Critical Reference**: Read `synapse-crm-workflow.md` for:
- Complete 5-phase development roadmap (Foundation → Backend → Frontend → Integration → Deployment)
- Environment setup steps (Supabase account creation)
- Full Prisma schema definitions
- Example API endpoint implementations (Contact CRUD, Auth flow)
- Dependency graphs and troubleshooting guide

**When Starting New Features**:
1. Check if backend API exists (workflow doc has examples for Contact, Lead, Deal, etc.)
2. Verify frontend has required packages installed before implementing UI
3. Follow multi-tenant pattern (always filter by `tenantId`)
4. Use `SupabaseAuthGuard` on all protected backend routes
5. Use shadcn/ui components (`@/components/ui/*`) for consistent styling

## Development Priority: Backend-First Approach

**Current Focus**: Complete frontend pages for Contacts, Leads, Deals, Tickets with full CRUD operations.

### Backend Development Order (Start Here)

#### Phase 1: Database Foundation
```powershell
cd server
npx prisma generate  # Already done - client exists at prisma/generated/client
npx prisma db push   # Already done - schema pushed to Supabase
npx prisma studio    # Use this to inspect database
```

#### Phase 2: Core Infrastructure
```powershell
# Already completed - DatabaseModule and PrismaService exist
# All feature modules (Contacts, Leads, Deals, Tickets, Pipelines, Stages) are implemented
# Verify: check server/src/*/ modules
```
**Remaining tasks**:
1. Update `main.ts`:
   - Enable global ValidationPipe ✅
   - Enable CORS for `http://localhost:3000` ✅
   - Set global prefix to `'api'` ✅
   - Change port from 3000 to 3001 ✅

#### Phase 3: Authentication Module
```powershell
# Already completed - SupabaseAuthModule fully implemented
# Verify: check server/src/supabase-auth/ directory
```

#### Phase 4: Feature Modules (Build in Order)
Each module follows same pattern - see workflow doc section 2.9 for Contact example:

1. **Contact Module** ✅ (Already implemented)
   ```powershell
   # Already completed - check server/src/contacts/
   ```
   - DTOs with `class-validator` decorators ✅
   - Service methods MUST filter by `tenantId` ✅
   - Controller uses `@UseGuards(SupabaseAuthGuard)` ✅
   - Extract tenantId via `AuthService.getUserDetails(supabaseUserId)` ✅

2. **Lead Module** ✅ (Already implemented)
3. **Pipeline & Stage Modules** ✅ (Already implemented)
4. **Deal Module** ✅ (Already implemented)
5. **Interaction Module** (Future)
6. **Ticket Module** ✅ (Already implemented)
7. **Integration & CallLog Modules** ✅ (LiveKit VoIP implemented)

#### Testing Backend Endpoints
```powershell
# Start backend
npm run start:dev

# Test with curl or Postman
curl -X GET http://localhost:3001/api/auth/me `
  -H "Authorization: Bearer YOUR_SUPABASE_JWT"
```

### Frontend Development (After Backend is Stable)

**Wait until backend Phase 4 is complete** before starting frontend integration.

#### Phase 1: Install Missing Dependencies
```powershell
cd Frontend
# All required dependencies already installed:
# @supabase/ssr, @tanstack/react-query, axios, @livekit/components-react, etc.
```

#### Phase 2: Authentication Setup
```powershell
# Already completed - Supabase authentication fully implemented
# Verify: check Frontend/src/hooks/useUser.ts, Frontend/src/providers.tsx
```

#### Phase 3: Feature Pages (Match Backend Modules)
1. **Dashboard with stats** ✅ (Already implemented - check `/dashboard`)
2. **Analytics page** ✅ (Already implemented - check `/analytics`)
3. Contacts page with list/create/edit (Next priority)
4. Leads, Deals, Tickets pages
5. Form components with `react-hook-form`

## Current Project State (as of Nov 21, 2025)
- ✅ Frontend: Landing page complete with shadcn/ui, Tailwind CSS 4, full responsive design
- ✅ Backend: NestJS 11 with PrismaService, DatabaseModule configured, all core modules implemented
- ✅ Database: Complete Prisma schema (13 models) generated and pushed to Supabase
- ✅ Authentication: Supabase OAuth fully implemented with guards, services, and frontend hooks
- ✅ API Endpoints: All feature modules implemented (Contact, Lead, Deal, Ticket, Pipeline, Stage, Analytics, LiveKit VoIP)
- ✅ Frontend Auth: Supabase authentication with providers, user hooks, and protected routes
- ✅ Frontend Features: Dashboard with stats, Analytics page with revenue forecasting, LiveKit VoIP integration
- ✅ Android: LiveKit VoIP integration with CallConnectionService and LiveKitManager
- 🎯 **Next Action**: Complete frontend pages for Contacts, Leads, Deals, Tickets with full CRUD operations
