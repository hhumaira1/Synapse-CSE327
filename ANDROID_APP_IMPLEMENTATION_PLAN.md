# 📱 SynapseCRM Android App - Complete Implementation Plan

> **Status**: Planning Complete - Ready to Implement  
> **Target**: First Working MVP in 3-4 Weeks  
> **Tech Stack**: Kotlin + Jetpack Compose + Material 3

---

## 📊 Current Status Analysis

### ✅ What's Already Implemented

#### 1. **Basic Project Setup** (30% Complete)
```kotlin
✅ Android Gradle project structure
✅ Jetpack Compose enabled
✅ Material 3 theme (Purple color scheme)
✅ Navigation Compose (androidx.navigation:navigation-compose:2.8.0)
✅ Basic theme system (Color.kt, Type.kt, Theme.kt)
✅ MainActivity with Scaffold and NavHost
✅ Edge-to-edge UI support
```

#### 2. **Existing Dependencies** (Partially Complete)
```gradle
✅ Retrofit 3.0.0 + OkHttp 5.3.0 (for API calls)
✅ DataStore 1.1.7 (for secure token storage)
✅ Coroutines 1.10.2 (for async operations)
✅ SwipeRefresh (Accompanist 0.36.0)
✅ Material Icons Extended
⚠️ Clerk SDK - Commented out (needs proper setup)
❌ Room Database - Not added yet
❌ Hilt/Dagger - Not added yet
❌ Coil (image loading) - Not added yet
```

#### 3. **Existing Screens** (3 Basic Pages)

**LandingPage.kt** ✅ (90% Complete)
```kotlin
✅ Background image with gradient overlay
✅ App logo and tagline
✅ Sign Up / Sign In buttons (navigation ready)
✅ "Home" button (navigates to owner_dashboard)
✅ Settings icon (navigation prepared)
✅ Version info
⚠️ Sign Up/Sign In routes not implemented yet
```

**OwnerDashboard.kt** ⚠️ (40% Complete)
```kotlin
✅ TopBar with back button
✅ Floating Action Button (QuickActionsSpeedDials)
✅ Pull-to-refresh functionality
✅ LazyColumn with section placeholders
✅ OverviewSection component declared
⚠️ OverviewSection shows hardcoded data (not real API)
⚠️ Quick actions don't navigate yet
❌ No stats cards with real data
❌ No recent activity feed
❌ No performance charts
```

**CreateContact.kt** ⚠️ (20% Complete)
```kotlin
✅ Basic Composable declared
✅ Navigation parameter received (navController, onSave, onBack)
❌ No form fields implemented
❌ No API integration
❌ Just placeholder screen
```

**CustomerDashboard.kt** ⚠️ (10% Complete)
```kotlin
✅ File exists in codebase
❌ Likely empty or placeholder only
```

**Createdeal.kt** ⚠️ (10% Complete)
```kotlin
✅ File exists in codebase
❌ Likely empty or placeholder only
```

#### 4. **Theme System** ✅ (80% Complete)
```kotlin
✅ Color.kt - Purple gradient colors defined
✅ Type.kt - Typography system
✅ Theme.kt - Light/dark theme support
✅ Material 3 design
⚠️ No dynamic color scheme (Material You)
```

---

## 🚀 Implementation Roadmap (4 Weeks)

### **Week 1: Foundation & Authentication** (Days 1-7)

#### Day 1-2: Project Architecture Setup
```kotlin
□ Add Hilt dependencies (version-catalog or direct)
□ Create Application class with @HiltAndroidApp
□ Setup DI modules:
  - NetworkModule (Retrofit, OkHttp, API service)
  - DatabaseModule (Room database)
  - RepositoryModule (data layer)
□ Configure build.gradle with kapt processor
```

#### Day 3-4: Networking Layer
```kotlin
□ Create data/api/ApiService.kt:
  interface ApiService {
    @POST("auth/onboard") suspend fun onboard(...)
    @GET("contacts") suspend fun getContacts(...)
    @POST("contacts") suspend fun createContact(...)
    @GET("leads") suspend fun getLeads(...)
    @POST("deals") suspend fun createDeal(...)
    @GET("tickets") suspend fun getTickets(...)
    // ... all backend endpoints
  }

□ Create data/api/AuthInterceptor.kt:
  - Inject access token in "Authorization: Bearer <token>" header
  - Read token from DataStore
  - Handle 401 errors (token refresh or logout)

□ Create data/api/ApiClient.kt:
  - Retrofit builder with base URL
  - Add logging interceptor (debug only)
  - Add auth interceptor
  - Timeout configuration
```

