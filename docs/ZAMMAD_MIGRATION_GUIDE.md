# Zammad Migration Guide - Existing Users to Zammad SSO

## 📋 Overview

This guide explains how to migrate your **existing CRM users and portal customers** to Zammad with SSO auto-login support.

### When Do You Need This?

- ✅ **You DO need migration** if you had users/customers BEFORE implementing Zammad SSO
- ❌ **You DON'T need migration** for new users created after SSO implementation (auto-provisioned)

### What This Migration Does

1. **Creates Zammad accounts** for existing CRM users and portal customers
2. **Stores SSO identifiers** (`zammadUserId` and `zammadEmail`) in your database
3. **Handles dual-role users** (same email as both agent and customer in different tenants)
4. **Sets up organization membership** for multi-tenant isolation

---

## 🔧 Prerequisites

### 1. Verify Environment Variables

Ensure these are set in `server/.env`:

```env
# Zammad Configuration (REQUIRED)
ZAMMAD_URL="http://localhost:8080"
ZAMMAD_API_TOKEN="your-admin-token-here"
ZAMMAD_WEBHOOK_SECRET="your-webhook-secret"

# Backend Configuration
BACKEND_URL="http://localhost:3001"
PORT=3001

# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

**How to get ZAMMAD_API_TOKEN:**
1. Login to Zammad: `http://localhost:8080`
2. Go to Profile → Token Access
3. Create new token with admin permissions
4. Copy token to `.env`

### 2. Verify Zammad is Running

```powershell
# Check if Zammad container is running
docker ps | Select-String "zammad"

# OR check HTTP endpoint
curl http://localhost:8080
```

### 3. Database Schema Check

Ensure Prisma migrations are applied:

```powershell
cd server
npx prisma generate
npx prisma db push
```

This should have added:
- `User.zammadUserId` (String?)
- `User.zammadEmail` (String?)
- `PortalCustomer.zammadUserId` (String?)
- `PortalCustomer.zammadEmail` (String?)

---

## 🚀 Migration Steps

### Step 1: Verify Current State

Run the verification script to see what needs migrating:

```powershell
cd server
npm run verify:zammad
```

**Expected Output:**
```
🔍 Starting Zammad Integration Verification...

1️⃣  Testing Zammad Connection...
   ✅ Zammad is reachable and configured

2️⃣  Checking Tenant Organizations...
   Found 3 tenants
   ✅ 3 tenants have Zammad integration:
      - TechCorp (Org ID: 2)
      - SalesPro (Org ID: 3)
      - StartupX (Org ID: 4)

3️⃣  Checking CRM User Accounts...
   Total CRM users: 15
   ✅ With Zammad SSO: 0
   ⚠️  Without Zammad SSO: 15

   ⚠️  Users missing Zammad accounts:
      - admin@techcorp.com (TechCorp, Role: ADMIN)
      - manager@salespro.com (SalesPro, Role: MANAGER)
      ... and 13 more

   💡 Run: npm run migrate:zammad-users

4️⃣  Checking Portal Customer Accounts...
   Total portal customers: 8
   ✅ With Zammad SSO: 0
   ⚠️  Without Zammad SSO: 8

   💡 Run: npm run migrate:zammad-customers

📊 VERIFICATION SUMMARY
============================================================
Zammad Connection:     ✅ OK
Tenants with Orgs:     3/3
Users with SSO:        0/15
Customers with SSO:    0/8
Dual-Role Users:       2
============================================================

⚠️  Action required:
   1. Run: npm run migrate:zammad
   2. Run: npm run migrate:zammad-users
   3. Run: npm run migrate:zammad-customers
```

### Step 2: Migrate Organizations (If Needed)

If verification shows tenants without Zammad integration:

```powershell
npm run migrate:zammad
```

**What this does:**
- Creates Zammad organization for each tenant
- Stores organization ID in `Integration` table
- Sets up basic configuration

### Step 3: Migrate CRM Users (Internal Agents)

```powershell
npm run migrate:zammad-users
```

**What this does:**
- Creates Zammad account for each CRM user
- Assigns agent role and permissions
- Adds user to their tenant's organization
- Stores `zammadUserId` and `zammadEmail` for SSO

