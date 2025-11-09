# osTicket Integration Testing Checklist

## Pre-Testing Setup

### ✅ Backend Setup
- [ ] Backend server running on `http://localhost:3001`
- [ ] Database connected (Supabase PostgreSQL)
- [ ] Prisma schema migrated
- [ ] Environment variables configured in `server/.env`:
  ```
  DATABASE_URL="postgresql://..."
  DIRECT_URL="postgresql://..."
  PORT=3001
  NODE_ENV=development
  ```

### ✅ Frontend Setup
- [ ] Frontend server running on `http://localhost:3000`
- [ ] Environment variables configured in `Frontend/.env.local`:
  ```
  NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  ```

### ✅ osTicket Docker Setup
- [ ] Docker containers running (`docker ps` shows both mysql and osticket)
- [ ] osTicket accessible at `http://localhost:8080`
- [ ] osTicket admin panel accessible at `http://localhost:8080/scp/login.php`
- [ ] API key created from osTicket admin panel
- [ ] API key has "Create Tickets" permission enabled

---

## Testing Steps

### Test 1: osTicket Configuration (Settings Page)

**Steps**:
1. Open SynapseCRM: `http://localhost:3000`
2. Login with Clerk credentials
3. Navigate to: **Settings → Integrations** tab
4. Fill in osTicket details:
   - Base URL: `http://localhost:8080/api`
   - API Key: (paste from osTicket)
5. Click **"Test Connection"**
6. Click **"Setup Integration"**

**Expected Results**:
- [ ] "Connection successful! ✓" message appears after test
- [ ] "osTicket integration configured successfully!" message after setup
- [ ] Status badge shows "Active" with green checkmark
- [ ] Current configuration section displays:
  - Base URL: `http://localhost:8080/api`
  - Synced Tickets: 0 tickets (initially)

**Screenshots**:
- [ ] Settings page with Integrations tab
- [ ] Successful connection test
- [ ] Active integration status

---

### Test 2: Create Ticket from Internal Dashboard

**Steps**:
1. Navigate to: **Tickets** page
2. Click **"Create Ticket"** button
3. Fill in form:
   - Title: "Test Ticket - Internal Dashboard"
   - Description: "Testing osTicket integration from internal dashboard"
   - Priority: HIGH
   - Source: EMAIL
   - Contact: Select any existing contact
4. Click **"Create Ticket"**

**Expected Results**:
- [ ] Success toast: "Ticket created successfully"
- [ ] Ticket appears in kanban board under "Open" column
- [ ] Ticket card shows purple osTicket badge: "osTicket #123456"
- [ ] Clicking ticket opens detail dialog
- [ ] Detail dialog shows osTicket badge with ticket number
- [ ] "View in osTicket" button visible (may show configuration toast)

**Verify in osTicket**:
- [ ] Open osTicket admin panel: `http://localhost:8080/scp/tickets.php`
- [ ] New ticket visible in ticket list
- [ ] Ticket number matches the badge in SynapseCRM
- [ ] Ticket details match (title, description, priority)

**Screenshots**:
- [ ] Ticket creation form
- [ ] Ticket in kanban board with osTicket badge
- [ ] Ticket in osTicket admin panel

---

### Test 3: Create Ticket from Customer Portal

**Steps**:
1. Navigate to: **Portal** (`http://localhost:3000/portal`)
2. Login as portal customer
3. Go to **Tickets** section
4. Click **"New Ticket"** button
5. Fill in form:
   - Title: "Test Ticket - Customer Portal"
   - Description: "Testing from customer portal"
   - Priority: MEDIUM
6. Click **"Submit Ticket"**

**Expected Results**:
- [ ] Success message appears
- [ ] Ticket appears in portal tickets list
- [ ] Ticket card shows osTicket badge: "🎫 #123457"
- [ ] Status and priority badges displayed correctly