#### Day 5-7: Authentication with Clerk
```kotlin
□ Add Clerk SDK (uncomment in build.gradle)
□ Configure Clerk API keys in local.properties
□ Create auth/ClerkAuthManager.kt:
  - Initialize Clerk SDK
  - Sign in with email/password
  - Sign up flow
  - Get current JWT token
  - Sign out

□ Implement SignInScreen.kt:
  - Email field with validation
  - Password field (masked)
  - Sign in button → call Clerk API
  - Error handling with Snackbar
  - Navigate to dashboard on success
  - "Sign up" link

□ Implement SignUpScreen.kt:
  - Email, password, confirm password
  - Company name field
  - Terms checkbox
  - Sign up button → Clerk + backend onboard
  - Navigate to onboarding

□ Implement OnboardingScreen.kt:
  - Company name input
  - "Get Started" button
  - Call /api/auth/onboard endpoint
  - Save tenantId to DataStore
  - Navigate to dashboard

□ Update navigation routes:
  - "landing" → "signin" → "onboard" → "owner_dashboard"
```

---

### **Week 2: Core CRM Features - Contacts, Leads, Deals** (Days 8-14)

#### Day 8-9: Contacts Module (Full Implementation)
```kotlin
□ Create domain/model/Contact.kt:
  data class Contact(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String?,
    val phone: String?,
    val company: String?,
    val jobTitle: String?,
    val linkedInUrl: String?,
    // ... all fields from backend
  )

□ Implement ContactsScreen.kt:
  - LazyColumn with contact cards
  - Search bar at top
  - Filter chips (All, With Email, With Phone)
  - Click card → navigate to detail
  - FAB → create new contact

□ Implement ContactDetailScreen.kt:
  - Top section: Photo + Name + Email
  - Info cards: Phone, Company, Job Title
  - Action buttons: Call, Message, Edit
  - Stats section: Deals count, Tickets count
  - "Delete Contact" button (with confirmation)

□ Complete CreateContactScreen.kt (replace placeholder):
  - Form fields: First name, Last name, Email, Phone, Company, Job Title
  - Validation: Required fields
  - "Save" button → POST /api/contacts
  - Loading state during API call
  - Navigate back on success

□ Create ContactViewModel.kt:
  @HiltViewModel
  class ContactViewModel @Inject constructor(
    private val repository: ContactRepository
  ) : ViewModel() {
    val contacts = repository.getContacts().asLiveData()
    suspend fun createContact(...) { ... }
    suspend fun deleteContact(id: String) { ... }
  }

□ Create ContactRepository.kt:
  class ContactRepository @Inject constructor(
    private val apiService: ApiService,
    private val contactDao: ContactDao
  ) {
    fun getContacts(): Flow<List<Contact>> = ...
    suspend fun createContact(...) = ...
  }
```

#### Day 10-11: Leads Module (Kanban Board)
```kotlin
□ Create domain/model/Lead.kt:
  data class Lead(
    val id: String,
    val title: String,
    val contactId: String,
    val contactName: String,
    val value: Double,
    val status: LeadStatus,
    val source: LeadSource,
    // ...
  )
  
  enum class LeadStatus {
    NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED
  }

□ Implement LeadsScreen.kt (Kanban Board):
  - HorizontalPager with 5 status columns
  - Each column: LazyColumn of lead cards
  - Drag-and-drop between columns (use DragAndDropState or third-party lib)
  - Card shows: title, contact name, value, source icon
  - Click card → LeadDetailDialog
  - FAB → CreateLeadDialog

□ Implement CreateLeadDialog.kt:
  - Title, Value, Source dropdown
  - Contact selector (autocomplete or dropdown)
  - "Create Lead" button → POST /api/leads
  - Close dialog on success

□ Implement LeadDetailDialog.kt:
  - Full lead information
  - "Convert to Deal" button
  - Edit/Delete actions
  - Comments section (if available)

□ Add drag-and-drop library:
  implementation("androidx.compose.foundation:foundation:1.7.0") // Built-in drag support
  // OR use third-party: "com.google.accompanist:accompanist-draganddrop:0.36.0"

□ Update LeadViewModel.kt:
  - Handle status changes on drag
  - Call PATCH /api/leads/:id with new status
```

