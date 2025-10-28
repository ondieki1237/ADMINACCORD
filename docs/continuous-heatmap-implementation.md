# Continuous Heatmap Implementation Guide

## Overview
The admin heatmap has been updated to support continuous location tracking with live polling mode. The system now fetches location tracks from the new `/api/admin/location` endpoint and displays them on the map in real-time.

## Files Modified

### 1. `/lib/locationStream.ts` (NEW)
TypeScript helper module providing:
- `fetchAdminTracks()` - Fetches paginated location tracks from admin API
- `flattenAndSortPoints()` - Flattens track batches and sorts by timestamp
- `toLatLng()` - Converts LocationPoint to Leaflet LatLng format
- `startPollingTracks()` - Starts polling loop for live updates (returns stop function)
- `connectLocationSocket()` - Optional Socket.IO connection (requires `socket.io-client` package)

### 2. `/components/dashboard/sales-heatmap.tsx` (MODIFIED)
Updated to use continuous tracking API:
- Replaced old `/dashboard/heatmap/live` endpoint with `/admin/location`
- Added `liveMode` toggle (replaces `autoRefresh`)
- Implements polling every 5 seconds when live mode is ON
- Uses `tracksMap` (Map<string, LocationTrack>) for deduplication
- Converts LocationTrack format to legacy Trail format for rendering
- Merges new tracks incrementally without re-fetching everything

## API Endpoints

### Admin Location Endpoint
**GET** `https://app.codewithseth.co.ke/api/admin/location`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `userId` (optional) - Filter by specific user
- `from` (optional) - ISO date string, filters syncedAt >= from
- `to` (optional) - ISO date string, filters syncedAt <= to

**Headers:**
- `Authorization: Bearer <ADMIN_JWT>`
- `Content-Type: application/json`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "track123",
      "userId": {
        "_id": "user456",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "employeeId": "EMP001"
      },
      "locations": [
        {
          "latitude": -1.2921,
          "longitude": 36.8219,
          "accuracy": 8,
          "timestamp": "2025-10-28T10:00:00.000Z",
          "speed": 0.5,
          "heading": 120,
          "altitude": 1650
        }
      ],
      "deviceInfo": {
        "userAgent": "Mozilla/5.0...",
        "platform": "web",
        "timestamp": "2025-10-28T10:00:01.000Z"
      },
      "syncedAt": "2025-10-28T10:00:02.000Z",
      "createdAt": "2025-10-28T10:00:02.000Z",
      "updatedAt": "2025-10-28T10:00:02.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "totalDocs": 150,
    "totalPages": 3
  }
}
```

## Features Implemented

### 1. Live Mode Toggle
- Button with Radio icon that toggles between ON/OFF
- When ON: polls every 5 seconds for new tracks
- When OFF: stops polling
- Visual indicator: green background + pulsing icon when live

### 2. Polling Strategy
- Uses `startPollingTracks()` helper
- Fetches only new tracks by passing `from=lastSyncedAt` query param
- Merges new tracks into existing `tracksMap` (deduplication by track `_id`)
- Automatically handles errors with console warnings (non-blocking)
- Cleanup on unmount or when live mode disabled

### 3. Track Deduplication
- Uses `Map<string, LocationTrack>` keyed by track `_id`
- New tracks overwrite old ones with same ID
- Prevents duplicate rendering

### 4. User Filtering
- Dropdown selector to filter trails by specific user
- Applies filter to both initial fetch and polling
- Shows "All Trails" by default

### 5. Data Conversion
- Converts `LocationTrack` format (latitude/longitude) to legacy `Trail` format (lat/lng)
- Groups locations by userId
- Preserves user metadata (name, employeeId, region)

## UI Controls

### Header Section
- **Live Toggle** - Enable/disable continuous polling (5s interval)
- **Refresh Button** - Manual refresh to fetch latest data
- **Active Points Counter** - Shows total location points across all trails
- **Last Updated** - Timestamp of most recent data fetch

### Sidebar
- **Active Trails List** - Shows all users with trail count, distance
- **User Filter Dropdown** - Select specific user or "All Trails"
- **Points List** - Detailed lat/lng coordinates for filtered trails
- **Hospital Toggle** - Show/hide hospital markers
- **Total Distance** - Sum of all trail distances

### Map
- **Polylines** - Colored trails for each user
- **Markers** - Location pins at each point with popup info
- **Heatmap Layer** - Density visualization using leaflet.heat
- **Hospital Markers** - Red hospital icons (toggle-able)

## Performance Considerations

1. **Pagination**: Default limit is 200 for initial fetch, 100 for polling
2. **Incremental Updates**: Only new tracks fetched when polling (using `from` param)
3. **Client-side Filtering**: User selection doesn't re-fetch, just filters rendered data
4. **Memoization**: Uses `useMemo` for derived data (trails, userList, filteredTrails)
5. **Abort Controllers**: Cancels in-flight requests when polling stops

## Error Handling

- 401 Unauthorized → Shows "No auth token" error
- 403 Forbidden → User not admin
- 400 Bad Request → Invalid query params
- 500 Server Error → Logs warning, continues polling
- Network errors → Swallowed with console.warn, polling continues

## Future Enhancements (Optional)

### Socket.IO Real-time Updates (Optional - Currently Disabled)
The `connectLocationSocket()` function is commented out in `lib/locationStream.ts` to avoid build errors.

To enable real-time push updates instead of polling:

1. Install socket.io-client:
```bash
npm install socket.io-client
```

2. Uncomment the `connectLocationSocket()` function in `/lib/locationStream.ts`

3. Server-side: emit event when track saved:
```js
// In trackLocation controller after saving
io.emit('location:track', populatedTrack);
```

4. Client-side: import and use in heatmap component:
```ts
import { connectLocationSocket } from '@/lib/locationStream';

