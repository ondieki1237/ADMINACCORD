"use client";

// Haversine formula to calculate distance between two lat/lng points in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate total distance for a trail
function trailDistance(path: TrailPoint[]): number {
  let dist = 0;
  for (let i = 1; i < path.length; i++) {
    dist += haversineDistance(path[i-1].lat, path[i-1].lng, path[i].lat, path[i].lng);
  }
  return dist;
}
// Color palette for polylines
const COLORS = [
  '#2563eb', // blue-600
  '#10b981', // green-500
  '#f59e42', // yellow-500
  '#ef4444', // red-500
  '#a21caf', // purple-700
  '#f43f5e', // pink-500
  '#0ea5e9', // sky-500
  '#eab308', // amber-500
];
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { RefreshCw, MapPin, Activity, Radio, ArrowLeft, Calendar, Clock, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import HospitalLayer from "./HospitalLayer";
import { 
  fetchAdminTracks, 
  flattenAndSortPoints, 
  startPollingTracks, 
  type LocationTrack 
} from '@/lib/locationStream';

// Extend the Leaflet Map type to include heatLayer
declare module 'leaflet' {
  interface Map {
    heatLayer?: any;
  }
}

interface TrailPoint {
  lat: number;
  lng: number;
  timestamp?: number; // Unix timestamp in milliseconds
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface UserInfo {
  id: string;
  employeeId: string;
  name: string;
  region: string;
}

interface Trail {
  user: UserInfo;
  path: TrailPoint[];
}

interface ApiResponse {
  success: boolean;
  data: Trail[];
}

// Component to handle heatmap layer
const HeatmapLayer: React.FC<{ data: HeatmapPoint[] }> = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    if (map.heatLayer) {
      map.removeLayer(map.heatLayer);
    }

    if (data.length > 0) {
      const heatPoints = data.map(point => [point.lat, point.lng, point.intensity]);

      const heatLayer = (L as any).heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 12,
        gradient: {
          0.0: '#3B82F6',
          0.2: '#10B981',
          0.4: '#F59E0B',
          0.6: '#EF4444',
          0.8: '#DC2626',
          1.0: '#991B1B'
        }
      });

      heatLayer.addTo(map);
      map.heatLayer = heatLayer;
    }

    return () => {
      if (map.heatLayer) {
        map.removeLayer(map.heatLayer);
        map.heatLayer = undefined;
      }
    };
  }, [data, map]);

  return null;
};

