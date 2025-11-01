# Phase 6: Dual Authentication Flow (Internal CRM + Customer Portal)

## Overview

Synapse CRM now supports TWO distinct user flows:

1. **Internal Onboarding** — Your team members create workspaces
2. **Portal Onboarding** — External customers access a limited portal

---

## 6.1: Internal Onboarding (Existing Flow)

**Who:** Your CRM administrators and team members

**Flow:**
1. User visits `/sign-up` and creates Clerk account
2. Redirected to `/onboard`
3. Fills form with `tenantName: "Acme Inc."`
4. Frontend calls `POST /auth/onboard`
5. Backend creates:
   - New `Tenant` record with slug
   - New `User` record with `role: "admin"` and linked to tenant
6. User redirected to `/dashboard` (internal CRM)

**Frontend Code:**
```typescript
// src/app/onboard/page.tsx
const mutation = useMutation({
  mutationFn: async (data: { tenantName: string }) => {
    const response = await apiClient.post('/auth/onboard', data);
    return response.data;
  },
  onSuccess: () => {
    router.push('/dashboard');  // Internal dashboard
  },
});
```

**Backend Code:**
```typescript
// src/auth/auth.controller.ts
@Post('onboard')
@UseGuards(ClerkAuthGuard)
async onboard(
  @CurrentUser('sub') clerkId: string,
  @CurrentUser('email_addresses') emailArray: any[],
  @Body() body: { tenantName: string },
) {
  const email = emailArray?.[0]?.email_address;
  const name = `${firstName} ${lastName}`.trim();

  // Create tenant and admin user
  const { tenant, user } = await this.authService.createInitialUserAndTenant(
    clerkId,
    email,
    name,
    body.tenantName,
  );

  return { message: 'Onboarded successfully', tenant, user };
}
```

---

## 6.2: Portal Onboarding (NEW Flow)

**Who:** External customers invited by your CRM admins

**Flow:**
1. **Admin invites customer** (via CRM dashboard):
   - Admin navigates to `/dashboard/portal-customers/invite`
   - Enters `customer@email.com` and selects `tenantId: "acme-inc-123"`
   - Backend creates `PortalCustomer` record:
     ```prisma
     {
       id: "portal_abc",
       tenantId: "acme-inc-123",
       email: "customer@email.com",
       clerkId: null,  // Not yet linked
       name: null,
       createdAt: now(),
     }
     ```

2. **Customer receives invite link**:
   - Email contains: `https://yourapp.com/portal/accept-invite?tenantId=acme-inc-123`

3. **Customer signs up**:
   - Visits link → redirected to Clerk sign-up
   - Creates account with `customer@email.com`
   - After sign-up, frontend detects:
     - `isSignedIn = true`
     - `tenantId` from URL params

4. **Auto-sync happens**:
   - Frontend immediately calls `POST /portal/auth/sync`
   - Backend finds `PortalCustomer` by `tenantId` + `email`
   - Updates `clerkId` to link Clerk account
   - Returns success

5. **Customer redirected to portal**:
   - Frontend redirects to `/portal/dashboard`
   - Limited UI with tickets, messages, documents only

**Frontend Code:**
```typescript
// src/app/portal/accept-invite/page.tsx
const syncMutation = useMutation({
  mutationFn: async (tenantId: string) => {
    const response = await apiClient.post('/portal/auth/sync', { tenantId });
    return response.data;
  },
  onSuccess: () => {
    setSynced(true);
    router.push('/portal/dashboard');  // Portal dashboard
  },
});

// Auto-trigger sync after sign-up
useEffect(() => {
  if (isSignedIn && tenantId && !synced) {
    syncMutation.mutate(tenantId);
  }
}, [isSignedIn, tenantId, synced]);
```

**Backend Code:**
```typescript
// src/portal/auth/portal-auth.controller.ts
@Post('sync')
@UseGuards(ClerkAuthGuard)
async syncPortalUser(
  @CurrentUser('sub') clerkId: string,
  @CurrentUser() fullUser: JwtPayload,
  @Body() body: { tenantId: string },
) {
  // Extract email from Clerk token
  const email = fullUser.email_addresses?.find(
    (e) => e.id === fullUser.primary_email_address_id,
  )?.email_address;

  if (!email) {
    throw new BadRequestException('Primary email not found');
  }

  // Find and update PortalCustomer
  const portalCustomer = await this.portalAuthService.syncPortalCustomer(
    clerkId,
    email,
    body.tenantId,
  );

  return {
    message: 'Portal account synced successfully',
    user: portalCustomer,
  };
}
```

**Backend Service:**
```typescript
// src/portal/auth/portal-auth.service.ts
async syncPortalCustomer(clerkId: string, email: string, tenantId: string) {
  // Find pre-created invite
  const portalCustomer = await this.prisma.portalCustomer.findUnique({
    where: {
      tenantId_email: { tenantId, email },
    },
  });

  if (!portalCustomer) {
    throw new ForbiddenException('Invite not found');
  }

  if (portalCustomer.clerkId && portalCustomer.clerkId !== clerkId) {
    throw new ForbiddenException('Email already linked to another user');
  }

  if (portalCustomer.clerkId === clerkId) {
    return portalCustomer;  // Already synced
  }

  // First-time sync: update clerkId
  return await this.prisma.portalCustomer.update({
    where: { id: portalCustomer.id },
    data: { clerkId },
  });
}
```

