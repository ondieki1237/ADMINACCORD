# ACCORD Repository - Visual Overview

## 🎨 System Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCORD ADMIN PANEL                            │
│                  (Next.js 14 + React 18)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  USER INTERFACE (React Components)                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Dashboard │ Visits │ Trails │ Leads │ Machines │ ...  │   │
│  │  Forms │ Lists │ Charts │ Maps │ Dialogs │ Tables       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  STATE MANAGEMENT (React Query)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  useQuery (fetch)      │  useMutation (create/update)   │   │
│  │  Cache Keys            │  Optimistic Updates            │   │
│  │  Auto-refetch          │  Error Handling               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  BUSINESS LOGIC (Services & Utilities)                          │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │   apiService         │  │   authService        │           │
│  │  • 40+ endpoints     │  │  • Login/Register    │           │
│  │  • Token handling    │  │  • Token Storage     │           │
│  │  • Error handling    │  │  • Current User      │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                   │
│  ┌────────────────────────┐  ┌──────────────────────┐          │
│  │   Utilities            │  │   Permissions        │          │
│  │  • PDF Generators (3)  │  │  • Role Checks (7)   │          │
│  │  • Route Snapping      │  │  • Feature Guards    │          │
│  │  • Location Streaming  │  │  • Admin Only        │          │
│  └────────────────────────┘  └──────────────────────┘          │
│                           ↓                                      │
│  HTTP LAYER (fetch + Bearer Token)                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GET /endpoint     POST /endpoint      PUT /endpoint     │   │
│  │  Authorization: Bearer {accessToken}                    │   │
│  │  Content-Type: application/json                         │   │
│  │  On 401: Refresh Token → Retry                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  BACKEND API (Node.js + MongoDB)                                │
│  https://app.codewithseth.co.ke/api                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /auth/*  /dashboard/*  /visits  /trails  /leads        │   │
│  │  /machines  /engineering-services  /follow-ups  /users  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 App Navigation Structure

```
HOME PAGE (app/page.tsx)
│
├─ NOT AUTHENTICATED
│  ├─ LoginForm
│  └─ RegisterForm
│
└─ AUTHENTICATED
   │
   ├─ DESKTOP LAYOUT (hidden on mobile)
   │  ├─ DashboardSidebar (left)
   │  │  ├─ Dashboard → DashboardOverview
   │  │  ├─ Visits → VisitManagement
   │  │  ├─ Trails → TrailManagement
   │  │  ├─ Reports → ReportsManager
   │  │  ├─ Leads → LeadsList
   │  │  ├─ Machines → MachinesList
   │  │  ├─ Sales Heatmap → SalesHeatmap
   │  │  ├─ Performance Analytics → PerformanceAnalytics
   │  │  ├─ Engineer Reports → EngineerReports
   │  │  ├─ Daily Reports → DailyReports
   │  │  ├─ Advanced Analytics → AdvancedAnalytics
   │  │  ├─ User Manager → UserManager
   │  │  ├─ Planners → PlannersManager
   │  │  └─ Profile → UserProfile
   │  │
   │  └─ Main Content Area (dynamic)
   │
   ├─ MOBILE LAYOUT (hidden on desktop)
   │  ├─ MobileNav (bottom)
   │  │  └─ Same menu as sidebar
   │  └─ Main Content Area (full width)
   │
   └─ SWIPE GESTURES
      ├─ Swipe Left → Next page
      └─ Swipe Right → Previous page
```

---

## 🔄 Data Flow Patterns

### Simple Query Flow
```
Component Mounts
    ↓
useQuery hook initialized
    ↓
React Query checks cache
    ├─ HIT → Return cached data (instant)
    └─ MISS → Call queryFn
        ↓
    apiService.getXxx()
        ↓
    fetch to backend with Bearer token
        ↓
    Backend processes request
        ↓
    ├─ 200 OK → Parse JSON
    ├─ 401 Unauthorized → Refresh token → Retry
    └─ Error → Throw error
        ↓
    React Query caches result
        ↓
    Component re-renders with data
```

