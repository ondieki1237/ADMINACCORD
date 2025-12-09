# ACCORD Admin Panel - Complete Repository Study Guide

## 📚 Overview

**ACCORD** is a comprehensive business management application built with Next.js 14, designed for field sales teams. It's a mobile-first PWA (Progressive Web App) that enables:
- Real-time GPS trail tracking for sales representatives
- Visit management and scheduling
- Follow-up tracking for sales deals
- Admin dashboard with advanced analytics
- Engineering services management
- Machine and facility tracking
- Weekly planners and expense tracking
- Comprehensive reporting system

**Repository**: ADMINACCORD  
**Framework**: Next.js 14 (App Router)  
**Language**: TypeScript + React  
**State Management**: TanStack React Query  
**Styling**: Tailwind CSS + shadcn/ui components  
**Backend API**: https://app.codewithseth.co.ke/api  

---

## 📁 Project Structure

### Root Level Files
```
├── package.json                 # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
├── next.config.mjs             # Next.js configuration
├── tailwind.config.js          # Tailwind CSS config
├── postcss.config.mjs          # PostCSS plugins
├── components.json             # shadcn/ui configuration
├── capacitor.config.json       # Mobile deployment config (Capacitor)
├── README.md                   # Quick start guide
├── ADMIN_PANEL_REQUIREMENTS.md # Full feature requirements
├── BACKEND_REQUIREMENTS.md     # Backend specifications
└── next-env.d.ts              # Generated type definitions
```

### Core Directories

#### `/app` - Next.js App Router
```
app/
├── layout.tsx                  # Root layout with fonts, metadata, QueryProvider
├── page.tsx                    # Main entry point (handles auth & routing)
├── globals.css                 # Global styles
├── api/
│   └── facilities/            # API routes (example)
└── dashboard/
    ├── advanced-analytics/     # Advanced analytics page
    ├── facilities/             # Facilities admin
    ├── follow-ups/             # Follow-ups page
    ├── leads/                  # Leads management
    ├── machines/               # Machines admin
    ├── planners/               # Weekly planners
    ├── sales-heatmap/          # Real-time heatmap
    └── user-manager/           # User management
```

#### `/components` - React Components

**Layout Components**:
```
components/layout/
├── dashboard-sidebar.tsx       # Main sidebar navigation
├── mobile-nav.tsx              # Bottom mobile navigation
├── theme-provider.tsx          # Dark/light theme provider
└── QueryProvider.tsx           # React Query provider wrapper
```

**Authentication Components**:
```
components/auth/
├── login-form.tsx              # Login form with validation
└── register-form.tsx           # Registration form with validation
```

**Dashboard Components** (Main admin interface):
```
components/dashboard/
├── dashboard-overview.tsx      # Main dashboard (stats, charts, charts)
├── advanced-analytics.tsx      # Advanced analytics & reporting
├── daily-reports.tsx           # Daily report summaries
├── reports.tsx                 # Reports management & PDF generation
├── quotations.tsx              # Quotations management
├── leads.tsx                   # Leads management with history
├── machines.tsx                # Machine registry & services
├── machines-map.tsx            # Geographic machine map
├── user-manager.tsx            # User management & roles
├── planners.tsx                # Weekly expense planners
├── sales-heatmap.tsx           # Real-time GPS heatmap
├── performance-analytics.tsx   # Performance metrics dashboard
├── engineer-reports.tsx        # Engineering service reports
├── engineer-finance.tsx        # Engineer payment tracking
├── facilities-admin.tsx        # Facility management
├── HospitalLayer.tsx           # Hospital overlay for maps
└── stats-card.tsx              # Reusable stat card component
```

**Visit Management Components**:
```
components/visits/
├── visit-management.tsx        # Main visit manager
├── visit-list.tsx              # List of visits with filters
├── visit-detail.tsx            # Detailed visit view
├── create-visit-form.tsx       # Create new visit
├── follow-up-manager.tsx       # Follow-up management hub
├── follow-up-list.tsx          # List of follow-ups
└── create-follow-up-form.tsx   # Create follow-up form
```

**Trail Management Components**:
```
components/trails/
├── trail-management.tsx        # Main trail manager
├── trail-list.tsx              # List trails with filters
├── trail-detail.tsx            # Detailed trail view
└── create-trail-form.tsx       # Create new trail
```

**Profile Components**:
```
components/profile/
└── user-profile.tsx            # User profile & logout
```

**Mobile Components**:
```
components/mobile/
├── pwa-install.tsx             # PWA installation prompt
├── offline-indicator.tsx       # Offline status indicator
├── mobile-optimizations.tsx    # Mobile-specific optimizations
└── touch-gestures.tsx          # Swipe gesture handling
```

**UI Components** (shadcn/ui):
```
components/ui/
├── button.tsx
├── card.tsx
├── dialog.tsx
├── input.tsx
├── label.tsx
├── select.tsx
├── tabs.tsx
├── badge.tsx
├── alert-dialog.tsx
├── breadcrumb.tsx
└── [20+ other shadcn components]
```

