# Zammad Admin Configuration Guide

## 🎯 Overview

This guide explains **what you need to configure inside Zammad** as an admin to enable the multi-tenant SSO integration with SynapseCRM.

---

## ⚙️ Required Zammad Admin Configurations

### 1. Enable API Access & Create Admin Token

**Location**: Admin → System → API

#### Steps:
1. Login to Zammad: `http://localhost:8080`
2. Click **Admin** (gear icon) → **System** → **API**
3. Ensure **"HTTP Token Access"** is **ENABLED** ✅
4. Click **Token Access** tab
5. Click **Create New Token**
6. Configure token:
   - **Name**: `SynapseCRM Integration`
   - **Permissions**: Select **ALL** (admin access required for user/org management)
   - **Expires**: Never (or set long expiration)
7. Click **Create**
8. **Copy the token** → Save to `server/.env` as `ZAMMAD_API_TOKEN`

⚠️ **Critical**: Token must have **admin permissions** to:
- Create/update users
- Create organizations
- Assign users to organizations
- Create auto-login tokens

---

### 2. Configure SSO Auto-Login Settings

**Location**: Admin → System → Security

#### Steps:
1. Go to **Admin** → **System** → **Security**
2. Find **"Third Party Authentication"** section
3. Configure these settings:

   **Authentication via token:**
   - ✅ **Enabled** (required for SSO)
   
   **Token expiration:**
   - Set to `300` seconds (5 minutes) or less
   - This matches our backend token TTL
   
   **Allowed domains for token authentication:**
   - Add: `http://localhost:3000` (your CRM frontend)
   - Add: `http://localhost:3001` (your backend)
   - Add any production domains when deploying

#### Why This Matters:
- Allows CRM to generate one-time tokens for auto-login
- Users don't need separate Zammad passwords
- Tokens expire quickly for security

---

### 3. Configure Organizations (Multi-Tenant Setup)

**Location**: Admin → Manage → Organizations

#### What Migration Scripts Do:
The `npm run migrate:zammad` script automatically creates:
- One organization per CRM tenant
- Organization naming: Matches tenant name (e.g., "TechCorp", "SalesPro")
- Organization configuration stored in CRM `Integration` table

#### Manual Check (Verify Migration):
1. Go to **Admin** → **Manage** → **Organizations**
2. You should see organizations matching your CRM tenants:
   ```
   - TechCorp (created by migration)
   - SalesPro (created by migration)
   - StartupX (created by migration)
   ```

#### Optional Organization Settings:
For each organization, you can configure:
1. Click organization name
2. **Members** tab → Shows users (agents + customers)
3. **Settings** tab:
   - **Shared Organization**: ✅ Enabled (allows users to see tickets from same org)
   - **Domain Assignment**: Add company domain for auto-assignment
   - **Note**: Add description for admin reference

#### When to Create Manually:
❌ **Don't create manually** - let migration scripts handle it
✅ **Only if migration fails** or you need custom organization structure

---

### 4. Configure Groups (Support Teams)

**Location**: Admin → Manage → Groups

#### What Migration Scripts Do:
The `npm run migrate:zammad-groups` script creates:
- One default group per tenant (e.g., "TechCorp-Support")
- Agents are assigned to their tenant's group
- Groups are isolated per organization

#### Manual Configuration (Optional):
1. Go to **Admin** → **Manage** → **Groups**
2. For each group, configure:
   - **Name**: `TenantName-Support` (auto-created)
   - **Email**: `support@tenantdomain.com` (optional - for email tickets)
   - **Signature**: Custom signature for outgoing emails
   - **Members**: Assigned automatically by migration

3. **Add additional groups** if needed:
   - Sales team: `TenantName-Sales`
   - Technical: `TenantName-Technical`
   - Billing: `TenantName-Billing`

#### Group Assignment Logic:
```
CRM User → Tenant → Zammad Organization → Default Group
```

Example:
- `admin@techcorp.com` (CRM) → TechCorp tenant → TechCorp org → TechCorp-Support group

---

### 5. Configure Roles & Permissions

**Location**: Admin → Manage → Roles

#### Default Roles Used:
Our integration uses Zammad's built-in roles:

| Role | Zammad ID | Used For | Permissions |
|------|-----------|----------|-------------|
| **Agent** | `2` | CRM internal users | Full ticket access, can work on any ticket in their group/org |
| **Customer** | `3` | Portal customers | Can only view/create own tickets |
| **Admin** | `1` | Super admins | Full system access (rarely needed) |

#### Verification Steps:
1. Go to **Admin** → **Manage** → **Roles**
2. Check **Agent** role (ID: 2):
   - ✅ `ticket.agent` permission enabled
   - ✅ Can access all tickets in assigned groups
   - ✅ Can create/update/close tickets

