# Road-Snapped Polylines Implementation Guide

## 🎯 Goal
Convert GPS trail points into polylines that follow actual road routes instead of straight lines between coordinates.

---

## 📋 What You'll Need

### 1. **Routing/Directions API Service**

You have several options:

#### Option A: **Google Maps Directions API** (Recommended - Best accuracy)
- ✅ Excellent road data for Kenya
- ✅ Accurate route snapping
- ✅ Real-time traffic data
- ❌ Costs money (but has free tier)
- 💰 **Pricing**: $5 per 1,000 requests (first $200/month free)

#### Option B: **Mapbox Directions API** (Good alternative)
- ✅ Good road data
- ✅ Nice styling options
- ✅ Better pricing than Google
- ❌ Slightly less accurate in some regions
- 💰 **Pricing**: $0.50 per 1,000 requests (first 100,000 free/month)

#### Option C: **OpenRouteService** (Free option)
- ✅ Completely free up to 2,000 requests/day
- ✅ Open source
- ✅ Decent road data
- ❌ Less accurate than Google/Mapbox
- 💰 **Pricing**: FREE (2,000 requests/day)

#### Option D: **OSRM (Open Source Routing Machine)** (Self-hosted)
- ✅ Completely free
- ✅ Self-hosted = unlimited requests
- ✅ Fast routing
- ❌ Requires server setup and maintenance
- ❌ Need to download/update map data
- 💰 **Pricing**: FREE (but infrastructure costs)

---

## 🏗️ Implementation Options

### **Option 1: Real-Time Route Snapping** (On-Demand)
When user views a trail, snap it to roads in real-time.

**Pros:**
- Always uses latest road data
- No preprocessing needed
- Accurate routes

**Cons:**
- Requires API calls every time trail is viewed
- Can be slow if many points
- Costs money (API charges)

---

### **Option 2: Batch Processing & Storage** (Recommended)
Process trails once and store snapped routes in database.

**Pros:**
- Fast loading (no API calls on view)
- One-time API cost per trail
- Can process overnight
- Better user experience

**Cons:**
- Requires database schema changes
- Initial processing time
- Routes don't update if roads change

---

### **Option 3: Hybrid Approach** (Best Balance)
Store snapped routes, but regenerate if trail data changes.

**Pros:**
- Fast most of the time
- Always accurate
- Cache benefits

**Cons:**
- More complex implementation
- Requires cache management

---

## 🛠️ Recommended Solution: **Mapbox Directions API with Batch Processing**

I recommend **Mapbox** because:
- ✅ Better pricing than Google
- ✅ 100,000 free requests/month (enough for testing and small scale)
- ✅ Good accuracy in Kenya
- ✅ Easy to implement
- ✅ Nice map styling

---

## 📐 Technical Architecture

### 1. **Database Schema Updates**

Add snapped route data to your Trail model:

```javascript
// Backend - Update Trail/EngineeringService model
{
  // Existing fields...
  path: {
    coordinates: [[lng, lat], [lng, lat], ...],  // Original GPS points
  },
  
  // NEW FIELDS for road-snapped routes
  snappedRoute: {
    coordinates: [[lng, lat], [lng, lat], ...],  // Snapped to roads
    distance: Number,      // Total distance in meters
    duration: Number,      // Estimated duration in seconds
    processedAt: Date,     // When snapping was done
    provider: String       // 'mapbox', 'google', 'osrm', etc.
  }
}
```

---

### 2. **Frontend Dependencies**

```bash
npm install @mapbox/polyline
npm install @turf/turf  # For geospatial calculations
```

---

### 3. **Backend API Endpoint**

Create endpoint to snap routes:

```javascript
// routes/trails.js

const axios = require('axios');
const polyline = require('@mapbox/polyline');

// POST /api/trails/:id/snap-route
// Snap trail to roads using Mapbox
router.post('/:id/snap-route', authenticate, async (req, res) => {
  try {
    const trail = await Trail.findById(req.params.id);
    
    if (!trail) {
      return res.status(404).json({ success: false, message: 'Trail not found' });
    }

    // Get coordinates from trail
    const coordinates = trail.path.coordinates;
    
    if (coordinates.length < 2) {
      return res.status(400).json({ success: false, message: 'Need at least 2 points' });
    }

    // Mapbox Directions API can handle up to 25 waypoints
    // If more, we need to split into segments
    const maxWaypoints = 25;
    const snappedSegments = [];
    
    for (let i = 0; i < coordinates.length; i += maxWaypoints - 1) {
      const segment = coordinates.slice(i, i + maxWaypoints);
      
      // Format: lng,lat;lng,lat;lng,lat
      const waypointsString = segment
        .map(coord => `${coord[0]},${coord[1]}`)
        .join(';');

      // Call Mapbox Directions API
      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${waypointsString}`,
        {
          params: {
            access_token: process.env.MAPBOX_ACCESS_TOKEN,
            geometries: 'polyline6',  // Encoded polyline format
            overview: 'full',
            steps: false
          }
        }
      );

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        
        // Decode polyline to coordinates
        const decodedCoords = polyline.decode(route.geometry, 6);
        snappedSegments.push({
          coordinates: decodedCoords.map(coord => [coord[1], coord[0]]), // [lng, lat]
          distance: route.distance,
          duration: route.duration
        });
      }
    }

    // Merge segments
    const allCoordinates = snappedSegments.flatMap(seg => seg.coordinates);
    const totalDistance = snappedSegments.reduce((sum, seg) => sum + seg.distance, 0);
    const totalDuration = snappedSegments.reduce((sum, seg) => sum + seg.duration, 0);

    // Update trail with snapped route
    trail.snappedRoute = {
      coordinates: allCoordinates,
      distance: totalDistance,
      duration: totalDuration,
      processedAt: new Date(),
      provider: 'mapbox'
    };

    await trail.save();

    res.json({
      success: true,
      data: {
        coordinates: allCoordinates,
        distance: totalDistance,
        duration: totalDuration
      }
    });

  } catch (error) {
    console.error('Error snapping route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to snap route',
      error: error.message
    });
  }
});

// Batch process all trails
router.post('/snap-all-routes', authenticate, isAdmin, async (req, res) => {
  try {
    const trails = await Trail.find({ 
      'snappedRoute.coordinates': { $exists: false } 
    });

    let processed = 0;
    let failed = 0;

    for (const trail of trails) {
      try {
        // Process each trail (same logic as above)
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 200)); // 5 requests/sec
        processed++;
      } catch (err) {
        failed++;
      }
    }

    res.json({
      success: true,
      message: `Processed ${processed} trails, ${failed} failed`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

### 4. **Frontend Implementation**

Update your sales heatmap component:

```typescript
// components/dashboard/sales-heatmap.tsx

interface Trail {
  user: UserInfo;
  path: TrailPoint[];
  snappedRoute?: {
    coordinates: [number, number][]; // [lng, lat]
    distance: number;
    duration: number;
  };
}

// Add function to snap route on frontend (fallback)
async function snapRouteToRoads(coordinates: [number, number][]): Promise<[number, number][]> {
  if (coordinates.length < 2) return coordinates;

  try {
    // Limit to 25 waypoints per request
    const maxWaypoints = 25;
    const allSnappedCoords: [number, number][] = [];

    for (let i = 0; i < coordinates.length; i += maxWaypoints - 1) {
      const segment = coordinates.slice(i, i + maxWaypoints);
      
      const waypointsString = segment
        .map(coord => `${coord[0]},${coord[1]}`)
        .join(';');

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${waypointsString}?` +
        `access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&` +
        `geometries=geojson&overview=full&steps=false`
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeCoords = data.routes[0].geometry.coordinates;
        allSnappedCoords.push(...routeCoords);
      }
    }

    return allSnappedCoords;
  } catch (error) {
    console.error('Error snapping route:', error);
    return coordinates; // Fallback to original
  }
}

// In your component render
{trails.map((trail, idx) => {
  // Use snapped route if available, otherwise original path
  const routeCoords = trail.snappedRoute 
    ? trail.snappedRoute.coordinates.map(c => [c[1], c[0]]) // Convert [lng,lat] to [lat,lng]
    : trail.path.map(p => [p.lat, p.lng]);

  return (
    <Polyline
      key={idx}
      positions={routeCoords}
      color={COLORS[idx % COLORS.length]}
      weight={4}
      opacity={0.7}
    >
      <Popup>
        <div>
          <strong>{trail.user.name}</strong><br />
          Distance: {trail.snappedRoute 
            ? `${(trail.snappedRoute.distance / 1000).toFixed(2)} km` 
            : `${trailDistance(trail.path).toFixed(2)} km`
          }<br />
          {trail.snappedRoute && (
            <>Duration: {Math.round(trail.snappedRoute.duration / 60)} min<br /></>
          )}
          Points: {trail.path.length}
        </div>
      </Popup>
    </Polyline>
  );
})}
```

---

### 5. **Frontend API Methods**

Add to your api.ts:

```typescript
// lib/api.ts

class ApiService {
  // ... existing methods

  async snapTrailToRoads(trailId: string): Promise<any> {
    return this.makeRequest(`/trails/${trailId}/snap-route`, {
      method: 'POST'
    });
  }

