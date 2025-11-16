import { authService } from "./auth"

const API_BASE_URL = "https://app.codewithseth.co.ke/api"

export interface DashboardOverview {
  totalVisits: number
  totalTrails: number
  recentActivity: Activity[]
  performance: PerformanceMetrics
}

export interface Activity {
  id: string
  type: "visit" | "trail"
  description: string
  timestamp: string
}

export interface PerformanceMetrics {
  visitsThisMonth: number
  trailsThisMonth: number
  averageVisitDuration: number
  completionRate: number
}

export interface Trail {
  id: string
  date: string
  startTime: string
  endTime: string
  path: {
    coordinates: number[][]
  }
  stops: any[]
  deviceInfo: any
}

export interface Visit {
  id?: string
  date: string
  startTime: string
  client: {
    name: string
    type: string
    location: string
  }
  visitPurpose: string
  contacts: { name: string; role: string }[]
}

class ApiService {

  async getSalesHeatmap() {
    const res = await this.makeRequest("/dashboard/heatmap/sales");
    return res.data; // assuming response has { success, data }
  }
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    let token = authService.getAccessToken();
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    console.log("🌐 API Request:", {
      url: fullUrl,
      method: options.method || 'GET',
      hasToken: !!token,
      endpoint
    });
    
    let response = await fetch(fullUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    console.log("📡 API Response:", {
      url: fullUrl,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // If unauthorized, try to refresh the token and retry once
    if (response.status === 401) {
      console.log("🔐 Got 401, attempting token refresh...");
      const refreshToken = authService.getRefreshToken && authService.getRefreshToken();
      if (refreshToken) {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshData.tokens || {};
          if (newAccessToken && newRefreshToken) {
            authService.setTokens && authService.setTokens(newAccessToken, newRefreshToken);
            token = newAccessToken;
            console.log("✅ Token refreshed, retrying request...");
            // Retry the original request with the new token
            response = await fetch(fullUrl, {
              ...options,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...options.headers,
              },
            });
          }
        } else {
          console.log("❌ Token refresh failed, logging out");
          // Refresh failed, log out
          authService.logout && authService.logout();
        }
      } else {
        console.log("❌ No refresh token available, logging out");
        // No refresh token, log out
        authService.logout && authService.logout();
      }
    }

    if (!response.ok) {
      // Try to parse error response for better debugging
      let errorMsg = response.statusText;
      try {
        const errorData = await response.json();
        console.error("❌ API Error Response:", errorData);
        if (errorData && errorData.message) {
          errorMsg = errorData.message;
        }
        if (errorData && errorData.errors) {
          errorMsg += ": " + JSON.stringify(errorData.errors);
        }
      } catch {
        // ignore JSON parse errors
      }
      throw new Error(`API request failed: ${errorMsg}`);
    }

    const responseData = await response.json();
    console.log("✅ API Response Data:", responseData);
    return responseData;
  }

  async getDashboardOverview(startDate?: string, endDate?: string, region?: string): Promise<any> {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (region) params.append("region", region)

    return this.makeRequest(`/dashboard/overview?${params.toString()}`)
  }

  async getRecentActivity(limit = 20): Promise<any> {
    return this.makeRequest(`/dashboard/recent-activity?limit=${limit}`)
  }

  async getPerformanceMetrics(startDate?: string, endDate?: string, region?: string): Promise<any> {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (region) params.append("region", region)

    return this.makeRequest(`/dashboard/performance?${params.toString()}`)
  }

  async getTrails(page = 1, limit = 20, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)