### Mutation Flow
```
User Submits Form
    ↓
React Hook Form validates
    ├─ Invalid → Show errors
    └─ Valid → Continue
        ↓
    mutation.mutate(data)
        ↓
    apiService.createXxx(data)
        ↓
    POST to backend with data
        ↓
    Backend creates resource
        ↓
    ├─ Success → Return created item
    └─ Error → Return error message
        ↓
    queryClient.invalidateQueries(['key'])
        ↓
    All queries with that key marked stale
        ↓
    Components automatically re-fetch
        ↓
    UI updates with new data
        ↓
    Show success toast & close dialog
```

---

## 📦 Component Organization

```
components/
│
├── ui/ (30+ shadcn components)
│   └── Buttons, Cards, Dialogs, Tables, Forms, etc.
│
├── layout/ (4 files)
│   ├── dashboard-sidebar.tsx → Left navigation
│   ├── mobile-nav.tsx → Bottom navigation
│   ├── theme-provider.tsx → Dark mode
│   └── QueryProvider.tsx → React Query setup
│
├── auth/ (2 files)
│   ├── login-form.tsx
│   └── register-form.tsx
│
├── profile/ (1 file)
│   └── user-profile.tsx
│
├── mobile/ (4 files)
│   ├── pwa-install.tsx
│   ├── offline-indicator.tsx
│   ├── mobile-optimizations.tsx
│   └── touch-gestures.tsx
│
├── dashboard/ (19 files) ⭐ MAIN ADMIN FEATURES
│   ├── dashboard-overview.tsx
│   ├── reports.tsx → Reports management
│   ├── sales-heatmap.tsx → GPS tracking
│   ├── advanced-analytics.tsx
│   ├── performance-analytics.tsx
│   ├── engineer-reports.tsx
│   ├── engineer-finance.tsx
│   ├── daily-reports.tsx
│   ├── leads.tsx
│   ├── machines.tsx
│   ├── machines-map.tsx
│   ├── user-manager.tsx
│   ├── planners.tsx
│   ├── quotations.tsx
│   └── ... more
│
├── visits/ (6 files) ⭐ VISIT MANAGEMENT
│   ├── visit-management.tsx
│   ├── visit-list.tsx
│   ├── visit-detail.tsx
│   ├── create-visit-form.tsx
│   ├── follow-up-manager.tsx
│   ├── follow-up-list.tsx
│   └── create-follow-up-form.tsx
│
└── trails/ (4 files) ⭐ TRAIL TRACKING
    ├── trail-management.tsx
    ├── trail-list.tsx
    ├── trail-detail.tsx
    └── create-trail-form.tsx
```

---

## 🔧 Library Architecture

```
lib/
│
├── ⭐ CORE SERVICES
│   ├── auth.ts
│   │   ├── AuthService class
│   │   ├── Methods: login, register, logout
│   │   ├── Stores: accessToken, refreshToken, currentUser
│   │   └── Used by: Every authenticated request
│   │
│   └── api.ts
│       ├── ApiService class
│       ├── Methods: 40+ endpoints
│       ├── Core: makeRequest() with token + 401 handling
│       └── Used by: All data-fetching components
│
├── ⭐ UTILITIES
│   ├── constants.ts → Static data
│   ├── utils.ts → Tailwind utilities
│   ├── permissions.ts → Role-based access (7 checks)
│   └── locationStream.ts → Real-time location
│
├── ⭐ OPTIMIZATION
│   ├── routeSnapping.ts
│   │   ├── snapTrailToRoads()
│   │   ├── calculateDistance()
│   │   └── formatDistance/Duration()
│   │
│   └── plannerHelpers.ts
│       ├── fetchAdminPlanners()
│       ├── getWeekRange()
│       └── calculateAllowance()
│
├── ⭐ PDF GENERATION (3 generators)
│   ├── reportsPdfGenerator.ts
│   ├── plannerPdfGenerator.ts
│   └── visitsPdfGenerator.ts
│
└── api/
    └── engineeringService.ts → Service wrappers
```

---

## 🌐 API Endpoint Organization

