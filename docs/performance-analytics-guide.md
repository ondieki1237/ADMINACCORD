# Performance Analytics Integration Guide

## Overview

The Performance Analytics feature integrates Python-powered analytics into the ADMINACCORD dashboard, providing comprehensive insights through interactive visualizations, charts, and Excel reports.

## Features

- **Interactive Dashboard**: Real-time HTML dashboards with multiple metrics
- **Visual Charts**: Performance trends, sales data, and activity metrics
- **Excel Reports**: Downloadable comprehensive reports
- **Automated Generation**: Schedule-based or on-demand analytics
- **Multiple Time Ranges**: Analyze data for 7, 30, or 90 days

## Access

The Performance Analytics button is located in the main Dashboard toolbar, highlighted with a primary gradient background.

### Navigation
```
Dashboard → Performance (button in toolbar)
```

## Components

### 1. Performance Analytics Component
**File**: `/components/dashboard/performance-analytics.tsx`

**Features**:
- Status monitoring (last updated, generation status, available files)
- Analytics generation controls (7, 30, 90 days)
- Tabbed interface (Dashboard, Charts, Interactive)
- Excel report download
- Real-time status polling during generation

### 2. Dashboard Integration
**File**: `/components/dashboard/dashboard-overview.tsx`

**Changes**:
- Added Performance button to toolbar
- State management for showing/hiding performance view
- Import of PerformanceAnalytics component

## API Integration

### Base URL
```
https://app.codewithseth.co.ke/api/analytics
```

### Key Endpoints Used

#### 1. Get Status
```typescript
GET /api/analytics/status
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "lastUpdated": "2025-10-19T10:30:00Z",
    "isGenerating": false,
    "hasData": true
  }
}
```

#### 2. Generate Analytics
```typescript
POST /api/analytics/generate?daysBack=30
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Analytics generation started",
  "status": "processing"
}
```

#### 3. Get Visualizations List
```typescript
GET /api/analytics/visualizations
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "name": "dashboard_20251019_103045.html",
      "type": "html",
      "size": 524288,
      "createdAt": "2025-10-19T10:30:45Z",
      "url": "/api/analytics/files/dashboard_20251019_103045.html"
    },
    ...
  ]
}
```

#### 4. Download Excel Report
```typescript
GET /api/analytics/report/latest
Authorization: Bearer <token>

Response: Excel file (.xlsx)
```

#### 5. Get Interactive Dashboard
```typescript
GET /api/analytics/dashboard
Authorization: Bearer <token>

Response: HTML content
```

## Usage Guide

### For End Users

1. **Access Performance Analytics**
   - Click the "Performance" button in the Dashboard toolbar
   - Button has a gradient background for easy identification

2. **Check Status**
   - View last update time
   - Check if analytics are ready or being generated
   - See number of available visualizations

3. **Generate New Analytics**
   - Click one of the time range buttons:
     - "Last 7 Days" - Quick weekly overview
     - "Generate Analytics (30 Days)" - Standard monthly report
     - "Last 90 Days" - Quarterly analysis
   - Wait for generation to complete (status will update automatically)

4. **View Results**
   - **Dashboard Tab**: Interactive HTML dashboard with comprehensive metrics
   - **Charts Tab**: Static image charts (PNG format)
   - **Interactive Tab**: Interactive HTML visualizations

5. **Download Reports**
   - Click "Excel Report" button to download
   - File is automatically named with current date
   - Contains comprehensive data tables and summaries

### For Developers

#### Adding Custom Analytics

1. **Backend**: Add new Python analytics scripts in the analytics folder
2. **Frontend**: Update visualization rendering in `performance-analytics.tsx`

Example:
```typescript
// Add custom visualization type
const customVisualizations = visualizations.filter(v => 
  v.name.includes('custom_metric')
)

// Render custom visualization
{customVisualizations.map(viz => (
  <CustomVisualization key={viz.name} data={viz} />
))}
```

#### Customizing Time Ranges

