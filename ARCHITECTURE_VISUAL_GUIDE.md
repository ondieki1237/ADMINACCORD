# ACCORD Repository - Visual Architecture & File Relationships

## 🏗️ High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ACCORD Admin Panel                                 │
│                         (Next.js 14 + React 18)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐         ┌──────────────────┐      ┌───────────────┐  │
│  │   app/page.tsx   │         │   app/layout.tsx │      │   globals.css │  │
│  │                  │         │                  │      │               │  │
│  │ Main Router &    │────┬────│ Root Layout      │      │  Global       │  │
│  │ Auth Check       │    │    │ QueryProvider    │      │  Styles       │  │
│  │                  │    │    │ Analytics        │      │               │  │
│  └──────────────────┘    │    └──────────────────┘      └───────────────┘  │
│                          │                                                    │
│                          ├─→ isAuthenticated?                               │
│                          │   ├─ YES: Render Dashboard                       │
│                          │   └─ NO: Show Auth Forms                         │
│                          │                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              AUTHENTICATION LAYER (lib/auth.ts)                      │   │
│  │                                                                       │   │
│  │  authService.login/register → localStorage → JWT tokens            │   │
│  │  authService.getAccessToken() → Used by apiService                 │   │
│  │  authService.logout() → Clear tokens & redirect                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │             DESKTOP & MOBILE LAYOUT (components/layout/)             │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────┐      ┌──────────────────────────┐    │   │
│  │  │  DashboardSidebar        │      │   MobileNav              │    │   │
│  │  │  (Left nav - Desktop)    │      │   (Bottom nav - Mobile)  │    │   │
│  │  │                          │      │                          │    │   │
│  │  │ • Dashboard              │      │ • Dashboard              │    │   │
│  │  │ • Visits                 │      │ • Visits                 │    │   │
│  │  │ • Trails                 │      │ • Trails                 │    │   │
│  │  │ • Leads                  │      │ • Follow-ups             │    │   │
│  │  │ • Machines               │      │ • Reports                │    │   │
│  │  │ • Reports                │      │ • Profile                │    │   │
│  │  │ • And 10+ more...        │      │                          │    │   │
│  │  └──────────────────────────┘      └──────────────────────────┘    │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │         Main Content Area (dynamic based on page)            │   │   │
│  │  │                                                              │   │   │
│  │  │  currentPage state router:                                  │   │   │
│  │  │  "dashboard" → DashboardOverview                            │   │   │
│  │  │  "visits" → VisitManagement                                 │   │   │
│  │  │  "trails" → TrailManagement                                 │   │   │
│  │  │  "leads" → LeadsList                                        │   │   │
│  │  │  "machines" → MachinesList                                  │   │   │
│  │  │  "reports" → ReportsManager                                 │   │   │
│  │  │  "sales-heatmap" → SalesHeatmap                             │   │   │
│  │  │  ... and 9+ more pages                                      │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │           API SERVICE LAYER (lib/api.ts)                            │   │
│  │                                                                       │   │
│  │  apiService.makeRequest(endpoint, options)                          │   │
│  │  ├─ Attaches Bearer token from authService                          │   │
│  │  ├─ Handles 401 → Token refresh → Retry                            │   │
│  │  ├─ Parses JSON response                                            │   │
│  │  └─ Throws on error                                                 │   │
│  │                                                                       │   │
│  │  Methods:                                                             │   │
│  │  • getDashboardOverview()        • getVisits()                       │   │
│  │  • getPerformanceMetrics()       • createVisit()                     │   │
│  │  • getTrails()                   • getFollowUps()                    │   │
│  │  • getLeads()                    • createFollowUp()                  │   │
│  │  • getMachines()                 • getEngineeringServices()          │   │
│  │  • getSalesHeatmap()             ... and 20+ more                    │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓
                    BACKEND API ENDPOINT
                https://app.codewithseth.co.ke/api
                              │
         ┌────────────────────┼────────────────────┐
         ↓                    ↓                    ↓
    /auth/*            /dashboard/*          /visits, /trails,
   /auth/login        /overview              /leads, /machines,
   /auth/register     /performance           /engineering-services,
   /auth/logout       /heatmap/sales         /follow-ups, etc.
   /auth/refresh      /recent-activity
   /auth/me
```

---

## 🔄 Component Interconnection Map

### Visit → Follow-up → Report Flow

```
┌─────────────────────┐
│   Visit Created     │
│   (Sales Rep)       │
└──────────┬──────────┘
           │ apiService.createVisit()
           ↓
┌─────────────────────────────────────────┐
│  /components/visits/                    │
│  ├─ visit-management.tsx                │
│  ├─ visit-list.tsx                      │
│  ├─ visit-detail.tsx                    │
│  ├─ create-visit-form.tsx               │
│  └─ UI: date, client, contacts, purpose │
└──────────┬──────────────────────────────┘
           │ visit stored with visitId
           ↓
┌─────────────────────────────────────────┐
│  /components/visits/follow-up-*         │
│  ├─ follow-up-manager.tsx               │
│  ├─ follow-up-list.tsx                  │
│  ├─ create-follow-up-form.tsx           │
│  │   └─ Links to specific visitId       │
│  └─ UI: outcome, notes, contact person  │
└──────────┬──────────────────────────────┘
           │ apiService.createFollowUp()
           ↓
┌─────────────────────────────────────────┐
│  /components/dashboard/                 │
│  ├─ reports.tsx                         │
│  │   └─ Aggregates visits + follow-ups  │
│  └─ Displays: status, admin notes       │
└──────────┬──────────────────────────────┘
           │ Admin approves/rejects
           ↓
┌─────────────────────────────────────────┐
│  /lib/reportsPdfGenerator.ts            │
│  ├─ generateReportsSummaryPDF()         │
│  ├─ generateIndividualReportPDF()       │
│  ├─ generateDetailedReportPDF()         │
│  └─ Output: PDF blob for download       │
└─────────────────────────────────────────┘
```

---

## 📊 Data Query Flow

```
Component mounts
    ↓
useQuery hook called
    ↓
React Query checks cache
    ↓
    ├─ Cache HIT → Return cached data (instant)
    │
    └─ Cache MISS → Fetch new data
        ↓
    apiService.method()
        ↓
    apiService.makeRequest(endpoint, options)
        ↓
    [Get token from authService]
        ↓
    fetch(url, {headers: {Authorization: "Bearer token"}})
        ↓
    Backend processes request
        ↓
    Response returned
        ↓
    ├─ Status 200-299 (OK)
    │   ├─ Parse JSON
    │   └─ Return data
    │
    └─ Status 401 (Unauthorized)
        ├─ POST /auth/refresh with refreshToken
        ├─ Get new accessToken
        ├─ Update authService & localStorage
        └─ Retry original request
            └─ Return data or error
        
    (On error at any point)
        └─ Throw error
            ↓
    Component receives error in query state
        └─ Render error UI / retry button
```

---

## 🔐 Authentication Token Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│              TOKEN LIFECYCLE                                 │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  INITIAL LOGIN:                                              │
│  User fills credentials → LoginForm                          │
│         ↓                                                     │
│  authService.login(email, password)                          │
│         ↓                                                     │
│  POST /auth/login                                            │
│         ↓                                                     │
│  Backend returns:                                            │
│  {                                                           │
│    data: {                                                   │
│      user: { id, email, role, firstName, lastName },        │
│      tokens: { accessToken, refreshToken }                  │
│    }                                                         │
│  }                                                           │
│         ↓                                                     │
│  authService.setTokens(accessToken, refreshToken)           │
│  authService.setCurrentUser(user)                           │
│         ↓                                                     │
│  Store in 3 places:                                          │
│  ├─ memory: this.accessToken, this.refreshToken             │
│  ├─ memory: this.currentUser                                │
│  └─ localStorage: accessToken, refreshToken, currentUser    │
│         ↓                                                     │
│  App shows authenticated UI                                  │
│                                                                │
│  ─────────────────────────────────────────────────────────── │
│                                                                │
│  USING TOKEN IN REQUESTS:                                    │
│  Component calls apiService.getVisits()                      │
│         ↓                                                     │
│  apiService.makeRequest('/visits', {...})                   │
│         ↓                                                     │
│  let token = authService.getAccessToken()                   │
│         ↓                                                     │
│  fetch(url, {                                                │
│    headers: { Authorization: `Bearer ${token}` }            │
│  })                                                          │
│         ↓                                                     │
│  Backend validates token                                     │
│         ↓                                                     │
│  ├─ Valid → Return data (200)                                │
│  └─ Invalid → Return error (401)                             │
│                                                                │
│  ─────────────────────────────────────────────────────────── │
│                                                                │
│  TOKEN REFRESH (on 401):                                     │
│  makeRequest receives 401                                    │
│         ↓                                                     │
│  let refreshToken = authService.getRefreshToken()           │
│         ↓                                                     │
│  POST /auth/refresh                                          │
│  Body: { refreshToken }                                      │
│         ↓                                                     │
│  Backend validates refresh token                             │
│         ↓                                                     │
│  ├─ Valid → Return new accessToken & refreshToken (200)     │
│  │        ↓                                                   │
│  │   authService.setTokens(newAccess, newRefresh)           │
│  │        ↓                                                   │
│  │   Retry original request with new token                  │
│  │        ↓                                                   │
│  │   Return data                                             │
│  │                                                            │
│  └─ Invalid → Return error (401)                             │
│             ↓                                                 │
│          authService.logout()                                │
│             ↓                                                 │
│          Clear tokens from memory & localStorage             │
│             ↓                                                 │
│          Redirect to login                                   │
│                                                                │
│  ─────────────────────────────────────────────────────────── │
│                                                                │
│  LOGOUT:                                                     │
│  User clicks logout                                          │
│         ↓                                                     │
│  authService.logout()                                        │
│         ↓                                                     │
│  POST /auth/logout with refreshToken                        │
│         ↓                                                     │
│  Clear tokens from memory & localStorage                     │
│         ↓                                                     │
│  window.location.reload() or redirect to login               │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Hierarchy Tree

```
HomePage (app/page.tsx)
├── Desktop Layout (hidden on mobile)
│   ├── DashboardSidebar
│   │   └── Menu Items (onClick: setCurrentPage)
│   │       ├── Dashboard → DashboardOverview
│   │       ├── Visits → VisitManagement
│   │       ├── Trails → TrailManagement
│   │       ├── Leads → LeadsList
│   │       ├── Machines → MachinesList
│   │       ├── Reports → ReportsManager
│   │       ├── Sales Heatmap → SalesHeatmap
│   │       ├── Performance Analytics → PerformanceAnalytics
│   │       └── ... and 8+ more
│   └── Main Content
│       └── Dynamic content based on currentPage
│
├── Mobile Layout (hidden on desktop)
│   ├── MobileNav
│   │   └── Tab Items (bottom navigation)
│   └── Main Content
│       └── Dynamic content based on currentPage
│
├── VisitManagement (when currentPage='visits')
│   ├── VisitList
│   │   ├── Visit Cards (map visits array)
│   │   │   └── onClick: setCurrentPage + show detail
│   │   ├── Filters
│   │   │   ├── DateRange
│   │   │   └── Search
│   │   └── Pagination
│   ├── CreateVisitForm (in Dialog)
│   │   ├── Input: date, client, contacts
│   │   ├── onSubmit: apiService.createVisit()
│   │   └── onSuccess: invalidateQueries(['visits'])
│   └── VisitDetail (selected visit)
│       ├── Visit Information
│       ├── FollowUpList
│       │   ├── FollowUp Cards
│       │   └── CreateFollowUpForm (in Dialog)
│       │       ├── Input: date, outcome, notes
│       │       ├── onSubmit: apiService.createFollowUp()
│       │       └── onSuccess: invalidateQueries(['followUps'])
│       └── Actions: Edit, Delete, Print
│
├── DashboardOverview (when currentPage='dashboard')
│   ├── Stats Cards
│   │   ├── Total Visits
│   │   ├── Total Trails
│   │   ├── Total Reports
│   │   └── Total Orders
│   ├── Performance Charts
│   │   ├── Line Chart (trends)
│   │   ├── Bar Chart (comparisons)
│   │   └── Pie Chart (breakdown)
│   ├── RecentActivity Section
│   ├── Quick Actions
│   │   ├── View Reports
│   │   ├── View Analytics
│   │   └── Manage Users
│   ├── Export Options
│   │   ├── Export as CSV
│   │   ├── Export as JSON
│   │   └── Export as Excel
│   └── Navigation Buttons
│       └── onClick: onPageChange()
│
├── SalesHeatmap (when currentPage='sales-heatmap')
│   ├── Map Container
│   │   ├── TileLayer (OpenStreetMap)
│   │   ├── UserTrails (polylines)
│   │   │   ├── Colored by user
│   │   │   └─ Snapped to roads (OSRM)
│   │   ├── Markers (start/end points)
│   │   ├── HeatmapLayer (intensity)
│   │   └── HospitalLayer (GeoJSON)
│   └── Controls
│       ├── Time Range Selector (24h, 7d, 30d)
│       ├── User Filter
│       └── Legend
│
├── LeadsList (when currentPage='leads')
│   ├── LeadCards
│   │   ├── Basic Info
│   │   ├── Status Badge
│   │   ├── View History Button
│   │   │   └─ ViewHistoryDialog
│   │   │       └─ fetch /admin/leads/:id/history
│   │   └── Actions: Edit, Delete
│   ├── Filters
│   │   ├── By Status
│   │   ├── By Region
│   │   └─ Search
│   └── Pagination
│
├── ReportsManager (when currentPage='reports')
│   ├── ReportsList
│   │   ├── ReportCards
│   │   │   ├── User Info
│   │   │   ├── Status Badge
│   │   │   ├─ View Details
│   │   │   └─ Actions: Approve, Reject
│   │   ├── Filters by Status
│   │   └── Pagination
│   ├── ReportDetail (selected report)
│   │   ├── Content Display
│   │   ├── Sections
│   │   ├─ Admin Notes
│   │   ├─ Metadata (author, date)
│   │   └─ Actions: Approve, Reject, Download PDF
│   │       └─ generateIndividualReportPDF()
│   └── Batch Actions
│       ├─ Export as PDF
│       └─ Export as Excel
│
├── TouchGestures (wrapper)
│   ├─ onSwipeLeft: nextPage
│   └─ onSwipeRight: prevPage
│
└── Modals & Dialogs (for forms)
    ├── LoginForm (when not authenticated)
    ├── RegisterForm (when not authenticated)
    ├── CreateVisitForm
    ├── CreateFollowUpForm
    ├── CreateReportForm
    ├── EditLeadForm
    └── DeleteConfirmDialog
```

---

## 📦 Library/Service Dependencies

```
┌────────────────────────────────────────────────────────────┐
│                  EXTERNAL DEPENDENCIES                      │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  React Ecosystem                                            │
│  ├─ react 18                                                │
│  ├─ react-dom 18                                            │
│  ├─ @tanstack/react-query 5                                │
│  │   └─ Used by: All data-fetching components              │
│  ├─ react-hook-form 7                                       │
│  │   └─ Used by: All form components                       │
│  └─ framer-motion 12                                        │
│      └─ Used by: Animations & transitions                  │
│                                                              │
│  Next.js Specific                                           │
│  ├─ next 14                                                 │
│  ├─ next-themes                                             │
│  │   └─ Used by: Dark/light mode                           │
│  └─ @vercel/analytics                                       │
│      └─ Used by: app/layout.tsx                            │
│                                                              │
│  UI & Styling                                              │
│  ├─ tailwindcss 4                                           │
│  ├─ shadcn/ui (components from radix-ui)                   │
│  │   ├─ @radix-ui/react-dialog                             │
│  │   ├─ @radix-ui/react-select                             │
│  │   ├─ @radix-ui/react-tabs                               │
│  │   ├─ @radix-ui/react-toast                              │
│  │   └─ ... 30+ more radix components                      │
│  ├─ lucide-react                                            │
│  │   └─ Used by: All icon usage throughout app             │
│  ├─ cmdk 1                                                  │
│  │   └─ Used by: Command palette (if implemented)          │
│  └─ embla-carousel-react 8                                  │
│      └─ Used by: Carousel components (if any)              │
│                                                              │
│  Maps & Geolocation                                        │
│  ├─ leaflet 1.9                                             │
│  ├─ react-leaflet 4                                         │
│  ├─ leaflet.heat 0.2                                        │
│  ├─ react-leaflet-heatmap-layer-v3 3                        │
│  └─ @turf/simplify 7                                        │
│      └─ Used by: Trail simplification (routeSnapping)      │
│                                                              │
│  PDF Generation                                            │
│  ├─ jspdf 3                                                 │
│  └─ jspdf-autotable 5                                       │
│      └─ Used by: All PDF generation (reports, planners)    │
│                                                              │
│  Charts & Visualization                                    │
│  ├─ chart.js 4                                              │
│  ├─ react-chartjs-2 5                                       │
│  ├─ recharts 2                                              │
│  └─ react-resizable-panels 2                                │
│      └─ Used by: Resizable layout sections                 │
│                                                              │
│  Data & Validation                                         │
│  ├─ zod 3                                                   │
│  │   └─ Used by: Input validation (if implemented)         │
│  ├─ date-fns 4                                              │
│  │   └─ Used by: Date formatting throughout                │
│  ├─ axios 1                                                 │
│  │   └─ Imported but apiService uses fetch instead         │
│  └─ clsx 2 + tailwind-merge 2                               │
│      └─ Used by: cn() utility function                     │
│                                                              │
│  Notifications                                             │
│  ├─ sonner 1                                                │
│  ├─ react-hot-toast 2                                       │
│  └─ react-toastify 11                                       │
│      └─ Used by: Toast notifications (multiple libs!)      │
│                                                              │
│  Mobile & PWA                                              │
│  ├─ @capacitor/cli (for mobile deployment)                 │
│  └─ Used by: Native app deployment                         │
│                                                              │
│  Development                                               │
│  ├─ typescript 5                                            │
│  ├─ @types/node 22                                          │
│  ├─ @types/react 18                                         │
│  ├─ @types/leaflet 1.9                                      │
│  └─ postcss 8 + autoprefixer 10                             │
│      └─ Used by: CSS processing                            │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

---

## 🔗 Internal Library Architecture

```
/lib
├── auth.ts
│   └── Exports: authService (singleton)
│       ├── Methods: login, register, logout, getCurrentUser
│       ├── Stores: accessToken, refreshToken, currentUser
│       └── Used by: All components, apiService for token refresh
│
├── api.ts
│   └── Exports: apiService (singleton)
│       ├── Core: makeRequest(endpoint, options)
│       │   ├─ Calls authService.getAccessToken()
│       │   ├─ Handles 401 refresh flow
│       │   └─ Returns parsed JSON or throws
│       ├── Dashboard: getDashboardOverview(), getPerformanceMetrics()
│       ├── Trails: getTrails(), createTrail(), snapTrailToRoads()
│       ├── Visits: getVisits(), createVisit(), updateVisit()
│       ├── Follow-ups: getFollowUps(), createFollowUp(), getFollowUpsByVisit()
│       ├── Leads: getLeads(), getLeadById(), updateLead()
│       ├── Machines: getMachines(), createMachine(), updateMachine()
│       └── Engineering: getEngineeringServices(), createEngineeringService()
│       └── Used by: All data-fetching components
│
├── permissions.ts
│   └── Role-based access control
│       ├── hasAdminAccess(user)
│       ├── hasManagerAccess(user)
│       ├── canViewHeatmap(user)
│       ├── canDeleteRecords(user)
│       ├── canEditRecords(user)
│       ├── canViewAllRecords(user)
│       └── canAccessSuperUserFeatures(user)
│       └── Used by: Dashboard components to show/hide UI
│
├── constants.ts
│   └── Static data
│       ├── kenyanCounties: string[]
│       ├── userRoles: { ADMIN, MANAGER, SALES }
│       └── departments: string[]
│
├── utils.ts
│   └── Utility functions
│       └── cn(...inputs): Tailwind class merging
│           └── Used by: All components for className merging
│
├── locationStream.ts
│   └── Real-time location utilities
│       ├── fetchAdminTracks()
│       ├── flattenAndSortPoints()
│       ├── toLatLng()
│       ├── startPollingTracks()
│       └── connectLocationSocket()
│       └── Used by: SalesHeatmap component
│
├── routeSnapping.ts
│   └── Trail optimization & distance calculations
│       ├── snapTrailToRoads()
│       ├── batchSnapTrails()
│       ├── simplifyTrailCoordinates()
│       ├── calculateDistance()
│       ├── calculateTrailDistance()
│       ├── formatDistance()
│       ├── formatDuration()
│       └── Used by: Trail management & heatmap
│
├── plannerHelpers.ts
│   └── Planner-specific utilities
│       ├── fetchAdminPlanners()
│       ├── getWeekRange()
│       ├── getPreviousWeekRange()
│       ├── calculateWeeklyAllowance()
│       ├── groupPlannersByUser()
│       └── Used by: PlannersManager component
│
├── reportsPdfGenerator.ts
│   └── Report PDF generation
│       ├── generateReportsSummaryPDF()
│       ├── generateIndividualReportPDF()
│       ├── generateDetailedReportPDF()
│       └── Used by: ReportsManager component
│
├── plannerPdfGenerator.ts
│   └── Planner PDF generation
│       ├── generatePlannersSummaryPDF()
│       ├── generateIndividualPlannerPDF()
│       └── Used by: PlannersManager component
│
├── visitsPdfGenerator.ts
│   └── Visit data extraction
│       ├── generateVisitsExtractionPDF()
│       ├── generateContactsExtractionPDF()
│       ├── generateFacilitiesExtractionPDF()
│       └── Used by: VisitManager component
│
└── api/
    └── engineeringService.ts (wrapper functions)
        ├── listServices()
        ├── listServicesByEngineer()
        ├── createService()
        └── Used by: Engineering components
```

---

## 🎯 Data Flow Patterns

### Pattern 1: Simple Query with useQuery

```typescript
// In component
const { data: visits, isLoading, error } = useQuery({
  queryKey: ['visits', page, limit],
  queryFn: () => apiService.getVisits(page, limit)
})

// Flow
Component mounts
  → useQuery hook created
  → React Query checks cache for ['visits', page, limit]
  → Cache miss → Call queryFn
  → apiService.getVisits(page, limit)
  → apiService.makeRequest('/visits?page=1&limit=20')
  → fetch with Bearer token
  → Parse response
  → Update cache
  → Component re-renders with data
  → User sees visit list
```

### Pattern 2: Mutation with Optimistic Update

```typescript
// In component
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: (visitData) => apiService.createVisit(visitData),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['visits'] })
  }
})

// Flow
User submits form
  → Validation passes
  → mutation.mutate(visitData)
  → apiService.createVisit(visitData)
  → apiService.makeRequest('/visits', { method: 'POST', body })
  → fetch with Bearer token
  → Backend creates visit
  → Response returns
  → invalidateQueries(['visits'])
  → All queries with key ['visits'] marked stale
  → Components re-fetch latest data
  → Component shows success toast
  → Dialog closes
```

### Pattern 3: Dependent Queries

```typescript
// In VisitDetail component
const { data: visit } = useQuery({
  queryKey: ['visit', visitId],
  queryFn: () => apiService.getVisitById(visitId),
  enabled: !!visitId // Don't fetch if no visitId
})

const { data: followUps } = useQuery({
  queryKey: ['followUpsByVisit', visitId],
  queryFn: () => apiService.getFollowUpsByVisit(visitId),
  enabled: !!visitId && !!visit // Wait for visit first
})

// Flow
visitId changes
  → First query enables
  → Fetch visit data
  → Visit data loaded
  → Second query enables (enabled changed from false to true)
  → Fetch follow-ups for that visit
  → Both display in component
```

---

## 🚀 Deployment Architecture

```
Development
    ↓
git push to main
    ↓
Build: npm run build
    ↓
Output: .next/ (optimized production build)
    ↓
Start: npm run start
    ↓
Server listens on :3000 (or configured port)
    ↓
PWA Deployment (via Capacitor)
    ↓
├─ Android
│   └─ npx cap add android
│   └─ npx cap open android (Android Studio)
│   └─ Build APK/AAB
│
└─ iOS
    └─ npx cap add ios
    └─ npx cap open ios (Xcode)
    └─ Build IPA
    └─ Upload to App Store
```

---

## 📊 File Statistics

```
Total Files: ~150+
Total Lines of Code: ~25,000+

Breakdown:
├─ Components: ~60 files (~12,000 LOC)
│   ├─ Dashboard: 19 files (~6,000 LOC)
│   ├─ Visits: 6 files (~2,000 LOC)
│   ├─ Trails: 4 files (~1,500 LOC)
│   ├─ Layout: 4 files (~1,200 LOC)
│   ├─ Auth: 2 files (~400 LOC)
│   ├─ Mobile: 4 files (~800 LOC)
│   ├─ Profile: 1 file (~300 LOC)
│   └─ UI: 20+ files (shadcn/ui)
│
├─ Libraries: 11 files (~3,500 LOC)
│   ├─ api.ts: 534 lines
│   ├─ auth.ts: 180 lines
│   ├─ reportsPdfGenerator.ts: 1200+ lines
│   ├─ routeSnapping.ts: 300+ lines
│   └─ Others
│
├─ Documentation: 25+ files (~5,000 LOC)
│   └─ Comprehensive guides & specs
│
├─ Configuration: 7 files (~300 LOC)
│   └─ next.config, tsconfig, tailwind, etc.
│
└─ Public Assets: 50+ files
    └─ Images, manifests, icons
```

---

## 🔍 Quick Navigation Guide

### To Find Feature Implementation
```
Feature: Leads Management
  → components/dashboard/leads.tsx (main component)
  → lib/api.ts: getLeads(), updateLead(), deleteLead() (API)
  → docs/LEADS_HISTORY_API_INTEGRATION.md (documentation)

Feature: Report PDF Export
  → components/dashboard/reports.tsx (UI)
  → lib/reportsPdfGenerator.ts (PDF generation logic)
  → docs/REPORTS_PDF_GENERATION.md (implementation details)

Feature: Sales Heatmap
  → components/dashboard/sales-heatmap.tsx (main component)
  → lib/locationStream.ts (data fetching)
  → lib/routeSnapping.ts (trail optimization)
  → docs/HEATMAP_CHANGES_SUMMARY.md (implementation)
```

### To Add a New Page
```
1. Create component: components/dashboard/[feature].tsx
2. Add to imports: app/page.tsx
3. Add case statement: renderCurrentPage() in app/page.tsx
4. Add to sidebar: components/layout/dashboard-sidebar.tsx
5. Add API methods: lib/api.ts (if needed)
6. Create documentation: docs/[FEATURE].md
```

### To Fix a Data Flow Issue
```
1. Identify affected components
2. Check query key in useQuery: queryKey: ['xxx']
3. Find API call in lib/api.ts: getXxx()
4. Verify endpoint path: '/xxx'
5. Check backend response format
6. Test with console logs in makeRequest()
7. Check React Query DevTools for cache status
```

---

## Summary

This visual guide shows:
- ✅ Overall system architecture
- ✅ Component hierarchy
- ✅ Data flow patterns
- ✅ Authentication flow
- ✅ API integration
- ✅ Library dependencies
- ✅ File organization
- ✅ Deployment structure

Use this as a reference when:
- Adding new features
- Debugging data flows
- Understanding component relationships
- Onboarding new developers
- Planning refactors

**Key Takeaway**: ACCORD is a well-structured, modular application with clear separation of concerns:
- **Authentication** (lib/auth.ts)
- **API Integration** (lib/api.ts)
- **UI Components** (components/)
- **Business Logic** (lib utilities)
- **State Management** (React Query)

All pieces fit together seamlessly through the centralized `apiService` and `authService`.