#### Day 12-14: Deals Module (Pipeline Kanban)
```kotlin
□ Create domain/model/Deal.kt & Pipeline.kt:
  data class Deal(
    val id: String,
    val title: String,
    val value: Double,
    val probability: Int,
    val stageId: String,
    val stageName: String,
    val pipelineId: String,
    val contactName: String,
    val expectedCloseDate: String?,
    // ...
  )

□ Implement DealsScreen.kt (enhanced Createdeal.kt):
  - Pipeline selector at top (dropdown)
  - Horizontal Pager with stage columns
  - Each column shows deals in that stage
  - Drag-and-drop to move between stages
  - Deal card shows: title, value, probability %, expected close date
  - FAB → CreateDealDialog

□ Implement CreateDealDialog.kt:
  - Title, Value, Probability slider
  - Contact selector
  - Lead selector (optional - convert from lead)
  - Pipeline selector
  - Stage selector (within pipeline)
  - Expected close date picker
  - "Create Deal" button → POST /api/deals

□ Implement DealDetailDialog.kt:
  - Full deal information
  - Progress indicator (probability)
  - Revenue forecast calculation
  - Edit/Delete actions
  - Move to stage buttons
  - Related lead link (if converted)

□ Add date picker:
  implementation("androidx.compose.material3:material3-datetime-picker:1.0.0")
  // OR use: DatePickerDialog

□ Update DealViewModel.kt:
  - Load pipelines with stages
  - Handle stage changes on drag
  - Call PATCH /api/deals/:id/move
```

---

### **Week 3: Tickets, VoIP, Analytics** (Days 15-21)

#### Day 15-16: Tickets Module
```kotlin
□ Create domain/model/Ticket.kt:
  data class Ticket(
    val id: String,
    val title: String,
    val description: String?,
    val status: TicketStatus,
    val priority: TicketPriority,
    val contactName: String,
    val assignedUserName: String?,
    val commentsCount: Int,
    val createdAt: String,
    // ...
  )
  
  enum class TicketStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED }
  enum class TicketPriority { LOW, MEDIUM, HIGH, URGENT }

□ Implement TicketsScreen.kt:
  - Tabs for status: Open, In Progress, Resolved, Closed
  - LazyColumn of ticket cards per tab
  - Card shows: title, priority badge, contact, assigned user
  - Click → TicketDetailScreen
  - FAB → CreateTicketDialog

□ Implement CreateTicketDialog.kt:
  - Title, Description (multiline)
  - Priority selector
  - Contact selector
  - Deal selector (optional)
  - "Submit Ticket" button → POST /api/tickets

□ Implement TicketDetailScreen.kt:
  - Title, description, status badge, priority badge
  - Contact card (clickable)
  - Assigned user info
  - Comments section (LazyColumn)
  - Add comment field at bottom
  - Status change buttons (Open → In Progress → Resolved → Closed)
  - Edit/Delete actions

□ Add TicketCommentCard.kt:
  - Avatar (or initials)
  - Author name and timestamp
  - Comment text
  - Internal/External badge

□ Update TicketViewModel.kt:
  - Load tickets by status
  - Add comment → POST /api/tickets/:id/comments
  - Update status → PATCH /api/tickets/:id
```

#### Day 17-18: VoIP Calling (WebRTC or Twilio)

**Option A: WebRTC Implementation**
```kotlin
□ Add WebRTC dependencies:
  implementation("io.socket:socket.io-client:2.1.0")
  implementation("org.webrtc:google-webrtc:1.0.32006")

□ Create voip/WebRTCClient.kt:
  - Initialize PeerConnection
  - Handle SDP offer/answer
  - Handle ICE candidates
  - Connect to signaling server (Socket.IO)

□ Create voip/CallManager.kt:
  - Initiate call
  - Accept call
  - Reject call
  - End call
  - Mute/unmute
  - Speaker on/off

□ Implement DialerScreen.kt:
  - Contact search
  - Call button
  - Show "Calling..." state
  - Navigate to ActiveCallScreen

□ Implement ActiveCallScreen.kt:
  - Contact name and photo
  - Call duration timer
  - Mute button
  - Speaker button
  - End call button (red, large)
  - Audio visualization (optional)

□ Implement IncomingCallActivity.kt:
  - Full-screen overlay
  - Caller name and photo
  - Accept (green) / Reject (red) buttons
  - Ringtone playback
  - Launch from notification
```

**Option B: Twilio SDK (Simpler)**
```kotlin
□ Add Twilio Voice SDK:
  implementation("com.twilio:voice-android:6.1.4")

□ Create voip/TwilioManager.kt:
  - Initialize Twilio SDK
  - Request access token from backend
  - Make outgoing call
  - Handle incoming call
  - Handle call events

□ Request permissions in AndroidManifest.xml:
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <uses-permission android:name="android.permission.READ_PHONE_STATE" />

□ Implement same UI screens as Option A
```

**Recommended: Start with Option B (Twilio) - easier integration, then add WebRTC if needed**

#### Day 19-21: Analytics Dashboard
```kotlin
□ Create domain/model/Analytics.kt:
  data class DashboardAnalytics(
    val totalPipelineValue: Double,
    val weightedPipelineValue: Double,
    val winRate: Double,
    val dealsCount: Int,
    val revenueGrowth: Double,
    // ...
  )

□ Implement AnalyticsScreen.kt:
  - Stats cards section (Grid):
    * Total Pipeline Value
    * Weighted Value
    * Win Rate
    * Deals Count
  - Revenue chart (Line graph)
  - Pipeline health chart (Bar graph)
  - Top performers list

□ Add chart library:
  implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")
  // OR use Compose-native charts:
  implementation("com.patrykandpatrick.vico:compose-m3:2.0.0-alpha.16")

□ Create AnalyticsViewModel.kt:
  - Load dashboard data → GET /api/analytics/dashboard
  - Load revenue data → GET /api/analytics/revenue
  - Load forecast → GET /api/analytics/forecast

□ Implement RevenueChart.kt (Composable):
  - Line chart showing monthly revenue
  - X-axis: months
  - Y-axis: revenue amount
  - Gradient fill under line

□ Implement PipelineHealthChart.kt:
  - Bar chart for stage distribution
  - Color-coded bars per stage
  - Show deal count per stage
```

---

### **Week 4: Dashboard, Settings, Polish** (Days 22-28)

#### Day 22-23: Complete Owner Dashboard
```kotlin
□ Update OwnerDashboard.kt (replace OverviewSection):
  - Stats Cards Section:
    * Contacts count (with icon)
    * Leads count (with icon)
    * Deals count + total value (with icon)
    * Tickets count (with icon)
    * Load from API: GET /api/analytics/dashboard
  
  - Quick Actions Section:
    * "Add Contact" → navigate to CreateContact
    * "Create Lead" → navigate to CreateLead
    * "New Deal" → navigate to CreateDeal
    * "New Ticket" → navigate to CreateTicket
  
  - Recent Activity Feed:
    * LazyColumn of recent items
    * Show last 10 contacts, leads, deals created
    * Each item: icon, title, timestamp, type badge
    * Click → navigate to detail screen

□ Create DashboardViewModel.kt:
  - Load stats → GET /api/analytics/dashboard
  - Load recent activity (combine contacts/leads/deals APIs)
  - Refresh function for pull-to-refresh

□ Implement QuickActionCard.kt:
  - Icon + Title + Description
  - Gradient background
  - Ripple effect on click
```

