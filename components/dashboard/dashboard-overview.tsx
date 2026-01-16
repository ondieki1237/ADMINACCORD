"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Users, MapPin, TrendingUp, TrendingDown, Activity,
  Calendar, ArrowRight, UserCheck, AlertCircle, FileText,
  Briefcase, CheckCircle2, Clock, XCircle, ChevronDown, Filter
} from "lucide-react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VisitsPage from "./visitmanager";
import Reports from "./reports";
import QuotationList from "./quotations";
import { VisitContactData } from "./visit-contact-data";

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, ArcElement, Filler
);

// --- Types ---
interface Visit {
  _id: string;
  client: { name: string; location: string; _id?: string };
  user: { firstName: string; lastName: string; _id: string; email: string };
  startTime: string;
  endTime: string;
  status: string; // "Completed", "Cancelled", etc.
  visitOutcome?: string; // "Successful", "Follow-up Needed", "Rejected"
  notes?: string;
  createdAt: string;
}

interface Lead {
  _id: string;
  name: string;
  company: string;
  value: number;
  status: string;
  createdAt: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  region: string;
}

// --- Brand Colors ---
const COLORS = {
  primary: "#0089f4", // Blue
  secondary: "#ef4444", // Red (Alerts/Negative)
  text: "#1e293b", // Slate 800
  textLight: "#64748b", // Slate 500
  success: "#10b981", // Emerald 500
  warning: "#f59e0b", // Amber 500
  background: "#f8fafc", // Slate 50
  white: "#ffffff",
};