#### `/lib` - Core Libraries & Utilities

**Authentication & API**:
```
lib/
├── auth.ts                     # AuthService class (login, register, token management)
├── api.ts                      # ApiService class (centralized API calls)
└── api/
    └── engineeringService.ts   # Engineering service API helpers
```

**Utilities**:
```
lib/
├── utils.ts                    # cn() utility for Tailwind merging
├── constants.ts                # Kenyan counties, roles, departments
├── permissions.ts              # Role-based access control helpers
└── locationStream.ts           # Real-time location tracking
```

**PDF Generation**:
```
lib/
├── reportsPdfGenerator.ts      # Weekly reports PDF generation
├── plannerPdfGenerator.ts      # Planners PDF generation
└── visitsPdfGenerator.ts       # Visits data extraction PDF
```

**Map & Routing**:
```
lib/
├── routeSnapping.ts            # Road snapping & trail optimization
└── locationStream.ts           # Location polling & streaming
```

#### `/docs` - Documentation

**Architecture & Setup**:
```
docs/
├── PROJECT_OVERVIEW.md         # High-level project structure
├── PROJECT_ANALYSIS.md         # Code analysis & recommendations
├── BACKEND_IMPLEMENTATION_GUIDE.md
├── BACKEND_CHECKLIST.md
└── BACKEND_REPORTS_API_UPDATE.md
```

**Features Documentation**:
```
docs/
├── ADMIN_PANEL_REQUIREMENTS.md # Complete feature specs
├── DASHBOARD_MODERNIZATION.md  # Dashboard redesign
├── PLANNERS_FEATURE.md         # Weekly planners
├── REPORTS_PDF_GENERATION.md   # Report generation
├── VISITS_DATA_EXTRACTION.md   # Data extraction features
├── LEADS_HISTORY_API_INTEGRATION.md
├── MACHINE_SERVICE_INTEGRATION.md
├── ENGINEER_REPORTS_BACKEND_REQUIREMENTS.md
└── SALES_FOLLOW_UP_SYSTEM.md
```

**Maps & Analytics**:
```
docs/
├── ROAD_SNAPPED_POLYLINES_GUIDE.md
├── HEATMAP_CHANGES_SUMMARY.md
├── live-analytics.md
├── performance-analytics-guide.md
└── SALES_FOLLOW_UP_SYSTEM.md
```

#### `/hooks` - Custom React Hooks
```
hooks/
├── use-mobile.ts               # Mobile detection hook
└── use-toast.ts                # Toast notification hook
```

#### `/public` - Static Assets
```
public/
├── ACCORD-app-icon-blue.jpg    # App icon/logo
├── manifest.json               # PWA manifest
└── [other assets]
```

---

## 🔐 Authentication Flow

### Auth Service (`lib/auth.ts`)

```
┌─────────────────────────────────────────────────────────────┐
│                  Authentication Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User Login/Register                                     │
│     ↓                                                         │
│  2. POST /auth/login or /auth/register                      │
│     ↓                                                         │
│  3. Backend returns: { data: { user, tokens } }             │
│     ↓                                                         │
│  4. authService.setTokens(access, refresh)                  │
│     → Stores in localStorage                                │
│     → Stores in memory (accessToken, refreshToken)          │
│     ↓                                                         │
│  5. authService.setCurrentUser(user)                        │
│     → Stores in localStorage                                │
│     → Stores in memory (currentUser)                        │
│     ↓                                                         │
│  6. App updates state, shows authenticated UI               │
│                                                               │
│  Token Refresh Flow (on 401):                                │
│  ─────────────────────────                                  │
│  1. API call returns 401                                     │
│  2. apiService intercepts → POST /auth/refresh              │
│  3. Gets new tokens from backend                             │
│  4. Updates storage & memory                                 │
│  5. Retries original request with new token                 │
│  6. If refresh fails → logout user                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### User Interface Flow

```
app/page.tsx (HomePage)
    ↓
[Load authService.isAuthenticated()]
    ↓
    ├─→ NOT AUTHENTICATED
    │   └─→ Show LoginForm or RegisterForm
    │       ├─ LoginForm calls authService.login()
    │       ├─ RegisterForm calls authService.register()
    │       └─ Both trigger onSuccess() → setIsAuthenticated(true)
    │
    └─→ AUTHENTICATED
        └─→ Render Main App:
            ├─ DashboardSidebar (desktop)
            ├─ MobileNav (mobile)
            ├─ Main Content (currentPage state)
            │   ├─ dashboard → DashboardOverview
            │   ├─ visits → VisitManagement
            │   ├─ trails → TrailManagement
            │   ├─ follow-ups → FollowUpManager
            │   ├─ reports → ReportsManager
            │   ├─ leads → LeadsList
            │   ├─ machines → MachinesList
            │   ├─ planners → PlannersManager
            │   ├─ sales-heatmap → SalesHeatmap
            │   ├─ performance-analytics → PerformanceAnalytics
            │   ├─ engineer-reports → EngineerReports
            │   ├─ engineer-finance → EngineerFinance
            │   ├─ daily-reports → DailyReports
            │   ├─ advanced-analytics → AdvancedAnalytics
            │   ├─ user-manager → UserManager
            │   └─ profile → UserProfile
            └─ Touch Gestures for swipe navigation