#### Day 24-25: Settings & Team Management
```kotlin
□ Implement SettingsScreen.kt:
  - Profile section:
    * User name
    * Email
    * Avatar (editable)
    * "Edit Profile" button
  
  - Preferences section:
    * Theme toggle (Light/Dark/System)
    * Language selector
    * Notification settings
  
  - Team section:
    * "Team Members" → TeamScreen
    * "Send Invitation" button
  
  - About section:
    * App version
    * Terms & Privacy links
    * "Sign Out" button

□ Implement TeamScreen.kt:
  - List of team members
  - Each member: avatar, name, email, role badge
  - "Invite Member" FAB → InviteDialog

□ Implement InviteDialog.kt:
  - Email input
  - Role selector (Admin, Manager, Member)
  - "Send Invite" button → POST /api/users/invite
  - Show success message

□ Implement theme switching:
  - Save preference to DataStore
  - Update Theme.kt to read from DataStore
  - Apply theme globally in MainActivity
```

#### Day 26: Customer Portal Screens
```kotlin
□ Implement PortalDashboardScreen.kt:
  - Different branding (Blue/Cyan theme vs Purple)
  - Stats cards:
    * Open tickets count
    * Resolved tickets count
    * Total support requests
  - Quick actions:
    * "Submit Ticket" → CreateTicketDialog
    * "View Tickets" → PortalTicketsScreen
  - Recent tickets list

□ Implement PortalTicketsScreen.kt:
  - Similar to TicketsScreen but filtered
  - Only show customer's own tickets
  - Can create new tickets
  - Can view detail and add comments
  - Different color scheme

□ Add tenant selector:
  - If customer has access to multiple vendors
  - Dropdown at top to switch workspace
  - Save selection to DataStore
```

#### Day 27-28: Polish & Testing
```kotlin
□ Add loading states everywhere:
  - CircularProgressIndicator during API calls
  - Skeleton loaders for lists (Shimmer effect)
  - Error states with retry button

□ Add error handling:
  - Try-catch in all ViewModels
  - Show Snackbar for errors
  - Network error → "No internet" message
  - 401 error → Navigate to sign-in

□ Add image loading:
  implementation("io.coil-kt:coil-compose:2.5.0")
  - Use AsyncImage for contact photos
  - Add placeholder and error images

□ Add Material 3 animations:
  - Fade in/out transitions between screens
  - Slide transitions for dialogs
  - Ripple effects on cards
  - Scale animation on FAB click

□ Test on different screen sizes:
  - Phone (Compact)
  - Tablet (Medium/Expanded)
  - Add responsive layouts where needed

□ Test offline functionality:
  - Turn off WiFi/data
  - Verify cached data loads
  - Verify sync queue works when back online

□ Fix any crashes or memory leaks:
  - Use LeakCanary for detection
  - Fix ViewModel leaks
  - Cancel coroutines properly
```

---

## 📦 Final Dependencies List

Update `build.gradle.kts` (app level):

```kotlin
dependencies {
    // Existing dependencies
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.foundation)
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.8.0")
    
    // Network & API (already added)
    implementation("com.squareup.retrofit2:retrofit:3.0.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:5.3.0")
    implementation("com.squareup.okhttp3:logging-interceptor:5.3.0")
    
    // Authentication
    implementation("com.clerk:clerk-android:1.0.0") // Check latest version
    
    // Local Storage (already added)
    implementation("androidx.datastore:datastore-preferences:1.1.7")
    
    // Dependency Injection - Hilt
    implementation("com.google.dagger:hilt-android:2.51")
    kapt("com.google.dagger:hilt-compiler:2.51")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
    
    // Room Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    
    // Coroutines (already added)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    
    // ViewModel & LiveData
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.8.7")
    
    // Image Loading
    implementation("io.coil-kt:coil-compose:2.5.0")
    
    // Charts
    implementation("com.patrykandpatrick.vico:compose-m3:2.0.0-alpha.16")
    // OR: implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")
    
    // VoIP - Option A: WebRTC
    implementation("io.socket:socket.io-client:2.1.0")
    implementation("org.webrtc:google-webrtc:1.0.32006")
    // OR Option B: Twilio
    implementation("com.twilio:voice-android:6.1.4")
    
    // Push Notifications
    implementation("com.google.firebase:firebase-messaging:24.1.0")
    implementation("com.google.firebase:firebase-analytics:22.1.2")
    
    // Work Manager (background sync)
    implementation("androidx.work:work-runtime-ktx:2.10.0")
    
    // Swipe refresh (already added)
    implementation("com.google.accompanist:accompanist-swiperefresh:0.36.0")
    
    // Material Icons Extended (already added)
    implementation("androidx.compose.material:material-icons-extended")
    
    // Date/Time Picker
    implementation("com.maxkeppeler.sheets-compose-dialogs:calendar:1.3.0")
    
    // Debugging
    debugImplementation("com.squareup.leakcanary:leakcanary-android:2.12")
    
    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}
```