// In component
const disconnect = await connectLocationSocket({
  url: 'https://app.codewithseth.co.ke',
  token: localStorage.getItem('accessToken'),
  onTrack: (track) => mergeTracks([track])
});

// Cleanup
return () => disconnect();
```

### Date Range Picker
Add `from` and `to` date inputs to filter historical data:
```tsx
<input type="date" onChange={(e) => setFromDate(e.target.value)} />
<input type="date" onChange={(e) => setToDate(e.target.value)} />
```

### Pagination Controls
Add next/prev buttons for browsing historical pages:
```tsx
<button onClick={() => setPage(page - 1)}>Previous</button>
<span>Page {page} of {totalPages}</span>
<button onClick={() => setPage(page + 1)}>Next</button>
```

## Testing

1. Start dev server: `npm run dev`
2. Navigate to `/dashboard/sales-heatmap`
3. Verify initial data loads (200 most recent tracks)
4. Toggle "Live: ON" and verify polling starts
5. Check browser console for "Polling tracks failed" warnings (if any)
6. Select a specific user from dropdown
7. Verify map updates with filtered trails
8. Toggle "Live: OFF" and verify polling stops

## Troubleshooting

**No data showing:**
- Check browser console for API errors
- Verify `accessToken` exists in localStorage
- Confirm user has admin role
- Check server logs for `/api/admin/location` endpoint

**Polling not working:**
- Verify live toggle is ON (green background)
- Check browser console for polling errors
- Ensure no ad blockers interfering with fetch requests
- Verify token hasn't expired

**Map not rendering:**
- Leaflet CSS must be imported
- Ensure component wrapped in dynamic import with `ssr: false`
- Check browser console for Leaflet errors

## Dependencies

- `react-leaflet` - Map rendering
- `leaflet` - Core mapping library
- `leaflet.heat` - Heatmap layer
- `socket.io-client` - (Optional) Real-time updates

## Related Files

- `/lib/locationStream.ts` - Helper utilities
- `/components/dashboard/sales-heatmap.tsx` - Main component
- `/components/dashboard/HospitalLayer.tsx` - Hospital markers
- `/app/dashboard/sales-heatmap/page.tsx` - Route wrapper