```

---

## 🌐 API Integration Architecture

### API Service (`lib/api.ts`)

The `ApiService` class is the central hub for all backend communication:

```typescript
class ApiService {
  private async makeRequest(endpoint, options) {
    // 1. Gets access token from authService
    // 2. Attaches Bearer token to headers
    // 3. Makes fetch request
    // 4. Handles 401 → token refresh → retry
    // 5. Throws or returns parsed JSON
  }

  // Dashboard Endpoints
  getDashboardOverview(startDate?, endDate?, region?)
  getRecentActivity(limit)
  getPerformanceMetrics(startDate?, endDate?, region?)

  // Trail Management
  getTrails(page, limit, startDate?, endDate?)
  createTrail(trailData)
  updateTrail(trailId, trailData)
  deleteTrail(trailId)
  snapTrailToRoads(trailId)        // Road snapping
  batchSnapAllTrails()

  // Visit Management
  getVisits(page, limit, startDate?, endDate?)
  createVisit(visitData)
  updateVisit(visitId, visitData)
  deleteVisit(visitId)

  // Follow-ups
  createFollowUp(followUpData)
  getFollowUps(filters)
  getAdminFollowUps(filters)
  getFollowUpById(followUpId)
  updateFollowUp(followUpId, followUpData)
  deleteFollowUp(followUpId)
  getFollowUpsByVisit(visitId)

  // Leads
  getLeads(page, limit, filters, useAdminEndpoint?)
  getLeadById(leadId, useAdminEndpoint?)
  updateLead(leadId, payload, useAdminEndpoint?)
  deleteLead(leadId, useAdminEndpoint?)
  getLeadHistory(leadId)           // Lead history tracking

  // Machines
  getMachines(page, limit, filters)
  getMachineById(machineId)
  getMachineServices(machineId, page, limit)
  createMachine(payload)
  updateMachine(machineId, payload)
  deleteMachine(machineId)

  // Engineering Services
  getEngineeringServices(page, limit, filters)
  getEngineeringServicesByEngineer(engineerId, page, limit, filters)
  getEngineeringServiceById(serviceId)
  createEngineeringService(payload)
  updateEngineeringService(serviceId, payload)
  deleteEngineeringService(serviceId)
  assignEngineeringService(serviceId, payload)

  // Users
  getUsers(filters)
  getUsersByRole(role)
  getEngineers()

  // Heatmap
  getSalesHeatmap()
}

export const apiService = new ApiService()
```

### Backend API Endpoints

**Base URL**: `https://app.codewithseth.co.ke/api`

| Feature | Endpoints |
|---------|-----------|
| **Auth** | POST /auth/login, /auth/register, /auth/logout, /auth/refresh, GET /auth/me |
| **Dashboard** | GET /dashboard/overview, /dashboard/recent-activity, /dashboard/performance, /dashboard/heatmap/sales |
| **Trails** | GET /trails, POST /trails, PUT /trails/:id, DELETE /trails/:id, POST /trails/:id/snap-route |
| **Visits** | GET /visits, POST /visits, PUT /visits/:id, DELETE /visits/:id |
| **Follow-ups** | GET /follow-ups, POST /follow-ups, PUT /follow-ups/:id, DELETE /follow-ups/:id |
| **Leads** | GET /leads, GET /admin/leads, PUT /leads/:id, DELETE /leads/:id, GET /admin/leads/:id/history |
| **Machines** | GET /admin/machines, POST /admin/machines, PUT /admin/machines/:id, DELETE /admin/machines/:id |
| **Engineering** | GET /engineering-services, POST /engineering-services, PUT /engineering-services/:id |
| **Users** | GET /users, GET /users?role=engineer |

---

## 🧩 Key Components & Data Flow

### 1. Dashboard Overview (`components/dashboard/dashboard-overview.tsx`)

**Purpose**: Main admin dashboard with statistics and quick actions

**Data Flow**:
```
DashboardOverview
├─ useQuery(['overview']) → apiService.getDashboardOverview()
├─ useQuery(['performance']) → apiService.getPerformanceMetrics()
├─ useQuery(['trails']) → apiService.getTrails()
├─ useQuery(['heatmap']) → apiService.getSalesHeatmap()
├─ fetch(/api/visits) → Visit statistics
└─ fetch(/api/dashboard/all-trails) → Trail statistics
    ↓
Renders:
├─ Stats Cards (visits, trails, reports)
├─ Charts (performance, trends)
├─ Quick Action Buttons
└─ Navigation to other sections
```