**Sample Output:**
```
🔄 Starting Zammad User Migration...

Found 15 CRM users to migrate

Processing: admin@techcorp.com (TechCorp)
  ✅ Created Zammad agent account (ID: 5)
  ✅ Added to organization: TechCorp (ID: 2)
  ✅ Updated CRM database with SSO details

Processing: manager@salespro.com (SalesPro)
  ✅ Created Zammad agent account (ID: 6)
  ✅ Added to organization: SalesPro (ID: 3)
  ✅ Updated CRM database with SSO details

... (continues for all users)

✅ Migration complete! Successfully migrated 15 users.
```

### Step 4: Migrate Portal Customers

```powershell
npm run migrate:zammad-customers
```

**What this does:**
- Creates Zammad customer account
- Adds customer to their tenant's organization
- Stores `zammadUserId` and `zammadEmail` for SSO

**Sample Output:**
```
🔄 Starting Zammad Customer Migration...

Found 8 portal customers to migrate

Processing: customer1@example.com (TechCorp)
  ✅ Created Zammad customer account (ID: 7)
  ✅ Added to organization: TechCorp (ID: 2)
  ✅ Updated CRM database with SSO details

... (continues for all customers)

✅ Migration complete! Successfully migrated 8 customers.
```

### Step 5: Verify Migration Success

Run verification again:

```powershell
npm run verify:zammad
```

**Expected Output After Migration:**
```
📊 VERIFICATION SUMMARY
============================================================
Zammad Connection:     ✅ OK
Tenants with Orgs:     3/3
Users with SSO:        15/15
Customers with SSO:    8/8
Dual-Role Users:       2
============================================================

🎉 All systems operational! Zammad integration fully configured.
```

---

## 🎭 Dual-Role Users (Agent + Customer)

### The Problem

Some users may have the same email address as both:
- **Internal agent** in one tenant (e.g., `john@company.com` works for TechCorp)
- **Portal customer** in another tenant (e.g., `john@company.com` is customer of SalesPro)

Traditional systems can't handle this because they require unique email addresses.

### Our Solution: Organization-Based Access Control

**One Zammad account, multiple organization memberships with different roles:**

```
Zammad Account: john@company.com (ID: 123)
├── Organization: TechCorp (ID: 2)
│   └── Role: Agent (can create/manage tickets)
└── Organization: SalesPro (ID: 3)
    └── Role: Customer (can only view own tickets)
```

**When john@company.com logs in:**
- Context from CRM determines which organization to use
- Agent login → TechCorp organization context → full agent permissions
- Customer portal login → SalesPro organization context → customer permissions only

**No action required** - the migration scripts handle this automatically!

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to Zammad"

**Symptoms:**
```
❌ Cannot connect to Zammad
💡 Check:
   - Is Zammad running? (docker ps or http://localhost:8080)
   - Is ZAMMAD_URL correct in .env?
   - Is ZAMMAD_API_TOKEN valid?
```

**Solutions:**

1. **Check Zammad is running:**
   ```powershell
   docker ps
   # Should show zammad containers running
   ```

2. **Test Zammad API directly:**
   ```powershell
   $headers = @{
       "Authorization" = "Bearer YOUR_API_TOKEN"
   }
   Invoke-RestMethod -Uri "http://localhost:8080/api/v1/users/me" -Headers $headers
   ```

3. **Restart Zammad:**
   ```powershell
   docker-compose restart zammad
   ```

### Issue: "User already exists in Zammad"

**Symptoms:**
```
⚠️  Error migrating user@example.com: User already exists
```

**Solution:**
The script now checks for existing `zammadUserId` before creating. If this error occurs:

1. **Manual check in Zammad:**
   - Login to Zammad UI: `http://localhost:8080`
   - Search for the user email
   - Note their Zammad ID

2. **Update CRM database directly:**
   ```sql
   -- For CRM user
   UPDATE "User"
   SET "zammadUserId" = '5', "zammadEmail" = 'user@example.com'
   WHERE email = 'user@example.com';

   -- For portal customer
   UPDATE "PortalCustomer"
   SET "zammadUserId" = '7', "zammadEmail" = 'customer@example.com'
   WHERE email = 'customer@example.com';
   ```

3. **Re-run migration** - it will skip users with `zammadUserId`

### Issue: "Migration partially completed"

**Symptoms:**
- Some users migrated, others failed
- Verification shows mixed results

**Solution:**
Migration scripts are **idempotent** (safe to re-run):

