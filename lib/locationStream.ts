// lib/locationStream.ts
import type { LatLngExpression } from 'leaflet';

export type LocationPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string | number;
  speed?: number;
  heading?: number;
  altitude?: number;
};

export type LocationTrack = {
  _id: string;
  userId: any; // populated user object or id
  locations: LocationPoint[];
  deviceInfo?: Record<string, any>;
  syncedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaginatedResponse = {
  success: boolean;
  data: LocationTrack[];
  meta?: { page: number; limit: number; totalDocs: number; totalPages: number };
};

export async function fetchAdminTracks({
  baseUrl = '/api',
  token,
  userId,
  from,
  to,
  page = 1,
  limit = 100,
  signal,
}: {
  baseUrl?: string;
  token?: string;
  userId?: string;
  from?: string | number;
  to?: string | number;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<PaginatedResponse> {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (from) params.set('from', typeof from === 'number' ? new Date(from).toISOString() : String(from));
  if (to) params.set('to', typeof to === 'number' ? new Date(to).toISOString() : String(to));
  params.set('page', String(page));
  params.set('limit', String(limit));

  const res = await fetch(`${baseUrl}/admin/location?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(`Failed to fetch tracks: ${res.status} ${res.statusText} ${text}`);
    err.status = res.status;
    throw err;
  }

  const json = (await res.json()) as PaginatedResponse;
  return json;
}

/** Flatten tracks to an array of points with converted timestamps and metadata */
export function flattenAndSortPoints(tracks: LocationTrack[]) {
  const points = tracks.flatMap((track) =>
    (track.locations || []).map((loc) => ({
      ...loc,
      // normalized timestamp number (ms)
      ts: typeof loc.timestamp === 'number' ? loc.timestamp : new Date(String(loc.timestamp)).getTime(),
      trackId: track._id,
      userId: track.userId,
      syncedAt: track.syncedAt,
    }))
  );

  points.sort((a, b) => a.ts - b.ts);

  return points;
}

/** Convert LocationPoint to Leaflet LatLng tuple */
export function toLatLng(p: { latitude: number; longitude: number }): LatLngExpression {
  return [p.latitude, p.longitude];
}

/** Start polling for new tracks (returns a stop function) */
export function startPollingTracks(opts: {
  intervalMs?: number;
  onUpdate: (newTracks: LocationTrack[]) => void;
  getLastSyncedAt: () => string | undefined;
  fetchOptions: { baseUrl?: string; token?: string; userId?: string; limit?: number };
}) {
  const { intervalMs = 5000, onUpdate, getLastSyncedAt, fetchOptions } = opts;
  let stopped = false;
  let controller: AbortController | undefined;

  async function tick() {
    if (stopped) return;
    try {
      controller?.abort();
      controller = new AbortController();
      const from = getLastSyncedAt();
      const resp = await fetchAdminTracks({
        ...fetchOptions,
        from,
        page: 1,
        limit: fetchOptions.limit ?? 100,
        signal: controller.signal,
      });
      if (resp && resp.data && resp.data.length) {
        onUpdate(resp.data);
      }
    } catch (err: any) {
      // swallow transient errors; caller can surface if needed
      if (err.name !== 'AbortError') {
        console.warn('Polling tracks failed', err);
      }
    } finally {
      if (!stopped) setTimeout(tick, intervalMs);
    }
  }

  tick();

  return () => {
    stopped = true;
    controller?.abort();
  };
}

/**
 * Optional: Socket.IO helper (if server emits `location:track`)
 * - Uses dynamic import to avoid bundling socket on server side
 * - Requires: npm install socket.io-client
 * 
 * Note: This function is commented out to avoid build errors.
 * Uncomment after installing socket.io-client: npm install socket.io-client
 */
/*
export async function connectLocationSocket({
  url,
  token,
  onTrack,
}: {
  url: string;
  token?: string;
  onTrack: (track: LocationTrack) => void;
}) {
  try {
    const { io } = await import('socket.io-client');
    const socket = io(url, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('location socket connected', socket.id);
    });

    socket.on('location:track', (payload: LocationTrack) => {
      try {
        onTrack(payload);
      } catch (err) {
        console.error('onTrack handler failed', err);
      }
    });

    socket.on('disconnect', (reason: string) => {
      console.log('location socket disconnected', reason);
    });

    return () => socket.disconnect();
  } catch (err) {
    console.error('socket.io-client not installed. Run: npm install socket.io-client');
    throw new Error('socket.io-client module not found');
  }
}
*/