```
https://app.codewithseth.co.ke/api/

/auth/                          # Authentication
├── POST /login                 ← User credentials
├── POST /register              ← New account
├── POST /logout                ← Logout
├── POST /refresh               ← Token refresh
└── GET  /me                    ← Current user

/dashboard/                     # Dashboard data
├── GET  /overview              ← Main stats
├── GET  /recent-activity       ← Recent actions
├── GET  /performance           ← Metrics
└── GET  /heatmap/sales         ← Location data

/trails                         # Trail management
├── GET  /?page=1&limit=20      ← List trails
├── POST /                      ← Create trail
├── PUT  /:id                   ← Update trail
├── DELETE /:id                 ← Delete trail
├── POST /:id/snap-route        ← Road snapping
└── POST /snap-all-routes       ← Batch snap

/visits                         # Visit management
├── GET  /?page=1&limit=20      ← List visits
├── POST /                      ← Create visit
├── PUT  /:id                   ← Update visit
└── DELETE /:id                 ← Delete visit

/follow-ups                     # Follow-up tracking
├── GET  /?filters...           ← List follow-ups
├── POST /                      ← Create follow-up
├── PUT  /:id                   ← Update follow-up
├── DELETE /:id                 ← Delete follow-up
└── GET  /?visitId=xxx          ← By visit

/leads                          # Lead management
├── GET  /?page=1&limit=20      ← List leads
├── PUT  /:id                   ← Update lead
└── DELETE /:id                 ← Delete lead

/admin/leads                    # Admin lead features
├── GET  /?page=1&limit=20      ← Admin list
└── GET  /:id/history           ← Lead history

/machines                       # Machine registry
├── GET  /?page=1&limit=20      ← List machines
├── POST /                      ← Create machine
├── PUT  /:id                   ← Update machine
├── DELETE /:id                 ← Delete machine
└── GET  /:id/services          ← Machine services

/engineering-services          # Engineering services
├── GET  /?page=1&limit=20      ← List services
├── GET  /engineer/:id?...      ← By engineer
├── POST /                      ← Create service
├── PUT  /:id                   ← Update service
└── DELETE /:id                 ← Delete service

/users                          # User management
└── GET  /?filters...           ← List users
```

---

## 🔐 Authentication Flow Diagram

```
[User] 
    ↓ enters email/password
[LoginForm]
    ↓ validates with React Hook Form
[authService.login(email, password)]
    ↓ POST /auth/login
[Backend]
    ↓ validates credentials
[Returns: { data: { user, tokens: { accessToken, refreshToken } } }]
    ↓
[authService.setTokens(accessToken, refreshToken)]
    ├─ this.accessToken = accessToken
    ├─ this.refreshToken = refreshToken
    ├─ localStorage.setItem('accessToken', ...)
    ├─ localStorage.setItem('refreshToken', ...)
    └─ authService.setCurrentUser(user)
        ├─ this.currentUser = user
        ├─ localStorage.setItem('currentUser', JSON.stringify(user))
        └─ Parent component: setIsAuthenticated(true)
            ↓
        [HomePage shows authenticated UI]
            ↓
        [All API calls now include Bearer token]
            ↓
        [USER IS LOGGED IN]

[API Request Flow]
apiService.getVisits()
    ↓
makeRequest('/visits', options)
    ├─ let token = authService.getAccessToken()
    ├─ fetch(url, {
    │   headers: {
    │     Authorization: `Bearer ${token}`
    │   }
    │ })
    └─ If 401: 
        ├─ POST /auth/refresh
        ├─ Get new accessToken
        ├─ authService.setTokens(new token)
        ├─ Retry original request
        └─ Return data or error

[Logout Flow]
[User clicks Logout]
    ↓
[authService.logout()]
    ├─ POST /auth/logout with refreshToken
    ├─ Clear this.accessToken
    ├─ Clear this.refreshToken
    ├─ Clear this.currentUser
    ├─ localStorage.removeItem('accessToken')
    ├─ localStorage.removeItem('refreshToken')
    ├─ localStorage.removeItem('currentUser')
    └─ setIsAuthenticated(false)
        ↓
    [Show LoginForm again]
```