**Verify in osTicket**:
- [ ] Ticket visible in osTicket admin panel
- [ ] Ticket source shows "API"
- [ ] Customer email matches portal customer

**Screenshots**:
- [ ] Portal ticket creation form
- [ ] Ticket in portal list with osTicket badge
- [ ] Ticket in osTicket admin panel

---

### Test 4: Add Comment to Ticket (Internal)

**Steps**:
1. Open any ticket in internal dashboard
2. Scroll to comments section
3. Type comment: "Adding comment from SynapseCRM"
4. Click **"Send"** button

**Expected Results**:
- [ ] Success toast: "Comment added successfully"
- [ ] Comment appears in comment list immediately
- [ ] Comment shows timestamp and author

**Verify in osTicket**:
- [ ] Open same ticket in osTicket admin panel
- [ ] Click on ticket to view details
- [ ] Navigate to "Posts" or "Thread" tab
- [ ] Comment visible with same content
- [ ] Comment shows as internal note or public reply

**Screenshots**:
- [ ] Comment added in SynapseCRM
- [ ] Comment visible in osTicket

---

### Test 5: Add Comment from Portal

**Steps**:
1. Open ticket in customer portal
2. Add comment: "Reply from customer portal"
3. Click send

**Expected Results**:
- [ ] Comment appears in portal immediately
- [ ] Badge shows comment count increased

**Verify in osTicket**:
- [ ] Comment visible in osTicket as customer reply
- [ ] Alert flag set (if configured)

---

### Test 6: Update Ticket Status

**Steps**:
1. Open ticket in internal dashboard
2. Change status dropdown to "IN_PROGRESS"
3. Wait for auto-save or click update

**Expected Results**:
- [ ] Success toast: "Ticket updated successfully"
- [ ] Ticket moves to "In Progress" column in kanban
- [ ] Status badge updates

**Verify in osTicket**:
- [ ] Open ticket in osTicket admin panel
- [ ] Status shows as updated (Open → In Progress mapping)
- [ ] Status change logged in ticket history

**Screenshots**:
- [ ] Status change in SynapseCRM
- [ ] Updated status in osTicket

---

### Test 7: Update Ticket Priority

**Steps**:
1. Open ticket detail dialog
2. Change priority dropdown to "URGENT"
3. Save changes

**Expected Results**:
- [ ] Priority badge changes to red with "URGENT" label
- [ ] Alert icon appears on ticket card

**Verify in osTicket**:
- [ ] Priority updated in osTicket (LOW=1, MEDIUM=2, HIGH=3, URGENT=4)
- [ ] Priority change logged

---

### Test 8: Sync All Tickets

**Steps**:
1. Create 2-3 tickets directly in osTicket admin panel
2. Navigate to: **Settings → Integrations** in SynapseCRM
3. Click **"Sync All Tickets"** button
4. Wait for sync to complete

**Expected Results**:
- [ ] Success toast: "Successfully synced X tickets from osTicket"
- [ ] Synced tickets count updates in status section
- [ ] Navigate to Tickets page
- [ ] All osTicket tickets now visible in kanban board
- [ ] Each ticket has osTicket badge

**Screenshots**:
- [ ] Tickets created in osTicket
- [ ] Sync all button clicked
- [ ] Tickets appearing in SynapseCRM

---

### Test 9: Portal Customer Experience

**Full Portal Flow**:
1. Portal customer creates ticket
2. Support team (internal) sees ticket with osTicket badge
3. Support team adds reply
4. Portal customer sees reply in portal
5. Portal customer adds another comment
6. Status updated to "RESOLVED" by support
7. Portal customer sees updated status

**Expected Results**:
- [ ] Seamless bidirectional communication
- [ ] All updates reflected in both systems
- [ ] osTicket remains source of truth
- [ ] Local cache provides fast reads

---

### Test 10: Error Handling

**Test Scenarios**:

#### Scenario A: osTicket Offline
1. Stop osTicket container: `docker-compose stop osticket`
2. Try to create ticket in SynapseCRM
3. Expected: Error toast with clear message
4. Restart osTicket: `docker-compose start osticket`

#### Scenario B: Invalid API Key
1. Go to Settings → Integrations
2. Change API key to invalid value
3. Click "Test Connection"
4. Expected: "Connection failed" error

#### Scenario C: Network Issues
1. Change osTicket baseUrl to wrong port
2. Test connection
3. Expected: Connection timeout error with helpful message

**Results**:
- [ ] Errors caught and displayed to user
- [ ] No crashes or white screens
- [ ] User can retry after fixing issue

---

## Performance Testing

### Load Test: Multiple Tickets
1. Create 10 tickets rapidly
2. All should be created in osTicket
3. All should be cached locally
4. Kanban board should update smoothly

**Results**:
- [ ] All tickets created successfully
- [ ] No duplicate tickets
- [ ] UI remains responsive

### Cache Performance
1. Open Tickets page (reads from cache)
2. Measure load time (should be <500ms)
3. Click "Sync All" to refresh cache
4. Kanban should update within 2-3 seconds

**Results**:
- [ ] Fast initial load from cache
- [ ] Sync completes in reasonable time
- [ ] No data loss during sync

---

## Cross-Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if on Mac)

All features should work identically.

---

## Mobile Responsiveness

Test on mobile viewport:
- [ ] Settings page integrations tab
- [ ] Tickets kanban board
- [ ] Ticket detail dialog
- [ ] Portal tickets page
- [ ] All badges visible and readable

---

## Final Verification Checklist

### Backend
- [ ] All API endpoints responding
- [ ] Logs show successful osTicket API calls
- [ ] Database cache populated correctly
- [ ] No error logs in console

### Frontend
- [ ] No console errors
- [ ] All UI components render correctly
- [ ] Loading states work properly
- [ ] Success/error messages clear and helpful

### osTicket
- [ ] All tickets visible in admin panel
- [ ] Comments synced properly
- [ ] Status updates reflected
- [ ] API key permissions correct

### Integration
- [ ] Data consistency between systems
- [ ] No duplicate tickets
- [ ] Bidirectional sync working
- [ ] osTicket remains authoritative source

---

## Troubleshooting Reference

### Common Issues

**Issue**: "Connection failed" when testing osTicket
- **Check**: Is osTicket container running? (`docker ps`)
- **Check**: Is API enabled in osTicket settings?
- **Check**: Is API key correct and active?

**Issue**: Tickets not appearing in osTicket
- **Check**: API key has "Create Tickets" permission
- **Check**: Backend logs for error messages
- **Check**: Help Topic ID exists in osTicket

**Issue**: Comments not syncing
- **Check**: osTicket API endpoints accessible
- **Check**: Network connectivity between backend and osTicket
- **Check**: API key still valid

**Issue**: Status updates not working
- **Check**: Status mapping in backend code (OPEN=1, RESOLVED=2, etc.)
- **Check**: osTicket ticket status permissions

---

## Success Criteria

✅ **Integration is successful if**:
1. All 10 test cases pass
2. No critical errors in browser console
3. No errors in backend logs
4. Data consistency maintained between systems
5. User experience is smooth and intuitive
6. osTicket admin panel shows all SynapseCRM tickets
7. Performance is acceptable (<2s for sync operations)

---

## Post-Testing

### Documentation
- [ ] Screenshot all successful test results
- [ ] Document any issues encountered
- [ ] Note any configuration changes needed
- [ ] Update README if needed

### Deployment Prep
- [ ] Review security settings
- [ ] Plan production osTicket deployment
- [ ] Prepare environment variables for production
- [ ] Test with production-like data volume

---

**Testing Date**: _________________
**Tested By**: _________________
**osTicket Version**: _________________
**SynapseCRM Version**: _________________
**Result**: ⬜ PASS ⬜ FAIL (with notes)

**Notes**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
