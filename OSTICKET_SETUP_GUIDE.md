# osTicket Integration Setup Guide

This guide walks you through setting up osTicket in Docker and integrating it with SynapseCRM.

## Table of Contents

1. [osTicket Docker Setup](#osticket-docker-setup)
2. [osTicket Configuration](#osticket-configuration)
3. [SynapseCRM Integration](#synapsecrm-integration)
4. [Testing the Integration](#testing-the-integration)
5. [Troubleshooting](#troubleshooting)

---

## osTicket Docker Setup

### Option 1: Using Official osTicket Docker Image

#### Step 1: Create Docker Compose File

Create a file named `docker-compose.yml` in a new directory:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: osticket-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: osticket
      MYSQL_USER: osticket
      MYSQL_PASSWORD: osticketpass
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - osticket-network
    restart: unless-stopped

  osticket:
    image: osticket/osticket:latest
    container_name: osticket-app
    depends_on:
      - mysql
    ports:
      - "8080:80"
    environment:
      # Database Configuration
      MYSQL_HOST: mysql
      MYSQL_PORT: 3306
      MYSQL_DATABASE: osticket
      MYSQL_USER: osticket
      MYSQL_PASSWORD: osticketpass
      MYSQL_PREFIX: ost_
    
      # osTicket Configuration
      INSTALL_SECRET: your-secret-key-here
      INSTALL_EMAIL: admin@yourdomain.com
      INSTALL_NAME: SynapseCRM Support
    
      # Admin User (Change these!)
      ADMIN_EMAIL: admin@yourdomain.com
      ADMIN_FIRSTNAME: Admin
      ADMIN_LASTNAME: User
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: Admin@12345
    
      # SMTP Configuration (Optional - for email notifications)
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 587
      SMTP_FROM: support@yourdomain.com
      SMTP_TLS: 'on'
      SMTP_USERNAME: your-email@gmail.com
      SMTP_PASSWORD: your-app-password
    volumes:
      - osticket_data:/var/www/html
    networks:
      - osticket-network
    restart: unless-stopped

volumes:
  mysql_data:
    driver: local
  osticket_data:
    driver: local

networks:
  osticket-network:
    driver: bridge
```

#### Step 2: Start the Containers

```powershell
# Navigate to the directory with docker-compose.yml
cd path\to\osticket-docker

# Start the containers
docker-compose up -d

# Check if containers are running
docker ps

# View logs (optional)
docker-compose logs -f osticket
```

#### Step 3: Access osTicket

1. Open your browser and navigate to: `http://localhost:8080`
2. You should see the osTicket welcome screen
3. The installation will auto-configure using the environment variables

---

### Option 2: Manual Docker Setup (Alternative)

If you prefer manual control:

```powershell
# Create network
docker network create osticket-net

# Run MySQL
docker run -d `
  --name osticket-mysql `
  --network osticket-net `
  -e MYSQL_ROOT_PASSWORD=rootpassword `
  -e MYSQL_DATABASE=osticket `
  -e MYSQL_USER=osticket `
  -e MYSQL_PASSWORD=osticketpass `
  -v osticket-mysql-data:/var/lib/mysql `
  mysql:8.0

# Wait 30 seconds for MySQL to initialize
Start-Sleep -Seconds 30

# Run osTicket
docker run -d `
  --name osticket `
  --network osticket-net `
  -p 8080:80 `
  -e MYSQL_HOST=osticket-mysql `
  -e MYSQL_DATABASE=osticket `
  -e MYSQL_USER=osticket `
  -e MYSQL_PASSWORD=osticketpass `
  -e INSTALL_SECRET=changeme `
  -e INSTALL_EMAIL=admin@example.com `
  -e ADMIN_EMAIL=admin@example.com `
  -e ADMIN_FIRSTNAME=Admin `
  -e ADMIN_LASTNAME=User `
  -e ADMIN_USERNAME=admin `
  -e ADMIN_PASSWORD=Admin@12345 `
  osticket/osticket:latest
```

---

## osTicket Configuration

### Step 1: Access Admin Panel

1. Navigate to: `http://localhost:8080/scp/login.php`
2. Login with admin credentials:
   - **Username**: `admin`
   - **Password**: `Admin@12345` (or what you set in docker-compose.yml)

### Step 2: Create API Key

1. In the admin panel, navigate to: **Admin Panel → Manage → API Keys**
2. Click **"Add New API Key"**
3. Configure the API key:
   - **Name**: SynapseCRM
   - **Status**: Active
   - **IP Address**: Leave empty (or add `127.0.0.1` for localhost testing)
   - **Can create tickets**: ✅ **YES**
   - **Can execute cron**: ❌ No
4. Click **"Add Key"**
5. **IMPORTANT**: Copy the generated API key immediately (you won't see it again!)
   - Example: `9E9B8F7C6D5A4B3C2D1E0F9A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B9`

### Step 3: Configure API Settings

1. Navigate to: **Admin Panel → Settings → API**
2. Enable the following:
   - **API Enabled**: ✅ YES
   - **Accept API Format**: JSON
   - **Require API Key**: ✅ YES

### Step 4: Configure Help Topics (Optional but Recommended)

1. Navigate to: **Admin Panel → Manage → Help Topics**
2. Ensure you have at least one help topic (default topics should exist)
3. Note the Help Topic ID (you'll need this for ticket creation)

### Step 5: Test API Access

Use PowerShell or curl to test the API:

```powershell
# Test API connectivity
$headers = @{
    "X-API-Key" = "4BB97DB0BDD0EB5C2DE917EBDBFB0E36"
    "Content-Type" = "application/json"
}

$body = @{
    alert = $true
    autorespond = $true
    source = "API"
    name = "Test User"
    email = "test@example.com"
    phone = "555-1234"
    subject = "Test Ticket from API"
    message = "This is a test ticket created via API."
    ip = "127.0.0.1"
    topicId = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/tickets.json" -Method Post -Headers $headers -Body $body
```

Expected response:

```json
{
  "ticket_id": 123456,
  "number": "123456"
}
```

---

## SynapseCRM Integration

### Step 1: Start Backend Server

```powershell
cd g:\Cse 327\synapse\server
npm run start:dev
```

**Backend should be running on**: `http://localhost:3001`

### Step 2: Start Frontend Server

```powershell
cd g:\Cse 327\synapse\Frontend
npm run dev
```

**Frontend should be running on**: `http://localhost:3000`

### Step 3: Configure osTicket in SynapseCRM

1. [ ] Open SynapseCRM in your browser: `http://localhost:3000`
2. [ ] Login with your Clerk credentials
3. [ ] Navigate to: **Settings → Integrations**
4. [ ] In the osTicket Integration section:
    - [ ] **Base URL**: `http://localhost:8080/api`
    - [ ] **API Key**: Paste the API key you copied from osTicket
5. [ ] Click **"Test Connection"** to verify
    - [ ] ✅ You should see: "Connection successful! ✓"
6. [ ] Click **"Setup Integration"**
    - [ ] ✅ You should see: "osTicket integration configured successfully!"

---

## Testing the Integration

### Test 1: Create Ticket from Internal Dashboard

1. Navigate to: **Tickets** page in SynapseCRM
2. Click **"Create Ticket"**
3. Fill in the form:
   - **Title**: Test Ticket from SynapseCRM
   - **Description**: Testing osTicket integration
   - **Priority**: HIGH
   - **Source**: EMAIL
   - **Contact**: Select an existing contact
4. Click **"Create Ticket"**
5. ✅ **Expected Result**:
   - Ticket appears in SynapseCRM with purple osTicket badge
   - Badge shows: **"osTicket #123456"** (ticket number)
   - Check osTicket admin panel: Ticket should appear there too

### Test 2: Create Ticket from Customer Portal

1. Navigate to: **Portal** (`http://localhost:3000/portal`)
2. Login as a portal customer
3. Go to **Tickets** section
4. Click **"New Ticket"**
5. Fill in the form:
   - **Title**: Portal Test Ticket
   - **Description**: Testing from customer portal
   - **Priority**: MEDIUM
6. Click **"Submit Ticket"**
7. ✅ **Expected Result**:
   - Ticket appears with osTicket badge
   - Ticket visible in osTicket admin panel

### Test 3: Add Comments

1. Open a ticket in SynapseCRM
2. Add a comment in the comment section
3. Click **"Send"**
4. ✅ **Expected Result**:
   - Comment appears in SynapseCRM
   - Comment synced to osTicket (check osTicket admin panel)

### Test 4: Update Ticket Status

1. Open a ticket in SynapseCRM
2. Change status to **"IN_PROGRESS"**
3. ✅ **Expected Result**:
   - Status updates in SynapseCRM
   - Status updates in osTicket (check admin panel)

### Test 5: Sync All Tickets

1. Navigate to: **Settings → Integrations**
2. Click **"Sync All Tickets"** button
3. ✅ **Expected Result**:
   - All osTicket tickets are pulled into SynapseCRM cache
   - Success message shows count: "Successfully synced X tickets from osTicket"

---

## Troubleshooting

### Issue 1: "Connection failed" when testing osTicket

**Possible Causes**:

- osTicket container is not running
- API key is incorrect
- API is disabled in osTicket

**Solutions**:

```powershell
# Check if containers are running
docker ps

# Check osTicket logs
docker logs osticket

# Restart containers
docker-compose restart
```

### Issue 2: Tickets not appearing in osTicket

**Possible Causes**:

- API key doesn't have "Create Tickets" permission
- Help Topic ID is invalid

**Solutions**:

1. Check API key permissions in osTicket admin panel
2. Ensure API is enabled in **Settings → API**
3. Check backend logs for errors:
   ```powershell
   # In server directory
   npm run start:dev
   ```

### Issue 3: CORS Errors

**Solution**:
Backend CORS is already configured for `http://localhost:3000`. If using different ports, update `server/src/main.ts`:

```typescript
app.enableCors({
  origin: 'http://localhost:YOUR_FRONTEND_PORT',
  credentials: true,
});
```

### Issue 4: osTicket shows "Database connection error"

**Solution**:

```powershell
# Wait for MySQL to fully initialize
docker-compose down
docker-compose up -d mysql
Start-Sleep -Seconds 30
docker-compose up -d osticket
```

### Issue 5: Can't access osTicket admin panel

**Solution**:

- Check if port 8080 is already in use
- Try different port in docker-compose.yml:
  ```yaml
  ports:
    - "8081:80"  # Change to 8081
  ```

---

## Backend API Endpoints Reference

### osTicket Management Endpoints

| Method | Endpoint                         | Description                    | Admin Only |
| ------ | -------------------------------- | ------------------------------ | ---------- |
| POST   | `/api/osticket/setup`          | Configure osTicket integration | ✅ Yes     |
| POST   | `/api/osticket/test`           | Test osTicket connection       | ❌ No      |
| GET    | `/api/osticket/status`         | Get integration status         | ❌ No      |
| POST   | `/api/osticket/sync/:ticketId` | Sync single ticket             | ❌ No      |
| POST   | `/api/osticket/sync-all`       | Sync all tickets               | ✅ Yes     |
| POST   | `/api/osticket/disable`        | Disable integration            | ✅ Yes     |

### Ticket Endpoints (Auto-use osTicket if configured)

| Method | Endpoint                      | Description                            |
| ------ | ----------------------------- | -------------------------------------- |
| POST   | `/api/tickets`              | Create ticket (goes to osTicket first) |
| GET    | `/api/tickets`              | List all tickets (from cache)          |
| GET    | `/api/tickets/:id`          | Get ticket details                     |
| PATCH  | `/api/tickets/:id`          | Update ticket (updates osTicket)       |
| DELETE | `/api/tickets/:id`          | Delete ticket (closes in osTicket)     |
| POST   | `/api/tickets/:id/comments` | Add comment (syncs to osTicket)        |

---

## Architecture Diagram

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  SynapseCRM     │         │   NestJS Backend │         │   osTicket      │
│  Frontend       │ ◄─────► │   (Port 3001)    │ ◄─────► │  (Port 8080)    │
│  (Port 3000)    │   API   │                  │   REST  │                 │
└─────────────────┘  Calls  │  ┌────────────┐  │   API   │  ┌───────────┐  │
                             │  │  Tickets   │  │         │  │  Tickets  │  │
                             │  │  Service   │  │         │  │  Database │  │
                             │  └────────────┘  │         │  └───────────┘  │
                             │         │        │         └─────────────────┘
                             │         ▼        │                  │
                             │  ┌────────────┐  │                  │
                             │  │  Supabase  │  │                  │
                             │  │  (Cache)   │  │◄─────────────────┘
                             │  └────────────┘  │      Sync on
                             └──────────────────┘      Create/Update
```

### Data Flow

1. **Create Ticket**:

   - Frontend → Backend API
   - Backend → osTicket API (create ticket)
   - Backend → Supabase (cache ticket with externalId)
   - Backend → Frontend (return ticket)
2. **Read Tickets**:

   - Frontend → Backend API
   - Backend → Supabase (read from cache - fast!)
   - Backend → Frontend (return tickets)
3. **Update Ticket**:

   - Frontend → Backend API
   - Backend → osTicket API (update ticket)
   - Backend → Supabase (update cache)
   - Backend → Frontend (return updated ticket)

---

## Production Deployment Notes

### Security Considerations

1. **Change Default Passwords**:

   ```yaml
   MYSQL_ROOT_PASSWORD: use-strong-password-here
   ADMIN_PASSWORD: use-strong-password-here
   ```
2. **Restrict API Key IP**:

   - In osTicket admin panel, set API key IP restriction to your server IP
3. **Use HTTPS**:

   - Deploy behind reverse proxy (nginx, Caddy)
   - Use SSL certificates
4. **Environment Variables**:

   ```bash
   # Backend .env
   OSTICKET_BASE_URL=https://support.yourdomain.com/api
   OSTICKET_API_KEY=your-api-key-here
   ```

### Docker Compose for Production

```yaml
version: '3.8'

services:
  osticket:
    image: osticket/osticket:latest
    restart: always
    environment:
      # Use secrets or env files
      MYSQL_HOST: mysql
      MYSQL_DATABASE: ${OSTICKET_DB}
      MYSQL_USER: ${OSTICKET_USER}
      MYSQL_PASSWORD: ${OSTICKET_PASS}
    volumes:
      - osticket_data:/var/www/html
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.osticket.rule=Host(`support.yourdomain.com`)"
      - "traefik.http.routers.osticket.entrypoints=websecure"
      - "traefik.http.routers.osticket.tls.certresolver=letsencrypt"
```

---

## Additional Resources

- **osTicket Official Docs**: https://docs.osticket.com/
- **osTicket API Docs**: https://docs.osticket.com/en/latest/Developer%20Documentation/API/Tickets.html
- **Docker Hub**: https://hub.docker.com/r/osticket/osticket

---

## Support

If you encounter issues:

1. Check container logs:

   ```powershell
   docker logs osticket
   docker logs osticket-mysql
   ```
2. Check backend logs (in terminal running `npm run start:dev`)
3. Check browser console for frontend errors
4. Verify API key permissions in osTicket admin panel

---

**Last Updated**: November 10, 2025
**Version**: 1.0.0