---

## 📊 Data Model Relationships

```
User
├─ id, email, role (admin, manager, sales)
├─ firstName, lastName
└─ region, territory, department

Visit
├─ id, date, startTime, endTime
├─ client (name, type, location)
├─ visitPurpose
├─ contacts[] (name, role)
├─ requestedEquipment[]
└─ LINKED TO: User, FollowUp

FollowUp
├─ id, visitId (FK to Visit)
├─ date, outcome (deal_sealed, in_progress, deal_failed)
├─ contactPerson (name, role, phone)
├─ winningPoint, progressNotes, improvements, failureReasons
└─ LINKED TO: Visit

Trail
├─ id, date, startTime, endTime
├─ path (coordinates[])
├─ stops[]
├─ userId (FK to User)
└─ LINKED TO: User

Report
├─ id, userId (FK to User)
├─ status (pending, approved, rejected)
├─ weekStart, weekEnd
├─ content (metadata, sections[])
├─ adminNotes
└─ LINKED TO: User

Lead
├─ id, name, email, phone
├─ region, status
├─ createdAt, updatedAt
└─ LINKED TO: User (creator)

Machine
├─ id, model, manufacturer, serialNumber
├─ facility (name, location)
├─ status, installedDate, warrantyExpiry
└─ LINKED TO: Facility

EngineeringService
├─ id, date, serviceType
├─ facility (FK to Facility)
├─ engineerInCharge (FK to User/Engineer)
├─ status, scheduledDate
├─ notes, conditionBefore, conditionAfter
└─ LINKED TO: User, Facility, Machine

Planner
├─ id, userId (FK to User)
├─ weekStart, weekEnd
├─ allowance, status
└─ LINKED TO: User
```

---

## 🎯 Feature Matrix