  async batchSnapAllTrails(): Promise<any> {
    return this.makeRequest('/trails/snap-all-routes', {
      method: 'POST'
    });
  }
}
```

---

## 💰 Cost Analysis

### For 1,000 trails with average 50 GPS points each:

| Provider | Setup Cost | Per Trail | Total 1k Trails |
|----------|-----------|-----------|-----------------|
| **Mapbox** | $0 | $0.001 | **$1.00** |
| **Google Maps** | $0 | $0.005 | **$5.00** |
| **OpenRouteService** | $0 | $0 | **FREE** |
| **OSRM (Self-hosted)** | $50/month server | $0 | **$50/month** |

**Recommendation**: Start with **Mapbox** - you get 100k free requests/month!

---

## 🚀 Implementation Steps

### **Step 1: Get Mapbox Account**
1. Sign up at https://www.mapbox.com
2. Get your access token
3. Add to `.env`:
   ```
   MAPBOX_ACCESS_TOKEN=pk.your_token_here
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
   ```

### **Step 2: Update Database Schema**
- Add `snappedRoute` field to Trail model
- Run migration

### **Step 3: Add Backend Endpoint**
- Copy snap-route endpoint code
- Test with Postman

### **Step 4: Update Frontend**
- Add Mapbox token to environment
- Update Trail interface
- Modify Polyline rendering to use snappedRoute

### **Step 5: Batch Process Existing Trails**
- Run batch processing script
- Monitor progress
- Verify results on map

### **Step 6: Automate for New Trails**
- Add snap-route call to trail creation
- Process in background job
- Add retry logic

---

## 🎨 Advanced Features (Optional)

### 1. **Different Transport Modes**
```javascript
// Mapbox supports: driving, walking, cycling, driving-traffic
const mode = 'driving'; // or 'walking' for field visits
const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/...`;
```

### 2. **Avoid Highways**
```javascript
params: {
  exclude: 'toll,motorway',  // Avoid tolls and highways
}
```

### 3. **Alternative Routes**
```javascript
params: {
  alternatives: true,  // Get 2-3 alternative routes
}
```

### 4. **Color by Speed/Time**
```typescript
// Color polylines based on time of day or speed
const getColorBySpeed = (avgSpeed: number) => {
  if (avgSpeed > 60) return '#10b981'; // Green - fast
  if (avgSpeed > 30) return '#f59e0b'; // Yellow - medium
  return '#ef4444'; // Red - slow/traffic
};
```

### 5. **Animated Polyline**
```typescript
// Show direction of travel with animated dashes
<Polyline
  positions={routeCoords}
  color="#2563eb"
  weight={4}
  dashArray="10, 10"
  dashOffset="0"
  className="animate-dash"
/>
```

---

## 📊 Performance Optimization

### 1. **Point Simplification**
Reduce GPS points before snapping to save API calls:

```typescript
import simplify from '@turf/simplify';

// Simplify trail to reduce API calls
function simplifyTrail(coordinates: [number, number][], tolerance = 0.001) {
  const line = turf.lineString(coordinates);
  const simplified = simplify(line, { tolerance, highQuality: false });
  return simplified.geometry.coordinates;
}
```

### 2. **Caching**
```typescript
// Cache snapped routes in localStorage for quick access
const cacheKey = `snapped_route_${trailId}`;
const cached = localStorage.getItem(cacheKey);
if (cached) {
  return JSON.parse(cached);
}
```

### 3. **Background Processing**
```javascript
// Process trails in background queue
const Queue = require('bull');
const snapQueue = new Queue('snap-routes');

snapQueue.process(async (job) => {
  const { trailId } = job.data;
  await snapTrailToRoads(trailId);
});
```

---

## 🧪 Testing

### Test with sample trail:
```javascript
// Sample Nairobi route
const testTrail = {
  coordinates: [
    [36.8219, -1.2921],  // CBD
    [36.8167, -1.2864],  // University Way
    [36.8195, -1.2797],  // Westlands
  ]
};

// Should return route following roads
```

---

## 📱 Mobile Considerations

If using Capacitor mobile app:
- ✅ Store snapped routes locally
- ✅ Sync when online
- ✅ Show original GPS path if offline
- ✅ Queue snap requests for later

---

## 🎯 Summary

**What you need:**
1. ✅ Mapbox account (or alternative)
2. ✅ Update database schema (add snappedRoute field)
3. ✅ Backend endpoint to snap routes
4. ✅ Frontend code to render snapped polylines
5. ✅ Batch processing script

**Time estimate:**
- Setup: 1 hour
- Backend: 2-3 hours
- Frontend: 1-2 hours
- Testing: 1 hour
- **Total: ~6 hours**

**Cost:**
- $0 for first 100k trails/month with Mapbox
- After that: ~$1 per 1,000 trails

---

## 🚦 Quick Start Command

```bash
# Install dependencies
npm install @mapbox/polyline axios

# Add environment variable
echo "MAPBOX_ACCESS_TOKEN=your_token" >> .env
echo "NEXT_PUBLIC_MAPBOX_TOKEN=your_token" >> .env

# Ready to implement!
```

---

**This will make your trail visualization look professional and follow actual road routes! 🛣️**

Let me know if you want me to help implement any specific part!