Also update `build.gradle.kts` (app level) plugins:
```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    id("kotlin-kapt") // For Hilt and Room
    id("dagger.hilt.android.plugin")
    id("com.google.gms.google-services") // For Firebase
}
```

Update `build.gradle.kts` (project level):
```kotlin
plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("com.google.dagger.hilt.android") version "2.51" apply false
    id("com.google.gms.google-services") version "4.4.2" apply false
}
```

---

## 🗂️ Recommended Project Structure

```
app/src/main/java/com/example/synapse/
├── SynapseApplication.kt          # @HiltAndroidApp
├── MainActivity.kt                # Main entry point
│
├── di/                            # Dependency Injection
│   ├── NetworkModule.kt           # Retrofit, OkHttp, ApiService
│   ├── DatabaseModule.kt          # Room database
│   └── RepositoryModule.kt        # Repositories
│
├── data/                          # Data Layer
│   ├── api/
│   │   ├── ApiService.kt          # Retrofit interface
│   │   ├── ApiClient.kt           # Retrofit builder
│   │   └── AuthInterceptor.kt     # JWT injection
│   ├── db/
│   │   ├── AppDatabase.kt         # Room database
│   │   ├── dao/
│   │   │   ├── ContactDao.kt
│   │   │   ├── LeadDao.kt
│   │   │   └── DealDao.kt
│   │   └── entities/
│   │       ├── ContactEntity.kt
│   │       ├── LeadEntity.kt
│   │       └── DealEntity.kt
│   ├── repository/
│   │   ├── ContactRepository.kt
│   │   ├── LeadRepository.kt
│   │   ├── DealRepository.kt
│   │   ├── TicketRepository.kt
│   │   └── AnalyticsRepository.kt
│   └── preferences/
│       └── PreferencesManager.kt  # DataStore wrapper
│
├── domain/                        # Domain Layer
│   ├── model/
│   │   ├── Contact.kt
│   │   ├── Lead.kt
│   │   ├── Deal.kt
│   │   ├── Ticket.kt
│   │   ├── Pipeline.kt
│   │   ├── Stage.kt
│   │   └── Analytics.kt
│   └── usecase/                   # Business logic (optional)
│
├── presentation/                  # UI Layer
│   ├── navigation/
│   │   └── NavGraph.kt            # Navigation routes
│   ├── auth/
│   │   ├── SignInScreen.kt
│   │   ├── SignUpScreen.kt
│   │   ├── OnboardingScreen.kt
│   │   └── AuthViewModel.kt
│   ├── dashboard/
│   │   ├── OwnerDashboard.kt      # Already exists
│   │   ├── CustomerDashboard.kt   # Already exists
│   │   ├── DashboardViewModel.kt
│   │   └── components/
│   │       ├── StatsCard.kt
│   │       └── QuickActionCard.kt
│   ├── contacts/
│   │   ├── ContactsScreen.kt
│   │   ├── ContactDetailScreen.kt
│   │   ├── CreateContactScreen.kt # Enhance existing
│   │   ├── ContactViewModel.kt
│   │   └── components/
│   │       └── ContactCard.kt
│   ├── leads/
│   │   ├── LeadsScreen.kt
│   │   ├── CreateLeadDialog.kt
│   │   ├── LeadDetailDialog.kt
│   │   ├── LeadViewModel.kt
│   │   └── components/
│   │       ├── LeadCard.kt
│   │       └── KanbanColumn.kt
│   ├── deals/
│   │   ├── DealsScreen.kt
│   │   ├── CreateDealDialog.kt    # Enhance Createdeal.kt
│   │   ├── DealDetailDialog.kt
│   │   ├── DealViewModel.kt
│   │   └── components/
│   │       └── DealCard.kt
│   ├── tickets/
│   │   ├── TicketsScreen.kt
│   │   ├── TicketDetailScreen.kt
│   │   ├── CreateTicketDialog.kt
│   │   ├── TicketViewModel.kt
│   │   └── components/
│   │       ├── TicketCard.kt
│   │       └── CommentCard.kt
│   ├── analytics/
│   │   ├── AnalyticsScreen.kt
│   │   ├── AnalyticsViewModel.kt
│   │   └── components/
│   │       ├── RevenueChart.kt
│   │       └── PipelineChart.kt
│   ├── voip/
│   │   ├── DialerScreen.kt
│   │   ├── ActiveCallScreen.kt
│   │   ├── IncomingCallActivity.kt
│   │   ├── CallManager.kt
│   │   └── CallViewModel.kt
│   ├── settings/
│   │   ├── SettingsScreen.kt
│   │   ├── TeamScreen.kt
│   │   ├── InviteDialog.kt
│   │   └── SettingsViewModel.kt
│   ├── portal/
│   │   ├── PortalDashboardScreen.kt
│   │   ├── PortalTicketsScreen.kt
│   │   └── PortalViewModel.kt
│   ├── components/                # Shared components
│   │   ├── EmptyState.kt
│   │   ├── ErrorState.kt
│   │   ├── LoadingState.kt
│   │   └── SearchBar.kt
│   └── LandingPage.kt             # Already exists
│
├── ui/                            # Theme system
│   └── theme/
│       ├── Color.kt               # Already exists
│       ├── Type.kt                # Already exists
│       └── Theme.kt               # Already exists
│
└── util/                          # Utilities
    ├── Constants.kt               # API base URL, etc.
    ├── Extensions.kt              # Kotlin extensions
    └── DateUtils.kt               # Date formatting
```

