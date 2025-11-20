# Settings Feature - User Guide

## How to Access Settings

1. Open the app and log in
2. From the Owner Dashboard, tap the **+ (Plus)** button at the bottom right
3. In the speed dial menu, tap **Settings** (gear icon with purple color)
4. Settings screen will open

---

## Settings Screen Layout

### Top Bar
- **Back Arrow** (←) - Returns to dashboard
- **Title**: "Settings"

### Two Tabs
1. **Team Tab** (default) - Manage team members and invitations
2. **Workspace Tab** - Coming soon

---

## Team Tab Features

### Section 1: Team Members
Shows all current team members with:
- **Avatar** with initials
- **Full Name** and email
- **Role Badge** (Admin/Manager/Member) with color coding:
  - 🟣 Purple = Admin
  - 🔵 Blue = Manager
  - ⚫ Gray = Member
- **Three-dot menu** (⋮) with options:
  - **Change Role** - Opens dialog to select new role
  - **Remove** - Opens confirmation dialog to remove member

**Empty State**: If no team members exist, shows "No team members yet"

### Section 2: Pending Invitations (Admins Only)
Shows invitations that haven't been accepted yet:
- **Email** of invited person
- **Role** they were invited as
- **Sent Date** - When invitation was sent
- **Expires Date** - When invitation expires (in orange)
- **X button** - Cancel invitation

**Empty State**: Shows "No pending invitations"

---

## How to Invite Team Members

### Step 1: Open Invite Dialog
- Look for the **Floating Action Button** (FAB) at bottom right corner
  - Icon: **+ (Plus sign)** inside a circle
  - Color: Primary theme color
  - **IMPORTANT**: Only visible to users with **ADMIN** role
- Tap the FAB to open "Invite Member" dialog

### Step 2: Fill Invitation Form
Dialog contains:
1. **Email Field**
   - Label: "Email Address"
   - Validation: Must be valid email format
   - Error shown if invalid

2. **Role Dropdown**
   - Click to expand and see options:
     - **Admin** - "Full access to all features"
     - **Manager** - "Manage teams and customers"
     - **Member** - "Customer dashboard access"

### Step 3: Send Invitation
- Tap **"Send Invite"** button
- Loading spinner appears during sending
- On success: Snackbar shows "Invitation sent successfully"
- On error: Snackbar shows error message
- Dialog closes automatically on success
- New invitation appears in "Pending Invitations" section

---

## How to Change User Role

### Prerequisites
- You must be an **ADMIN**
- Cannot change your own role

### Steps:
1. Find the team member in the list
2. Tap the **three-dot menu** (⋮) on their card
3. Select **"Change Role"**
4. Dialog opens showing:
   - Member's name
   - Current role
   - Three role options with descriptions (as cards with radio buttons)
5. Select new role
6. Tap **"Save"** button
7. Confirmation snackbar appears

---

## How to Remove Team Member

### Prerequisites
- You must be an **ADMIN**
- Cannot remove yourself

### Steps:
1. Find the team member in the list
2. Tap the **three-dot menu** (⋮) on their card
3. Select **"Remove"**
4. Confirmation dialog opens with:
   - ⚠️ Warning icon (red)
   - Member's name
   - Warning message: "This action cannot be undone"
5. Tap red **"Remove"** button to confirm
6. Or tap **"Cancel"** to abort
7. Member is removed from team immediately

---

## Troubleshooting

### "I don't see the + button to invite members"
**Cause**: You are not an ADMIN
**Solution**: Only users with ADMIN role can invite team members. Ask your workspace admin to change your role.

### "I can't change roles or remove members"
**Cause**: You are not an ADMIN
**Solution**: Only ADMIN users can manage team members.

### "The three-dot menu is disabled on some members"
**Cause**: You cannot remove yourself
**Solution**: This is by design to prevent self-removal. Another admin must remove you.

### "Settings button doesn't appear in speed dial"
**Cause**: Navigation issue
**Solution**: 
1. Make sure you compiled the latest code
2. Run: `.\gradlew clean && .\gradlew assembleDebug`
3. Reinstall the app

### "I see 'No team members yet' but I should see myself"
**Cause**: Database not synced or user not added to team
**Solution**: 
1. Check backend API `/users` endpoint
2. Verify your user has a `tenantId`
3. Check console logs for API errors

---

## Permission Matrix

| Action | Admin | Manager | Member |
|--------|-------|---------|--------|
| View team members | ✅ | ✅ | ✅ |
| Invite members | ✅ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ |
| View pending invitations | ✅ | ❌ | ❌ |
| Cancel invitations | ✅ | ❌ | ❌ |

---

## API Endpoints Used

The Settings feature makes these backend API calls:

1. **GET /users** - Fetch all team members in tenant
2. **POST /invitations** - Send invitation email
3. **GET /invitations** - Fetch pending invitations
4. **POST /users/{id}/role** - Change user role
5. **DELETE /users/{id}** - Remove team member
6. **DELETE /invitations/{id}** - Cancel invitation
7. **GET /auth/me** - Get current user details

---

## Color Coding Reference

### Role Badges
- **Admin**: Purple (#a855f7) - Full access
- **Manager**: Blue (#3b82f6) - Manage teams & customers
- **Member**: Gray (#6b7280) - Customer dashboard only

### UI Elements
- **Primary Actions**: Theme primary color
- **Destructive Actions**: Red (#ef4444) - Remove user
- **Warnings**: Orange - Expiration dates
- **Success**: Green - Confirmation messages
- **Error**: Red - Error messages

---

## Screen Navigation Flow

```
Owner Dashboard
    ↓ (Tap + button)
Speed Dial Menu Opens
    ↓ (Tap Settings)
Settings Screen
    ├── Team Tab (Active by default)
    │   ├── Team Members List
    │   │   ├── Member Card
    │   │   │   └── Three-dot menu
    │   │   │       ├── Change Role → Role Dialog
    │   │   │       └── Remove → Confirmation Dialog
    │   │   └── + FAB → Invite Dialog
    │   └── Pending Invitations (Admins only)
    │       └── Invitation Card → Cancel button
    └── Workspace Tab
        └── "Coming Soon" placeholder
```

---

## Next Steps (Future Enhancements)

Planned features for Settings:
- [ ] Workspace name editing
- [ ] Workspace logo upload
- [ ] Billing & subscription management
- [ ] Notification preferences
- [ ] API keys & integrations
- [ ] Audit logs
- [ ] Export data