3. Check **Customer** role (ID: 3):
   - ✅ `ticket.customer` permission enabled
   - ✅ Can only access own tickets
   - ❌ Cannot see other customers' tickets

#### Custom Roles (Optional):
If you need custom permission levels:
1. Click **New Role**
2. Configure permissions:
   - Name: `Limited Agent`
   - Permissions: Customize ticket access
   - Active: ✅
3. Update `ZammadIdentityService` to use custom role ID

---

### 6. Configure Email Integration (Optional)

**Location**: Admin → Channels → Email

#### If You Want Email Tickets:
1. Go to **Admin** → **Channels** → **Email** → **Accounts**
2. Click **Add Account**
3. Configure:
   - **Inbound**: IMAP settings for receiving emails
   - **Outbound**: SMTP settings for sending emails
   - **Match Organization**: Map email domains to organizations

Example:
```
Email: support@techcorp.com
↓
Auto-assigned to: TechCorp organization
↓
Visible to: TechCorp agents only
```

#### Integration with CRM:
- Emails received → Zammad creates ticket
- Webhook triggers → CRM syncs ticket data
- Agents can reply from Zammad or CRM

---

### 7. Configure Webhooks for Real-Time Sync

**Location**: Admin → System → Webhooks

#### Auto-Configuration:
✅ **Webhooks are created automatically** by migration scripts

#### Verify Webhook Setup:
1. Go to **Admin** → **System** → **Webhooks**
2. You should see webhooks for each tenant:
   ```
   - CRM Sync - TechCorp
   - CRM Sync - SalesPro
   - CRM Sync - StartupX
   ```

3. Click a webhook to verify:
   - **Endpoint**: `http://localhost:3001/api/webhooks/zammad/{tenantId}`
   - **Secret**: Set (matches `ZAMMAD_WEBHOOK_SECRET` in your .env)
   - **Triggers**:
     - ✅ Ticket created
     - ✅ Ticket updated
     - ✅ Article created (new comment/note)
   - **Active**: ✅ Enabled

#### Manual Webhook Creation (If Needed):
If migration didn't create webhooks:

1. Click **New Webhook**
2. Configure:
   ```
   Name: CRM Sync - TenantName
   Endpoint: http://your-backend:3001/api/webhooks/zammad/TENANT_ID
   Secret: [Copy from your .env ZAMMAD_WEBHOOK_SECRET]
   
   Triggers:
   ✅ Ticket Create
   ✅ Ticket Update
   ✅ Ticket Article Create
   
   Active: ✅
   ```
3. Click **Save**

#### Test Webhook:
```powershell
# Backend logs should show:
# "Received Zammad webhook for tenant: {tenantId}"
```

---

### 8. Configure User Authentication Settings

**Location**: Admin → System → Security → User Authentication

#### Recommended Settings:

**Password Requirements:**
- Since users auto-login via SSO, passwords are optional
- Can disable password requirements for SSO users
- Configure:
  ```
  Minimum password length: 8
  Require special characters: No (SSO users won't use passwords)
  Password expiration: Never (for SSO accounts)
  ```

**Account Lockout:**
- Enable for security: ✅
- Failed attempts before lockout: 10
- Lockout duration: 30 minutes

**Two-Factor Authentication (2FA):**
- ❌ **Not required** for SSO users (CRM handles auth)
- ✅ **Optional** for admin accounts (recommended)

---

### 9. Configure Customer Portal Settings

**Location**: Admin → System → Security → Customer Portal

#### Settings for Portal Customers:

**Customer Self-Service:**
- ✅ **Enabled** - Allows portal customers to login
- Customer can create tickets: ✅
- Customer can see organization tickets: ❌ (privacy - only own tickets)

**Customer Auto-Creation:**
- ❌ **Disabled** - CRM creates customers via API (controlled)
- Prevents random signups

**Customer Verification:**
- ❌ Email verification not needed (CRM handles this)

---

### 10. Configure Ticket Settings (Optional)

**Location**: Admin → System → Objects → Ticket

#### Useful Custom Fields:
You can add custom fields to sync with CRM:

1. Go to **Admin** → **System** → **Objects** → **Ticket**
2. Click **Add Attribute**
3. Add CRM-specific fields:
   ```
   Name: crm_deal_id
   Type: Text
   Display: Show in ticket view
   Purpose: Link ticket to CRM deal
   
   Name: crm_tenant_id
   Type: Text
   Display: Hidden (internal use)
   Purpose: Track which tenant owns ticket
   ```

These fields are auto-populated by CRM when creating tickets.

---

## 📋 Configuration Checklist

Use this checklist to ensure Zammad is properly configured:

### Initial Setup
- [ ] Zammad installed and running (`http://localhost:8080`)
- [ ] Admin account created
- [ ] Initial setup wizard completed