```powershell
# Re-run will skip already migrated users
npm run migrate:zammad-users
npm run migrate:zammad-customers
```

Users with `zammadUserId` are automatically skipped.

### Issue: "Organization not found"

**Symptoms:**
```
❌ Tenant TechCorp has no Zammad integration
```

**Solution:**
1. **Check Integration table:**
   ```sql
   SELECT * FROM "Integration" WHERE "serviceName" = 'zammad';
   ```

2. **Re-run organization migration:**
   ```powershell
   npm run migrate:zammad
   ```

3. **Manual fix (if needed):**
   - Create organization in Zammad UI
   - Add Integration record in CRM database

---

## ⚡ Quick Commands Reference

```powershell
# Full migration (all steps at once)
npm run migrate:zammad-all

# Individual steps
npm run migrate:zammad              # 1. Create organizations
npm run migrate:zammad-groups       # 2. Create groups
npm run migrate:zammad-users        # 3. Migrate CRM users
npm run migrate:zammad-customers    # 4. Migrate portal customers

# Verification
npm run verify:zammad               # Check migration status
```

---

## 🧪 Testing SSO After Migration

### Test Agent Auto-Login

1. Login to CRM as internal user: `http://localhost:3000/login`
2. Navigate to Tickets page: `http://localhost:3000/dashboard/tickets`
3. Click **"Open Zammad"** button
4. **Expected:** Opens Zammad in new tab, automatically logged in as agent

### Test Customer Auto-Login

1. Login to portal as customer: `http://localhost:3000/portal/login`
2. Navigate to Tickets page: `http://localhost:3000/portal/tickets`
3. Click **"View in Zammad"** button
4. **Expected:** Opens Zammad in new tab, automatically logged in as customer

### Verify Dual-Role User

If `john@company.com` is both agent and customer:

1. **Test as agent:**
   - Login to CRM with agent credentials
   - Open Zammad → should see agent interface with all tickets

2. **Test as customer:**
   - Logout, login to portal with customer credentials
   - Open Zammad → should see customer interface with only own tickets

---

## 📊 Migration Checklist

- [ ] Environment variables configured (`.env`)
- [ ] Zammad running and accessible (`docker ps`)
- [ ] Database schema updated (`npx prisma db push`)
- [ ] Verification script run (`npm run verify:zammad`)
- [ ] Organizations migrated (if needed)
- [ ] CRM users migrated (`npm run migrate:zammad-users`)
- [ ] Portal customers migrated (`npm run migrate:zammad-customers`)
- [ ] Verification passed (all green checkmarks)
- [ ] Tested agent auto-login
- [ ] Tested customer auto-login
- [ ] Tested dual-role users (if applicable)

---

## 🎯 Next Steps

After successful migration:

1. **Monitor auto-login:** Check backend logs for SSO token generation
2. **Train users:** Inform them to use "Open Zammad" buttons instead of direct login
3. **Disable direct Zammad login:** Configure Zammad to use SSO-only (optional)
4. **Setup webhooks:** Configure Zammad to send ticket updates to CRM (Phase 2)

---

## 📚 Related Documentation

- [ZAMMAD_AUTO_LOGIN_SETUP.md](./ZAMMAD_AUTO_LOGIN_SETUP.md) - Complete SSO architecture guide
- [synapse-crm-workflow.md](../synapse-crm-workflow.md) - Overall project workflow
- Backend: `server/src/zammad/` - Zammad integration code
- Frontend: `Frontend/src/components/tickets/` - Ticket UI components

---

## 🆘 Need Help?

If migration fails or you encounter issues:

1. **Check logs:** `cd server && npm run start:dev` (watch for errors)
2. **Re-run verification:** `npm run verify:zammad`
3. **Check Zammad UI:** `http://localhost:8080` (verify users exist)
4. **Database inspection:** `npx prisma studio` (check `zammadUserId` fields)
5. **Review documentation:** Read troubleshooting section above

**Common mistakes:**
- ❌ Forgetting to start Zammad (`docker-compose up`)
- ❌ Wrong `ZAMMAD_API_TOKEN` in `.env`
- ❌ Not running `npx prisma db push` after schema changes
- ❌ Running migrations before organizations are created

**Success indicators:**
- ✅ All verification checkmarks green
- ✅ `zammadUserId` populated in database
- ✅ Auto-login buttons work in frontend
- ✅ Dual-role users can access both contexts
