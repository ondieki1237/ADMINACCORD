# Weekly Planners Feature Documentation

## Overview
The Weekly Planners feature provides administrators with a comprehensive view of field staff weekly activity plans, including travel allowances, locations, means of transport, and prospect tracking.

## Architecture

### 1. Helper Utilities (`/lib/plannerHelpers.ts`)

#### TypeScript Interfaces
```typescript
interface PlannerDay {
  day: string;           // "Monday", "Tuesday", etc.
  date: string;          // ISO date string
  place: string;         // Location/destination
  means: string;         // Mode of transport
  allowance: string;     // Daily allowance amount
  prospects?: string;    // Optional: prospects/targets
}

interface Planner {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  };
  weekCreatedAt: string; // ISO date string (week start)
  days: PlannerDay[];    // 5-day array (Mon-Fri)
  notes?: string;        // Optional weekly notes
}
```

#### Core Functions

**Week Range Calculations:**
- `getWeekRange(date: Date)` - Returns Monday-Sunday range for given date
- `getPreviousWeekRange(date: Date)` - Returns previous week's range
- `getNextWeekRange(date: Date)` - Returns next week's range
- `formatWeekRange(date: Date | string)` - Format as "Jan 6 - Jan 12"

**API Integration:**
- `fetchAdminPlanners(params)` - Fetches planners with query params:
  - `token` (required): JWT Bearer token
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Results per page (default: 50)
  - `userId` (optional): Filter by specific user ID
  - `from` (optional): Start date (ISO string)
  - `to` (optional): End date (ISO string)
  - `sortBy` (optional): 'date' | 'name'
  - `order` (optional): 'asc' | 'desc'

**Allowance Calculations:**
- `calculateWeeklyAllowance(planner: Planner)` - Sum all day allowances for one planner
- `calculateTotalAllowance(planners: Planner[])` - Sum allowances across all planners

**Data Processing:**
- `groupPlannersByUser(planners: Planner[])` - Group planners by user ID
- `getUniquePlannerUsers(planners: Planner[])` - Extract unique users with details
- `sortPlannersByDate(planners: Planner[], order)` - Sort by weekCreatedAt
- `sortPlannersByName(planners: Planner[], order)` - Sort by user lastName

### 2. UI Component (`/components/dashboard/planners.tsx`)

#### Features
1. **Week Navigation**
   - Previous/Next week buttons
   - Jump to current week
   - Display formatted week range

2. **Filtering & Sorting**
   - User filter dropdown (all users or specific user)
   - Sort by date or name (ascending/descending)
   - Refresh button with loading state

3. **Statistics Dashboard**
   - Total weekly allowance (KES currency)
   - Total planner count
   - Weekly date range

4. **Planner Cards**
   - User information (name, employee ID, email)
   - Weekly allowance total
   - Optional notes section
   - 5-day grid layout (Monday-Friday)

5. **Day Details**
   - Day name and date
   - Location/place
   - Mode of transport
   - Daily allowance (KES formatted)
   - Prospects/targets

#### Styling
- Gradient backgrounds (purple/indigo theme)
- Responsive grid layouts (1/2/5 columns)
- Hover effects and transitions
- Shadow and border enhancements
- Loading and error states

### 3. Route (`/app/dashboard/planners/page.tsx`)
Simple page wrapper that renders `PlannersComponent`.

### 4. Dashboard Integration
Updated `dashboard-overview.tsx` to include:
- Top navigation button: "Planners" with Calendar icon
- Quick Actions sidebar button: "Weekly Planners"
- Purple gradient background for visual distinction

## API Endpoint

### GET /api/admin/planners

**Authentication:** Required (Bearer token)  
**Authorization:** Admin role

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Results per page
- `userId` (string): Filter by user ID
- `from` (string): Start date (ISO format)
- `to` (string): End date (ISO format)
- `sortBy` (string): 'date' | 'name'
- `order` (string): 'asc' | 'desc'

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "planner123",
      "userId": {
        "_id": "user123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "employeeId": "EMP001"
      },
      "weekCreatedAt": "2024-01-08T00:00:00.000Z",
      "days": [
        {
          "day": "Monday",
          "date": "2024-01-08",
          "place": "Nairobi CBD",
          "means": "Matatu",
          "allowance": "1500",
          "prospects": "3 client meetings"
        },
        // ... 4 more days
      ],
      "notes": "Focus on new leads this week"
    }
  ],
  "meta": {
    "totalDocs": 15,
    "totalPages": 2,
    "currentPage": 1,
    "limit": 10
  }
}
```

## Usage

### 1. Navigate to Planners
From the dashboard, click:
- "Planners" button in top navigation (desktop)
- "Weekly Planners" in Quick Actions sidebar

### 2. View Planners
- Default view shows current week's planners
- Each planner card displays user info and 5-day schedule
- See weekly allowance totals per user

### 3. Navigate Weeks
- Click **Previous Week** (←) or **Next Week** (→) buttons
- Click "Current Week" to jump to present week
- Week range displayed in center

### 4. Filter by User
- Select user from dropdown menu
- Choose "All Users" to see everyone
- Statistics update automatically

### 5. Sort Results
- Toggle between "Sort by Date" and "Sort by Name"
- Click arrow button to reverse order (asc/desc)
- Results re-fetch automatically

### 6. Refresh Data
- Click refresh button (↻) to reload planners
- Button shows spinning animation during load

## Currency Formatting
All allowances displayed in **Kenyan Shillings (KES)**:
- Format: `KES 1,500` (no decimals for whole amounts)
- Uses `Intl.NumberFormat('en-KE', { currency: 'KES' })`

## State Management
- React hooks for state (useState, useEffect)
- Auto-fetch on dependency changes:
  - Week navigation
  - User selection
  - Sort settings
- Loading states with spinners
- Error handling with user-friendly messages

## Mobile Responsiveness
- **Desktop:** 5-column day grid
- **Tablet:** 2-column day grid
- **Mobile:** 1-column day grid (stacked)
- Touch-friendly button sizes
- Responsive navigation controls

## Performance Considerations
- Default limit: 100 planners per fetch
- Week-based date filtering reduces payload
- Efficient state updates (single dependency triggers)
- Memoization opportunities for allowance calculations

## Future Enhancements
1. **Export Functionality**
   - CSV/Excel export of weekly planners
   - Allowance reports for accounting

2. **Pagination**
   - Add page controls for > 100 planners
   - Use meta.totalPages for navigation

3. **Advanced Filters**
   - Date range picker (multi-week view)
   - Region filter
   - Role filter

4. **Analytics**
   - Allowance trends over time
   - Top locations visited
   - Transport cost analysis

5. **Edit Capabilities**
   - Admin inline editing of planners
   - Approval workflow
   - Allowance adjustments

## Testing Checklist
- [ ] Week navigation (prev/next/current)
- [ ] User filtering (all/specific)
- [ ] Sort by date (asc/desc)
- [ ] Sort by name (asc/desc)
- [ ] Refresh functionality
- [ ] Loading states
- [ ] Error handling (no auth, API failure)
- [ ] Empty state (no planners)
- [ ] Currency formatting (KES)
- [ ] Allowance calculations
- [ ] Responsive layouts
- [ ] Back to home navigation

## Dependencies
- **React:** 18+
- **Next.js:** 14.2+
- **Lucide React:** Icons
- **TypeScript:** 5+
- **Tailwind CSS:** Styling

## Build Output
Route: `/dashboard/planners`  
Size: **4.65 kB**  
First Load JS: **91.9 kB**

---

**Last Updated:** 2024-01-12  
**Version:** 1.0.0  
**Author:** ACCORD Admin Team