| Feature | Component | Page | API | Status |
|---------|-----------|------|-----|--------|
| Dashboard | dashboard-overview | /dashboard | /dashboard/* | ✅ |
| Visits | visit-management | /dashboard | /visits | ✅ |
| Trails | trail-management | /dashboard | /trails | ✅ |
| Follow-ups | follow-up-manager | /dashboard/follow-ups | /follow-ups | ✅ |
| Reports | reports | /dashboard | /reports + PDF | ✅ |
| Leads | leads | /dashboard/leads | /leads | ✅ |
| Machines | machines | /dashboard/machines | /machines | ✅ |
| Engineering | engineer-reports | /dashboard | /engineering-services | ✅ |
| Finance | engineer-finance | /dashboard | /engineering-services | ✅ |
| Planners | planners | /dashboard/planners | /planners + PDF | ✅ |
| Heatmap | sales-heatmap | /dashboard/sales-heatmap | /dashboard/heatmap | ✅ |
| Analytics | performance-analytics | /dashboard | /analytics | ✅ |
| Users | user-manager | /dashboard/user-manager | /users | ✅ |
| Daily Reports | daily-reports | /dashboard | /reports | ✅ |
| Quotations | quotations | /dashboard | /quotations | ✅ |
| Profile | user-profile | /dashboard | /auth/me | ✅ |

---

## 📈 Statistics at a Glance

```
CODEBASE SIZE
├─ React Components: 60+
├─ Pages: 16
├─ Library Files: 11
├─ UI Components: 30+
├─ Total Lines: 25,000+
└─ Documentation: 50,000+ words

FEATURES
├─ API Endpoints: 40+
├─ Components: 60+
├─ Admin Pages: 16
├─ PDF Generators: 3
├─ Permission Checks: 7
├─ Custom Hooks: 2
└─ Data Models: 8

DEPENDENCIES
├─ Production: 50+
├─ Development: 10+
├─ UI Components: 30+ (shadcn/ui)
├─ Charts: 3 libraries
├─ Maps: 4 libraries
└─ PDF: 2 libraries

DOCUMENTATION
├─ Overview: 3 files
├─ Features: 20+ files
├─ Backend: 3 files
├─ Technical: 8 files
├─ Total Files: 55+
└─ Total Words: 106,000+
```

---

## ✨ Technology Stack

```
FRONTEND
├─ Framework: Next.js 14
├─ Language: TypeScript 5
├─ UI Library: React 18
├─ Styling: Tailwind CSS 4
├─ Components: shadcn/ui (30+ components)
├─ State: TanStack React Query 5
├─ Forms: React Hook Form 7
├─ Animations: Framer Motion 12
├─ Icons: Lucide React
└─ Theme: next-themes

DATA & VISUALIZATION
├─ Charts: Chart.js, Recharts
├─ Maps: Leaflet.js, React-Leaflet
├─ Heatmap: leaflet.heat
├─ PDF: jsPDF, jsPDF-AutoTable
├─ Routing: @turf/simplify
└─ Analytics: Python backend

UTILITIES
├─ Date: date-fns 4
├─ Validation: Zod 3
├─ HTTP: axios 1 (fetch used)
├─ Icons: lucide-react
└─ CSS Merge: tailwind-merge, clsx

MOBILE
├─ PWA: Web components
├─ Native: Capacitor
├─ Offline: Service Workers
└─ Install: manifest.json

MONITORING
├─ Analytics: @vercel/analytics
└─ DevTools: React Query DevTools

BUILD TOOLS
├─ Bundler: Webpack (Next.js)
├─ CSS: PostCSS 8, Autoprefixer
├─ Type Check: TypeScript 5
└─ Linting: ESLint
```

---

## 🚀 Deployment Architecture

```
DEVELOPMENT
├─ npm run dev
├─ Runs on localhost:3000
├─ Hot reload enabled
└─ Full debugging

PRODUCTION BUILD
├─ npm run build
├─ Creates .next/ optimized output
├─ npm run start
├─ Runs on port :3000 (configurable)
└─ Minified & optimized

MOBILE DEPLOYMENT
├─ npm run build (web assets)
├─ npx cap sync (sync to mobile)
├─ Android: npx cap open android → Android Studio
├─ iOS: npx cap open ios → Xcode
├─ Generate APK/AAB or IPA
└─ Deploy to app stores

DEPLOYMENT TARGETS
├─ Web: Any Node.js hosting (Vercel, AWS, Heroku)
├─ Mobile: Google Play Store, Apple App Store
├─ PWA: Direct web install
└─ Desktop: Electron wrapper (optional)
```

---

## 💡 Key Design Patterns Used

```
PATTERN 1: Service Pattern
├─ authService (singleton)
├─ apiService (singleton)
└─ Used by components via import

PATTERN 2: Custom Hooks
├─ useQuery (TanStack Query)
├─ useMutation (TanStack Query)
├─ useForm (React Hook Form)
└─ useState, useEffect (React)

PATTERN 3: Higher-Order Components
├─ QueryProvider (wraps whole app)
├─ ThemeProvider (dark/light mode)
└─ Dynamic imports (code splitting)

PATTERN 4: Composition
├─ Small, reusable components
├─ Nested component hierarchy
├─ Props for customization
└─ Render props pattern

PATTERN 5: Context & Providers
├─ QueryClient context
├─ Theme context
├─ Built-in providers
└─ Custom providers
```

---

## 📚 Quick Reference Links

**Starting Points:**
- Quick Start: QUICK_REFERENCE.md
- Architecture: REPOSITORY_STUDY_GUIDE.md
- Visual: ARCHITECTURE_VISUAL_GUIDE.md
- Navigation: COMPLETE_INDEX.md

**Feature Documentation:**
- Visits: VISITS_DATA_EXTRACTION.md
- Reports: REPORTS_PDF_GENERATION.md
- Heatmap: HEATMAP_CHANGES_SUMMARY.md
- Planners: PLANNERS_FEATURE.md
- Leads: LEADS_HISTORY_API_INTEGRATION.md

**Backend:**
- Database: BACKEND_IMPLEMENTATION_GUIDE.md
- API: BACKEND_REQUIREMENTS.md
- Checklist: BACKEND_CHECKLIST.md

---

**Last Updated**: December 9, 2025  
**Documentation Status**: Complete ✅  
**Ready for**: Development, Production, Onboarding