**Permissions Check**:
- `hasAdminAccess()` - Show admin-only features
- `canViewHeatmap()` - Show heatmap
- `canViewAllRecords()` - Show all records vs. own records

**Key Features**:
- Real-time stats auto-refresh
- CSV/JSON/Excel exports
- Date range filtering
- User-specific filtering
- Top performers leaderboard
- Conversion funnel analysis

---

### 2. Sales Heatmap (`components/dashboard/sales-heatmap.tsx`)

**Purpose**: Real-time GPS tracking of sales team with road snapping

**Data Flow**:
```
SalesHeatmap
├─ useQuery(['heatmapData']) → fetch(/api/dashboard/heatmap/live)
├─ useState(userTracks) → Updated by polling
├─ ReactLeaflet Map
│   ├─ TileLayer (OpenStreetMap)
│   ├─ HospitalLayer (GeoJSON overlay)
│   ├─ UserTrails (road-snapped polylines)
│   ├─ TrailMarkers (start/end points)
│   └─ HeatmapLayer (intensity visualization)
└─ Sidebar Controls
    ├─ Time range picker (24h, 7d, 30d)
    ├─ User filter
    └─ Legend
```

**Technologies**:
- `react-leaflet` - Interactive map
- `leaflet.heat` - Heatmap layer
- `turf/simplify` - Trail simplification
- OSRM - Road snapping
- GeoJSON - Hospital locations

---

### 3. Visit Management (`components/visits/visit-management.tsx`)

**Purpose**: Track client visits and manage follow-ups

**Data Flow**:
```
VisitManagement
├─ VisitList
│   ├─ useQuery(['visits']) → apiService.getVisits()
│   ├─ useMutation(deleteVisit)
│   └─ Renders visit cards
├─ CreateVisitForm
│   ├─ useForm (React Hook Form)
│   ├─ onSubmit → apiService.createVisit()
│   └─ invalidateQueries(['visits'])
└─ VisitDetail
    ├─ Shows visit info
    ├─ FollowUpList (nested)
    └─ Can create follow-up
```

**Key Data**:
```typescript
interface Visit {
  _id: string
  date: string
  startTime: string
  endTime?: string
  client: { name: string; type: string; location: string }
  visitPurpose: string
  contacts: { name: string; role: string }[]
  requestedEquipment?: Equipment[]
  notes?: string
  status?: "scheduled" | "in-progress" | "completed" | "cancelled"
}
```

---

### 4. Follow-up System (`components/visits/follow-up-manager.tsx`)

**Purpose**: Track sales deal progress with follow-ups

**Data Flow**:
```
FollowUpManager
├─ FollowUpList
│   ├─ useQuery(['followUps']) → apiService.getFollowUps(filters)
│   ├─ Status badges: deal_sealed, in_progress, deal_failed
│   └─ Conversion tracking
├─ CreateFollowUpForm
│   └─ Links to specific visit
└─ Analytics
    └─ Win/loss rates by user
```

**Follow-up Data**:
```typescript
interface FollowUp {
  visitId: string
  date: string
  contactPerson: { name: string; role: string; phone?: string; email?: string }
  outcome: 'deal_sealed' | 'in_progress' | 'deal_failed'
  winningPoint?: string
  progressNotes?: string
  improvements?: string
  failureReasons?: string
}
```

---

### 5. Reports System (`components/dashboard/reports.tsx`)

**Purpose**: Manage weekly reports with PDF generation

**Data Flow**:
```
ReportsManager
├─ ReportsList
│   ├─ useQuery(['reports']) → fetch(/api/reports)
│   ├─ Status: pending, approved, rejected
│   └─ Display with metadata
├─ PDF Generation
│   ├─ generateReportsSummaryPDF() - Batch reports
│   ├─ generateIndividualReportPDF() - Single report
│   └─ generateDetailedReportPDF() - Detailed view
└─ Admin Actions
    ├─ Approve/Reject
    ├─ Add notes
    └─ Download PDF
```

**Report Structure**:
```typescript
interface Report {
  _id: string
  userId: { _id: string; firstName: string; lastName: string; email: string }
  status: "pending" | "approved" | "rejected"
  weekStart: string
  weekEnd: string
  content?: {
    metadata?: { author?: string; submittedAt?: string }
    sections?: Array<{ id: string; title: string; content: string }>
  }
  adminNotes?: string
  createdAt: string
}
```

---

### 6. Leads Management (`components/dashboard/leads.tsx`)

**Purpose**: Track customer leads and their interaction history

**Data Flow**:
```
LeadsList
├─ useQuery(['leads']) → apiService.getLeads(filters)
├─ Lead Cards
│   ├─ Basic info
│   ├─ Status badge
│   ├─ View History button
│   └─ Edit/Delete actions
├─ ViewHistoryDialog
│   └─ fetch(/api/admin/leads/:id/history)
│       ├─ All interactions
│       ├─ Status changes
│       └─ Timeline view
└─ Filters
    ├─ By region
    ├─ By status
    └─ Search by name
```

