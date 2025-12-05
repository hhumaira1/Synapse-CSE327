# Zammad Multi-Tenant Integration with Auto-Login SSO

## Overview
SynapseCRM integrates with Zammad using a **multi-tenant architecture** where:
- Each CRM tenant gets its own Zammad organization
- Users can be **both internal agents AND portal customers** across different tenants
- **Auto-login SSO** eliminates need for separate Zammad passwords
- Same email can have different roles in different organizations

## Architecture

### Multi-Tenant Structure
```
Tenant A                        Tenant B
├── Organization: "Company A"   ├── Organization: "Company B"
├── Group: "A-Support"          ├── Group: "B-Support"
├── Agents:                     ├── Agents:
│   └── admin@companyA.com      │   └── manager@companyB.com
└── Customers:                  └── Customers:
    └── client@external.com         └── admin@companyA.com  <-- Same person!
```

### Dual-Role Solution
**Problem**: `admin@company.com` is both:
- Internal agent for Tenant A
- Portal customer for Tenant B

**Solution**: Organization-based access control
- One Zammad account per email globally
- User belongs to multiple organizations with different roles
- Zammad automatically shows correct permissions based on organization context

```
User: admin@company.com (Single Zammad Account)
├── Organization A
│   ├── Role: Agent
│   ├── Group: A-Support
│   └── Can work on all tickets in Org A
└── Organization B
    ├── Role: Customer
    └── Can only see own tickets in Org B
```

## Auto-Login SSO Flow

### For Internal Agents (CRM Users)
1. User clicks "Open Zammad" in CRM
2. Backend generates one-time token (expires in 5 minutes)
3. User redirected to Zammad with token
4. Zammad validates token and logs user in automatically
5. User sees agent dashboard with full permissions

**Endpoint**: `GET /api/zammad/sso/agent-login?ticketId=123`

### For Portal Customers
1. Customer clicks "View Ticket" in portal
2. Backend generates customer-specific token
3. Customer redirected to Zammad customer portal
4. Auto-logged in and sees their tickets only

**Endpoint**: `GET /api/zammad/sso/customer-login?ticketId=456&tenantId=xyz`

### Universal Endpoint
Auto-detects if user is agent or customer:

**Endpoint**: `GET /api/zammad/sso/login?ticketId=123`

## Setup Instructions

### 1. Install Zammad Locally (Docker)

```bash
# Clone Zammad Docker setup
git clone https://github.com/zammad/zammad-docker-compose.git
cd zammad-docker-compose

# Start Zammad
docker-compose up -d

# Wait 2-3 minutes for initialization
# Access: http://localhost:8080
```

**Initial Setup:**
1. Create admin account
2. Complete setup wizard
3. Go to Admin → System → API → Create Token
4. Copy token for next step

### 2. Configure Backend

**File**: `server/.env`
```env
# Zammad Configuration
ZAMMAD_URL=http://localhost:8080
ZAMMAD_API_TOKEN=your-api-token-from-step-1

# Backend URL (for webhooks)
BACKEND_URL=http://localhost:3001

# Webhook Security (generate random secret)
ZAMMAD_WEBHOOK_SECRET=your-random-secret-here

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase (already configured)
SUPABASE_URL="https://..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

**Generate webhook secret:**
```bash
# PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Or use online tool: https://generate-random.org/api-token-generator
```

### 3. Configure Frontend

**File**: `Frontend/.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_ZAMMAD_URL=http://localhost:8080
```

### 4. Update Database Schema

```bash
cd server

# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Verify in Prisma Studio
npx prisma studio
```

### 5. Run Migration Scripts

Create Zammad organizations for existing tenants:

```bash
cd server

# Create organizations for all tenants
npm run migrate:zammad

# Create agent accounts for existing CRM users
npm run migrate:zammad-users

# Create customer accounts for portal customers
npm run migrate:zammad-customers
```

### 6. Test Integration

**Start Backend:**
```bash
cd server
npm run start:dev
```

**Start Frontend:**
```bash
cd Frontend
npm run dev
```

**Test Flow:**
1. **Create new tenant** → Check Zammad for new organization
2. **Create CRM user** → Check Zammad for agent account
3. **Invite portal customer** → Check Zammad for customer account
4. **Create ticket** → Should sync to Zammad
5. **Click "Open Zammad"** → Should auto-login without password
6. **Update ticket in Zammad** → Should sync back via webhook

## API Endpoints

### SSO Endpoints

| Endpoint | Method | Description | User Type |
|----------|--------|-------------|-----------|
| `/zammad/sso/agent-login` | GET | Auto-login for CRM agents | Internal |
| `/zammad/sso/customer-login` | GET | Auto-login for portal customers | External |
| `/zammad/sso/login` | GET | Universal auto-login (auto-detects) | Both |
| `/zammad/sso/status` | GET | Check user's Zammad access | Both |

### Query Parameters

- `ticketId` (optional): Redirect to specific ticket after login
- `tenantId` (optional): For customers with multiple tenant access

### Response Format

```json
{
  "loginUrl": "http://localhost:8080/api/v1/sessions/sso?token=...&return_to=%23ticket%2Fzoom%2F123",
  "expiresIn": 300,
  "userRole": "agent",
  "redirectTo": "/#ticket/zoom/123"
}
```

## Webhook Configuration

### Auto-Setup (Recommended)

Webhooks are automatically configured when tenant is created via `ZammadService.setupWebhook()`.

### Manual Setup (if needed)

1. Login to Zammad as admin
2. Go to **Admin → System → Webhooks**
3. Click **Create New Webhook**
4. Configure:
   - **Name**: `CRM Sync - TenantA`
   - **Endpoint**: `http://your-backend.com/api/webhooks/zammad/{tenantId}`
   - **Triggers**: 
     - ✅ Ticket Create
     - ✅ Ticket Update  
     - ✅ Article Create
   - **Secret**: Your `ZAMMAD_WEBHOOK_SECRET` from .env