    return this.makeRequest(`/trails?${params.toString()}`)
  }

  // Engineering services endpoints
  async getEngineeringServices(page = 1, limit = 20, filters: Record<string, any> = {}): Promise<any> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    return this.makeRequest(`/engineering-services?${params.toString()}`);
  }

  async getEngineeringServicesByEngineer(engineerId: string, page = 1, limit = 50, filters: Record<string, any> = {}): Promise<any> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    return this.makeRequest(`/engineering-services/engineer/${encodeURIComponent(engineerId)}?${params.toString()}`);
  }

  async getEngineeringServiceById(serviceId: string): Promise<any> {
    return this.makeRequest(`/engineering-services/${encodeURIComponent(serviceId)}`);
  }

  async createEngineeringService(payload: {
    date?: string;
    facility: { name: string; location: string };
    serviceType: string;
    engineerInCharge: { _id?: string; name: string; phone?: string };
    machineDetails?: string;
    status?: string;
    notes?: string;
    scheduledDate?: string;
    conditionBefore?: string;
    conditionAfter?: string;
  }): Promise<any> {
    return this.makeRequest(`/engineering-services`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateEngineeringService(serviceId: string, payload: {
    engineerInCharge?: { _id?: string; name: string; phone?: string };
    scheduledDate?: string;
    status?: string;
    notes?: string;
    conditionBefore?: string;
    conditionAfter?: string;
    machineDetails?: string;
    otherPersonnel?: string[];
    nextServiceDate?: string;
  }): Promise<any> {
    return this.makeRequest(`/engineering-services/${encodeURIComponent(serviceId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteEngineeringService(serviceId: string): Promise<any> {
    return this.makeRequest(`/engineering-services/${encodeURIComponent(serviceId)}`, {
      method: "DELETE",
    });
  }

  async assignEngineeringService(serviceId: string, payload: any): Promise<any> {
    // Use PUT /:id for assignment (compatible with updateEngineeringService)
    return this.updateEngineeringService(serviceId, payload);
  }

  // Get all users (for engineer selection)
  async getUsers(filters: Record<string, any> = {}): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    const queryString = params.toString();
    return this.makeRequest(`/users${queryString ? `?${queryString}` : ''}`);
  }

  // Get users by role
  async getUsersByRole(role: string): Promise<any> {
    return this.getUsers({ role });
  }

  // Get all engineers
  async getEngineers(): Promise<any> {
    return this.getUsers({ role: 'engineer' });
  }

  // Trail route snapping
  async snapTrailToRoads(trailId: string): Promise<any> {
    return this.makeRequest(`/trails/${trailId}/snap-route`, {
      method: "POST",
    });
  }

  async batchSnapAllTrails(): Promise<any> {
    return this.makeRequest('/trails/snap-all-routes', {
      method: "POST",
    });
  }

  async getVisits(page = 1, limit = 20, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)

    return this.makeRequest(`/visits?${params.toString()}`)
  }

  async createTrail(trailData: Omit<Trail, "id">): Promise<Trail> {
    return this.makeRequest("/trails", {
      method: "POST",
      body: JSON.stringify(trailData),
    })
  }

  async createVisit(visitData: Omit<Visit, "id">): Promise<Visit> {
    // Only send the fields the backend expects
    const payload = {
      date: visitData.date,
      startTime: visitData.startTime,
      client: {
        name: visitData.client.name,
        type: visitData.client.type,
        location: visitData.client.location,
      },
      visitPurpose: visitData.visitPurpose,
      contacts: (visitData.contacts || []).map(c => ({
        name: c.name,
        role: c.role,
      })),
    };
    return this.makeRequest("/visits", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async deleteVisit(visitId: string): Promise<void> {
    return this.makeRequest(`/visits/${visitId}`, {
      method: "DELETE",
    })
  }

  async deleteTrail(trailId: string): Promise<void> {
    return this.makeRequest(`/trails/${trailId}`, {
      method: "DELETE",
    })
  }

  async updateVisit(visitId: string, visitData: Partial<Visit>): Promise<Visit> {
    return this.makeRequest(`/visits/${visitId}`, {
      method: "PUT",
      body: JSON.stringify(visitData),
    })
  }

  async updateTrail(trailId: string, trailData: Partial<Trail>): Promise<Trail> {
    return this.makeRequest(`/trails/${trailId}`, {
      method: "PUT",
      body: JSON.stringify(trailData),
    })
  }

  // Follow-up endpoints
  async createFollowUp(followUpData: {
    visitId: string;
    date: string;
    contactPerson: {
      name: string;
      role: string;
      phone?: string;
      email?: string;
    };
    outcome: 'deal_sealed' | 'in_progress' | 'deal_failed';
    winningPoint?: string;
    progressNotes?: string;
    improvements?: string;
    failureReasons?: string;
  }): Promise<any> {
    return this.makeRequest("/follow-ups", {
      method: "POST",
      body: JSON.stringify(followUpData),
    });
  }

  async getFollowUps(filters: {
    visitId?: string;
    outcome?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
    return this.makeRequest(`/follow-ups?${params.toString()}`);
  }

  async getAdminFollowUps(filters: {
    visitId?: string;
    outcome?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
    return this.makeRequest(`/follow-ups/admin?${params.toString()}`);
  }

  async getFollowUpById(followUpId: string): Promise<any> {
    return this.makeRequest(`/follow-ups/${followUpId}`);
  }

  async updateFollowUp(followUpId: string, followUpData: {
    date?: string;
    contactPerson?: {
      name: string;
      role: string;
      phone?: string;
      email?: string;
    };
    outcome?: 'deal_sealed' | 'in_progress' | 'deal_failed';
    winningPoint?: string;
    progressNotes?: string;
    improvements?: string;
    failureReasons?: string;
  }): Promise<any> {
    return this.makeRequest(`/follow-ups/${followUpId}`, {
      method: "PUT",
      body: JSON.stringify(followUpData),
    });
  }

  async deleteFollowUp(followUpId: string): Promise<any> {
    return this.makeRequest(`/follow-ups/${followUpId}`, {
      method: "DELETE",
    });
  }

  async getFollowUpsByVisit(visitId: string): Promise<any> {
    return this.getFollowUps({ visitId });
  }

  // Leads endpoints
  async getLeads(page = 1, limit = 20, filters: Record<string, any> = {}, useAdminEndpoint = false): Promise<any> {
    const params = new URLSearchParams({ 
      page: String(page), 
      limit: String(limit),
      _t: String(Date.now()) // Cache buster
    });
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    
    // Use admin endpoint if user has admin access
    const endpoint = useAdminEndpoint ? `/admin/leads` : `/leads`;
    console.log(`📡 Using ${useAdminEndpoint ? 'ADMIN' : 'USER'} endpoint: ${endpoint}`);
    
    return this.makeRequest(`${endpoint}?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  async getLeadById(leadId: string, useAdminEndpoint = false): Promise<any> {
    const endpoint = useAdminEndpoint ? `/admin/leads` : `/leads`;
    return this.makeRequest(`${endpoint}/${encodeURIComponent(leadId)}`);
  }

  async updateLead(leadId: string, payload: Record<string, any>, useAdminEndpoint = false): Promise<any> {
    const endpoint = useAdminEndpoint ? `/admin/leads` : `/leads`;
    return this.makeRequest(`${endpoint}/${encodeURIComponent(leadId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteLead(leadId: string, useAdminEndpoint = false): Promise<any> {
    const endpoint = useAdminEndpoint ? `/admin/leads` : `/leads`;
    return this.makeRequest(`${endpoint}/${encodeURIComponent(leadId)}`, {
      method: "DELETE",
    });
  }

  // Get lead history (admin only)
  async getLeadHistory(leadId: string): Promise<any> {
    return this.makeRequest(`/admin/leads/${encodeURIComponent(leadId)}/history`);
  }
}

export const apiService = new ApiService()