### API & Security
- [ ] API access enabled
- [ ] Admin API token created and saved to `.env`
- [ ] SSO token authentication enabled
- [ ] Allowed domains configured (localhost:3000, localhost:3001)
- [ ] Token expiration set to 300 seconds

### Organizations & Groups
- [ ] Migration script run: `npm run migrate:zammad`
- [ ] Organizations created (one per tenant)
- [ ] Groups created (one per tenant)
- [ ] Verified in Zammad UI

### Users & Roles
- [ ] Migration script run: `npm run migrate:zammad-users`
- [ ] Agents created and assigned to organizations
- [ ] Agent role (ID: 2) has correct permissions
- [ ] Migration script run: `npm run migrate:zammad-customers`
- [ ] Customers created and assigned to organizations
- [ ] Customer role (ID: 3) has correct permissions

### Webhooks
- [ ] Webhooks automatically created (one per tenant)
- [ ] Webhook endpoints configured correctly
- [ ] Webhook secret matches `.env` value
- [ ] Webhooks active and triggers enabled
- [ ] Test webhook by creating ticket in Zammad

### Authentication
- [ ] Password requirements relaxed for SSO users
- [ ] 2FA disabled for regular users (optional for admins)
- [ ] Customer portal enabled
- [ ] Customer auto-creation disabled

### Optional
- [ ] Email integration configured (if needed)
- [ ] Custom ticket fields added (if needed)
- [ ] Email templates customized
- [ ] Signature templates configured

---

## 🔧 Common Admin Tasks

### Adding a New Tenant Organization

**Option 1 - Automatic (Recommended):**
```powershell
# In CRM, create new tenant via UI
# Backend automatically creates Zammad organization
```

**Option 2 - Manual Migration:**
```powershell
cd server
npm run migrate:zammad
```

### Promoting User to Agent

If a portal customer needs agent access:

1. **In Zammad UI:**
   - Go to **Admin** → **Manage** → **Users**
   - Find user email
   - Click user → **Roles** tab
   - Add **Agent** role (keep Customer role for dual access)
   - **Groups** tab → Assign to appropriate group

2. **In CRM:**
   ```sql
   -- Update user role in CRM database
   UPDATE "User"
   SET role = 'MANAGER' -- or 'ADMIN'
   WHERE email = 'user@example.com';
   ```

### Removing User Access

**In Zammad:**
1. Go to **Admin** → **Manage** → **Users**
2. Find user
3. Set **Active**: ❌ Disabled
4. User can no longer login (SSO will fail)

**In CRM:**
```sql
-- Deactivate user
UPDATE "User"
SET active = false
WHERE email = 'user@example.com';
```

### Checking Webhook Logs

1. Go to **Admin** → **System** → **Webhooks**
2. Click webhook name
3. Click **Logs** tab
4. View recent webhook deliveries and responses

---

## 🚨 Troubleshooting

### Issue: "API Token Invalid"

**Check:**
1. Admin → System → API → Token Access
2. Verify token exists and is active
3. Copy token exactly (no spaces)
4. Update `server/.env` → `ZAMMAD_API_TOKEN`

### Issue: "Users Can't Auto-Login"

**Check:**
1. Admin → System → Security → Third Party Authentication
2. Verify **token authentication** is ✅ enabled
3. Check **allowed domains** includes your CRM URL
4. Check token expiration time (should be 300s)

### Issue: "Webhooks Not Firing"

**Check:**
1. Admin → System → Webhooks
2. Verify webhook is ✅ active
3. Click webhook → **Logs** tab → Check for errors
4. Verify endpoint URL is correct
5. Test by creating ticket manually in Zammad

### Issue: "Users in Wrong Organization"

**Fix:**
1. Admin → Manage → Users
2. Find user
3. Click **Organizations** tab
4. Remove incorrect org, add correct org
5. Verify group assignment

---

## 📚 Additional Resources

- **Zammad API Docs**: https://docs.zammad.org/en/latest/api/intro.html
- **Zammad Admin Guide**: https://docs.zammad.org/en/latest/admin.html
- **CRM Integration Docs**: See `ZAMMAD_AUTO_LOGIN_SETUP.md`
- **Migration Guide**: See `ZAMMAD_MIGRATION_GUIDE.md`

---

## 🎉 You're Ready!

Once you've completed this configuration checklist, your Zammad instance is ready for multi-tenant SSO integration with SynapseCRM.

**Next steps:**
1. Run migration scripts (see `ZAMMAD_MIGRATION_GUIDE.md`)
2. Test auto-login from CRM frontend
3. Verify ticket synchronization
4. Train users on new workflow

**No password management needed** - users click "Open Zammad" and are automatically logged in! 🚀
