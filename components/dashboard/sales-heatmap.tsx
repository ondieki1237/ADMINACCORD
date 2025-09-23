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

// Import types and components
interface TrailPoint {
  lat: number;
  lng: number;
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

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

// Dynamic import for the map component to avoid SSR issues
const MapWithHeatmap: React.FC<{ 
  trails: Trail[], 
  selectedUserId: string | null,
  showHospitals: boolean,
  locationIcon: L.Icon
}> = ({ trails, selectedUserId, showHospitals, locationIcon }) => {
  const [MapContainer, setMapContainer] = React.useState<any>(null);
  const [TileLayer, setTileLayer] = React.useState<any>(null);
  const [Polyline, setPolyline] = React.useState<any>(null);
  const [Marker, setMarker] = React.useState<any>(null);
  const [Popup, setPopup] = React.useState<any>(null);
  const [useMap, setUseMap] = React.useState<any>(null);
  const [L, setL] = React.useState<any>(null);
  const [HospitalLayer, setHospitalLayer] = React.useState<any>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Dynamically import all Leaflet components
    const loadLeafletComponents = async () => {
      const leaflet = await import('leaflet');
      const reactLeaflet = await import('react-leaflet');
      const hospitalLayer = await import('./HospitalLayer');
      
      setL(leaflet);
      setMapContainer(() => reactLeaflet.MapContainer);
      setTileLayer(() => reactLeaflet.TileLayer);
      setPolyline(() => reactLeaflet.Polyline);
      setMarker(() => reactLeaflet.Marker);
      setPopup(() => reactLeaflet.Popup);
      setUseMap(() => reactLeaflet.useMap);
      setHospitalLayer(() => hospitalLayer.default);
      
      setMounted(true);
    };

    loadLeafletComponents();
  }, []);

  const HeatmapLayerComponent: React.FC<{ data: HeatmapPoint[] }> = ({ data }) => {
    const map = useMap();

    React.useEffect(() => {
      if (!map || !L || !mounted) return;

      // Clean up existing heatmap
      if ((map as any).heatLayer) {
        map.removeLayer((map as any).heatLayer);
        (map as any).heatLayer = undefined;
      }

      if (data.length > 0) {
        // Dynamically import leaflet.heat
        import('leaflet.heat').then((leafletHeat) => {
          const heatPoints = data.map(point => [point.lat, point.lng, point.intensity]);

          const heatLayer = leafletHeat.default(heatPoints, {
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
          (map as any).heatLayer = heatLayer;
        });
      }

      return () => {
        if ((map as any).heatLayer) {
          map.removeLayer((map as any).heatLayer);
          (map as any).heatLayer = undefined;
        }
      };
    }, [data, map, L, mounted]);

    return null;
  };

  if (!mounted || !MapContainer || !TileLayer || !L) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  const filteredTrails = selectedUserId 
    ? trails.filter(trail => trail.user.id === selectedUserId) 
    : trails;

  const userList = trails.map(trail => trail.user);

  return (
    <MapContainer 
      center={[-1.286389, 36.817223]} 
      zoom={7} 
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Hospital locations */}
      {showHospitals && <HospitalLayer />}

      {/* Heatmap Layer */}
      <HeatmapLayerComponent
        data={trails.flatMap(trail =>
          trail.path.map(pt => ({
            lat: pt.lat,
            lng: pt.lng,
            intensity: 1
          }))
        )}
      />

      {/* Trails */}
      {filteredTrails.map((trail) => {
        const userIdx = userList.findIndex(u => u.id === trail.user.id);
        const color = COLORS[userIdx % COLORS.length];
        return (
          <React.Fragment key={trail.user.id}>
            {/* Draw trail as connected segments */}
            {trail.path.map((pt, i) => {
              if (i < trail.path.length - 1) {
                const nextPt = trail.path[i + 1];
                return (
                  <Polyline
                    key={`${trail.user.id}-seg-${i}`}
                    positions={[
                      [pt.lat, pt.lng], // Fixed: lat first, then lng
                      [nextPt.lat, nextPt.lng] // Fixed: lat first, then lng
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
                    Point #{i + 1}: [{pt.lat.toFixed(6)}, {pt.lng.toFixed(6)}]
                  </div>
                </Popup>
              </Marker>
            ))}
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};

const HeatmapDashboard: React.FC = () => {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Kenya bounds for better map positioning
  const kenyaBounds: [[number, number], [number, number]] = [
    [-4.7, 33.9], // Southwest
    [5.5, 41.9]   // Northeast
  ];

  const fetchHeatmapData = async () => {
    try {
      setError(null);
      const response = await fetch('https://accordbackend.onrender.com/api/dashboard/heatmap/live', {
        headers: {
          'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzE4ODIxOWI4ZmVmOTAxNjQwMTJhOCIsImlhdCI6MTc1NzgyNTYzMywiZXhwIjoxNzU4NDMwNDMzfQ.SfDFRZOclIkmuLLcx1Sa2JjT8vIyaoMI86H0rOdCIoQ'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      if (result.success) {
        setTrails(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch heatmap data');
      console.error('Error fetching heatmap data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchHeatmapData, 30000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh]);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchHeatmapData();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Custom icon using a location pin
  const [locationIcon, setLocationIcon] = useState<L.Icon | null>(null);

  useEffect(() => {
    // Create icon after mount to avoid SSR issues
    import('leaflet').then((L) => {
      const icon = new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -28]
      });
      setLocationIcon(icon);
    });
  }, []);

  const userList = trails.map(trail => trail.user);
  const filteredTrails = selectedUserId ? trails.filter(trail => trail.user.id === selectedUserId) : trails;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar: List active points, trails, owners, and selection UI */}
      <aside className="w-80 bg-white border-r border-gray-200 p-4 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold mb-2">Active Trails</h2>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {userList.map(user => {
              const trail = trails.find(t => t.user.id === user.id);
              const dist = trail ? trailDistance(trail.path) : 0;
              return (
                <li key={user.id} className="flex flex-col mb-2">
                  <span className="font-medium text-blue-700">{user.name}</span>
                  <span className="text-xs text-gray-500">ID: {user.employeeId} | Region: {user.region}</span>
                  <span className="text-xs text-gray-400">{trail?.path.length ?? 0} pts | {dist.toFixed(2)} km</span>
                </li>
              );
            })}
          </ul>
        </div>
        {/* Total distance for all users */}
        <div className="mt-4 text-sm font-semibold text-blue-900">
          Total Distance: {trails.reduce((sum, t) => sum + trailDistance(t.path), 0).toFixed(2)} km
        </div>
        <div>
          <label htmlFor="user-select" className="block text-sm font-medium mb-1">Show Trail for:</label>
          <select
            id="user-select"
            className="w-full border rounded px-2 py-1"
            value={selectedUserId || ''}
            onChange={e => setSelectedUserId(e.target.value || null)}
          >
            <option value="">All Trails</option>
            {userList.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
        <div>
          <h3 className="text-md font-semibold mb-1">Points</h3>
          <ul className="text-xs max-h-40 overflow-y-auto">
            {filteredTrails.map(trail => (
              trail.path.map((pt, i) => (
                <li key={trail.user.id + '-' + i} className="mb-1">
                  <span className="font-mono">[{pt.lat.toFixed(6)}, {pt.lng.toFixed(6)}]</span>
                  <span className="ml-2 text-gray-400">({trail.user.name})</span>
                </li>
              ))
            ))}
          </ul>
        </div>
        <div>
          <button
            onClick={() => setShowHospitals((prev) => !prev)}
            className={`w-full mt-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              showHospitals
                ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {showHospitals ? "Hide" : "Show"} Hospital Locations
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Person Heatmap</h1>
              <p className="text-gray-600">Live tracking of field sales activities in Kenya</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-gray-50 px-4 py-2 rounded-lg flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {trails.reduce((acc, t) => acc + t.path.length, 0)} Active Points
              </span>
            </div>
            {lastUpdated && (
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAutoRefresh}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Auto: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="relative h-[calc(100vh-100px)]">
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}
          {loading && (
            <div className="absolute top-4 right-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-700">Loading data...</span>
            </div>
          )}

          {locationIcon && (
            <MapWithHeatmap
              trails={trails}
              selectedUserId={selectedUserId}
              showHospitals={showHospitals}
              locationIcon={locationIcon}
            />
          )}
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[1000]">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Activity Intensity</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">Low</span>
              <div className="w-20 h-3 rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-600"></div>
              <span className="text-xs text-gray-600">High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapDashboard;