# 🧪 Testing Guide - SynapseCRM

Comprehensive testing guide for all features in the multi-tenant CRM system.

## Table of Contents

1. [Setup for Testing](#setup-for-testing)
2. [Backend API Testing](#backend-api-testing)
3. [Frontend E2E Testing](#frontend-e2e-testing)
4. [Multi-Tenant Isolation Testing](#multi-tenant-isolation-testing)
5. [Email Testing](#email-testing)
6. [Security Testing](#security-testing)
7. [Performance Testing](#performance-testing)

---

## Setup for Testing

### Prerequisites

```bash
# Backend running
cd server
npm run start:dev  # Port 3001

# Frontend running
cd Frontend
npm run dev  # Port 3000

# Email configured (see EMAIL_SETUP.md)
```

### Test Accounts Setup

Create these test accounts in Clerk:

1. **Admin User** - `admin@test.com`
2. **Manager User** - `manager@test.com`
3. **Member User** - `member@test.com`
4. **Customer User** - `customer@test.com`

### Test Tenants Setup

1. **Tenant A** - "Acme Corp"
2. **Tenant B** - "Beta Industries"

---

## Backend API Testing

### 1. Authentication Endpoints

#### Test: Get Current User Details
```bash
# Replace [TOKEN] with your Clerk JWT token
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer [TOKEN]"

# Expected Response:
{
  "id": "user_xxx",
  "clerkId": "user_xxx",
  "email": "admin@test.com",
  "firstName": "John",
  "lastName": "Doe",
  "tenants": [
    {
      "tenantId": "tenant_yyy",
      "role": "ADMIN",
      "tenant": { "id": "tenant_yyy", "name": "Acme Corp" }
    }
  ]
}
```

#### Test: Get User's Tenants
```bash
curl -X GET http://localhost:3001/api/users/my-tenants \
  -H "Authorization: Bearer [TOKEN]"

# Expected: Array of tenants with roles
```

### 2. Employee Invitation Endpoints

#### Test: Send Employee Invitation
```bash
curl -X POST http://localhost:3001/api/users/invite \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemployee@test.com",
    "role": "MANAGER",
    "firstName": "Jane",
    "lastName": "Smith"
  }'

# Expected Response:
{
  "id": "invitation_xxx",
  "email": "newemployee@test.com",
  "role": "MANAGER",
  "invitedBy": "user_xxx",
  "tenantId": "tenant_yyy",
  "token": "inv_xxxx...",
  "expiresAt": "2025-11-11T...",
  "createdAt": "2025-11-04T..."
}
```

#### Test: List Pending Invitations
```bash
curl -X GET http://localhost:3001/api/users/invitations \
  -H "Authorization: Bearer [TOKEN]"

# Expected: Array of pending invitations
```

#### Test: Get Invitation by Token
```bash
curl -X GET "http://localhost:3001/api/users/invitation/[TOKEN]"

# Expected: Invitation details (no auth required)
```

#### Test: Accept Invitation
```bash
curl -X POST http://localhost:3001/api/users/accept-invite \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{ "token": "inv_xxxx..." }'

# Expected Response:
{
  "message": "Invitation accepted successfully",
  "tenantId": "tenant_yyy",
  "role": "MANAGER"
}
```

#### Test: Cancel Invitation (Admin Only)
```bash
curl -X DELETE http://localhost:3001/api/users/invitation/[ID] \
  -H "Authorization: Bearer [TOKEN]"

# Expected: { "message": "Invitation cancelled successfully" }
```

### 3. Team Management Endpoints

#### Test: Get Team Members
```bash
curl -X GET http://localhost:3001/api/users/team \
  -H "Authorization: Bearer [TOKEN]"

# Expected: Array of users in current tenant
```

#### Test: Deactivate Team Member (Admin Only)
```bash
curl -X PATCH http://localhost:3001/api/users/[USER_ID]/deactivate \
  -H "Authorization: Bearer [TOKEN]"

# Expected: { "message": "User deactivated successfully" }
```

### 4. Customer Portal Endpoints

#### Test: Invite Customer to Portal
```bash
curl -X POST http://localhost:3001/api/portal/customers/invite \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "contact_xxx",
    "email": "customer@test.com",
    "firstName": "Bob",
    "lastName": "Customer"
  }'

# Expected: Portal invitation created
```

#### Test: Get Portal Customers
```bash
curl -X GET http://localhost:3001/api/portal/customers \
  -H "Authorization: Bearer [TOKEN]"

# Expected: Array of portal customers
```

#### Test: Accept Portal Invitation
```bash
curl -X POST http://localhost:3001/api/portal/customers/accept \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{ "token": "portal_xxx..." }'

# Expected: Portal access activated
```

#### Test: Deactivate Portal Access
```bash
curl -X DELETE http://localhost:3001/api/portal/customers/[ID] \
  -H "Authorization: Bearer [TOKEN]"

# Expected: { "message": "Portal access deactivated" }
```

---

## Frontend E2E Testing

### 1. User Sign-Up Flow

**Steps:**
1. Navigate to `http://localhost:3000`
2. Click "Get Started" button
3. Complete Clerk sign-up form
4. Fill in onboarding form:
   - Company Name: "Test Corp"
   - Role: "ADMIN"
5. Submit form
6. Verify redirect to dashboard
7. Check database for new tenant and user

**Expected:**
- ✅ User created in database
- ✅ Tenant created with unique ID
- ✅ User-Tenant relationship created with ADMIN role
- ✅ Dashboard loads without errors

### 2. Employee Invitation Flow

**Steps:**
1. Sign in as Admin user
2. Navigate to Settings → Team tab
3. Click "Invite Team Member"
4. Fill invitation form:
   - Email: `newmember@test.com`
   - First Name: "New"
   - Last Name: "Member"
   - Role: "MANAGER"
5. Click "Send Invitation"
6. Check email inbox
7. Open invitation email
8. Click "Accept Invitation" link
9. Sign in with Clerk
10. Accept invitation on page
11. Verify redirect to dashboard

**Expected:**
- ✅ Invitation email sent within 10 seconds
- ✅ Email contains correct company name and role
- ✅ Accept link works
- ✅ User added to tenant with correct role
- ✅ User can access tenant dashboard

### 3. Multi-Tenant Access Flow

**Steps:**
1. Create first tenant as User A
2. Sign out
3. Create second tenant as Admin of Tenant B
4. Invite User A to Tenant B (as MEMBER)
5. Sign in as User A
6. Verify tenant selection page appears
7. Select Tenant A
8. Verify correct workspace loads
9. Click workspace switcher
10. Select Tenant B
11. Verify workspace switches correctly

**Expected:**
- ✅ Tenant selection page shows both tenants
- ✅ Role badges display correctly (ADMIN, MEMBER)
- ✅ Workspace data is isolated
- ✅ User cannot see Tenant B data when in Tenant A
- ✅ Workspace switcher works seamlessly

### 4. Customer Portal Invitation Flow

**Steps:**
1. Sign in as Admin
2. Create a contact: "John Customer"
3. Click "Invite to Portal" button
4. Fill invitation form
5. Send invitation
6. Check email
7. Open invitation email
8. Click "Activate Portal Access"
9. Sign in with Clerk (or sign up)
10. Accept invitation
11. Verify redirect to `/portal`

**Expected:**
- ✅ Portal invitation email sent
- ✅ Email has blue/cyan branding (distinct from employee)
- ✅ Portal access activated
- ✅ Customer can access portal dashboard

### 5. Team Management Interface

**Steps:**
1. Navigate to Settings → Team
2. Verify three sections visible:
   - Invite form
   - Pending invitations list
   - Active team members list
3. Send new invitation
4. Verify appears in pending list
5. Cancel invitation
6. Verify removed from pending list
7. Deactivate team member
8. Verify member grayed out in list

**Expected:**
- ✅ Real-time updates after each action
- ✅ Success/error toasts display
- ✅ Role badges display correctly
- ✅ Action buttons (Cancel, Deactivate) work

---

## Multi-Tenant Isolation Testing

### Critical: Data Isolation Verification

**Objective:** Ensure users cannot access other tenants' data.

#### Test 1: Contact Data Isolation

**Setup:**
```sql
-- Tenant A: contact_a
-- Tenant B: contact_b
```

**Test:**
1. Sign in as Admin of Tenant A
2. Create contact "Contact A"
3. Note contact ID
4. Sign in as Admin of Tenant B
5. Try to access Contact A via API:
   ```bash
   curl http://localhost:3001/api/contacts/[CONTACT_A_ID] \
     -H "Authorization: Bearer [TENANT_B_TOKEN]"
   ```

**Expected:**
- ❌ Should return 404 or 403 error
- ✅ Should NOT return contact data

#### Test 2: User List Isolation

**Test:**
1. Sign in as Admin of Tenant A
2. Get team members list
3. Verify only Tenant A users visible
4. Count: Should match database query:
   ```sql
   SELECT COUNT(*) FROM "User" 
   WHERE id IN (
     SELECT "userId" FROM "UserTenant" WHERE "tenantId" = 'tenant_a'
   );
   ```

**Expected:**
- ✅ Only Tenant A users visible
- ✅ Count matches database

#### Test 3: Invitation Isolation

**Test:**
1. Admin of Tenant A sends invitation
2. Note invitation token
3. Sign in as Admin of Tenant B
4. Try to cancel Tenant A's invitation:
   ```bash
   curl -X DELETE http://localhost:3001/api/users/invitation/[INVITATION_ID] \
     -H "Authorization: Bearer [TENANT_B_TOKEN]"
   ```

**Expected:**
- ❌ Should return 403 Forbidden
- ✅ Invitation should remain active

---

## Email Testing

### 1. Employee Invitation Email

**Verify:**
- ✅ Subject: "You're invited to join [Company Name] on SynapseCRM"
- ✅ Contains company name
- ✅ Contains role badge (ADMIN/MANAGER/MEMBER)
- ✅ Contains expiration date (7 days from now)
- ✅ Accept button works
- ✅ Gradient styling matches brand (purple/indigo)
- ✅ Footer has correct company name
- ✅ HTML renders correctly in:
  - Gmail
  - Outlook
  - Apple Mail
  - Mobile devices

### 2. Customer Portal Invitation Email

**Verify:**
- ✅ Subject: "Welcome to [Company Name] Customer Portal"
- ✅ Contains company name
- ✅ Lists portal benefits (3 items)
- ✅ Blue/cyan gradient (distinct from employee emails)
- ✅ Activate button works
- ✅ No expiration date mentioned
- ✅ Renders correctly in all email clients

### 3. Email Deliverability

**Test:**
1. Send invitations to:
   - Gmail account
   - Outlook account
   - Yahoo account
   - Custom domain
2. Check delivery time
3. Check spam folder
4. Verify links work

**Expected:**
- ✅ Delivered within 30 seconds
- ✅ Not in spam folder
- ✅ All links functional
- ✅ Images load correctly

---

## Security Testing

### 1. Authentication Bypass Testing

**Test: Access Protected Route Without Token**
```bash
curl -X GET http://localhost:3001/api/auth/me

# Expected: 401 Unauthorized
```

**Test: Access with Invalid Token**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer invalid_token_xxx"

# Expected: 401 Unauthorized
```

**Test: Access with Expired Token**
```bash
# Use old expired Clerk token
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer [EXPIRED_TOKEN]"

# Expected: 401 Unauthorized
```

### 2. Role-Based Access Control

**Test: Member Cannot Invite Users**
```bash
# Sign in as MEMBER role user
curl -X POST http://localhost:3001/api/users/invite \
  -H "Authorization: Bearer [MEMBER_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@test.com", "role": "MEMBER" }'

# Expected: 403 Forbidden
```

**Test: Manager Cannot Deactivate Users**
```bash
curl -X PATCH http://localhost:3001/api/users/[USER_ID]/deactivate \
  -H "Authorization: Bearer [MANAGER_TOKEN]"

# Expected: 403 Forbidden (only ADMIN can deactivate)
```

### 3. Input Validation Testing

**Test: Invalid Email Format**
```bash
curl -X POST http://localhost:3001/api/users/invite \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{ "email": "notanemail", "role": "MEMBER" }'

# Expected: 400 Bad Request with validation errors
```

**Test: Invalid Role**
```bash
curl -X POST http://localhost:3001/api/users/invite \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@test.com", "role": "SUPERUSER" }'

# Expected: 400 Bad Request
```

### 4. SQL Injection Testing

**Test: Malicious Email Input**
```bash
curl -X POST http://localhost:3001/api/users/invite \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@test.com; DROP TABLE User;--", "role": "MEMBER" }'

# Expected: 400 Bad Request (email validation fails)
# Database should remain intact
```

---

## Performance Testing

### 1. Load Testing with Apache Bench

```bash
# Install Apache Bench (Windows)
choco install apache-httpd

# Test: 1000 requests, 10 concurrent
ab -n 1000 -c 10 \
  -H "Authorization: Bearer [TOKEN]" \
  http://localhost:3001/api/auth/me

# Target Metrics:
# - Response time: < 200ms (p95)
# - Throughput: > 50 req/sec
# - Failed requests: 0
```

### 2. Database Query Performance

```bash
# Enable Prisma query logging
# In prisma/schema.prisma, add:
# log = ["query", "info", "warn", "error"]

# Run application and monitor logs
npm run start:dev

# Check for slow queries (> 100ms)
```

**Optimization Checklist:**
- [ ] Indexes on `tenantId` columns
- [ ] Indexes on `email` columns
- [ ] Composite indexes for common queries
- [ ] Connection pooling configured
- [ ] Query result caching (if needed)

### 3. Email Sending Performance

**Test:**
1. Send 10 invitations simultaneously
2. Measure time to send all
3. Check email delivery time

**Target:**
- ✅ All sent within 5 seconds
- ✅ All delivered within 30 seconds
- ✅ No failures

---

## Automated Testing

### Backend Unit Tests (Jest)

```bash
cd server

# Run all tests
npm run test

# Run specific test file
npm run test users.service.spec.ts

# Run with coverage
npm run test:cov
```

**Key Test Files to Create:**
- `users.service.spec.ts` - Test invitation logic
- `portal-customers.service.spec.ts` - Test portal logic
- `email.service.spec.ts` - Test email templates
- `clerk-auth.guard.spec.ts` - Test authentication

### Backend E2E Tests (Supertest)

```bash
# Run E2E tests
npm run test:e2e
```

**Example E2E Test:**
```typescript
// test/users.e2e-spec.ts
describe('Users (e2e)', () => {
  it('/api/users/invite (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/users/invite')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        email: 'test@test.com',
        role: 'MANAGER',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe('test@test.com');
      });
  });
});
```

---

## Test Data Cleanup

### After Testing

```sql
-- Delete test invitations
DELETE FROM "UserInvitation" WHERE email LIKE '%test.com';

-- Delete test users (careful!)
DELETE FROM "UserTenant" WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE '%test.com'
);
DELETE FROM "User" WHERE email LIKE '%test.com';

-- Delete test tenants (very careful!)
DELETE FROM "Tenant" WHERE name LIKE 'Test%';

-- Or use Prisma Studio for manual cleanup
npx prisma studio
```

---

## Testing Checklist

### Before Each Release

- [ ] All backend unit tests pass
- [ ] All E2E tests pass
- [ ] Manual testing of critical flows completed
- [ ] Multi-tenant isolation verified
- [ ] Email delivery tested
- [ ] Security tests pass
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] CORS settings verified
- [ ] Environment variables validated
- [ ] Error handling tested
- [ ] Logging working correctly

### Monthly Security Audit

- [ ] Review Clerk audit logs
- [ ] Check for suspicious API calls
- [ ] Review database access logs
- [ ] Update dependencies
- [ ] Run security scanning tools
- [ ] Test authentication flows
- [ ] Verify RBAC still working
- [ ] Check for data leaks

---

**✅ Testing Complete!**

Comprehensive testing ensures:
- 🔒 Security: Authentication, authorization, input validation
- 🏢 Multi-tenancy: Complete data isolation
- 📧 Email: Deliverability and formatting
- ⚡ Performance: Fast response times
- 🐛 Quality: Caught bugs before production

**Next Steps:**
1. Set up CI/CD with automated testing
2. Add Sentry for error tracking
3. Configure uptime monitoring
4. Schedule regular security audits