---

### 7. Engineering Services (`lib/api.ts` + components)

**Purpose**: Manage machine services and engineer assignments

**Data Flow**:
```
EngineerReports
├─ useQuery(['engineeringServices']) → apiService.getEngineeringServices()
├─ useQuery(['engineers']) → apiService.getEngineers()
├─ Duty/Service Cards
│   ├─ Engineer assignment
│   ├─ Status tracking
│   ├─ Date scheduling
│   └─ Condition reports
└─ Create Service
    ├─ Select facility
    ├─ Assign engineer
    ├─ Set service type
    └─ Add notes
```

**Engineer Finance** (`engineer-finance.tsx`):
- Track engineer payments
- Service completion verification
- Commission calculations
- Payment history

---

### 8. Machine Registry (`components/dashboard/machines.tsx`)

**Purpose**: Manage medical equipment in facilities

**Data Flow**:
```
MachinesList
├─ useQuery(['machines']) → apiService.getMachines(filters)
├─ Machine Cards
│   ├─ Equipment details
│   ├─ Facility location
│   ├─ Service history
│   └─ Warranty info
├─ MapView
│   ├─ Geographic distribution
│   └─ Facility markers
└─ Bulk Operations
    ├─ Add machines CSV
    ├─ Update facility names
    └─ Manage services
```

**Machine Data**:
```typescript
interface Machine {
  model: string
  manufacturer: string
  serialNumber: string
  facility: { name: string; level: string; location: string }
  status: "active" | "maintenance" | "inactive"
  installedDate: string
  purchaseDate: string
  warrantyExpiry: string
}
```

---

### 9. Weekly Planners (`components/dashboard/planners.tsx`)

**Purpose**: Employee expense tracking and planning

**Data Flow**:
```
PlannersManager
├─ useQuery(['planners']) → fetchAdminPlanners()
├─ WeekSelector
│   ├─ Current week
│   ├─ Previous week
│   └─ Next week
├─ PlannersList
│   ├─ Grouped by user
│   ├─ Daily allowances
│   ├─ Weekly totals
│   └─ Status tracking
└─ PDF Export
    ├─ Summary PDF (all users)
    ├─ Individual PDFs
    └─ Excel reports
```

**Planner Helpers** (`lib/plannerHelpers.ts`):
```typescript
export async function fetchAdminPlanners(params): Promise<PlannerResponse>
export function getWeekRange(date): { from: string; to: string }
export function calculateWeeklyAllowance(planner): number
export function groupPlannersByUser(planners): Map<string, Planner[]>
```

---

## 🛣️ Role-Based Access Control

### Permission Helpers (`lib/permissions.ts`)

```typescript
hasAdminAccess(user) → user.role === "admin"
hasManagerAccess(user) → role in ["admin", "manager"]
canViewHeatmap(user) → hasAdminAccess(user)
canDeleteRecords(user) → hasAdminAccess(user)
canEditRecords(user) → hasAdminAccess(user)
canViewAllRecords(user) → hasAdminAccess(user)
canAccessSuperUserFeatures(user) → hasAdminAccess(user)
```

### User Roles (from `lib/constants.ts`)

```typescript
userRoles = {
  ADMIN: "admin",      // Full access
  MANAGER: "manager",  // Can manage reports & services
  SALES: "sales"       // Can create visits & follow-ups
}
```

---

## 🎨 Component Hierarchy & Navigation

### Top-Level Routes (via `app/page.tsx`)

```
HomePage (app/page.tsx)
├─ Auth Check
│  ├─ isAuthenticated = false
│  │  └─ LoginForm / RegisterForm
│  └─ isAuthenticated = true
│     ├─ Desktop Layout
│     │  ├─ DashboardSidebar (left sidebar)
│     │  └─ Main Content (right)
│     ├─ Mobile Layout
│     │  ├─ MobileNav (bottom nav)
│     │  └─ Main Content (full width)
│     ├─ TouchGestures (swipe handling)
│     └─ currentPage Router
│        ├─ "dashboard" → DashboardOverview
│        ├─ "visits" → VisitManagement
│        ├─ "trails" → TrailManagement
│        ├─ "follow-ups" → FollowUpManager
│        ├─ "profile" → UserProfile
│        ├─ "reports" → ReportsManager
│        ├─ "advanced-analytics" → AdvancedAnalytics
│        ├─ "leads" → LeadsList
│        ├─ "machines" → MachinesList
│        ├─ "user-manager" → UserManager
│        ├─ "planners" → PlannersManager
│        ├─ "sales-heatmap" → SalesHeatmap
│        ├─ "performance-analytics" → PerformanceAnalytics
│        ├─ "engineer-reports" → EngineerReports
│        ├─ "engineer-finance" → EngineerFinance
│        └─ "daily-reports" → DailyReports
```

### Sidebar Navigation (`components/layout/dashboard-sidebar.tsx`)