```typescript
// Add new time range button
<Button
  onClick={() => generateAnalytics(180)}  // 6 months
  disabled={isGenerating}
  variant="outline"
  size="sm"
>
  <Calendar className="h-4 w-4 mr-2" />
  Last 6 Months
</Button>
```

#### Modifying Polling Behavior

```typescript
// Current: Poll every 5 seconds
const pollInterval = setInterval(async () => {
  // Check status
}, 5000)

// Customize: Poll every 10 seconds
const pollInterval = setInterval(async () => {
  // Check status
}, 10000)
```

## State Management

### Component States

```typescript
interface AnalyticsStatus {
  lastUpdated: string | null
  isGenerating: boolean
  hasData: boolean
}

interface Visualization {
  name: string
  type: 'image' | 'html' | 'excel'
  size: number
  createdAt: string
  url: string
}

// Local states
const [status, setStatus] = useState<AnalyticsStatus | null>(null)
const [visualizations, setVisualizations] = useState<Visualization[]>([])
const [dashboardUrl, setDashboardUrl] = useState<string>("")
const [isLoading, setIsLoading] = useState(false)
const [isGenerating, setIsGenerating] = useState(false)
```

## Error Handling

### Authentication Errors
```typescript
if (!token) {
  throw new Error("Authentication required")
}
```

### API Errors
```typescript
try {
  const response = await makeAnalyticsRequest('/endpoint')
  // Handle response
} catch (error) {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive",
  })
}
```

### No Data State
```typescript
{!status?.hasData && !isGenerating && (
  <Card>
    <CardContent>
      <h3>No Analytics Data</h3>
      <p>Generate analytics to view insights</p>
      <Button onClick={() => generateAnalytics(30)}>
        Generate Analytics Now
      </Button>
    </CardContent>
  </Card>
)}
```

## UI Components Used

- **Card**: Container for content sections
- **Button**: Actions and navigation
- **Badge**: Status indicators
- **Tabs**: Organize different visualization types
- **Separator**: Visual dividers
- **Toast**: User notifications
- **Icons**: Lucide React icons

## Styling

### Custom Styling
```typescript
// Gradient button
className="bg-gradient-to-r from-primary/10 to-primary/5"

// Iframe container
className="w-full h-[800px] border rounded-lg overflow-hidden"

// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 gap-4"
```

## Performance Considerations

1. **Lazy Loading**: Iframes load content on demand
2. **Caching**: Status and visualizations cached in state
3. **Polling**: Automatic polling stops after 5 minutes
4. **Image Optimization**: Charts served from backend
5. **Responsive Design**: Mobile-friendly layouts

## Security

1. **JWT Authentication**: All requests include Bearer token
2. **Authorization Headers**: Token validation on every request
3. **Secure URLs**: Analytics files require authentication
4. **CORS**: Configured for localhost development

## Troubleshooting

### Analytics Not Generating
1. Check Python analytics server is running on port 4500
2. Verify token is valid and not expired
3. Check network tab for API errors
4. Ensure user has proper permissions

### Visualizations Not Loading
1. Check if analytics have been generated
2. Verify ANALYTICS_BASE_URL is correct
3. Check browser console for errors
4. Ensure iframe src URLs are valid

### Download Failing
1. Check browser download settings
2. Verify token is included in request
3. Check if Excel file exists on backend
4. Review network response for errors

## Future Enhancements

- [ ] Add real-time updates via WebSockets
- [ ] Implement caching with React Query
- [ ] Add export to PDF functionality
- [ ] Create scheduled report emails
- [ ] Add custom date range picker
- [ ] Implement data filtering options
- [ ] Add comparison views (period over period)
- [ ] Create shareable dashboard links

## References

- [Python Analytics API Documentation](/docs/python.md)
- [Dashboard Overview Component](/components/dashboard/dashboard-overview.tsx)
- [Performance Analytics Component](/components/dashboard/performance-analytics.tsx)

---

**Last Updated**: October 19, 2025  
**Version**: 1.0.0