# 🔄 Jira Bidirectional Sync - Complete Implementation

## ✅ What Was Fixed & Implemented

### 1. **Bidirectional Sync** ✅
- **Write-through cache**: Changes in SynapseCRM → Jira → Local cache
- **Webhook sync**: Changes in Jira → Webhook → Local cache update
- **Automatic polling**: Background sync every 5 minutes as backup

### 2. **Webhooks Implementation** ✅
- **New Controller**: `jira-webhooks.controller.ts` receives Jira webhook events
- **New Service**: `jira-webhook.service.ts` processes webhook payloads
- **Supported Events**:
  - ✅ `jira:issue_created` - Detects new issues in Jira
  - ✅ `jira:issue_updated` - Syncs status, priority, title, description changes
  - ✅ `jira:issue_deleted` - Removes deleted issues from cache
  - ✅ `comment_created` - Syncs new comments from Jira
  - ✅ `comment_updated` - Logs comment updates
  - ✅ `comment_deleted` - Preserves audit trail

### 3. **Automatic Background Sync** ✅
- **New Service**: `jira-sync.service.ts` with `@Cron` decorator
- **Runs every 5 minutes** automatically
- **Syncs all tenants** with active Jira integration
- **Configurable** via environment variables
- **Prevents duplicate syncs** with locking mechanism

### 4. **Enhanced API Endpoints** ✅
Added to `TicketsController`:
- `POST /api/tickets/sync` - Manual sync trigger
- `GET /api/tickets/:id/refresh` - Refresh single ticket from Jira

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    JIRA CLOUD (Primary System)                 │
│  Issues, Comments, Status Changes, Priority Updates            │
└────────────┬────────────────────────────────┬──────────────────┘
             │                                │
             │ Webhooks (Real-time)           │ API Polling (Backup)
             │                                │
             ↓                                ↓
┌────────────────────────────────────────────────────────────────┐
│                    SynapseCRM Backend                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │ Webhook Handler  │  │ Auto-Sync Cron   │  │ Manual Sync  ││
│  │ (Real-time)      │  │ (Every 5 min)    │  │ (On-demand)  ││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
│           └────────────────┬────────────────────────┘         │
│                            ↓                                   │
│           ┌──────────────────────────────────┐                │
│           │   PostgreSQL Cache (Supabase)    │                │
│           │   - Fast reads                   │                │
│           │   - Always up-to-date            │                │
│           │   - Multi-tenant isolation       │                │
│           └──────────────────────────────────┘                │
└────────────────────────────────────────────────────────────────┘
             │
             │ Fast API Responses
             ↓
┌────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                          │
│  Tickets Dashboard, Real-time updates, Comments                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📁 New Files Created

### Backend Files

1. **`server/src/jira/controllers/jira-webhooks.controller.ts`**
   - Handles incoming webhook POST requests from Jira
   - Routes events to appropriate handlers
   - Validates webhook signatures
   - Public endpoint (no auth guard needed)

2. **`server/src/jira/services/jira-webhook.service.ts`**
   - Processes webhook payloads
   - Updates local cache based on Jira events
   - Handles issue updates, comments, deletions
   - Extracts text from Atlassian Document Format (ADF)

3. **`server/src/jira/services/jira-sync.service.ts`**
   - Background cron job for automatic sync
   - Syncs all tenants every 5 minutes
   - Can be triggered manually via API
   - Prevents concurrent sync operations

### Modified Files

4. **`server/src/jira/jira.module.ts`**
   - Added `JiraWebhookService` provider
   - Added `JiraSyncService` provider
   - Added `JiraWebhooksController`
   - Enabled `ScheduleModule` for cron jobs

5. **`server/src/jira/services/jira-api.service.ts`**
   - Added `getComments()` method
   - Added `searchIssues()` method
   - Added `getTransitions()` method
   - Enhanced bidirectional sync capabilities

