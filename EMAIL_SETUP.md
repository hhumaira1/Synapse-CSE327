# Email Configuration Guide

## Overview
SynapseCRM uses **Nodemailer** to send invitation emails for both employee invitations and customer portal access. This guide will help you set up email functionality.

## Quick Setup (Gmail)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Enter "SynapseCRM"
4. Click **Generate**
5. Copy the 16-character password (spaces don't matter)

### Step 3: Configure Environment Variables
Add these to `server/.env`:

```env
# Email Configuration (Gmail)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"  # Your app password
EMAIL_FROM="SynapseCRM <your-email@gmail.com>"
```

### Step 4: Restart Server
```powershell
cd server
npm run start:dev
```

You should see: `Email service initialized with gmail (your-email@gmail.com)`

## Alternative Email Providers

### Outlook/Hotmail
```env
EMAIL_SERVICE="outlook"
EMAIL_USER="your-email@outlook.com"
EMAIL_PASSWORD="your-password"
EMAIL_FROM="SynapseCRM <your-email@outlook.com>"
```

### Yahoo
```env
EMAIL_SERVICE="yahoo"
EMAIL_USER="your-email@yahoo.com"
EMAIL_PASSWORD="your-app-password"  # Generate at https://login.yahoo.com/account/security
EMAIL_FROM="SynapseCRM <your-email@yahoo.com>"
```

### Custom SMTP Server
```env
# For custom SMTP, modify server/src/common/services/email/email.service.ts
# Replace the 'service' option with manual SMTP config:
#
# host: 'smtp.example.com',
# port: 587,
# secure: false,
# auth: {
#   user: process.env.EMAIL_USER,
#   pass: process.env.EMAIL_PASSWORD,
# }
```

## Testing Email Functionality

### 1. Check Server Logs
When the server starts, you should see:
```
[EmailService] Email service initialized with gmail (your-email@gmail.com)
```

If you see:
```
[EmailService] Email credentials not configured. Email functionality will be disabled.
```
Then check your `.env` file for missing `EMAIL_USER` or `EMAIL_PASSWORD`.

### 2. Test Employee Invitation
1. Go to **Settings** → **Team** tab
2. Fill in the invitation form
3. Click "Send Invitation"
4. Check your email inbox (or spam folder)

### 3. Test Customer Portal Invitation
1. Go to **Contacts**
2. Click "Invite to Portal" on any contact
3. Send the invitation
4. Check the customer's email

## Email Templates

### Employee Invitation Email
- **Subject**: `You've been invited to join {Tenant Name} on SynapseCRM`
- **Content**: Professional HTML template with:
  - Company logo placeholder
  - Role information
  - Accept invitation button
  - Expiration notice (7 days)
  - Direct link as fallback

### Customer Portal Invitation Email
- **Subject**: `Access Your Customer Portal - {Tenant Name}`
  - Welcome message
  - List of portal features
  - Access portal button
  - Customer-friendly design

## Troubleshooting

### "Failed to send invitation email"
**Possible causes:**
1. **Invalid credentials** → Check `EMAIL_USER` and `EMAIL_PASSWORD`
2. **2FA not enabled** (Gmail) → Enable 2-Step Verification
3. **Using regular password** (Gmail) → Use App Password instead
4. **Firewall blocking SMTP** → Check ports 587 (TLS) or 465 (SSL)

### "Email service initialized" but emails not arriving
1. **Check spam/junk folder**
2. **Verify FROM address matches USER** → `EMAIL_FROM` should use same domain
3. **Check Gmail account limits** → Gmail allows ~500 emails/day for free accounts
4. **Check server logs** for detailed error messages

### Gmail "Less secure app access" error
- **Solution**: Don't use "Less secure app access"
- Use **App Passwords** instead (see Step 2 above)

## Email Sending Limits

| Provider | Daily Limit (Free) | Notes |
|----------|-------------------|-------|
| Gmail | ~500 emails/day | Use App Passwords |
| Outlook | ~300 emails/day | Personal accounts |
| Yahoo | ~500 emails/day | Requires App Password |
| SendGrid | 100 emails/day | Free tier, requires API key |

## Production Recommendations

For production use, consider:

1. **SendGrid** (100/day free, paid plans available)
   - More reliable delivery
   - Better analytics
   - Higher sending limits

2. **Amazon SES** (Pay as you go)
   - Very affordable ($0.10 per 1000 emails)
   - High deliverability
   - Integrates with AWS

3. **Custom SMTP** via your hosting provider
   - Often included with hosting plans
   - Branded domain improves deliverability

## Security Best Practices

1. ✅ **Never commit `.env` file** to version control
2. ✅ **Use App Passwords**, not your main account password
3. ✅ **Rotate passwords** periodically
4. ✅ **Monitor send limits** to avoid account suspension
5. ✅ **Use environment-specific configs** (dev/staging/prod)

## Need Help?

- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **Nodemailer Documentation**: https://nodemailer.com/about/
- **SMTP Test Tool**: https://www.smtper.net/

---

**Note**: The email service will gracefully degrade if not configured. The application will work but invitation emails won't be sent.
