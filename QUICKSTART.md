# 🚀 Quick Start Guide

## Prerequisites

- ✅ Node.js 20.9+ installed
- ✅ npm or yarn installed
- ✅ PostgreSQL database (Supabase recommended)
- ✅ Clerk account created

---

## Step 1: Clone and Setup

```bash
# Navigate to project
cd synapse

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

---

## Step 2: Configure Backend

```bash
cd server

# Create .env file
cat > .env << 'EOF'
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Clerk (get from https://clerk.com dashboard)
CLERK_SECRET_KEY="sk_test_YOUR_SECRET_KEY"
CLERK_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY"

# Server Config
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
EOF

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Start backend
npm run start:dev
```

Expected output:
```
🚀 Backend running on http://localhost:3001/api
```

---

## Step 3: Configure Frontend

```bash
cd Frontend

# Create .env.local file
cat > .env.local << 'EOF'
# Clerk (get from https://clerk.com dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboard"

# Backend API
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001/api"

# Environment
NODE_ENV="development"
EOF

# Start frontend
npm run dev
```

Expected output:
```
▲ Next.js 16.0.0
- Local: http://localhost:3000
- Ready in 2.5s
```

---

## Step 4: Test the Application

### Internal User Flow (Your Team)

1. Open browser: `http://localhost:3000`
2. Click **Sign Up** button (top right)
3. Create account with your email
4. You'll be redirected to `/onboard`
5. Enter workspace name: "My Company"
6. Click **Create Workspace**
7. You'll land on `/dashboard` - full CRM access! 🎉

### Verify in Database

```bash
cd server
npx prisma studio
```

Check:
- `Tenant` table → should have 1 record
- `User` table → should have 1 record with `role: "ADMIN"`

---

## Step 5: Test Portal Flow (Optional)

### Create Portal Customer Invite

```bash
# Open Prisma Studio
npx prisma studio

# Navigate to PortalCustomer table
# Click "Add Record"

# Fill in:
id: portal_test_1
tenantId: [copy from Tenant table]
email: customer@test.com
clerkId: null
name: null
```

### Test Portal Signup

1. Visit: `http://localhost:3000/portal/accept-invite?tenantId=[YOUR_TENANT_ID]`
2. Sign up with email: `customer@test.com`
3. Auto-sync happens automatically
4. You'll land on `/portal/dashboard` - limited portal access! 🎉

### Verify Portal Sync

```bash
npx prisma studio
```

Check:
- `PortalCustomer` table → `clerkId` should now be populated
- Matches the Clerk user ID

---

## Common Issues

### "Cannot connect to database"

```bash
# Test database connection
cd server
npx prisma db push

# If fails, check DATABASE_URL in .env
# Get correct URL from Supabase dashboard:
# Settings > Database > Connection string > Direct connection
```

### "Clerk token invalid"

```bash
# Verify keys match between frontend and backend
cat Frontend/.env.local | grep CLERK_PUBLISHABLE_KEY
cat server/.env | grep CLERK_PUBLISHABLE_KEY

# Should show same pk_test_... value
```

### "Module not found: prisma/generated/client"

```bash
cd server
npx prisma generate
npm run build
npm run start:dev
```

### "Port 3000 already in use"

```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Mac/Linux:
lsof -ti:3000 | xargs kill
```

---

## Development Workflow

### Daily Development

```bash
# Terminal 1: Backend (auto-reload on changes)
cd server && npm run start:dev

# Terminal 2: Frontend (auto-reload on changes)
cd Frontend && npm run dev

# Terminal 3: Database GUI
cd server && npx prisma studio
```

### Making Schema Changes

```bash
cd server

# 1. Edit prisma/schema.prisma
# 2. Push changes to database
npx prisma db push

# 3. Regenerate client
npx prisma generate

# 4. Restart backend
npm run start:dev
```

### Adding New Features

```bash
# Backend: Generate module
cd server
nest generate module feature-name
nest generate service feature-name/feature-name
nest generate controller feature-name/feature-name

# Frontend: Create page
cd Frontend
mkdir -p src/app/\(dashboard\)/feature-name
touch src/app/\(dashboard\)/feature-name/page.tsx
```

---

## Production Deployment

### Backend (Railway/Vercel)

1. Push code to GitHub
2. Connect repository to Railway/Vercel
3. Set environment variables:
   ```
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   CLERK_SECRET_KEY=sk_live_...
   CLERK_PUBLISHABLE_KEY=pk_live_...
   NODE_ENV=production
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Deploy!

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   NEXT_PUBLIC_API_BASE_URL=https://your-api.railway.app/api
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboard
   ```
4. Deploy!

---

## Resources

- **Documentation**: See `DASHBOARD-README.md` for detailed features
- **Auth Flows**: See `PHASE-6-DUAL-AUTH.md` for dual authentication
- **Tech Stack**: See `tech-stack-2025-changes.md` for migration notes
- **Full Workflow**: See `synapse-crm-workflow.md` for complete setup

---

## Support

If you encounter issues:

1. Check **Troubleshooting** sections in docs
2. Verify environment variables are correct
3. Ensure backend is running before frontend
4. Check browser console for errors
5. Check backend logs for API errors

---

**Happy coding! 🚀**

Last Updated: November 1, 2025
