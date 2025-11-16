# 📋 Android App Implementation Checklist

> **Quick reference for implementing SynapseCRM Android app with Supabase Auth**

---

## ✅ Pre-Implementation Setup

### 1. Supabase Configuration
- [ ] Get Supabase URL from dashboard (Settings → API)
- [ ] Get Supabase Anon Key from dashboard
- [ ] Enable Email authentication in Supabase (Authentication → Providers)
- [ ] Enable Google OAuth in Supabase (Authentication → Providers → Google)
- [ ] Add authorized redirect URLs for Android

### 2. Google Cloud Console Setup
- [ ] Create new project in Google Cloud Console
- [ ] Enable Google Sign-In API
- [ ] Create OAuth 2.0 credentials (Web client)
- [ ] Create OAuth 2.0 credentials (Android client)
- [ ] Get Web Client ID (for Supabase)
- [ ] Add SHA-1 fingerprint for Android app
- [ ] Download `google-services.json`

### 3. Android Project Configuration
- [ ] Create `local.properties` file with all credentials
- [ ] Add `google-services.json` to `app/` directory
- [ ] Update `build.gradle.kts` dependencies
- [ ] Add Hilt plugin to project-level gradle
- [ ] Sync Gradle files

### 4. Backend Verification
- [ ] Verify backend is running (http://localhost:3001)
- [ ] Test `/api/auth/me` endpoint with Postman
- [ ] Confirm Supabase Auth Guard is working
- [ ] Get sample JWT token from Supabase

---

## 📝 Implementation Phases

### PHASE 1: Authentication (Week 1)

#### Day 1-2: Dependencies & Configuration
- [ ] Add Supabase Kotlin SDK dependencies
- [ ] Add Google Sign-In dependencies
- [ ] Add Hilt dependency injection
- [ ] Add Room database dependencies
- [ ] Configure BuildConfig with API keys
- [ ] Create `local.properties` with credentials

#### Day 3-4: Auth Infrastructure
- [ ] Create `SupabaseManager.kt`
- [ ] Create `AuthRepository.kt`
- [ ] Create `GoogleSignInManager.kt`
- [ ] Create `PreferencesManager.kt`
- [ ] Create `AuthInterceptor.kt` for API calls
- [ ] Setup Hilt modules

#### Day 5-7: Auth UI
- [ ] Create `AuthViewModel.kt`
- [ ] Create `SignInScreen.kt`
- [ ] Create `SignUpScreen.kt`
- [ ] Create `OnboardingScreen.kt` (call backend onboard API)
- [ ] Update navigation graph
- [ ] Test email sign up/sign in
- [ ] Test Google Sign-In
- [ ] Test navigation flow

---

### PHASE 2: API Integration (Week 2)

#### Day 8-9: API Setup
- [ ] Create API models (User, Contact, Lead, Deal, Ticket)
- [ ] Create `ApiService.kt` interface
- [ ] Create `AuthInterceptor.kt` with token refresh
- [ ] Setup Retrofit with Hilt
- [ ] Create `SynapseApplication.kt` with `@HiltAndroidApp`
- [ ] Update `AndroidManifest.xml`

#### Day 10-11: Repositories
- [ ] Create `ContactRepository.kt`
- [ ] Create `LeadRepository.kt`
- [ ] Create `DealRepository.kt`
- [ ] Create `TicketRepository.kt`
- [ ] Create `UserRepository.kt`
- [ ] Test API calls with authenticated requests

#### Day 12-14: Room Database (Offline Support)
- [ ] Create Room entities
- [ ] Create DAOs
- [ ] Create `AppDatabase.kt`
- [ ] Update repositories to use Room
- [ ] Implement sync logic
- [ ] Test offline functionality

---

### PHASE 3: Contacts Module (Week 3)

#### Day 15-16: Contacts List
- [ ] Create `ContactViewModel.kt`
- [ ] Create `ContactsScreen.kt` with LazyColumn
- [ ] Add search functionality
- [ ] Add filter chips
- [ ] Add pull-to-refresh
- [ ] Create `ContactCard.kt` composable
- [ ] Test loading states

#### Day 17: Contact Details & Forms
- [ ] Create `ContactDetailScreen.kt`
- [ ] Create `CreateContactScreen.kt` (enhance existing)
- [ ] Create `EditContactScreen.kt`
- [ ] Add delete confirmation dialog
- [ ] Test create/edit/delete operations
- [ ] Handle error states

---

### PHASE 4: Leads Module (Week 4)

#### Day 18-19: Leads Kanban Board
- [ ] Create `LeadViewModel.kt`
- [ ] Create `LeadsScreen.kt` with HorizontalPager
- [ ] Create `LeadCard.kt` composable
- [ ] Create `KanbanColumn.kt` composable
- [ ] Implement drag-and-drop (or swipe to move)
- [ ] Test status updates

#### Day 20: Lead Forms
- [ ] Create `CreateLeadDialog.kt`
- [ ] Create `LeadDetailDialog.kt`
- [ ] Add contact selector
- [ ] Add convert-to-deal button
- [ ] Test lead creation and conversion

---

### PHASE 5: Deals Module (Week 4-5)

#### Day 21-22: Deals Pipeline
- [ ] Create `DealViewModel.kt`
- [ ] Create `DealsScreen.kt` with pipeline stages
- [ ] Create `DealCard.kt` composable
- [ ] Add pipeline selector dropdown
- [ ] Implement stage-based Kanban
- [ ] Test drag-and-drop between stages

#### Day 23: Deal Forms
- [ ] Create `CreateDealDialog.kt` (enhance Createdeal.kt)
- [ ] Create `DealDetailDialog.kt`
- [ ] Add date picker for expected close date
- [ ] Add probability slider
- [ ] Test deal creation and updates

---

### PHASE 6: Tickets Module (Week 5)

#### Day 24-25: Tickets List & Detail
- [ ] Create `TicketViewModel.kt`
- [ ] Create `TicketsScreen.kt` with status tabs
- [ ] Create `TicketCard.kt` composable
- [ ] Create `TicketDetailScreen.kt`
- [ ] Add priority badges
- [ ] Add status change buttons

#### Day 26: Ticket Forms & Comments
- [ ] Create `CreateTicketDialog.kt`
- [ ] Create `CommentCard.kt` composable
- [ ] Add comment input field
- [ ] Implement add comment functionality
- [ ] Test ticket creation and commenting

---

### PHASE 7: Dashboard & Analytics (Week 6)

#### Day 27-28: Dashboard Stats
- [ ] Create `DashboardViewModel.kt`
- [ ] Enhance `OwnerDashboard.kt`
- [ ] Create `StatsCard.kt` composable
- [ ] Create `QuickActionCard.kt` composable
- [ ] Add recent activity feed
- [ ] Load real data from API
- [ ] Test pull-to-refresh

#### Day 29: Analytics Screens
- [ ] Create `AnalyticsViewModel.kt`
- [ ] Create `AnalyticsScreen.kt`
- [ ] Add chart library (Vico or MPAndroidChart)
- [ ] Create `RevenueChart.kt`
- [ ] Create `PipelineChart.kt`
- [ ] Test data visualization

---

### PHASE 8: Settings & Polish (Week 6-7)

#### Day 30-31: Settings
- [ ] Create `SettingsViewModel.kt`
- [ ] Create `SettingsScreen.kt`
- [ ] Add profile section
- [ ] Add theme toggle (light/dark)
- [ ] Add notification settings
- [ ] Implement sign out

#### Day 32: Team Management
- [ ] Create `TeamViewModel.kt`
- [ ] Create `TeamScreen.kt`
- [ ] Create `InviteDialog.kt`
- [ ] Test team invitation flow
- [ ] Add role-based UI restrictions

#### Day 33-35: Testing & Polish
- [ ] Add loading states everywhere
- [ ] Add error handling with Snackbars
- [ ] Add skeleton loaders
- [ ] Implement image loading with Coil
- [ ] Add animations and transitions
- [ ] Test on different screen sizes
- [ ] Test offline functionality
- [ ] Fix any crashes or bugs
- [ ] Optimize performance

---

## 🔍 Testing Checklist

### Authentication Testing
- [ ] Sign up with email creates account
- [ ] Sign in with email works
- [ ] Google Sign-In works
- [ ] Token is saved to DataStore
- [ ] Token is added to API requests
- [ ] Auto-login on app restart works
- [ ] Sign out clears token
- [ ] 401 errors trigger token refresh

### CRM Features Testing
- [ ] Can view list of contacts/leads/deals/tickets
- [ ] Can search and filter items
- [ ] Can create new items
- [ ] Can edit existing items
- [ ] Can delete items (with confirmation)
- [ ] Pull-to-refresh updates data
- [ ] Offline mode shows cached data
- [ ] Changes sync when back online

### UI/UX Testing
- [ ] All screens follow Material 3 design
- [ ] Dark mode works correctly
- [ ] Navigation works smoothly
- [ ] Forms validate input
- [ ] Error messages are clear
- [ ] Loading states show progress
- [ ] Animations are smooth
- [ ] No crashes or ANRs

### Performance Testing
- [ ] Lists scroll smoothly
- [ ] Images load without lag
- [ ] API calls don't block UI
- [ ] Memory usage is reasonable
- [ ] Battery usage is acceptable
- [ ] App size is under 50MB

---

## 🚀 Deployment Checklist

### Before Play Store Release
- [ ] Update version code and name
- [ ] Generate signed APK/Bundle
- [ ] Test on multiple devices
- [ ] Test on different Android versions (API 24-34)
- [ ] Create app icon and screenshots
- [ ] Write Play Store description
- [ ] Create privacy policy
- [ ] Setup Firebase Analytics
- [ ] Setup Crashlytics
- [ ] Enable ProGuard/R8
- [ ] Test release build thoroughly

### Play Store Listing
- [ ] Upload APK/Bundle
- [ ] Add app title and description
- [ ] Add screenshots (phone and tablet)
- [ ] Add app icon
- [ ] Set content rating
- [ ] Set target audience
- [ ] Add privacy policy URL
- [ ] Submit for review

---

## 📚 Key Files Reference

### Configuration Files
```
Synapse/
├── local.properties                  # API keys and credentials
├── app/
│   ├── google-services.json          # Google Sign-In config
│   └── build.gradle.kts              # Dependencies and BuildConfig
```

### Core Architecture
```
app/src/main/java/com/example/synapse/
├── SynapseApplication.kt             # Hilt Application class
├── di/
│   ├── NetworkModule.kt              # Retrofit, OkHttp, ApiService
│   └── DatabaseModule.kt             # Room database
├── data/
│   ├── auth/
│   │   ├── SupabaseManager.kt        # Supabase client
│   │   ├── AuthRepository.kt         # Auth operations
│   │   └── GoogleSignInManager.kt    # Google Sign-In
│   ├── api/
│   │   ├── ApiService.kt             # Retrofit interface
│   │   └── AuthInterceptor.kt        # Add JWT to requests
│   ├── db/
│   │   └── AppDatabase.kt            # Room database
│   └── preferences/
│       └── PreferencesManager.kt     # DataStore wrapper
└── presentation/
    ├── auth/
    │   ├── SignInScreen.kt
    │   ├── SignUpScreen.kt
    │   └── AuthViewModel.kt
    ├── contacts/
    ├── leads/
    ├── deals/
    └── tickets/
```

---

## 🔗 Important Links

- **Supabase Dashboard**: https://app.supabase.com
- **Google Cloud Console**: https://console.cloud.google.com
- **Backend API**: http://localhost:3001/api
- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Google Sign-In Guide**: https://developers.google.com/identity/sign-in/android

---

**Track your progress and check off items as you complete them!** 🎯
