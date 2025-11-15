# Supabase Authentication Setup Guide

## ✅ Completed Steps

### 1. Backend Implementation
- [x] Created `SupabaseAuthService` with token verification, signup, signin, signout, password reset
- [x] Created `SupabaseAuthGuard` for JWT validation
- [x] Created `@CurrentUser` decorator for extracting user from request
- [x] Created `AuthController` with REST endpoints
- [x] Created `AuthService` for syncing Supabase users with database
- [x] Updated Prisma schema: `clerkId` → `supabaseUserId`
- [x] Added `domain` field to Tenant model
- [x] Added `TenantType.BUSINESS` enum value
- [x] Generated Prisma client and pushed schema to database

### 2. Database Schema Updates
```prisma
model User {
  supabaseUserId  String   @unique @map("supabase_user_id")
  firstName       String?  @map("first_name")
  lastName        String?  @map("last_name")
  // ... other fields
}

model Tenant {
  domain    String? // Optional domain for tenant
  // ... other fields
}

enum TenantType {
  ORGANIZATION
  PERSONAL
  BUSINESS // Added for compatibility
}
```

## 🔧 Configuration Required

### Step 1: Add Supabase Environment Variables

Add to `server/.env`:

```env
# Supabase Authentication
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**How to get these values:**
1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (secret)

### Step 2: Import SupabaseAuthModule in AppModule

Update `server/src/app.module.ts`:

```typescript
import { SupabaseAuthModule } from './supabase-auth/supabase-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SupabaseAuthModule, // Add this line
    // ... other modules
  ],
})
export class AppModule {}
```

## 📋 Next Steps (Backend)

### 1. Update Controllers to Use SupabaseAuthGuard

Replace `ClerkAuthGuard` with `SupabaseAuthGuard` in these files:

- [ ] `src/contacts/contacts.controller.ts`
- [ ] `src/leads/leads.controller.ts`
- [ ] `src/deals/deals.controller.ts`
- [ ] `src/tickets/tickets.controller.ts`
- [ ] `src/pipelines/pipelines.controller.ts`
- [ ] `src/analytics/analytics.controller.ts`
- [ ] `src/twilio/twilio.controller.ts`
- [ ] `src/osticket/osticket.controller.ts`
- [ ] `src/jira/controllers/jira-issue.controller.ts`

**Example change:**
```typescript
// OLD:
import { ClerkAuthGuard } from '../clerk/guards/clerk-auth/clerk-auth.guard';
@UseGuards(ClerkAuthGuard)
async findAll(@CurrentUser('sub') clerkId: string) {
  const user = await this.authService.getUserByClerkId(clerkId);
  // ...
}

// NEW:
import { SupabaseAuthGuard } from '../supabase-auth/guards/supabase-auth/supabase-auth.guard';
import { CurrentUser } from '../supabase-auth/decorators/current-user.decorator';
@UseGuards(SupabaseAuthGuard)
async findAll(@CurrentUser('id') supabaseUserId: string) {
  const user = await this.authService.getUserBySupabaseId(supabaseUserId);
  // ...
}
```

### 2. Test Authentication Endpoints

```bash
# Start backend
npm run start:dev

# Test signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User",
    "workspaceName": "Test Workspace",
    "workspaceType": "business"
  }'

# Test signin
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'

# Test protected route (use access_token from signin response)
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Delete Old Clerk Code

Once Supabase auth is working:

```bash
# Delete Clerk module
rm -r src/clerk

# Remove Clerk dependencies
npm uninstall @clerk/backend @clerk/nextjs
```

## 🎯 Frontend Integration (Next)

### 1. Install Supabase Packages

```bash
cd Frontend
npm uninstall @clerk/nextjs
npm install @supabase/ssr @supabase/supabase-js
```

### 2. Create Supabase Client

Create `Frontend/src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

Create `Frontend/src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};
```

### 3. Create Middleware

Create `Frontend/src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 4. Add Environment Variables

Add to `Frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 📱 Android Integration (Last)

### 1. Add Supabase Dependency

Update `android/app/build.gradle.kts`:

```kotlin
dependencies {
    // Supabase
    implementation("io.github.jan-tennert.supabase:postgrest-kt:2.0.0")
    implementation("io.github.jan-tennert.supabase:gotrue-kt:2.0.0")
    implementation("io.ktor:ktor-client-android:2.3.0")
    // ... other dependencies
}
```

### 2. Create Supabase Client

Create `app/src/main/java/com/synapse/data/auth/SupabaseClient.kt`:

```kotlin
package com.synapse.data.auth

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest

object SupabaseClient {
    val client = createSupabaseClient(
        supabaseUrl = "https://your-project-id.supabase.co",
        supabaseKey = "your-anon-key"
    ) {
        install(Auth)
        install(Postgrest)
    }
}
```

### 3. Create Auth Repository

```kotlin
class AuthRepository @Inject constructor() {
    private val supabase = SupabaseClient.client
    
    suspend fun signIn(email: String, password: String): Result<User> {
        return try {
            val user = supabase.auth.signInWith(Email) {
                this.email = email
                this.password = password
            }
            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun signUp(email: String, password: String): Result<User> {
        return try {
            val user = supabase.auth.signUpWith(Email) {
                this.email = email
                this.password = password
            }
            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getSession(): Session? {
        return supabase.auth.currentSessionOrNull()
    }
}
```

## 🎉 Migration Complete Checklist

- [x] Backend Supabase auth implementation
- [x] Database schema updated
- [x] Prisma client generated
- [ ] Environment variables configured
- [ ] AppModule updated
- [ ] Controllers updated with SupabaseAuthGuard
- [ ] Backend tested with curl/Postman
- [ ] Frontend Supabase client created
- [ ] Frontend auth pages created
- [ ] Frontend .env.local configured
- [ ] Android Supabase SDK installed
- [ ] Android auth implemented
- [ ] Clerk code deleted

## 📊 Estimated Timeline

- **Backend controller updates**: 2 hours
- **Backend testing**: 1 hour
- **Frontend implementation**: 1-2 days
- **Android implementation**: 2 days
- **Total**: 4-5 days

## 🔗 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Next.js Integration](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Kotlin SDK](https://github.com/supabase-community/supabase-kt)