---

## 6.3: Key Differences Between Flows

| Aspect | Internal Onboarding | Portal Onboarding |
|--------|---------------------|-------------------|
| **Trigger** | User self-sign-up | Admin sends invite |
| **Database Record** | Creates `Tenant` + `User` | Updates `PortalCustomer` |
| **Clerk ID** | Stored in `User.clerkId` | Stored in `PortalCustomer.clerkId` |
| **Dashboard** | `/dashboard` (full CRM) | `/portal/dashboard` (limited) |
| **Permissions** | Full access (contacts, deals, etc.) | Restricted (tickets, messages) |
| **Backend Endpoint** | `POST /auth/onboard` | `POST /portal/auth/sync` |

---

## 6.4: Environment Variables (.env.local)

**Frontend:**
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"  # Internal users
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboard"    # Internal users

# Backend API
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001/api"
```

---

## 6.5: Security Considerations

### Portal Customer Isolation

**Critical:** Portal customers should NEVER access internal CRM routes.

**Middleware Protection:**
```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/portal/accept-invite(.*)',
])

const isPortalRoute = createRouteMatcher(['/portal(.*)'])
const isInternalRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth();
  }
  
  // Future: Add role-based checks
  // if (isInternalRoute(request)) {
  //   // Verify user has internal CRM access
  // }
  // if (isPortalRoute(request)) {
  //   // Verify user is portal customer
  // }
})
```

**Backend Guards:**
```typescript
// Separate guards for internal vs portal endpoints
@UseGuards(ClerkAuthGuard)  // For /api/contacts, /api/deals
@UseGuards(PortalGuard)     // For /api/portal/tickets (future)
```

---

## 6.6: Testing the Flows

### Test Internal Onboarding

```bash
# 1. Start backend
cd server && npm run start:dev

# 2. Start frontend
cd Frontend && npm run dev

# 3. Visit http://localhost:3000
# 4. Click Sign Up → create account
# 5. Fill onboarding form with "Test Company"
# 6. Verify redirect to /dashboard
# 7. Check database for Tenant + User records
```

### Test Portal Onboarding

```bash
# 1. Manually create PortalCustomer (using Prisma Studio or SQL):
npx prisma studio

# In PortalCustomer table:
{
  id: "portal_test_123",
  tenantId: "<existing_tenant_id>",
  email: "test@portal.com",
  clerkId: null,
  name: null,
}

# 2. Visit invite link:
http://localhost:3000/portal/accept-invite?tenantId=<tenant_id>

# 3. Sign up with test@portal.com
# 4. Verify auto-sync and redirect to /portal/dashboard
# 5. Check PortalCustomer.clerkId is now populated
```

---

## 6.7: Future Enhancements

### Admin UI for Invitations

Create `/dashboard/portal-customers/invite` page:

```typescript
'use client';

import { useMutation } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api';

export default function InvitePortalCustomerPage() {
  const apiClient = useApiClient();
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await apiClient.post('/portal-customers/invite', data);
      return response.data;
    },
    onSuccess: (data) => {
      const inviteLink = `${window.location.origin}/portal/accept-invite?tenantId=${data.tenantId}`;
      alert(`Invite created! Send this link: ${inviteLink}`);
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate({ email });
    }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="customer@email.com"
        required
      />
      <button type="submit">Send Invite</button>
    </form>
  );
}
```

**Backend Endpoint:**
```typescript
@Post('portal-customers/invite')
@UseGuards(ClerkAuthGuard)
async invitePortalCustomer(
  @CurrentUser('sub') clerkId: string,
  @Body() body: { email: string },
) {
  const user = await this.authService.getUserDetails(clerkId);
  const tenantId = user.tenantId;

  // Create PortalCustomer record
  const portalCustomer = await this.prisma.portalCustomer.create({
    data: {
      email: body.email,
      tenantId: tenantId,
      clerkId: null,  // Will be filled on first login
    },
  });

  // TODO: Send email with invite link
  // await this.emailService.sendPortalInvite(body.email, tenantId);

  return { message: 'Invite sent', portalCustomer };
}
```

---

## 6.8: Troubleshooting

| Issue | Solution |
|-------|----------|
| Portal sync fails with "Invite not found" | Verify `PortalCustomer` exists with correct `tenantId` and `email` |
| User signed up but clerkId not updated | Check if email in Clerk matches `PortalCustomer.email` exactly |
| Redirect loops after sign-up | Ensure `tenantId` is in URL params during sync |
| Portal user can access /dashboard | Add middleware checks (section 6.5) |

---

**Last Updated:** November 1, 2025
**Version:** 2.0 — Dual Authentication Support
**Status:** Production-Ready
