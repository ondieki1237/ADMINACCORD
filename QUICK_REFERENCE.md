# ACCORD Repository - Quick Reference Guide

## 🎯 Quick Facts

| Aspect | Details |
|--------|---------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript + React 18 |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State Management** | TanStack React Query |
| **Authentication** | JWT (Bearer tokens) |
| **Backend API** | https://app.codewithseth.co.ke/api |
| **Mobile** | Capacitor PWA |
| **Maps** | Leaflet.js + OSRM road snapping |
| **PDF Export** | jsPDF + jsPDF-AutoTable |
| **Charts** | Chart.js + Recharts |

---

## 🚀 Getting Started (5 minutes)

### Installation
```bash
# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev

# Open http://localhost:3000
```

### Build for Production
```bash
npm run build      # Build optimized production bundle
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Mobile Deployment
```bash
# Build web assets
npm run build

# Sync with Capacitor
npx cap sync

# Open in native IDE
npx cap open android   # Android Studio
npx cap open ios       # Xcode
```

---

## 🗺️ File Location Quick Map

### I need to...

**Add a new page/feature**
```
1. Create component: /components/dashboard/[feature].tsx
2. Add import: app/page.tsx (line ~25)
3. Add dynamic import: app/page.tsx (line ~40)
4. Add case: renderCurrentPage() switch (line ~100)
5. Update sidebar: /components/layout/dashboard-sidebar.tsx
6. Add API methods: /lib/api.ts (if needed)
7. Docs: /docs/[FEATURE].md
```

**Fix authentication**
```
→ /lib/auth.ts (AuthService class)
→ Components: /components/auth/
→ Check: authService.getAccessToken()
```

**Fix API calls**
```
→ /lib/api.ts (ApiService class)
→ Check: apiService.makeRequest()
→ Token attach: Bearer token handling
→ 401 refresh: Token refresh logic
```

**Fix styling/UI**
```
→ /components/ui/ (shadcn/ui components)
→ /app/globals.css (global styles)
→ tailwind.config.js (Tailwind config)
→ components/theme-provider.tsx (dark mode)
```

**Fix map/heatmap**
```
→ /components/dashboard/sales-heatmap.tsx (main map)
→ /lib/locationStream.ts (fetch location data)
→ /lib/routeSnapping.ts (trail optimization)
```

**Fix PDF generation**
```
→ /lib/reportsPdfGenerator.ts (reports)
→ /lib/plannerPdfGenerator.ts (planners)
→ /lib/visitsPdfGenerator.ts (visits)
```

**Fix database queries**
```
→ /lib/api.ts (all API endpoints)
→ Check endpoint URL
→ Verify request/response format
→ Check error handling in makeRequest()
```

**Add permission check**
```
→ /lib/permissions.ts (add new function)
→ Import in component
→ Use: if (hasAdminAccess(user)) { }
```

**Change branding/colors**
```
→ /docs/BRANDING_COLORS.md (color reference)
→ tailwind.config.js (update color theme)
→ /app/globals.css (global style adjustments)
```

**Add new data type/interface**
```
→ Define in component file or create types/index.ts
→ Update API response interface in /lib/api.ts
→ Update form validation (React Hook Form)
```

---

## 📋 Common Code Patterns

### Fetch Data with useQuery
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['visits', page, limit],
  queryFn: () => apiService.getVisits(page, limit),
  staleTime: 5 * 60 * 1000, // 5 minutes
})

if (isLoading) return <div>Loading...</div>
if (error) return <div>Error: {error.message}</div>
return <div>{data?.length} visits</div>
```

### Submit Form with useMutation
```typescript
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: (data) => apiService.createVisit(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['visits'] })
    toast.success('Visit created!')
    onClose()
  },
  onError: (error) => {
    toast.error(error.message)
  }
})

const handleSubmit = (data) => mutation.mutate(data)
```

### Check Permissions
```typescript
import { hasAdminAccess } from '@/lib/permissions'

const user = authService.getCurrentUserSync()
if (hasAdminAccess(user)) {
  return <AdminPanel />
}
```

### Export Data as CSV
```typescript
const csvContent = [
  ['Name', 'Email', 'Status'],
  ...data.map(d => [d.name, d.email, d.status])
].map(row => row.join(',')).join('\n')

const blob = new Blob([csvContent], { type: 'text/csv' })
const url = window.URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `export-${Date.now()}.csv`
a.click()
```

### Generate PDF
```typescript
import { generateReportsPDF } from '@/lib/reportsPdfGenerator'

const handleExportPDF = async () => {
  const pdf = await generateReportsSummaryPDF(reports, dateRange)
  // pdf is a jsPDF object, handle as needed
}
```

### Show Toast Notification
```typescript
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

toast({
  title: 'Success',
  description: 'Visit created successfully',
  variant: 'default'
})

// Or with react-hot-toast
import toast from 'react-hot-toast'
toast.success('Saved!')
toast.error('Error occurred')
```

