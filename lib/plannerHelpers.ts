// lib/plannerHelpers.ts

export interface PlannerDay {
  day: string;
  date: string;
  place: string;
  means: string;
  allowance: string;
  prospects: string;
}

export interface Planner {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  };
  weekCreatedAt: string;
  days: PlannerDay[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlannerResponse {
  success: boolean;
  data: Planner[];
  meta: {
    page: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
  };
}

export interface FetchPlannersParams {
  baseUrl?: string;
  token: string;
  page?: number;
  limit?: number;
  userId?: string;
  from?: string;
  to?: string;
  sortBy?: 'date' | 'name';
  order?: 'asc' | 'desc';
  signal?: AbortSignal;
}

/**
 * Fetch planners from admin API
 */
export async function fetchAdminPlanners(params: FetchPlannersParams): Promise<PlannerResponse> {
  const {
    baseUrl = 'https://app.codewithseth.co.ke/api',
    token,
    page = 1,
    limit = 50,
    userId,
    from,
    to,
    sortBy = 'date',
    order = 'desc',
    signal
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (userId) queryParams.set('userId', userId);
  if (from) queryParams.set('from', from);
  if (to) queryParams.set('to', to);
  queryParams.set('sortBy', sortBy);
  queryParams.set('order', order);

  const response = await fetch(`${baseUrl}/admin/planners?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    signal
  });

  if (!response.ok) {
    const text = await response.text();
    const err: any = new Error(`Failed to fetch planners: ${response.status} ${response.statusText}`);
    err.status = response.status;
    err.body = text;
    throw err;
  }

  return response.json();
}

/**
 * Get week start (Monday) and end (Sunday) dates
 */
export function getWeekRange(date: Date = new Date()): { from: string; to: string } {
  const current = new Date(date);
  const dayOfWeek = current.getDay();
  
  // Get Monday (0 = Sunday, 1 = Monday, etc.)
  const monday = new Date(current);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days
  monday.setDate(current.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  
  // Get Sunday
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    from: monday.toISOString(),
    to: sunday.toISOString()
  };
}

/**
 * Get previous week range
 */
export function getPreviousWeekRange(currentWeekStart: Date): { from: string; to: string } {
  const monday = new Date(currentWeekStart);
  monday.setDate(monday.getDate() - 7);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    from: monday.toISOString(),
    to: sunday.toISOString()
  };
}

/**
 * Get next week range
 */
export function getNextWeekRange(currentWeekStart: Date): { from: string; to: string } {
  const monday = new Date(currentWeekStart);
  monday.setDate(monday.getDate() + 7);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    from: monday.toISOString(),
    to: sunday.toISOString()
  };
}

/**
 * Calculate total weekly allowance for a planner
 */
export function calculateWeeklyAllowance(planner: Planner): number {
  return planner.days.reduce((total, day) => {
    const allowance = parseFloat(day.allowance) || 0;
    return total + allowance;
  }, 0);
}

/**
 * Calculate total allowance for all planners
 */
export function calculateTotalAllowance(planners: Planner[]): number {
  return planners.reduce((total, planner) => total + calculateWeeklyAllowance(planner), 0);
}

/**
 * Group planners by user
 */
export function groupPlannersByUser(planners: Planner[]): Map<string, Planner[]> {
  const grouped = new Map<string, Planner[]>();
  
  planners.forEach(planner => {
    const userId = planner.userId._id;
    if (!grouped.has(userId)) {
      grouped.set(userId, []);
    }
    grouped.get(userId)!.push(planner);
  });
  
  return grouped;
}

/**
 * Format week range for display
 */
export function formatWeekRange(weekStartDate: string): string {
  const start = new Date(weekStartDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', formatOptions);
  const endStr = end.toLocaleDateString('en-US', formatOptions);
  
  return `${startStr} - ${endStr}`;
}

/**
 * Get unique users from planners
 */
export function getUniquePlannerUsers(planners: Planner[]) {
  const usersMap = new Map();
  
  planners.forEach(planner => {
    if (!usersMap.has(planner.userId._id)) {
      usersMap.set(planner.userId._id, planner.userId);
    }
  });
  
  return Array.from(usersMap.values());
}