const HeatmapDashboard: React.FC = () => {
  const router = useRouter();
  
  // State for continuous tracking
  const [tracksMap, setTracksMap] = useState<Map<string, LocationTrack>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveMode, setLiveMode] = useState<boolean>(false);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('today');
  
  const pollingStopperRef = useRef<(() => void) | null>(null);

  // Day options
  const dayOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: '2days', label: '2 Days Ago' },
    { value: '3days', label: '3 Days Ago' },
    { value: 'week', label: 'Past Week' },
    { value: 'all', label: 'All Time' }
  ];

  // Calculate date range based on selected day
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedDay) {
      case 'today':
        return { 
          from: today.toISOString(),
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          from: yesterday.toISOString(),
          to: today.toISOString()
        };
      case '2days':
        const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
        return {
          from: twoDaysAgo.toISOString(),
          to: new Date(twoDaysAgo.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case '3days':
        const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
        return {
          from: threeDaysAgo.toISOString(),
          to: new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          from: weekAgo.toISOString(),
          to: new Date().toISOString()
        };
      case 'all':
      default:
        return { from: undefined, to: undefined };
    }
  };
  
  // Convert tracks to legacy Trail format for rendering
  // Important: Sort by timestamp to connect points in chronological order
  const trails = useMemo(() => {
    const allTracks = Array.from(tracksMap.values());
    const userTrailsMap = new Map<string, Trail>();
    
    allTracks.forEach(track => {
      const userId = typeof track.userId === 'object' ? track.userId._id : track.userId;
      const userName = typeof track.userId === 'object' 
        ? `${track.userId.firstName || ''} ${track.userId.lastName || ''}`.trim() 
        : userId;
      const employeeId = typeof track.userId === 'object' ? track.userId.employeeId : userId;
      
      if (!userTrailsMap.has(userId)) {
        userTrailsMap.set(userId, {
          user: {
            id: userId,
            employeeId: employeeId || userId,
            name: userName || 'Unknown User',
            region: 'N/A'
          },
          path: []
        });
      }
      
      const trail = userTrailsMap.get(userId)!;
      // Collect locations with timestamps for sorting
      track.locations.forEach(loc => {
        const timestamp = typeof loc.timestamp === 'number' 
          ? loc.timestamp 
          : new Date(String(loc.timestamp)).getTime();
        
        trail.path.push({
          lat: loc.latitude,
          lng: loc.longitude,
          timestamp
        });
      });
    });
    
    // Sort each user's path by timestamp to ensure chronological order
    userTrailsMap.forEach(trail => {
      trail.path.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    });
    
    return Array.from(userTrailsMap.values());
  }, [tracksMap]);
  
  const userList = useMemo(() => trails.map(trail => trail.user), [trails]);
  const filteredTrails = useMemo(() => 
    selectedUserId ? trails.filter(trail => trail.user.id === selectedUserId) : trails,
    [trails, selectedUserId]
  );

  // Get last synced timestamp for polling
  const getLastSyncedAt = () => {
    const allTracks = Array.from(tracksMap.values());
    if (allTracks.length === 0) return undefined;
    
    const sorted = allTracks
      .filter(t => t.syncedAt)
      .sort((a, b) => new Date(b.syncedAt!).getTime() - new Date(a.syncedAt!).getTime());
    
    return sorted[0]?.syncedAt;
  };

  // Merge new tracks into existing map
  const mergeTracks = (newTracks: LocationTrack[]) => {
    setTracksMap((m) => {
      const copy = new Map(m);
      for (const t of newTracks) {
        copy.set(t._id, t);
      }
      return copy;
    });
    setLastUpdated(new Date());
  };

  const fetchInitialData = async () => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No auth token found. Please log in.");
        setLoading(false);
        return;
      }

      const dateRange = getDateRange();

      const result = await fetchAdminTracks({
        baseUrl: 'https://app.codewithseth.co.ke/api',
        token,
        userId: selectedUserId || undefined,
        from: dateRange.from,
        to: dateRange.to,
        limit: 500,
        page: 1
      });

      if (result.success && Array.isArray(result.data)) {
        // Clear existing tracks when changing filters
        setTracksMap(new Map());
        mergeTracks(result.data);
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch location data");
      console.error("Error fetching location data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when filters change
  useEffect(() => {
    fetchInitialData();
  }, [selectedUserId, selectedDay]);

  // Start/stop polling when live mode toggles
  useEffect(() => {
    if (liveMode) {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No auth token for live mode");
        setLiveMode(false);
        return;
      }

      const stopper = startPollingTracks({
        intervalMs: 5000, // poll every 5 seconds
        onUpdate: mergeTracks,
        getLastSyncedAt,
        fetchOptions: {
          baseUrl: 'https://app.codewithseth.co.ke/api',
          token,
          userId: selectedUserId || undefined,
          limit: 100
        }
      });

      pollingStopperRef.current = stopper;

      return () => {
        stopper();
        pollingStopperRef.current = null;
      };
    } else {
      if (pollingStopperRef.current) {
        pollingStopperRef.current();
        pollingStopperRef.current = null;
      }
    }
  }, [liveMode, selectedUserId]);

  const handleManualRefresh = () => {
    fetchInitialData();
  };

  const toggleLiveMode = () => {
    setLiveMode(!liveMode);
  };

  // Custom icon using a location pin
  const locationIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // location icon
    iconSize: [30, 30],   // size of the icon
    iconAnchor: [15, 30], // point of the icon that corresponds to marker's location
    popupAnchor: [0, -28] // popup position relative to the icon
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar: Enhanced with better styling */}
      <aside className="w-96 bg-white shadow-xl flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 mb-4 text-blue-100 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
          <h2 className="text-2xl font-bold mb-2">Location Tracker</h2>
          <p className="text-blue-100 text-sm">Monitor field sales activities</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Day Selector */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Select Time Period</span>
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full border-2 border-blue-200 rounded-lg px-3 py-2.5 text-sm font-medium bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              {dayOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
              <Users className="h-4 w-4 text-purple-600" />
              <span>Filter by User</span>
            </label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value || null)}
              className="w-full border-2 border-purple-200 rounded-lg px-3 py-2.5 text-sm font-medium bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            >
              <option value="">All Users</option>
              {userList.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-1">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{userList.length}</div>
              <div className="text-xs text-gray-600 font-medium">Active Users</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-1">
                <MapPin className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {trails.reduce((acc, t) => acc + t.path.length, 0)}
              </div>
              <div className="text-xs text-gray-600 font-medium">Total Points</div>
            </div>
          </div>

          {/* Active Trails List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-700">Active Trails</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {userList.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No trails found for selected filters
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {userList.map((user, idx) => {
                    const trail = trails.find(t => t.user.id === user.id);
                    const dist = trail ? trailDistance(trail.path) : 0;
                    const color = COLORS[idx % COLORS.length];
                    return (
                      <li key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{user.name}</p>
                            <p className="text-xs text-gray-500">ID: {user.employeeId}</p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs text-gray-600">
                                <span className="font-medium">{trail?.path.length ?? 0}</span> points
                              </span>
                              <span className="text-xs text-gray-600">
                                <span className="font-medium">{dist.toFixed(1)}</span> km
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Points Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700">Points Timeline</h3>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {filteredTrails.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No points to display
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredTrails.flatMap(trail =>
                    trail.path.map((pt, i) => {
                      const userIdx = userList.findIndex(u => u.id === trail.user.id);
                      const color = COLORS[userIdx % COLORS.length];
                      const time = pt.timestamp ? new Date(pt.timestamp).toLocaleTimeString() : 'N/A';
                      const date = pt.timestamp ? new Date(pt.timestamp).toLocaleDateString() : 'N/A';
                      
                      return (
                        <li key={`${trail.user.id}-${i}`} className="p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-xs text-gray-700 truncate">
                                  {trail.user.name}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">{time}</span>
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {pt.lat.toFixed(4)}, {pt.lng.toFixed(4)}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">{date}</div>
                            </div>
                          </div>
                        </li>
                      );
                    })
                  ).sort((a, b) => {
                    // Sort by timestamp descending (most recent first)
                    const timeA = a.key?.split('-').pop() || '0';
                    const timeB = b.key?.split('-').pop() || '0';
                    return parseInt(timeB) - parseInt(timeA);
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Hospital Toggle */}
          <button
            onClick={() => setShowHospitals((prev) => !prev)}
            className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
              showHospitals
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-400 hover:from-red-600 hover:to-pink-600 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showHospitals ? "Hide" : "Show"} Hospital Locations
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-md px-6 py-5 flex justify-between items-center border-b-2 border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sales Heatmap</h1>
              <p className="text-gray-500 text-sm mt-0.5">Real-time field activity monitoring</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {lastUpdated && (
              <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500">Last updated</div>
                <div className="text-sm font-semibold text-gray-700">
                  {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            )}
            <button
              onClick={toggleLiveMode}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md border-2 ${
                liveMode
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400 hover:from-green-600 hover:to-emerald-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Radio className={`h-4 w-4 ${liveMode ? 'animate-pulse' : ''}`} />
              <span>Live {liveMode ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md font-semibold text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="relative h-[calc(100vh-140px)] bg-gray-100">
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-red-400 max-w-md">
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-1 rounded">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm mb-1">Error Loading Data</div>
                  <div className="text-sm opacity-90">{error}</div>
                </div>
              </div>
            </div>
          )}
          {loading && (
            <div className="absolute top-4 right-4 z-[1000] bg-white px-5 py-3 rounded-xl shadow-xl border-2 border-blue-200 flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm font-semibold text-gray-700">Loading locations...</span>
            </div>
          )}

          {/*
          // To debug bounds issues, you can temporarily use center/zoom instead of bounds:
          // <MapContainer center={[-1.286389, 36.817223]} zoom={7} className="h-full w-full">
          */}
          {/* Temporarily use center/zoom for debugging polyline visibility */}
          <MapContainer center={[-1.286389, 36.817223]} zoom={7} className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Hospital locations */}
            {showHospitals && <HospitalLayer />}

            {/* Heatmap Layer */}
            <HeatmapLayer
              data={trails.flatMap(trail =>
                trail.path.map(pt => ({
                  lat: pt.lat,
                  lng: pt.lng,
                  intensity: 1
                }))
              )}
            />

            {/* Trails */}
            {(selectedUserId
              ? trails.filter(trail => trail.user.id === selectedUserId)
              : trails
            ).map((trail) => {
              const userIdx = userList.findIndex(u => u.id === trail.user.id);
              const color = COLORS[userIdx % COLORS.length];
              return (
                <React.Fragment key={trail.user.id}>
                  {/* Draw trail as connected segments in chronological order */}
                  {trail.path.map((pt, i) => {
                    if (i < trail.path.length - 1) {
                      const nextPt = trail.path[i + 1];
                      return (
                        <Polyline
                          key={`${trail.user.id}-seg-${i}`}
                          positions={[
                            [pt.lat, pt.lng], // Leaflet uses [lat, lng]
                            [nextPt.lat, nextPt.lng]
                          ]}
                          pathOptions={{
                            color,
                            weight: 3,
                            opacity: 0.7
                          }}
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Markers for every point */}
                  {trail.path.map((pt, i) => (
                    <Marker key={`${trail.user.id}-pt-${i}`} position={[pt.lat, pt.lng]} icon={locationIcon}>
                      <Popup>
                        <div>
                          <strong>{trail.user.name}</strong><br />
                          Employee ID: {trail.user.employeeId}<br />
                          Region: {trail.user.region}<br />
                          Point #{i + 1}: [{pt.lat}, {pt.lng}]
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </React.Fragment>
              );
            })}
          </MapContainer>
          
          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm p-5 rounded-xl shadow-2xl z-[1000] border-2 border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span>Activity Intensity</span>
            </h3>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-medium text-gray-600">Low</span>
              <div className="w-32 h-4 rounded-full bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-500 shadow-inner"></div>
              <span className="text-xs font-medium text-gray-600">High</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Total Distance: <span className="font-bold text-gray-700">
                  {trails.reduce((sum, t) => sum + trailDistance(t.path), 0).toFixed(2)} km
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapDashboard;