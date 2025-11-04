# 🚀 Deployment Checklist - SynapseCRM

Complete checklist for deploying the multi-tenant CRM system to production.

## Pre-Deployment Requirements

### 1. Environment Setup ✅

#### Backend Environment Variables (`server/.env`)

```env
# Database (Supabase Production)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Clerk Authentication (Production Keys)
CLERK_SECRET_KEY="sk_live_..."
CLERK_PUBLISHABLE_KEY="pk_live_..."

# Server Configuration
PORT=3001
NODE_ENV="production"
FRONTEND_URL="https://your-domain.com"

# Email Configuration (Production)
EMAIL_SERVICE="gmail"  # or sendgrid, ses, etc.
EMAIL_USER="noreply@your-domain.com"
EMAIL_PASSWORD="your-production-password"
EMAIL_FROM="SynapseCRM <noreply@your-domain.com>"
```

#### Frontend Environment Variables (`Frontend/.env.local`)

```env
# Clerk (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."

# API Configuration
NEXT_PUBLIC_API_BASE_URL="https://api.your-domain.com/api"

# Environment
NODE_ENV="production"
```

### 2. Database Migration

```bash
cd server

# Generate Prisma client
npx prisma generate

# Push schema to production database
npx prisma db push

# (Optional) Seed initial data
npx prisma db seed
```

### 3. Clerk Configuration

- [ ] Create production Clerk application
- [ ] Configure allowed redirect URLs:
  - `https://your-domain.com`
  - `https://your-domain.com/accept-invite`
  - `https://your-domain.com/portal/accept-invite`
  - `https://your-domain.com/select-tenant`
- [ ] Set up email templates (optional)
- [ ] Configure social sign-in providers (optional)
- [ ] Add webhook endpoints (if needed)

### 4. Email Service Setup

#### Option A: Gmail (Small Scale)
```env
EMAIL_SERVICE="gmail"
EMAIL_USER="noreply@your-domain.com"
EMAIL_PASSWORD="app-password"
```
- [ ] Enable 2FA on Google account
- [ ] Generate App Password
- [ ] Test email delivery
- **Limit:** ~500 emails/day

#### Option B: SendGrid (Recommended)
```env
EMAIL_SERVICE="sendgrid"
SENDGRID_API_KEY="SG.xxx"
EMAIL_FROM="noreply@your-domain.com"
```
- [ ] Sign up at sendgrid.com
- [ ] Verify domain
- [ ] Generate API key
- [ ] Set up sender authentication
- **Limit:** 100/day free, scalable

#### Option C: Amazon SES (Production)
```env
EMAIL_SERVICE="ses"
AWS_ACCESS_KEY_ID="xxx"
AWS_SECRET_ACCESS_KEY="xxx"
AWS_REGION="us-east-1"
EMAIL_FROM="noreply@your-domain.com"
```
- [ ] Set up AWS account
- [ ] Verify domain
- [ ] Request production access
- [ ] Configure IAM credentials
- **Cost:** $0.10 per 1000 emails

### 5. Domain & DNS Setup

- [ ] Purchase domain (e.g., synapse-crm.com)
- [ ] Configure DNS records:
  - `A` record: `@` → Frontend hosting IP
  - `A` record: `api` → Backend hosting IP
  - `CNAME` record: `www` → `@`
  - `MX` record: Email provider settings (if custom email)
  - `TXT` record: SPF, DKIM for email (if sending from custom domain)
- [ ] SSL certificates installed (Let's Encrypt or provider)

## Deployment Steps

### Backend Deployment (NestJS)

#### Option 1: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables via dashboard
railway variables set DATABASE_URL="..."
railway variables set CLERK_SECRET_KEY="..."
# ... (add all env vars)

# Deploy
railway up
```

#### Option 2: Render
```bash
# 1. Connect GitHub repository to Render
# 2. Create new Web Service
# 3. Configure:
#    - Build Command: cd server && npm install && npx prisma generate
#    - Start Command: cd server && npm run start:prod
#    - Add environment variables via dashboard
# 4. Deploy
```

#### Option 3: Docker (Any Platform)
```dockerfile
# Dockerfile in server/
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

```bash
# Build and deploy
docker build -t synapse-backend .
docker run -p 3001:3001 --env-file .env synapse-backend
```

### Frontend Deployment (Next.js)

#### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd Frontend

# Deploy
vercel --prod

# Configure environment variables in dashboard
# vercel.com → Project → Settings → Environment Variables
```

#### Option 2: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod
```

#### Option 3: Self-Hosted
```bash
# Build
cd Frontend
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start npm --name "synapse-frontend" -- start
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Backend health
curl https://api.your-domain.com/api

# Should return: { "message": "SynapseCRM API is running" }

# Frontend health
curl https://your-domain.com

# Should return: HTML of landing page
```

### 2. Authentication Flow

- [ ] Visit `https://your-domain.com`
- [ ] Click "Sign Up"
- [ ] Complete Clerk sign-up
- [ ] Redirect to onboarding
- [ ] Create workspace
- [ ] Redirect to dashboard

### 3. Invitation Flow Testing

**Employee Invitation:**
- [ ] Navigate to Settings → Team
- [ ] Send invitation to test email
- [ ] Check email delivery
- [ ] Click invitation link
- [ ] Accept invitation
- [ ] Verify user created in database

**Customer Portal:**
- [ ] Navigate to Contacts
- [ ] Click "Invite to Portal"
- [ ] Send invitation
- [ ] Check email delivery
- [ ] Accept invitation
- [ ] Verify portal access

### 4. Multi-Tenant Testing

- [ ] Create second workspace
- [ ] Invite first user to second workspace
- [ ] Sign in as first user
- [ ] Verify tenant selection page appears
- [ ] Switch between workspaces
- [ ] Verify data isolation

### 5. Performance Testing

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://api.your-domain.com/api/auth/me

# Should handle concurrent requests
# Target: < 200ms response time
```

### 6. Email Delivery Testing

```bash
# Test email sending
# 1. Send 5 test invitations
# 2. Check spam folder
# 3. Verify delivery within 30 seconds
# 4. Check email formatting
```

## Security Hardening

### Backend Security

- [ ] Enable CORS with specific origins
  ```typescript
  app.enableCors({
    origin: ['https://your-domain.com'],
    credentials: true,
  });
  ```

- [ ] Enable helmet for security headers
  ```bash
  npm install helmet
  ```

- [ ] Rate limiting for API endpoints
  ```bash
  npm install @nestjs/throttler
  ```

- [ ] HTTPS only (redirect HTTP → HTTPS)
- [ ] Secure cookies (httpOnly, secure, sameSite)
- [ ] Database connection pooling
- [ ] Environment variable validation

### Frontend Security

- [ ] CSP headers configured
- [ ] XSS protection enabled
- [ ] CSRF protection
- [ ] Secure headers via middleware
- [ ] API keys not in client code
- [ ] Input sanitization

### Database Security

- [ ] Strong passwords (min 16 chars)
- [ ] Connection pooling limits
- [ ] Read replicas for scaling (optional)
- [ ] Regular backups enabled
- [ ] Point-in-time recovery configured
- [ ] SSL/TLS for database connections

## Monitoring & Logging

### Application Monitoring

- [ ] Set up error tracking (Sentry, Bugsnag, etc.)
  ```bash
  npm install @sentry/node @sentry/nextjs
  ```

- [ ] Configure logging service (LogRocket, Datadog, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Performance monitoring (New Relic, Scout, etc.)

### Database Monitoring

- [ ] Enable slow query logging
- [ ] Set up connection pool monitoring
- [ ] Database size alerts
- [ ] Backup verification
- [ ] Query performance insights

### Email Monitoring

- [ ] Track email delivery rates
- [ ] Monitor bounce rates
- [ ] Spam complaint tracking
- [ ] Email send quota alerts

## Backup Strategy

### Database Backups

- [ ] Automated daily backups
- [ ] Point-in-time recovery enabled
- [ ] Backup retention: 30 days
- [ ] Test restore procedure monthly
- [ ] Off-site backup storage

### Configuration Backups

- [ ] Environment variables documented
- [ ] DNS records documented
- [ ] SSL certificates backed up
- [ ] Infrastructure-as-code (Terraform, etc.)

## Scaling Considerations

### Initial Launch (< 100 users)

- **Frontend:** Single instance, CDN enabled
- **Backend:** Single instance, vertical scaling
- **Database:** Supabase free tier or basic plan
- **Email:** Gmail or SendGrid free tier

### Growth Phase (100-1000 users)

- **Frontend:** Auto-scaling, edge caching
- **Backend:** Horizontal scaling (2-3 instances)
- **Database:** Upgrade to paid plan, read replicas
- **Email:** SendGrid growth plan or SES

### Scale Phase (1000+ users)

- **Frontend:** Global CDN, edge functions
- **Backend:** Load balancer, auto-scaling
- **Database:** High-availability setup, connection pooling
- **Email:** Dedicated IP, SES or custom SMTP
- **Caching:** Redis for session management
- **Queue:** Bull/BullMQ for background jobs

## Rollback Plan

### Database Rollback

```bash
# Restore from backup
pg_restore -d synapse_db backup.dump

# Or point-in-time recovery (Supabase)
# Use dashboard to restore to specific timestamp
```

### Application Rollback

```bash
# Vercel
vercel rollback

# Railway
railway rollback [deployment-id]

# Docker
docker pull synapse-backend:previous-tag
docker-compose up -d
```

## Final Checklist

### Pre-Launch

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Email service configured and tested
- [ ] Clerk production keys configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] CORS settings updated
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Monitoring tools installed
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Error tracking configured

### Launch Day

- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Verify health checks passing
- [ ] Test complete user flow
- [ ] Monitor error logs
- [ ] Test email delivery
- [ ] Verify database connections
- [ ] Check response times
- [ ] Monitor server resources

### Post-Launch (Week 1)

- [ ] Daily error log review
- [ ] User feedback collection
- [ ] Performance optimization
- [ ] Database query optimization
- [ ] Email delivery rate check
- [ ] Security audit
- [ ] Backup verification
- [ ] Documentation updates

## Support Contacts

- **Hosting Support:** [Provider contact]
- **Database Support:** [Supabase support]
- **Email Support:** [SendGrid/SES support]
- **SSL/DNS:** [Domain registrar support]
- **Auth Support:** [Clerk support]

## Emergency Procedures

### System Down

1. Check hosting provider status
2. Check database connectivity
3. Review recent deployments
4. Check error logs
5. Rollback if needed
6. Contact hosting support

### Email Issues

1. Check email service status
2. Verify API credentials
3. Check send quota
4. Review bounce/spam reports
5. Contact email provider

### Database Issues

1. Check connection pool
2. Verify credentials
3. Check disk space
4. Review slow queries
5. Contact database support

---

**✅ Deployment Complete!**

After completing this checklist, your SynapseCRM instance should be:
- ✅ Secure and production-ready
- ✅ Monitored and backed up
- ✅ Scalable and performant
- ✅ Fully functional with all features

**Next Steps:**
1. Monitor system for first 24 hours
2. Gather user feedback
3. Plan feature enhancements
4. Set up regular maintenance schedule