Menu items grouped by category:
- **Core**: Dashboard, Visits, Trails, Follow-ups
- **Sales**: Leads, Quotations, Reports
- **Admin**: Users, Planners, Performance Analytics
- **Technical**: Machines, Engineering, Finance
- **Tools**: Heatmap, Daily Reports, Advanced Analytics

---

## 📊 State Management Pattern

### React Query (TanStack Query)

Used for server state management:

```typescript
// In components
const { data, isLoading, error } = useQuery({
  queryKey: ['visits', { page, limit, filters }],
  queryFn: () => apiService.getVisits(page, limit, filters)
})

const mutation = useMutation({
  mutationFn: (data) => apiService.createVisit(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['visits'] })
  }
})
```

**Query Keys Pattern**:
- `['dashboard']` - Dashboard data
- `['visits']` - Visit list
- `['trails']` - Trail list
- `['followUps']` - Follow-ups list
- `['leads']` - Leads list
- `['machines']` - Machines list
- `['engineeringServices']` - Engineering services

### Local Component State

```typescript
const [currentPage, setCurrentPage] = useState('dashboard')
const [filters, setFilters] = useState({ startDate: '', endDate: '' })
const [showDialog, setShowDialog] = useState(false)
```

### localStorage Usage

Tokens and user data:
```typescript
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')
localStorage.getItem('currentUser')
```

---

## 🔗 File Dependency Graph

### Core Dependencies

```
app/page.tsx (entry point)
├─ components/auth/login-form.tsx
│  └─ lib/auth.ts (authService.login)
├─ components/auth/register-form.tsx
│  └─ lib/auth.ts (authService.register)
├─ components/layout/dashboard-sidebar.tsx
│  ├─ lib/permissions.ts
│  └─ lib/auth.ts
├─ components/dashboard/dashboard-overview.tsx
│  ├─ lib/api.ts (apiService)
│  ├─ lib/permissions.ts
│  ├─ lib/reportsPdfGenerator.ts
│  └─ components/dashboard/reports.tsx
├─ components/visits/visit-management.tsx
│  ├─ components/visits/visit-list.tsx
│  ├─ components/visits/visit-detail.tsx
│  ├─ components/visits/follow-up-list.tsx
│  └─ lib/api.ts
├─ components/dashboard/sales-heatmap.tsx
│  ├─ lib/locationStream.ts
│  ├─ react-leaflet
│  └─ leaflet.heat
└─ components/dashboard/leads.tsx
   ├─ lib/api.ts
   └─ lib/permissions.ts
```

### PDF Generation Chain

```
components/dashboard/reports.tsx
├─ lib/reportsPdfGenerator.ts
│  ├─ jspdf
│  ├─ jspdf-autotable
│  └─ Data: visits, reports, planners

components/dashboard/planners.tsx
├─ lib/plannerPdfGenerator.ts
│  ├─ jspdf
│  ├─ jspdf-autotable
│  └─ Data: planners, allowances

components/dashboard/visitmanager.tsx
└─ lib/visitsPdfGenerator.ts
   ├─ jspdf
   ├─ jspdf-autotable
   └─ Data: visits, contacts, facilities
```

---

## 🚀 Data Flow Examples

### Example 1: Viewing Visits

```
User clicks "Visits" in sidebar
  ↓
app/page.tsx: setCurrentPage('visits')
  ↓
VisitManagement component renders
  ↓
VisitList: useQuery(['visits']) triggers
  ↓
apiService.getVisits(page, limit)
  ↓
apiService.makeRequest('/visits?page=1&limit=20')
  ↓
Backend: GET /visits → Returns array of visits
  ↓
React Query caches data
  ↓
Component renders visit cards with date, client, purpose
  ↓
User clicks "View Details"
  ↓
VisitDetail component shows:
  - Visit information
  - Client/contact details
  - FollowUpList (nested query)
  ↓
apiService.getFollowUps({ visitId })
  ↓
Display all follow-ups for this visit
```

### Example 2: Creating a Follow-up

```
User clicks "Create Follow-up" in VisitDetail
  ↓
CreateFollowUpForm dialog opens
  ↓
User fills:
  - date
  - contactPerson (name, role, phone, email)
  - outcome (deal_sealed, in_progress, deal_failed)
  - winningPoint / progressNotes / improvements / failureReasons
  ↓
Form validates with React Hook Form
  ↓
useMutation triggers apiService.createFollowUp(data)
  ↓
apiService.makeRequest('/follow-ups', { method: 'POST', body: JSON.stringify(data) })
  ↓
Backend creates follow-up, returns result
  ↓
queryClient.invalidateQueries(['followUps'])
  ↓
FollowUpList re-fetches and updates
  ↓
Toast notification: "Follow-up created successfully"
```

### Example 3: Exporting Dashboard Data

```
User clicks "Export as CSV" on Dashboard
  ↓
Component collects:
  - overview data
  - performance metrics
  - recent activity
  - trail data
  ↓
Create CSV format
  ↓
new Blob(csvContent, { type: 'text/csv' })
  ↓
Create download link
  ↓
Trigger download as "dashboard-[date].csv"
  ↓
File saved to user's computer
```