### Navigate Pages
```typescript
// In HomePage's currentPage state
const setCurrentPage = (page: string) => {
  // 'dashboard', 'visits', 'trails', 'leads', etc.
}

// In sidebar/nav component
<Button onClick={() => setCurrentPage('leads')}>
  View Leads
</Button>
```

---

## 🔑 Key API Endpoints Reference

```typescript
// Authentication
POST   /auth/login
POST   /auth/register
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me

// Dashboard
GET    /dashboard/overview?startDate=&endDate=&region=
GET    /dashboard/recent-activity?limit=20
GET    /dashboard/performance?startDate=&endDate=&region=
GET    /dashboard/heatmap/sales

// Trails
GET    /trails?page=1&limit=20&startDate=&endDate=
POST   /trails
PUT    /trails/:id
DELETE /trails/:id
POST   /trails/:id/snap-route
POST   /trails/snap-all-routes

// Visits
GET    /visits?page=1&limit=20&startDate=&endDate=
POST   /visits
PUT    /visits/:id
DELETE /visits/:id

// Follow-ups
GET    /follow-ups?filters...
POST   /follow-ups
PUT    /follow-ups/:id
DELETE /follow-ups/:id
GET    /follow-ups/:id

// Leads
GET    /leads?page=1&limit=20&filters...
GET    /admin/leads?page=1&limit=20&filters...
PUT    /leads/:id
DELETE /leads/:id
GET    /admin/leads/:id/history

// Machines
GET    /admin/machines?page=1&limit=20&filters...
POST   /admin/machines
PUT    /admin/machines/:id
DELETE /admin/machines/:id
GET    /machines/:id/services

// Engineering Services
GET    /engineering-services?page=1&limit=20&filters...
GET    /engineering-services/engineer/:engineerId?...
POST   /engineering-services
PUT    /engineering-services/:id
DELETE /engineering-services/:id

// Users
GET    /users?filters...
GET    /users?role=engineer
```

---

## 🔍 Debugging Tips

### Check API Calls
```typescript
// 1. Open browser DevTools → Network tab
// 2. Look for API requests to app.codewithseth.co.ke/api/*
// 3. Check response status (200, 401, 500, etc.)
// 4. View request headers for Authorization
// 5. Check response body for error message

// Or use React Query DevTools in browser
// devtools.tanstack.com
```

### Check Authentication
```typescript
// In browser console:
localStorage.getItem('accessToken')    // Should show token
localStorage.getItem('refreshToken')   // Should show token
localStorage.getItem('currentUser')    // Should show user object

// Or check authService state:
import { authService } from '@/lib/auth'
authService.isAuthenticated()          // Should be true
authService.getCurrentUserSync()       // Should show user
```

### Check React Query Cache
```typescript
// Open React Query DevTools in browser
// Shows all queries, their status, cache, and data

// Or manually inspect:
import { useQueryClient } from '@tanstack/react-query'
const queryClient = useQueryClient()
console.log(queryClient.getQueryData(['visits']))
```

### Check Component State
```typescript
// Use React DevTools browser extension
// → Components tab
// → Find component
// → See props and state

// Or add console logs:
console.log('Data:', data)
console.log('Loading:', isLoading)
console.log('Error:', error)
```

### Test API Directly
```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://app.codewithseth.co.ke/api/visits"

# Or use Postman/Insomnia GUI apps
```

---

## 📦 Adding Dependencies

### Add a Package
```bash
npm install package-name
# or
pnpm add package-name
```

### Add Dev Dependency
```bash
npm install --save-dev package-name
# or
pnpm add -D package-name
```

### Update All Dependencies
```bash
npm update
# or check for outdated:
npm outdated
```

---

## 🧪 Testing

### Run Linter
```bash
npm run lint
```

### Build Check
```bash
npm run build
# Shows if TypeScript or build errors exist
```

### Manual Testing Checklist
```
□ Login/Register form works
□ Dashboard loads and shows data
□ Create new visit works
□ Create follow-up works
□ Permissions hide/show correct features
□ PDF export generates file
□ Mobile responsive design
□ Offline indicator shows when offline
□ All navigation works
□ Logout clears tokens
```

---

## 🚨 Common Issues & Solutions

### Issue: 401 Unauthorized
```
Cause: Invalid or expired token
Solution:
1. Check localStorage.getItem('accessToken') exists
2. Verify token format: Bearer <token>
3. Try logout and login again
4. Check backend /auth/me endpoint
```

### Issue: CORS Error
```
Cause: Cross-origin request blocked
Solution:
1. Verify API URL is correct in lib/api.ts
2. Check backend CORS configuration
3. Ensure credentials/cookies are sent if needed
4. Check browser console for exact CORS issue
```