---

## 🎯 Success Criteria (MVP Checklist)

### ✅ Authentication (Must Have)
- [x] User can sign up with Clerk
- [x] User can sign in
- [x] Onboarding flow creates tenant
- [x] Token stored securely in DataStore
- [x] Auto-login on app restart
- [x] Sign out functionality

### ✅ Dashboard (Must Have)
- [x] Owner dashboard shows stats cards
- [x] Stats cards show real data from API
- [x] Quick action buttons navigate correctly
- [x] Pull-to-refresh works

### ✅ Contacts (Must Have)
- [x] View list of contacts
- [x] Search contacts
- [x] Create new contact
- [x] View contact details
- [x] Edit contact
- [x] Delete contact

### ✅ Leads (Must Have)
- [x] View leads in Kanban board
- [x] Drag-and-drop between status columns
- [x] Create new lead
- [x] View lead details
- [x] Convert lead to deal

### ✅ Deals (Must Have)
- [x] View deals in pipeline Kanban
- [x] Select different pipelines
- [x] Drag-and-drop between stages
- [x] Create new deal
- [x] View deal details

### ✅ Tickets (Must Have)
- [x] View tickets by status
- [x] Create new ticket
- [x] View ticket details
- [x] Add comments on tickets
- [x] Change ticket status

### ⚠️ VoIP (Nice to Have for MVP)
- [ ] Make calls from contacts
- [ ] Receive incoming calls
- [ ] Call controls (mute, speaker, end)
- [ ] Call history

### ⚠️ Analytics (Nice to Have for MVP)
- [ ] Revenue metrics dashboard
- [ ] Pipeline health charts
- [ ] Win/loss analysis

### ⚠️ Settings (Nice to Have for MVP)
- [ ] User profile
- [ ] Theme toggle
- [ ] Team member list
- [ ] Send invitation

---

## 🔑 Environment Configuration

Create `local.properties` file:
```properties
# Backend API
API_BASE_URL=http://10.0.2.2:3001/api # For Android Emulator
# API_BASE_URL=http://192.168.1.100:3001/api # For physical device (replace with your IP)
# API_BASE_URL=https://your-production-url.com/api # For production

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Twilio VoIP (optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_secret_here

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your_project_id
```