---

## 🧪 Key Utilities & Helpers

### Route Snapping (`lib/routeSnapping.ts`)

Snaps trail coordinates to road network:

```typescript
snapTrailToRoads(trailId)          // Snap single trail
batchSnapTrails(trails)             // Snap multiple trails
simplifyTrailCoordinates(coords)    // Reduce coordinate density
calculateDistance(from, to)         // Calculate distance between points
calculateTrailDistance(coordinates) // Total trail distance
formatDistance(meters)              // Format as "5.2 km"
formatDuration(seconds)             // Format as "1h 23m"
```

### Location Streaming (`lib/locationStream.ts`)

Real-time location tracking:

```typescript
fetchAdminTracks({startDate?, endDate?, users?})  // Get all tracks
flattenAndSortPoints(tracks)                       // Flatten to point array
toLatLng(point)                                    // Convert to Leaflet format
startPollingTracks({interval, onUpdate})          // Poll for updates
connectLocationSocket({token, onUpdate})          // Socket connection
```

### Planner Helpers (`lib/plannerHelpers.ts`)

Weekly planner utilities:

```typescript
fetchAdminPlanners(params)          // Fetch planners for date range
getWeekRange(date)                  // Get Monday-Sunday of week
getPreviousWeekRange(date)          // Previous week's range
getNextWeekRange(date)              // Next week's range
calculateWeeklyAllowance(planner)   // Total weekly allowance
calculateTotalAllowance(planners)   // Sum all allowances
groupPlannersByUser(planners)       // Group by user
formatWeekRange(weekStart)          // Format "Mon 01/01 - Sun 07/01"
```

### PDF Generators

**Reports**:
```typescript
generateReportsSummaryPDF(reports, dateRange)       // Batch PDF
generateIndividualReportPDF(report)                 // Single PDF
generateDetailedReportPDF(report, sections)         // Detailed view
```

**Planners**:
```typescript
generatePlannersSummaryPDF(planners, weekRange)     // Batch PDF
generateIndividualPlannerPDF(planner, weekRange)    // Single PDF
```

**Visits**:
```typescript
generateVisitsExtractionPDF(visits)                 // Visit details
generateContactsExtractionPDF(visits)               // Contact list
generateFacilitiesExtractionPDF(visits)             // Facility info
```

---

## 🔒 Authentication & Token Management

### Access Token Flow

```
1. User logs in with credentials
   ↓
2. Backend validates, returns:
   {
     data: {
       user: { id, email, role, name, ... },
       tokens: { accessToken, refreshToken }
     }
   }
   ↓
3. authService.setTokens(accessToken, refreshToken)
   - Stores in localStorage
   - Stores in memory (this.accessToken, this.refreshToken)
   ↓
4. Every API call:
   - apiService.makeRequest() gets token
   - Adds header: "Authorization: Bearer {accessToken}"
   ↓
5. If 401 response:
   - POST /auth/refresh with refreshToken
   - Get new accessToken
   - Update storage & memory
   - Retry request with new token
   ↓
6. If refresh fails:
   - authService.logout() clears tokens
   - User redirected to login
```

### Token Storage Locations

```
// Memory (cleared on page refresh)
authService.accessToken
authService.refreshToken
authService.currentUser

// localStorage (persists across sessions)
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')
localStorage.getItem('currentUser')
```

---

## 📱 Mobile-First Features

### PWA Configuration
- Manifest: `public/manifest.json`
- Icon: `ACCORD-app-icon-blue.jpg`
- Installable on home screen
- Offline support

### Mobile Components

**Offline Indicator** (`components/mobile/offline-indicator.tsx`)
- Shows when device is offline
- Indicates available functionality

**PWA Install Prompt** (`components/mobile/pwa-install.tsx`)
- Install button for PWA
- Only shows in supported browsers

**Mobile Optimizations** (`components/mobile/mobile-optimizations.tsx`)
- Safe area handling (notches)
- Viewport optimization
- Touch-friendly sizing

**Touch Gestures** (`components/mobile/touch-gestures.tsx`)
- Swipe left/right for navigation
- Swipe down to refresh
- Long-press for context menu

### Mobile Navigation (`components/layout/mobile-nav.tsx`)
- Bottom tab navigation
- Current page indicator
- Logout functionality

---

## 📋 Implementation Status

### ✅ Completed Features

- ✅ Authentication (login, register, logout, token refresh)
- ✅ Dashboard with real-time metrics
- ✅ Visit management with follow-ups
- ✅ Trail tracking with GPS
- ✅ Sales heatmap with road snapping
- ✅ Report generation and PDF exports
- ✅ Lead management with history
- ✅ Machine registry and services
- ✅ Engineering services management
- ✅ Weekly planners and expense tracking
- ✅ User management and roles
- ✅ Performance analytics
- ✅ Advanced analytics
- ✅ Daily reports
- ✅ Quotations management
- ✅ Engineer reports & finance
- ✅ PWA mobile support
- ✅ Role-based access control