### Issue: Data Not Showing
```
Cause: Query not fetching or cache issue
Solution:
1. Check React Query DevTools - is query fetching?
2. Check Network tab - is API call being made?
3. Check API response - does it have data?
4. Verify queryKey matches between create/invalidate
5. Try queryClient.invalidateQueries() manually
```

### Issue: Form Not Submitting
```
Cause: Validation error or mutation failure
Solution:
1. Check React Hook Form errors: console.log(formState.errors)
2. Check mutation error: console.log(mutation.error)
3. Verify API endpoint is correct
4. Check request/response format matches backend
5. Check network request in DevTools
```

### Issue: Map Not Showing
```
Cause: Leaflet/map library issue
Solution:
1. Check if leaflet CSS is imported
2. Verify map container has height defined
3. Check if data is being fetched
4. Look for console errors from leaflet
5. Check if coordinates are valid (lat/lng)
```

---

## 📚 Documentation Files to Read

**Getting Started** (read in this order):
1. `README.md` - Features overview (5 min)
2. `PROJECT_OVERVIEW.md` - Architecture overview (10 min)
3. `REPOSITORY_STUDY_GUIDE.md` - Complete guide (you are here!)
4. `ARCHITECTURE_VISUAL_GUIDE.md` - Visual diagrams (10 min)

**Feature Specific**:
- `ADMIN_PANEL_REQUIREMENTS.md` - All features & UI specs
- `PLANNERS_FEATURE.md` - Weekly planners
- `VISITS_DATA_EXTRACTION.md` - Visit features
- `SALES_FOLLOW_UP_SYSTEM.md` - Follow-up system
- `performance-analytics-guide.md` - Analytics

**Backend Setup**:
- `BACKEND_IMPLEMENTATION_GUIDE.md` - Database schema
- `BACKEND_REQUIREMENTS.md` - Backend specs
- `BACKEND_CHECKLIST.md` - Implementation checklist

**Advanced**:
- `PROJECT_ANALYSIS.md` - Code analysis & recommendations
- `HEATMAP_CHANGES_SUMMARY.md` - Heatmap details
- `MACHINE_SERVICE_INTEGRATION.md` - Machine services

---

## 🎨 UI Component Reference

### Common Component Usage

```tsx
// Button
import { Button } from '@/components/ui/button'
<Button variant="default" size="lg">Click me</Button>
<Button variant="outline" disabled>Disabled</Button>
<Button variant="ghost">Ghost</Button>

// Card
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    Content here
  </DialogContent>
</Dialog>

// Input
import { Input } from '@/components/ui/input'
<Input type="text" placeholder="Enter..." />

// Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>

// Tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
<Tabs>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>

// Badge
import { Badge } from '@/components/ui/badge'
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
```

---

## 🎯 Development Workflow

### 1. Starting a Feature
```bash
# Ensure you're on main branch and up-to-date
git checkout main
git pull origin main

# Start development server
npm run dev

# Open http://localhost:3000
```

### 2. Making Changes
```bash
# Make changes to files
# Testing in browser as you go

# Run linter to catch issues
npm run lint

# Build to check for TypeScript errors
npm run build
```

### 3. Testing
```bash
# Test locally at http://localhost:3000
# Check mobile view with DevTools
# Test different user roles if needed
# Test API calls in Network tab
```

### 4. Committing
```bash
# Check what changed
git status

# Stage changes
git add .

# Commit with clear message
git commit -m "feat: add new feature description"

# Push to branch
git push origin your-branch
```

---

## 📞 Support & Resources

### When Stuck:
1. **Check the docs** - Most answers are in /docs/
2. **Search code** - Use Ctrl+Shift+F to find similar patterns
3. **Check Network tab** - See actual API requests/responses
4. **Use DevTools** - React DevTools, React Query DevTools
5. **Read error message** - Most errors are descriptive

### Key Files to Bookmark:
- `/lib/api.ts` - All API endpoints
- `/lib/auth.ts` - Authentication logic
- `/app/page.tsx` - Main router
- `/lib/permissions.ts` - Access control
- `/docs/PROJECT_OVERVIEW.md` - Architecture

---

## 📊 Statistics

- **Total Components**: 60+
- **Total Pages**: 16
- **Total API Methods**: 40+
- **Documented Features**: 15+
- **Lines of Code**: 25,000+
- **External Dependencies**: 50+

---

## ✅ Checklist for New Developer

After reading this guide:
- [ ] Understand project structure
- [ ] Know how to run locally
- [ ] Know where auth logic is
- [ ] Know where API calls happen
- [ ] Know where components are organized
- [ ] Know how permissions work
- [ ] Know how to add a new page
- [ ] Know how to fix common issues
- [ ] Have bookmarked key files
- [ ] Read 2-3 feature docs

---

**Last Updated**: December 9, 2025  
**For More**: See REPOSITORY_STUDY_GUIDE.md for complete reference

---

💡 **Pro Tip**: When in doubt, search for similar code patterns. The codebase is consistent, so finding one example helps you understand all similar implementations.