6. **`server/src/tickets/tickets/tickets.controller.ts`**
   - Added `POST /tickets/sync` endpoint
   - Added `GET /tickets/:id/refresh` endpoint

7. **`server/src/app.module.ts`**
   - Added `ScheduleModule.forRoot()` for cron jobs

8. **`server/.env`**
   - Added `JIRA_WEBHOOK_SECRET`
   - Added `JIRA_AUTO_SYNC_ENABLED`
   - Added `JIRA_SYNC_INTERVAL`

---

## 🚀 Setup Instructions

### Step 1: Configure Jira Webhooks

1. **Login to Jira** (https://iftikherazamcolab1.atlassian.net)

2. **Go to Settings**
   - Click ⚙️ (Settings) in top right
   - Select **System**
   - Click **Webhooks** in left sidebar

3. **Create Webhook**
   - Click **Create a WebHook**
   - **Name**: `SynapseCRM Sync`
   - **Status**: Enabled
   - **URL**: `https://your-production-domain.com/api/jira/webhooks`
     - For local testing: Use **ngrok** or **localtunnel** to expose port 3001
     - Example: `https://abc123.ngrok.io/api/jira/webhooks`

4. **Select Events**
   Check these boxes:
   - ✅ **Issue** → created
   - ✅ **Issue** → updated
   - ✅ **Issue** → deleted
   - ✅ **Issue** → worklog updated (optional)
   - ✅ **Comment** → created
   - ✅ **Comment** → updated
   - ✅ **Comment** → deleted

5. **Add Webhook Secret** (Optional but recommended)
   - Generate secret: `openssl rand -hex 32`
   - Add to `.env`: `JIRA_WEBHOOK_SECRET="your-generated-secret"`
   - In Jira webhook settings, add custom header:
     - Header: `X-Atlassian-Webhook-Identifier`
     - Value: Same secret from `.env`

6. **Save Webhook**

### Step 2: Test Webhook Locally

**Using ngrok (Recommended):**

```bash
# Install ngrok
npm install -g ngrok

# Start backend
cd server
npm run start:dev

# In another terminal, expose port 3001
ngrok http 3001

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Use in Jira webhook: https://abc123.ngrok.io/api/jira/webhooks
```

**Test Endpoint:**
```bash
curl -X POST http://localhost:3001/api/jira/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Step 3: Verify Auto-Sync

Auto-sync runs automatically every 5 minutes. Check logs:

```bash
# Backend logs will show:
# [JiraSyncService] Starting automatic Jira sync...
# [JiraSyncService] Found X tenants with Jira integration
# [JiraSyncService] Auto-sync completed: X tickets synced, X errors
```

**Disable auto-sync** (if needed):
```env
JIRA_AUTO_SYNC_ENABLED="false"
```

### Step 4: Manual Sync via API

**Trigger manual sync:**
```bash
curl -X POST http://localhost:3001/api/tickets/sync \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT"
```

**Refresh single ticket:**
```bash
curl http://localhost:3001/api/tickets/{ticketId}/refresh \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT"
```

---

## 🔄 How Sync Works

### Scenario 1: Create Ticket in SynapseCRM
```
1. User creates ticket in web app
2. Backend calls Jira API → createIssue()
3. Jira returns issue key (e.g., "KAN-5")
4. Backend saves ticket to cache with externalId="KAN-5"
5. ✅ Ticket exists in both systems
```

### Scenario 2: Update Ticket in Jira
```
1. User changes status in Jira (e.g., Open → In Progress)
2. Jira sends webhook to /api/jira/webhooks
3. JiraWebhookService receives event
4. Service updates cache: status = IN_PROGRESS
5. ✅ Frontend shows updated status immediately
```

### Scenario 3: Add Comment in Jira
```
1. User adds comment in Jira
2. Jira sends webhook (comment_created)
3. JiraWebhookService extracts comment text
4. Service creates TicketComment in cache
5. ✅ Comment appears in SynapseCRM
```

### Scenario 4: Auto-Sync (Backup)
```
1. Cron job runs every 5 minutes
2. JiraSyncService finds all Jira-linked tickets
3. For each ticket, calls Jira API → getIssue()
4. Compares Jira data with cache
5. Updates cache if differences found
6. ✅ Ensures cache is always synchronized
```

---

## 🧪 Testing Checklist

### Test 1: Create Ticket
- [ ] Create ticket in SynapseCRM
- [ ] Verify issue created in Jira with same title/description
- [ ] Check Jira issue key matches `externalId` in database

### Test 2: Update Status (CRM → Jira)
- [ ] Change ticket status in SynapseCRM
- [ ] Verify status updated in Jira
- [ ] Check Jira transition worked (e.g., Open → In Progress)

### Test 3: Update Status (Jira → CRM)
- [ ] Change issue status in Jira UI
- [ ] Wait for webhook (instant) or auto-sync (max 5 min)
- [ ] Verify status updated in SynapseCRM

### Test 4: Update Priority (Jira → CRM)
- [ ] Change priority in Jira (e.g., Medium → High)
- [ ] Wait for webhook
- [ ] Verify priority updated in SynapseCRM

### Test 5: Add Comment (CRM → Jira)
- [ ] Add comment in SynapseCRM
- [ ] Verify comment appears in Jira

### Test 6: Add Comment (Jira → CRM)
- [ ] Add comment in Jira
- [ ] Wait for webhook
- [ ] Verify comment appears in SynapseCRM

### Test 7: Delete Issue (Jira → CRM)
- [ ] Delete issue in Jira
- [ ] Wait for webhook
- [ ] Verify ticket removed from SynapseCRM cache

### Test 8: Manual Sync
- [ ] Make changes in Jira (without webhook)
- [ ] Call `/api/tickets/sync` endpoint
- [ ] Verify changes synced to SynapseCRM

### Test 9: Auto-Sync
- [ ] Make changes in Jira
- [ ] Wait 5+ minutes
- [ ] Check backend logs for sync activity
- [ ] Verify changes synced automatically

---

## 🐛 Troubleshooting

### Webhooks Not Working

**Check webhook delivery in Jira:**
1. Go to Jira → System → Webhooks
2. Click your webhook
3. View **Recent Deliveries** tab
4. Check for errors (400, 401, 500)

**Common issues:**
- ❌ **404 Not Found**: Wrong URL (check `/api/jira/webhooks`)
- ❌ **401 Unauthorized**: Webhook secret mismatch
- ❌ **500 Server Error**: Check backend logs for exceptions
- ❌ **Timeout**: Backend not accessible (firewall, ngrok down)

**Solution:**
```bash
# Test endpoint manually
curl -X POST https://your-domain.com/api/jira/webhooks/test
# Should return: {"success": true, "message": "Webhook endpoint is accessible"}
```

### Auto-Sync Not Running

**Check if enabled:**
```env
JIRA_AUTO_SYNC_ENABLED="true"  # Must be "true"
```

**Check logs:**
```bash
# Should see every 5 minutes:
[JiraSyncService] Starting automatic Jira sync...
```

**If no logs:**
- Verify `ScheduleModule.forRoot()` in `app.module.ts`
- Restart backend: `npm run start:dev`

### Tickets Not Syncing

**Check Jira configuration:**
```bash
# Test Jira connection
curl http://localhost:3001/api/jira/test
```

**Check database:**
```sql
SELECT * FROM "Ticket" WHERE "externalSystem" = 'jira';
-- All Jira tickets should have externalId set
```

**Check Jira API quota:**
- Free plan: 10,000 API calls/month
- If exceeded, sync will fail

---

## 📊 Monitoring & Logs

### Backend Logs

**Webhook events:**
```
[JiraWebhooksController] Received Jira webhook: jira:issue_updated
[JiraWebhookService] Processing issue updated: KAN-5
[JiraWebhookService] Status changed: In Progress → IN_PROGRESS
[JiraWebhookService] Updated cached ticket abc123 from Jira issue KAN-5
```

**Auto-sync:**
```
[JiraSyncService] Starting automatic Jira sync...
[JiraSyncService] Found 1 tenants with Jira integration
[JiraSyncService] Syncing tenant: tenant-id-123
[JiraSyncService] Found 5 Jira-linked tickets for tenant tenant-id-123
[JiraSyncService] Tenant tenant-id-123: Synced 5 tickets, 0 errors
[JiraSyncService] Auto-sync completed: 5 tickets synced, 0 errors
```

**Errors:**
```
[JiraApiService] Failed to get Jira issue KAN-5: 404 Not Found
[JiraSyncService] Ticket KAN-5: Issue has been deleted
```

### Database Monitoring

**Check sync status:**
```sql
-- Count synced tickets
SELECT COUNT(*) FROM "Ticket" 
WHERE "externalSystem" = 'jira' AND "externalId" IS NOT NULL;

-- Check recent updates
SELECT "id", "title", "externalId", "status", "updatedAt" 
FROM "Ticket" 
WHERE "externalSystem" = 'jira' 
ORDER BY "updatedAt" DESC 
LIMIT 10;
```

---

## 🎯 Performance Optimization

### Webhook Benefits
- ✅ **Instant updates** (< 1 second)
- ✅ **No polling overhead**
- ✅ **Reduces API calls** (saves quota)

### Auto-Sync Benefits
- ✅ **Backup mechanism** if webhooks fail
- ✅ **Handles missed events**
- ✅ **Recovers from downtime**

### Best Practices
1. **Use webhooks as primary sync** (fastest)
2. **Keep auto-sync enabled as backup**
3. **Adjust sync interval** based on usage:
   - High traffic: Every 3 minutes
   - Low traffic: Every 10 minutes
4. **Monitor Jira API quota** (10k calls/month free)

---

## 🔒 Security

### Webhook Secret
- ✅ Validates webhook authenticity
- ✅ Prevents fake webhook attacks
- ✅ Uses HMAC-SHA256 signature

### Environment Variables
```env
JIRA_WEBHOOK_SECRET="abc123..."  # Keep secret!
```

### Production Setup
1. Use **HTTPS only** for webhook URL
2. Set **webhook secret** in both Jira and `.env`
3. Enable **rate limiting** on webhook endpoint
4. Monitor for **suspicious activity**

---

## 📈 Future Enhancements

### Planned Features
- [ ] **Bi-directional attachment sync** (files)
- [ ] **Assignee mapping** (Jira user → CRM user)
- [ ] **Custom field sync** (labels, tags, etc.)
- [ ] **Bulk sync API** for initial setup
- [ ] **Sync analytics dashboard** (success rate, errors)
- [ ] **Webhook retry mechanism** (if processing fails)

---

## 📞 Support

**Issues?**
1. Check logs: `npm run start:dev` (watch mode)
2. Test webhook: `POST /api/jira/webhooks/test`
3. Manual sync: `POST /api/tickets/sync`
4. Check Jira deliveries: System → Webhooks → Recent Deliveries

**Still stuck?**
- Review this document's **Troubleshooting** section
- Check backend error logs
- Verify Jira credentials in `.env`

---

## ✅ Implementation Complete!

**What you can do now:**
1. ✅ Create tickets in SynapseCRM → Synced to Jira
2. ✅ Update tickets in Jira → Synced to SynapseCRM (via webhooks)
3. ✅ Add comments in either system → Synced bidirectionally
4. ✅ Auto-sync runs every 5 minutes as backup
5. ✅ Manual sync anytime via API endpoint

**Next Steps:**
1. Configure Jira webhooks (see Step 1 above)
2. Test bidirectional sync
3. Monitor logs for sync activity
4. Deploy to production with HTTPS webhook URL

---

**Status**: ✅ **FULLY IMPLEMENTED**  
**Last Updated**: November 22, 2025