### 📝 Notes

1. **Mixed API Usage**: Some components use `apiService`, others use direct `fetch()`. Consolidation recommended.
2. **Token Management**: Components sometimes read from localStorage instead of using `authService.getAccessToken()`.
3. **Type Safety**: Some API responses lack proper TypeScript interfaces.
4. **Component Reusability**: Good patterns established with shared UI components (shadcn/ui).

---

## 🎯 How Components Work Together

### Example: Complete Visit-to-Report Flow

```
1. VISIT TRACKING
   Sales rep completes visit
   → VisitManagement captures: date, client, contacts, purpose
   → apiService.createVisit() → Backend stores

2. FOLLOW-UP CREATION
   Manager reviews visit
   → FollowUpManager → CreateFollowUpForm
   → apiService.createFollowUp() → Backend tracks outcome

3. REPORTING
   Weekly reports generated
   → DashboardOverview fetches visits & follow-ups
   → Reports component displays for approval
   → Admin approves/rejects with notes

4. PDF EXPORT
   Admin needs hardcopy
   → generateReportsSummaryPDF() creates PDF
   → jsPDF + autoTable formats data
   → Download to computer

5. ANALYTICS
   Manager reviews performance
   → PerformanceAnalytics queries dashboard/performance
   → Charts show trends by user, region, period
   → Conversion funnel from visit→follow-up→deal
```

---

## 🔍 How to Navigate the Codebase

### To Add a New Feature

1. **Define the data model** → Backend schema
2. **Add API methods** → `lib/api.ts`
3. **Create UI component** → `components/dashboard/` or `components/visits/`
4. **Add to navigation** → Update sidebar & `app/page.tsx`
5. **Test with real data** → Run locally, connect to backend

### To Fix an Issue

1. **Identify affected components** → Use grep to find imports
2. **Check data flow** → Follow apiService calls
3. **Verify auth/permissions** → Check `lib/permissions.ts`
4. **Test in development** → `npm run dev`
5. **Check browser console** → API logs, errors

### To Understand a Page

1. Read the component file (look for `"use client"`, `useQuery`)
2. Check imported services (`lib/api.ts`, `lib/auth.ts`)
3. Follow the data flow (query key → API endpoint)
4. Look at related components (form, list, detail views)
5. Check documentation in `docs/` folder

---

## 📚 Key Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Quick start & features overview |
| `docs/PROJECT_OVERVIEW.md` | High-level architecture |
| `docs/PROJECT_ANALYSIS.md` | Code analysis & recommendations |
| `ADMIN_PANEL_REQUIREMENTS.md` | Complete feature specifications |
| `docs/BACKEND_IMPLEMENTATION_GUIDE.md` | Backend setup & schema |
| `docs/PLANNERS_FEATURE.md` | Weekly planners documentation |
| `docs/VISITS_DATA_EXTRACTION.md` | Data extraction features |
| `docs/SALES_FOLLOW_UP_SYSTEM.md` | Follow-up system details |
| `docs/HEATMAP_CHANGES_SUMMARY.md` | Heatmap implementation |
| `docs/performance-analytics-guide.md` | Analytics dashboard |

---

## 🎓 Learning Path

### Week 1: Foundation
- Read `README.md` and `PROJECT_OVERVIEW.md`
- Understand auth flow in `lib/auth.ts`
- Follow API setup in `lib/api.ts`
- Study `app/page.tsx` routing

### Week 2: Core Features
- Deep dive into Visit Management
- Understand Follow-up System
- Study Trail tracking
- Explore Reports PDF generation

### Week 3: Advanced Features
- Sales Heatmap implementation
- Engineering Services
- Lead Management & History
- Machine Registry

### Week 4: Deployment & Optimization
- Mobile PWA deployment
- Performance Analytics
- Backend integration
- Testing & debugging

---

## ✨ Summary

The **ACCORD** admin panel is a sophisticated, modern business application that:

1. **Provides centralized admin control** for sales team operations
2. **Tracks all business activities** from visits to follow-ups to deals
3. **Generates actionable insights** through analytics and reports
4. **Manages field operations** with GPS tracking and planning
5. **Supports mobile-first workflows** with PWA technology
6. **Maintains role-based security** with JWT authentication

All components are interconnected through:
- **Centralized API service** (`lib/api.ts`)
- **Robust authentication** (`lib/auth.ts`)
- **Organized component structure** (view → form → list patterns)
- **React Query caching** for optimal performance
- **Permission-based UI** showing only allowed features

The codebase is well-documented, modular, and ready for both feature additions and scaling.

---

**Last Updated**: December 9, 2025
**Version**: 1.0
**Total Lines of Code**: ~25,000+ (across all components, lib, and API)
**Key Technologies**: Next.js 14, React 18, TypeScript, Tailwind CSS, React Query