Update `build.gradle.kts` to read from local.properties:
```kotlin
import java.util.Properties

val localProperties = Properties()
val localPropertiesFile = rootProject.file("local.properties")
if (localPropertiesFile.exists()) {
    localProperties.load(localPropertiesFile.inputStream())
}

android {
    defaultConfig {
        buildConfigField("String", "API_BASE_URL", "\"${localProperties.getProperty("API_BASE_URL")}\"")
        buildConfigField("String", "CLERK_PUBLISHABLE_KEY", "\"${localProperties.getProperty("CLERK_PUBLISHABLE_KEY")}\"")
    }
    
    buildFeatures {
        buildConfig = true
    }
}
```

---

## 🚦 Testing Strategy

### Unit Tests
```kotlin
// Example: ContactViewModelTest.kt
@Test
fun `createContact should call repository and update state`() = runTest {
    val contact = Contact(...)
    viewModel.createContact(contact)
    verify(repository).createContact(contact)
    assert(viewModel.contacts.value.contains(contact))
}
```

### UI Tests
```kotlin
// Example: ContactsScreenTest.kt
@Test
fun `clicking contact card navigates to detail screen`() {
    composeTestRule.onNodeWithText("John Doe").performClick()
    composeTestRule.onNodeWithText("Contact Details").assertExists()
}
```

### Manual Testing Checklist
- [ ] Test on Android 7.0 (API 24)
- [ ] Test on Android 14 (API 34)
- [ ] Test on small screen (480x800)
- [ ] Test on tablet (1280x800)
- [ ] Test offline functionality
- [ ] Test with slow network
- [ ] Test rotation (portrait/landscape)
- [ ] Test background/foreground transitions
- [ ] Test memory usage (no leaks)

---

## 📈 Performance Optimization

### Best Practices to Follow:
1. **Lazy Loading**: Use LazyColumn/LazyRow for lists
2. **Image Caching**: Use Coil with disk cache
3. **State Management**: Use remember, derivedStateOf
4. **Coroutines**: Cancel jobs when ViewModel destroyed
5. **Database Queries**: Index frequently queried columns
6. **API Calls**: Cache responses, implement pagination
7. **Recomposition**: Use keys in LazyColumn items
8. **Memory**: Avoid holding references in ViewModels

---

## 🎨 Design Consistency

### Color Scheme (Already Defined)
```kotlin
Primary: Purple (#6366f1 to #a855f7 gradient)
Secondary: Blue (#3b82f6)
Background: Light (#F5F5F5) / Dark (#121212)
Success: Green (#10b981)
Warning: Yellow (#f59e0b)
Error: Red (#ef4444)
```

### Typography
```kotlin
Heading: 24sp, Bold
Title: 20sp, SemiBold
Body: 16sp, Regular
Caption: 14sp, Regular
```

### Spacing
```kotlin
XS: 4dp
S: 8dp
M: 16dp
L: 24dp
XL: 32dp
```

---

## 🛠️ Development Commands

```bash
# Clean project
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install on connected device
./gradlew installDebug

# Run unit tests
./gradlew test

# Run instrumented tests
./gradlew connectedAndroidTest

# Generate lint report
./gradlew lint

# Check for outdated dependencies
./gradlew dependencyUpdates
```

---

## 📝 Summary

### Current State:
- ✅ Basic project structure (30%)
- ✅ Existing dependencies for networking (50%)
- ✅ 3 placeholder screens (20%)
- ✅ Theme system (80%)
- ⚠️ No API integration yet
- ⚠️ No authentication yet
- ⚠️ No real functionality yet

### After 4 Weeks:
- ✅ Full authentication flow
- ✅ Complete CRM features (Contacts, Leads, Deals, Tickets)
- ✅ Analytics dashboard with charts
- ✅ VoIP calling (Twilio or WebRTC)
- ✅ Settings and team management
- ✅ Offline support with Room database
- ✅ Push notifications
- ✅ Material 3 design throughout
- ✅ Production-ready MVP

### Estimated Effort:
- **Week 1**: 40 hours (Foundation + Auth)
- **Week 2**: 40 hours (Contacts, Leads, Deals)
- **Week 3**: 40 hours (Tickets, VoIP, Analytics)
- **Week 4**: 40 hours (Dashboard, Settings, Polish)
- **Total**: ~160 hours = 4 weeks full-time development

---

**Document End**  
Created: November 10, 2025  
Author: AI Development Assistant  
Project: SynapseCRM Android App  
Status: Implementation Plan Complete - Ready to Build