5. Click **Save**

### Webhook Security

Webhooks are verified using HMAC-SHA256 signatures:

```typescript
// Backend automatically validates signature
const expectedSignature = crypto
  .createHmac('sha256', process.env.ZAMMAD_WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

if (signature !== expectedSignature) {
  throw new UnauthorizedException('Invalid webhook signature');
}
```

## Database Schema

### User Model (Internal Agents)
```prisma
model User {
  id             String   @id
  email          String   @unique
  tenantId       String
  zammadUserId   String?  // Zammad user ID for SSO
  zammadEmail    String?  // Email used in Zammad
  // ... other fields
}
```

### PortalCustomer Model (External Customers)
```prisma
model PortalCustomer {
  id             String   @id
  email          String
  tenantId       String
  zammadUserId   String?  // Zammad user ID for SSO
  zammadEmail    String?  // Email used in Zammad
  // ... other fields
}
```

## Frontend Implementation

### Dashboard (Internal Agents)

```tsx
// Button in tickets page
<Button
  onClick={async () => {
    try {
      const response = await apiClient.get('/zammad/sso/agent-login');
      window.open(response.data.loginUrl, "_blank");
      toast.success("Opening Zammad...");
    } catch (error) {
      toast.error("Failed to access Zammad");
    }
  }}
>
  Open Zammad (Auto-Login)
</Button>
```

### Portal (External Customers)

```tsx
// Button in portal tickets page
<Button
  onClick={async () => {
    const response = await portalApiClient.get('/zammad/sso/customer-login', {
      params: { ticketId: ticket.id }
    });
    window.open(response.data.loginUrl, "_blank");
  }}
>
  View in Zammad
</Button>
```

## Troubleshooting

### Issue: "Zammad account not configured"

**Cause**: User doesn't have `zammadUserId` in database

**Solution**: 
```bash
# Re-run migration scripts
npm run migrate:zammad-users
npm run migrate:zammad-customers
```

### Issue: "Failed to generate login token"

**Cause**: Zammad API not accessible or token expired

**Check**:
1. Verify Zammad is running: `curl http://localhost:8080`
2. Check API token is valid in Zammad admin panel
3. Verify `ZAMMAD_URL` and `ZAMMAD_API_TOKEN` in `.env`

### Issue: "Webhook signature invalid"

**Cause**: Mismatch between webhook secret in Zammad and backend

**Solution**:
1. Ensure same secret in both places
2. Regenerate secret and update both Zammad webhook config and `.env`

### Issue: User sees "Access Denied" in Zammad

**Cause**: User not in correct organization or role missing

**Solution**:
```sql
-- Check user's Zammad mapping
SELECT email, "zammadUserId", "zammadEmail" FROM users WHERE email = 'user@example.com';

-- If missing, re-run migrations
npm run migrate:zammad-users
```

### Issue: Same email can't be both agent and customer

**This is solved!** Our implementation supports dual roles:
- User belongs to multiple Zammad organizations
- Different role in each organization (agent in A, customer in B)
- Zammad automatically applies correct permissions

## Security Considerations

1. **Token Expiration**: Auto-login tokens expire after 5 minutes or first use
2. **Webhook Signatures**: All webhooks verified with HMAC-SHA256
3. **HTTPS Required**: Production must use HTTPS for webhooks
4. **Tenant Isolation**: Users can only access tickets in their organizations
5. **Role-Based Access**: Agents have full access, customers see only their tickets

## Production Deployment

### Environment Variables (Production)

```env
# Use production Zammad instance
ZAMMAD_URL=https://support.yourcompany.com

# Use strong API token
ZAMMAD_API_TOKEN=production-token-here

# Use HTTPS backend URL
BACKEND_URL=https://api.yourcrm.com

# Use strong webhook secret (32+ characters)
ZAMMAD_WEBHOOK_SECRET=production-secret-minimum-32-chars-long
```

### Zammad Hosting Options

1. **Self-Hosted**: Docker/Kubernetes deployment
2. **Zammad Cloud**: https://zammad.com/pricing
3. **AWS/Azure**: Deploy via marketplace

### SSL/TLS Configuration

Webhooks require HTTPS in production:

```nginx
# Nginx config for Zammad
server {
    listen 443 ssl;
    server_name support.yourcompany.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://zammad:8080;
    }
}
```

## Monitoring & Logging

Check logs for SSO activity:

```bash
# Backend logs
cd server
npm run start:dev

# Look for:
# ✅ "Generated agent auto-login for user@example.com"
# ✅ "Created auto-login token for user 123"
# ❌ "Failed to generate auto-login: ..."
```

Check Zammad logs:

```bash
docker logs zammad-railsserver-1 --tail=100 -f
```

## Future Enhancements

- [ ] Embedded Zammad widget (iframe in CRM)
- [ ] SSO with SAML/OAuth for production
- [ ] Periodic sync fallback (if webhook fails)
- [ ] Bulk ticket operations
- [ ] File attachment support
- [ ] Custom field mapping
- [ ] Multi-language support

## Support

For issues:
1. Check troubleshooting section above
2. Review backend logs: `npm run start:dev`
3. Check Zammad logs: `docker logs zammad-railsserver-1`
4. Verify database mappings: `npx prisma studio`

## License

MIT License - See main project LICENSE file
