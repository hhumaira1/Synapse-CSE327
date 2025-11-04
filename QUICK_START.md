# 🚀 Quick Start Guide - Multi-Tenant User Isolation

Get the invitation system up and running in 5 minutes!

## Prerequisites

- ✅ Backend server running (`cd server && npm run start:dev`)
- ✅ Frontend running (`cd Frontend && npm run dev`)
- ✅ Supabase database connected
- ✅ Clerk authentication configured

## Step 1: Configure Email (2 minutes)

### Using Gmail:

1. **Generate App Password:**
   - Visit: https://myaccount.google.com/apppasswords
   - Create password for "SynapseCRM"
   - Copy the 16-character code

2. **Update `server/.env`:**
   ```env
   EMAIL_SERVICE="gmail"
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"
   EMAIL_FROM="SynapseCRM <your-email@gmail.com>"
   ```

3. **Restart Backend:**
   ```powershell
   cd server
   npm run start:dev
   ```

4. **Verify in logs:**
   ```
   ✅ [EmailService] Email service initialized with gmail (your-email@gmail.com)
   ```

## Step 2: Test Employee Invitation (2 minutes)

1. **Sign in as ADMIN**
   - Go to http://localhost:3000/sign-in
   - Use your Clerk credentials

2. **Navigate to Settings:**
   - Click "Settings" in sidebar
   - Go to "Team" tab

3. **Send Invitation:**
   ```
   Email: colleague@example.com
   Name: John Doe
   Role: MANAGER
   ```
   Click "Send Invitation"

4. **Check Email:**
   - Open `colleague@example.com` inbox
   - Look for "You've been invited to join..."
   - Click "Accept Invitation"

5. **Complete Sign-up:**
   - Sign up with the invited email
   - You'll be auto-redirected to dashboard
   - User now appears in team list!

## Step 3: Test Customer Portal (1 minute)

1. **Go to Contacts:**
   - Click "Contacts" in sidebar
   - Select any contact with an email

2. **Send Portal Invitation:**
   - Click "Invite to Portal" button
   - Add optional message
   - Click "Send Invitation"

3. **Customer Accepts:**
   - Customer receives email
   - Clicks "Access Customer Portal"
   - Signs up or signs in
   - Gets access to portal at `/portal`

## Step 4: Test Multi-Tenant Access (Optional)

**Scenario:** Same user accesses multiple workspaces

1. **Create Second Workspace:**
   ```powershell
   # Sign in with different account
   # Complete onboarding for new workspace
   ```

2. **Invite First User:**
   ```
   # From second workspace, invite first user's email
   # OR invite first user as customer to second workspace
   ```

3. **Sign in as First User:**
   ```
   # Will see /select-tenant page
   # Shows all accessible workspaces
   # Click to choose which workspace to access
   ```

## Common Issues & Quick Fixes

### ❌ Email not sending
**Fix:** Check `.env` has correct credentials
```bash
# Verify EMAIL_USER and EMAIL_PASSWORD are set
# Use App Password, not regular password for Gmail
```

### ❌ "Email already registered" error
**Fix:** This is expected! It's the global uniqueness rule working
```
# Employee emails can only belong to ONE company
# Try a different email or invite as customer instead
```

### ❌ Invitation link not working
**Fix:** Check token hasn't expired (7 days)
```bash
# Send a new invitation
# Tokens are one-time use only
```

### ❌ Can't see Settings page
**Fix:** Ensure you're signed in as ADMIN
```
# Only ADMIN can access team settings
# MANAGER can only invite customers
```

## Quick Reference

### API Endpoints

| Action | Endpoint | Required Role |
|--------|----------|---------------|
| Invite Employee | `POST /api/users/invite` | ADMIN |
| Accept Invitation | `POST /api/users/accept-invite/:token` | Public |
| Get My Tenants | `GET /api/users/my-tenants` | Any |
| List Team | `GET /api/users` | Any |
| Invite Customer | `POST /api/portal/customers/invite` | ADMIN/MANAGER |
| Activate Portal | `POST /api/portal/customers/link/:token` | Public |

### Frontend Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/dashboard/settings` | Team management | ADMIN |
| `/select-tenant` | Choose workspace | Multi-access users |
| `/accept-invite?token=xxx` | Accept employee invite | Public |
| `/portal/accept-invite?token=xxx` | Accept customer invite | Public |

### User Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access - invite employees, manage team, invite customers |
| **MANAGER** | Invite customers, manage data |
| **MEMBER** | View-only access to team settings |
| **CUSTOMER** | Portal access only - view/submit tickets |

## Testing Checklist

- [ ] Email service initialized successfully
- [ ] Can send employee invitation
- [ ] Received invitation email with button
- [ ] Can accept invitation and create account
- [ ] User appears in team list
- [ ] Can send customer portal invitation
- [ ] Customer received portal invitation
- [ ] Customer can activate portal access
- [ ] Can view pending invitations
- [ ] Can cancel invitations
- [ ] Can deactivate users
- [ ] Global email uniqueness enforced
- [ ] Customer email can exist in multiple tenants

## Next Steps

Once basic testing is complete:

1. **Production Email Setup:**
   - Consider SendGrid/SES for production
   - Set up custom domain for emails
   - Configure DKIM/SPF records

2. **Customize Email Templates:**
   - Edit `server/src/common/services/email/email.service.ts`
   - Update HTML templates with your branding
   - Add company logo

3. **Set Up Monitoring:**
   - Track invitation acceptance rates
   - Monitor email delivery
   - Log failed invitations

4. **Security Audit:**
   - Review token expiration settings
   - Test role-based access controls
   - Verify tenant isolation

## Getting Help

- 📖 **Full Documentation:** See `IMPLEMENTATION_SUMMARY.md`
- 📧 **Email Setup:** See `EMAIL_SETUP.md`
- 🔧 **Troubleshooting:** Check server logs for detailed errors

---

**🎉 You're all set! Start inviting your team members!**