export function DashboardOverview() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUserSync());
  const [dateRange, setDateRange] = useState("thisMonth"); // "thisWeek", "thisMonth", "lastMonth"
  const [filterRegion, setFilterRegion] = useState("all");

  // Sub-page navigation states
  const [showVisits, setShowVisits] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showQuotations, setShowQuotations] = useState(false);
  const [showContactData, setShowContactData] = useState(false);

  // --- 1. Data Fetching ---

  // Fetch Visits
  const { data: visits = [], isLoading: loadingVisits } = useQuery({
    queryKey: ["visits-all"],
    queryFn: async () => {
      const json = await apiService.getVisits(1, 1000); // Fetch up to 1000 visits
      return (json.data?.docs || json.docs || (Array.isArray(json.data) ? json.data : []) || []) as Visit[];
    },
    staleTime: 60000,
  });

  // Fetch Leads (for "New Clients" approximation and Top Movers)
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["leads-all"],
    queryFn: async () => {
      // Try fetching leads; handle potential non-admin access if needed
      try {
        const json = await apiService.getLeads(1, 1000, {}, true);
        return (json.data?.docs || json.docs || (Array.isArray(json.data) ? json.data : []) || []) as Lead[];
      } catch (e) {
        console.warn("Failed to fetch admin leads, trying user leads", e);
        const json = await apiService.getLeads(1, 1000, {}, false);
        return (json.data?.docs || json.docs || (Array.isArray(json.data) ? json.data : []) || []) as Lead[];
      }
    },
    staleTime: 60000,
  });

  // Fetch Users (for Sales Reps count)
  const { data: users = [] } = useQuery({
    queryKey: ["users-all"],
    queryFn: async () => {
      const json = await apiService.getUsers();
      // Ensure we extract the array correctly even if nested differently
      return (json.data?.docs || json.data || json || []) as User[];
    },
    enabled: !!authService.getAccessToken(),
  });

  // --- 2. Data Processing & Aggregation ---

  const processedData = useMemo(() => {
    const today = new Date();
    let start = startOfMonth(today);
    let end = endOfMonth(today);

    // Debugging logs
    console.log("Dashboard Debug: Raw Visits:", visits.length, visits[0]);
    console.log("Dashboard Debug: Raw Leads:", leads.length, leads[0]);

    if (dateRange === "thisWeek") {
      start = subDays(today, 7);
      end = today;
    } else if (dateRange === "lastMonth") {
      start = startOfMonth(subDays(today, 30));
      end = endOfMonth(subDays(today, 30));
    } else if (dateRange === "allTime") {
      start = subDays(today, 3650); // 10 years ago
      end = today;
    }

    // Fallback: If "All Time" needed, we might need a new filter option.
    // For now, let's keep strict but robust parsing.

    // Filter Visits by Date & Region
    const filteredVisits = visits.filter(v => {
      if (!v.startTime && !v.createdAt) return false;
      const d = parseISO(v.startTime || v.createdAt);
      // Basic region filtering if user object has region (assuming standard user structure)
      // Note: Actual region filtering might need to join user data if not in visit object
      return isWithinInterval(d, { start, end });
    });

    console.log(`Dashboard Debug: Filtered Visits (${dateRange}):`, filteredVisits.length);

    const previousStart = subDays(start, (dateRange === "thisWeek" ? 7 : 30)); // Rough estimate for previous
    const previousEnd = subDays(end, (dateRange === "thisWeek" ? 7 : 30));
    // For all time, 'previous' is effectively empty or arbitrary 0 comparison

    const previousVisits = visits.filter(v => {
      if (dateRange === "allTime") return false;
      if (!v.startTime && !v.createdAt) return false;
      const d = parseISO(v.startTime || v.createdAt);
      return isWithinInterval(d, { start: previousStart, end: previousEnd });
    });

    // KPI Calculations

    // 1. Total Facilities (Unique facilities in the ENTIRE dataset usually, but let's respect filters if implicit)
    // User Request: "list of all the facilities... u ad them up and find the total facilities"
    // Interpretation: Total unique facilities found in the currently fetched data (which is 1000 items). 
    // If 'All Time' is selected, this is accurate. If a partial range is selected, it shows facilities active in that range.
    // However, usually "Total Facilities" implies a system-wide count. 
    // Let's use the unique count from *all fetched visits* to be safe as a "System Total" proxy if filters are loose, 
    // or strictly filtered if that's standard. 
    // Givne the prompt ("sum of all the daily visits made by the sales that week"), let's match the metric to the filter.

    // BUT for "New Clients", we need history.
    const facilityFirstSeen: Record<string, number> = {};
    visits.forEach(v => {
      const name = v.client?.name;
      if (!name) return;
      const date = new Date(v.startTime || v.createdAt).getTime();
      if (!facilityFirstSeen[name] || date < facilityFirstSeen[name]) {
        facilityFirstSeen[name] = date;
      }
    });

    // 2. New Clients
    // "when a user enters a new facility the data is checked if it is a new facility... after the end of the week... nolonger a new facility"
    // Logic: Count facilities whose FIRST visit ever falls within the current [start, end] interval.
    let newClientsCount = 0;
    Object.values(facilityFirstSeen).forEach(firstSeenDate => {
      if (firstSeenDate >= start.getTime() && firstSeenDate <= end.getTime()) {
        newClientsCount++;
      }
    });

    const totalVisitsCount = filteredVisits.length;
    const previousVisitsCount = previousVisits.length;

    let visitGrowth = 0;
    if (dateRange === "allTime") {
      visitGrowth = 100;
    } else {
      visitGrowth = previousVisitsCount > 0
        ? Math.round(((totalVisitsCount - previousVisitsCount) / previousVisitsCount) * 100)
        : (totalVisitsCount > 0 ? 100 : 0);
    }

    const uniqueFacilitiesFiltered = new Set(filteredVisits.map(v => v.client?.name)).size;
    // User likely wants "Total Facilities" to be the count of unique facilities active in this period? 
    // OR the Total System Facilities? "Total Facilities" usually implies the latter.
    // Let's stick to unique facilities in the *filtered* view for consistency with the card label "recorded in system" might imply total.
    // Let's show Unique Active Facilities for this period. 
    const totalFacilities = uniqueFacilitiesFiltered;

    // If user specifically wants "Total Facilities Recorded" (all time) regardless of filter:
    // const totalFacilities = Object.keys(facilityFirstSeen).length; 
    // But "0" in the original issue suggests it was reacting to filters. Let's keep it responsive.

    const salesRepsCount = users.filter(u => u.role === "sales" || u.role === "user").length;

    // Leaderboards
    // A. Top Facilities
    const facilityCounts: Record<string, { count: number, location: string, lastVisit: string }> = {};
    filteredVisits.forEach(v => {
      const name = v.client?.name || "Unknown";
      if (!facilityCounts[name]) {
        facilityCounts[name] = {
          count: 0,
          location: v.client?.location || "N/A",
          lastVisit: v.startTime || v.createdAt || ""
        };
      }
      facilityCounts[name].count++;
      const currentVisitTime = new Date(v.startTime || v.createdAt);
      if (currentVisitTime > new Date(facilityCounts[name].lastVisit)) {
        facilityCounts[name].lastVisit = v.startTime || v.createdAt;
      }
    });
    const topFacilities = Object.entries(facilityCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // B. Top Sales Reps
    const repCounts: Record<string, { count: number, id: string, name: string }> = {};
    filteredVisits.forEach(v => {
      const u = v.user;
      const name = u ? `${u.firstName} ${u.lastName}` : "Unknown Rep";
      if (!repCounts[name]) {
        repCounts[name] = { count: 0, id: u?._id, name };
      }
      repCounts[name].count++;
    });
    const topReps = Object.values(repCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Visit Outcome Breakdown
    const outcomes = { success: 0, followup: 0, rejected: 0 };
    filteredVisits.forEach(v => {
      // Normalize distinct outcomes if data is messy, assuming structured for now
      // Or infer from status if outcome field missing
      const outcome = (v.visitOutcome || v.status || "").toLowerCase();
      if (outcome.includes("success") || outcome.includes("completed") || outcome.includes("sale") || outcome.includes("deal")) outcomes.success++;
      else if (outcome.includes("follow") || outcome.includes("pending") || outcome.includes("progress")) outcomes.followup++;
      else outcomes.rejected++;
    });

    // Trends (Daily)
    const dailyVisits: Record<string, number> = {};
    filteredVisits.forEach(v => {
      if (v.startTime || v.createdAt) {
        const day = format(parseISO(v.startTime || v.createdAt), "MMM dd");
        dailyVisits[day] = (dailyVisits[day] || 0) + 1;
      }
    });
    const trendLabels = Object.keys(dailyVisits).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()); // Approximate sort
    // Better sort: create array of dates in range and fill

    return {
      kpi: {
        totalVisits: totalVisitsCount,
        visitGrowth,
        newClients: newClientsCount,
        totalFacilities: totalFacilities,
        salesReps: salesRepsCount
      },
      topFacilities,
      topReps,
      outcomes,
      recentActivity: filteredVisits.slice(0, 7), // Latest 7
      trendData: dailyVisits
    };
  }, [visits, leads, users, dateRange]);


  // --- 3. Sub-page Rendering ---
  if (showVisits) return <VisitsPage />; // Simpler for now, or wrap in layout
  if (showReports) return <Reports />;
  if (showQuotations) return <QuotationList />;
  if (showContactData) return <VisitContactData onClose={() => setShowContactData(false)} />;

  if (loadingVisits) {
    return <div className="p-8 flex items-center justify-center min-h-screen text-primary">Loading Analytics...</div>;
  }

  // --- 4. Chart Configs ---
  const lineChartData = {
    labels: Object.keys(processedData.trendData),
    datasets: [
      {
        label: "Visits",
        data: Object.values(processedData.trendData),
        borderColor: COLORS.primary,
        backgroundColor: "rgba(0, 137, 244, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const outcomeChartData = {
    labels: ["Successful", "Follow-Up", "No Outcome"],
    datasets: [
      {
        data: [processedData.outcomes.success, processedData.outcomes.followup, processedData.outcomes.rejected],
        backgroundColor: [COLORS.primary, COLORS.warning, COLORS.secondary],
        borderWidth: 0,
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500">Welcome back, {currentUser?.firstName || "Admin"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowContactData(true)} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
            <Users className="w-4 h-4 mr-2" /> Contact Visit Data
          </Button>
          <Button onClick={() => setShowReports(true)} variant="outline">
            <FileText className="w-4 h-4 mr-2" /> Reports
          </Button>
          <Button onClick={() => setShowVisits(true)} variant="default" className="bg-[#0089f4] hover:bg-blue-600">
            <MapPin className="w-4 h-4 mr-2" /> Visits Manager
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* 1. Executive Overview (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Total Visits"
            value={processedData.kpi.totalVisits}
            trend={processedData.kpi.visitGrowth}
            icon={MapPin}
            subtext="vs previous period"
          />
          <KpiCard
            title="New Clients"
            value={processedData.kpi.newClients}
            icon={UserCheck}
            subtext="New leads added"
            trend={null}
          />
          <KpiCard
            title="Total Facilities"
            value={processedData.kpi.totalFacilities}
            icon={Briefcase}
            subtext="recorded in system"
            isNeutral
          />
          <KpiCard
            title="Sales Team"
            value={processedData.kpi.salesReps}
            icon={Users}
            subtext="Active representatives"
            isNeutral
          />
        </div>

        {/* 2. Charts Row: Trends & Outcomes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trends Line Chart */}
          <Card className="lg:col-span-2 shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Visit Trends</CardTitle>
              <CardDescription>Performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { grid: { color: "#f1f5f9" }, beginAtZero: true },
                      x: { grid: { display: false } }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "#1e293b",
                        padding: 12,
                        cornerRadius: 8
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Visit Outcomes Pie Chart */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Visit Outcomes</CardTitle>
              <CardDescription>Breakdown by result</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="h-[200px] w-[200px] relative">
                <Doughnut
                  data={outcomeChartData}
                  options={{
                    cutout: "70%",
                    plugins: { legend: { display: false } }
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-3xl font-bold text-slate-800">{processedData.kpi.totalVisits}</span>
                  <span className="text-xs text-slate-500 uppercase">Total</span>
                </div>
              </div>
              <div className="w-full mt-6 space-y-3">
                <OutcomeLegend label="Successful" value={processedData.outcomes.success} color="bg-[#0089f4]" />
                <OutcomeLegend label="Follow-Up Needed" value={processedData.outcomes.followup} color="bg-amber-500" />
                <OutcomeLegend label="No Outcome / Rejected" value={processedData.outcomes.rejected} color="bg-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Leaderboards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Facilities */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Top Facilities</CardTitle>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600">By Visits</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processedData.topFacilities.map((facility, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{facility.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {facility.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{facility.count}</p>
                      <p className="text-xs text-slate-500">visits</p>
                    </div>
                  </div>
                ))}
                {processedData.topFacilities.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No facility data available</p>}
              </div>
            </CardContent>
          </Card>

          {/* Top Sales Reps */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Top Sales Reps</CardTitle>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600">Most Active</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processedData.topReps.map((rep, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border-b last:border-0 border-slate-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${rep.name}`} />
                        <AvatarFallback>{rep.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">{rep.name}</p>
                        <p className="text-xs text-slate-500">Sales Representative</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {rep.count} Visits
                      </span>
                    </div>
                  </div>
                ))}
                {processedData.topReps.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No rep data available</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3b. Top Consumables (Mocked for now) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Top Consumables</CardTitle>
              <Badge variant="outline" className="text-slate-500 border-slate-200">Trending</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <div className="p-3 bg-slate-100 rounded-full mb-3">
                  <Activity className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900">Data Unavailable</h3>
                <p className="text-xs text-slate-500 max-w-[200px] mt-1">
                  Consumption analytics require API integration. Please check documentation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for future widget or more detailed Reps stats? For now, we keep layout balanced */}
          <Card className="shadow-sm border-slate-200 flex items-center justify-center p-6 bg-slate-50 border-dashed">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 mb-4">
                <TrendingUp className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-900">More Insights Coming Soon</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Advanced revenue analytics and product performance metrics specific to your region will appear here.
              </p>
            </div>
          </Card>
        </div>

        {/* 4. Recent Activity Feed */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative border-l border-slate-200 ml-3 space-y-6">
              {processedData.recentActivity.map((visit, i) => (
                <div key={i} className="mb-8 ml-6 relative group">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-[37px] ring-4 ring-white">
                    <Clock className="w-3 h-3 text-blue-600" />
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-lg border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 pl-1">
                        {visit.client?.name || "Unknown Client"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 pl-1">
                        Visited by <span className="text-slate-700 font-medium">{visit.user?.firstName || "Rep"}</span>
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-3">
                      <Badge variant="outline" className={`${visit.visitOutcome?.includes("Success") ? "bg-green-50 text-green-700 border-green-200" :
                        visit.visitOutcome?.includes("Follow") ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-slate-50 text-slate-600"
                        }`}>
                        {visit.visitOutcome || visit.status || "Completed"}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {format(parseISO(visit.startTime), "MMM dd, HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {processedData.recentActivity.length === 0 && <p className="ml-6 text-slate-500 text-sm">No recent activity found.</p>}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

// --- Helper Components ---

function KpiCard({ title, value, trend, icon: Icon, subtext, isNeutral }: any) {
  const isPositive = trend >= 0;
  return (
    <Card className="border-l-4 border-l-[#0089f4] shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">{value?.toLocaleString() || 0}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="w-6 h-6 text-[#0089f4]" />
          </div>
        </div>
        {!isNeutral && trend !== null && (
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium flex items-center ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
              {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(trend)}%
            </span>
            <span className="text-slate-400 ml-2">{subtext}</span>
          </div>
        )}
        {(isNeutral || trend === null) && subtext && (
          <p className="mt-4 text-sm text-slate-400">{subtext}</p>
        )}
      </CardContent>
    </Card>
  )
}

function OutcomeLegend({ label, value, color }: any) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-slate-600">{label}</span>
      </div>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  )
}