"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { StatsCard } from "./stats-card";
import { RecentActivity } from "./recent-activity";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { hasAdminAccess, canViewHeatmap } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Clock, MapPin, Shield, TrendingUp, Users, FileText, Download, Calendar } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import QuotationList from "./quotations";
import Reports from "./reports";
import EngineerReports from "./engineer-reports";
import VisitsPage from "./visitmanager";
import PerformanceAnalytics from "./performance-analytics";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

interface DashboardData {
  overview: { totalVisits: number; totalTrails: number };
  recentActivity: any[];
  performance: { visitsThisMonth: number; trailsThisMonth: number; averageVisitDuration: number; completionRate: number };
  heatmap?: { [key: string]: number };
}

export function DashboardOverview() {
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd"),
  });
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUserSync());
  const [totalVisits, setTotalVisits] = useState(0);
  const [averageDuration, setAverageDuration] = useState(0);
  const [showQuotations, setShowQuotations] = useState(false);
  const [showEngineerReports, setShowEngineerReports] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showVisits, setShowVisits] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const { toast } = useToast();

  // Fetch user if not available
  useEffect(() => {
    if (!currentUser) {
      authService.getCurrentUser().then(setCurrentUser).catch((error) => {
        console.error("Failed to get current user:", error);
        toast({ title: "Error", description: "Unable to fetch user data.", variant: "destructive" });
      });
    }
  }, [toast]);

  // Fetch visits data
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        const res = await fetch("https://app.codewithseth.co.ke/api/visits", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
        const data = await res.json()
        const docs = data?.data?.docs || data?.docs || []
        setTotalVisits(docs.length)

        // Calculate average duration (in minutes)
        let totalMinutes = 0
        let count = 0
        docs.forEach((visit: any) => {

            const start = new Date(visit.startTime)
            const end = new Date(visit.endTime)
            const diff = (end.getTime() - start.getTime()) / (1000 * 60)
            if (!isNaN(diff) && diff > 0) {
              totalMinutes += diff
              count++
            }
          }
        )
        setAverageDuration(count > 0 ? Math.round(totalMinutes / count) : 0)
      } catch (err) {
        setTotalVisits(0)
        setAverageDuration(0)
      }
    }
    fetchVisits()
  }, []);

  // API calls with React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", dateRange, currentUser?.region, currentUser?.id],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const [overview, recentActivity, performance, visitsRes] = await Promise.all([
          apiService.getDashboardOverview(dateRange.startDate, dateRange.endDate, currentUser?.region || "North"),
          apiService.getRecentActivity(20),
          apiService.getPerformanceMetrics(dateRange.startDate, dateRange.endDate, currentUser?.region || "North"),
          fetch("https://app.codewithseth.co.ke/api/visits", {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          }).then(res => res.json())
        ]);
        const docs = visitsRes?.data?.docs || visitsRes?.docs || [];
        // Calculate average duration
        let totalMinutes = 0, count = 0;
        docs.forEach((visit: any) => {
          if (visit.startTime && visit.endTime) {
            const start = new Date(visit.startTime);
            const end = new Date(visit.endTime);
            const diff = (end.getTime() - start.getTime()) / (1000 * 60);
            if (!isNaN(diff) && diff > 0) {
              totalMinutes += diff;
              count++;
            }
          }
        });
        const averageVisitDuration = count > 0 ? Math.round(totalMinutes / count) : 0;
        // Merge into overview
        return {
          overview: {
            ...overview,
            totalVisits: docs.length,
            averageVisitDuration,
          },
          recentActivity,
          performance,
          heatmap: null,
        };
      } catch (err) {
        console.error("Dashboard query failed:", err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });

  // Fetch performance trend data for chart
  const { data: performanceData } = useQuery({
    queryKey: ["performance", dateRange, currentUser?.region],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const region = currentUser?.region || "North";
      const url = `https://app.codewithseth.co.ke/api/dashboard/performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&region=${region}`;
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      const data = await res.json();
      return data.success && Array.isArray(data.data) ? data.data : [];
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5,
  });

  // Sales Heatmap Query
  const { data: salesHeatmap, isLoading: heatmapLoading } = useQuery({
    queryKey: ["salesHeatmap"],
    queryFn: apiService.getSalesHeatmap,
    staleTime: 1000 * 60 * 10, // cache 10 mins
  });

  // Transform recent activity
  const recentActivityArr = Array.isArray(data?.recentActivity) ? data.recentActivity : [];
  const transformedActivity = recentActivityArr.map((item: any, index: number) => ({
    id: item.id || index.toString(),
    type: item.type || (index % 2 === 0 ? "visit" : "trail"),
    description: item.description || item.action || `Activity ${index + 1}`,
    timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
    client: item.client?.name || item.clientName,
  }));

  // Fetch trails data FIRST
  const { data: trailsData, isLoading: trailsLoading } = useQuery({
    queryKey: ["allTrails"],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://app.codewithseth.co.ke/api/dashboard/all-trails", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      return data?.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Now you can safely use trailsData below
  // Build date-indexed maps for visits and trails
  const visitsResDocs = data?.overview?.visits || []; // If you have visits by date, else use your fetched docs
  const trailsDocs = Array.isArray(trailsData) ? trailsData : [];

  // Collect all unique dates from both datasets
  const allDatesSet = new Set<string>();
  visitsResDocs.forEach((v: any) => v.date && allDatesSet.add(v.date.slice(0, 10)));
  trailsDocs.forEach((t: any) => t.date && allDatesSet.add(t.date.slice(0, 10)));
  const allDates = Array.from(allDatesSet).sort();

  // Count visits and trails per date
  const visitsByDate: Record<string, number> = {};
  visitsResDocs.forEach((v: any) => {
    const d = v.date?.slice(0, 10);
    if (d) visitsByDate[d] = (visitsByDate[d] || 0) + 1;
  });
  const trailsByDate: Record<string, number> = {};
  trailsDocs.forEach((t: any) => {
    const d = t.date?.slice(0, 10);
    if (d) trailsByDate[d] = (trailsByDate[d] || 0) + 1;
  });

  // Chart.js data for performance trends: Visits vs Trails
  const performanceChartData = {
    labels: allDates.map((d) => format(new Date(d), "MMM dd")),
    datasets: [
      {
        label: "Visits",
        data: allDates.map((d) => visitsByDate[d] || 0),
        borderColor: "hsl(var(--primary))",
        backgroundColor: "hsl(var(--primary)/0.2)",
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Trails",
        data: allDates.map((d) => trailsByDate[d] || 0),
        borderColor: "hsl(var(--secondary))",
        backgroundColor: "hsl(var(--secondary)/0.2)",
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Sales Heatmap chart data
  const salesHeatmapChartData = {
    labels: salesHeatmap?.map((item: any) => `${item.userName} (${item.location})`) || [],
    datasets: [
      {
        label: "Sales Activity",
        data: salesHeatmap?.map((item: any) => item.count) || [],
        backgroundColor: "hsl(var(--primary)/0.5)",
      },
    ],
  };

  // Heatmap chart data
  const heatmapChartData = {
    labels: Object.keys(data?.heatmap || {}),
    datasets: [
      {
        label: "Activity Intensity",
        data: Object.values(data?.heatmap || {}),
        backgroundColor: "hsl(var(--primary)/0.5)",
      },
    ],
  };

  // Calculate total trails and distance
  const totalTrails = trailsDocs.length;
  const totalTrailDistance = trailsDocs.reduce((sum, trail) => sum + (trail.totalDistance || 0), 0);

  // Download Functions
  const downloadDashboardData = async (format: 'csv' | 'json' | 'excel') => {
    try {
      const dashboardData = {
        summary: {
          totalVisits,
          totalTrails,
          totalTrailDistance: totalTrailDistance.toFixed(2),
          averageVisitDuration: averageDuration,
          dateRange: dateRange,
          generatedAt: new Date().toISOString(),
          user: {
            name: `${currentUser?.firstName} ${currentUser?.lastName}`,
            role: currentUser?.role,
            region: currentUser?.region,
          }
        },
        visits: visitsResDocs,
        trails: trailsDocs,
        recentActivity: transformedActivity,
        performance: data?.performance,
      };

      if (format === 'json') {
        // Download as JSON
        const blob = new Blob([JSON.stringify(dashboardData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Started",
          description: "Dashboard data exported as JSON",
        });
      } else if (format === 'csv') {
        // Download as CSV
        const csvRows = [];
        
        // Summary section
        csvRows.push('Dashboard Summary Report');
        csvRows.push(`Generated: ${new Date().toLocaleString()}`);
        csvRows.push(`User: ${currentUser?.firstName} ${currentUser?.lastName} (${currentUser?.role})`);
        csvRows.push(`Region: ${currentUser?.region}`);
        csvRows.push('');
        
        // Metrics
        csvRows.push('Metric,Value');
        csvRows.push(`Total Visits,${totalVisits}`);
        csvRows.push(`Total Trails,${totalTrails}`);
        csvRows.push(`Total Distance (km),${totalTrailDistance.toFixed(2)}`);
        csvRows.push(`Average Visit Duration (min),${averageDuration}`);
        csvRows.push('');
        
        // Visits data
        csvRows.push('Visits');
        csvRows.push('Date,Client,Location,Duration,Status');
        visitsResDocs.forEach((visit: any) => {
          csvRows.push(`${visit.date},${visit.client?.name || 'N/A'},${visit.client?.location || 'N/A'},${visit.duration || 'N/A'},${visit.status || 'N/A'}`);
        });
        csvRows.push('');
        
        // Trails data
        csvRows.push('Trails');
        csvRows.push('Date,Start Time,End Time,Distance (km),Stops');
        trailsDocs.forEach((trail: any) => {
          csvRows.push(`${trail.date},${trail.startTime},${trail.endTime},${trail.totalDistance?.toFixed(2) || 0},${trail.stops?.length || 0}`);
        });
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Started",
          description: "Dashboard data exported as CSV",
        });
      } else if (format === 'excel') {
        // Download Excel from analytics API
        try {
          const token = authService.getAccessToken();
          const response = await fetch('https://app.codewithseth.co.ke/api/analytics/report/latest', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (!response.ok) {
            throw new Error('Excel report not available. Generate analytics first.');
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "Download Started",
            description: "Excel analytics report downloaded",
          });
        } catch (error) {
          toast({
            title: "Excel Report Unavailable",
            description: "Generate analytics first or use CSV export",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to export dashboard data",
        variant: "destructive",
      });
    }
  };

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  if (isLoading || trailsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 neumorphic-card animate-pulse bg-primary/10 rounded-lg" />
          ))}
        </div>
        <div className="h-64 neumorphic-card animate-pulse bg-primary/10 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load dashboard data. Please try again later.</p>
        <Button onClick={() => window.location.reload()} className="mt-4 neumorphic-button">
          Retry
        </Button>
      </div>
    );
  }

  // Show reports page if button is clicked
  if (showReports) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          className="mb-4 flex items-center gap-2"
          onClick={() => setShowReports(false)}
        >
          ← Back to Dashboard
        </Button>
        <Reports />
      </div>
    );
  }

  // Show visits page if button is clicked
  if (showVisits) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          className="mb-4 flex items-center gap-2"
          onClick={() => setShowVisits(false)}
        >
          ← Back to Dashboard
        </Button>
        <VisitsPage />
      </div>
    );
  }

  // Show quotations page if button is clicked
  if (showQuotations) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          className="mb-4 flex items-center gap-2"
          onClick={() => setShowQuotations(false)}
        >
          ← Back to Dashboard
        </Button>
        <QuotationList />
      </div>
    );
  }

  if (showEngineerReports) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          className="mb-4 flex items-center gap-2"
          onClick={() => setShowEngineerReports(false)}
        >
          ← Back to Dashboard
        </Button>
        {/* lazy load EngineerReports component */}
        <React.Suspense fallback={<div className="p-4">Loading engineer reports...</div>}>
          {/* @ts-ignore Server/Client boundary: component is client */}
          <EngineerReports />
        </React.Suspense>
      </div>
    );
  }

  if (showPerformance) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          className="mb-4 flex items-center gap-2"
          onClick={() => setShowPerformance(false)}
        >
          ← Back to Dashboard
        </Button>
        <PerformanceAnalytics />
      </div>
    );
  }

  // Replace the previous return JSX with an improved modern layout + subtle animations
  return (
    <div className="space-y-6 px-6 py-8">
      {/* Top toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 shadow-md">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Live overview of visits, trails and sales activity</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-2 rounded-md transition transform hover:scale-105"
              onClick={() => setShowReports(true)}
            >
              <BarChart3 className="h-4 w-4" />
              Reports
            </Button>

            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-2 rounded-md transition transform hover:scale-105 bg-gradient-to-r from-primary/10 to-primary/5"
              onClick={() => setShowPerformance(true)}
            >
              <TrendingUp className="h-4 w-4" />
              Performance
            </Button>

            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-2 rounded-md transition transform hover:scale-105"
              onClick={() => setShowVisits(true)}
            >
              <Clock className="h-4 w-4" />
              Visits
            </Button>

            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-2 rounded-md transition transform hover:scale-105"
              onClick={() => setShowQuotations(true)}
            >
              <FileText className="h-4 w-4" />
              Quotations
            </Button>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-2 rounded-md transition transform hover:scale-105"
              onClick={() => setShowEngineerReports(true)}
            >
              <FileText className="h-4 w-4" />
              Engineer Reports
            </Button>

            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-2 rounded-md transition transform hover:scale-105 bg-black text-white hover:bg-gray-800"
              onClick={() => window.location.href = "/dashboard/planners"}
            >
              <Calendar className="h-4 w-4" />
              Planners
            </Button>
          </div>

          <Button
            variant="outline"
            className="ml-2 hidden sm:inline-flex"
            onClick={() => window.location.reload()}
            title="Refresh dashboard"
          >
            Refresh
          </Button>

          {/* Download Button with Dropdown */}
          <div className="relative ml-2">
            <Button
              variant="default"
              className="hidden sm:inline-flex items-center gap-2"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              title="Download dashboard data"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            
            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      downloadDashboardData('csv');
                      setShowDownloadMenu(false);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Export as CSV
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      downloadDashboardData('json');
                      setShowDownloadMenu(false);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Export as JSON
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      downloadDashboardData('excel');
                      setShowDownloadMenu(false);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Analytics Excel Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Welcome + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="col-span-1 lg:col-span-2 p-6 rounded-2xl shadow-lg transform transition duration-400 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              Welcome back{currentUser ? `, ${currentUser.firstName}` : ""}!
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              {currentUser ? `${currentUser.role.toUpperCase()} • ${currentUser.region}` : "Loading user..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/60 p-4 rounded-xl shadow-sm border border-gray-100 transition transform hover:scale-[1.02]">
                <div className="text-xs font-semibold text-gray-500">Total Visits</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{totalVisits}</div>
                <div className="text-xs text-green-600 mt-1">This period</div>
              </div>
              <div className="bg-white/60 p-4 rounded-xl shadow-sm border border-gray-100 transition transform hover:scale-[1.02]">
                <div className="text-xs font-semibold text-gray-500">Total Trails</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{totalTrails}</div>
                <div className="text-xs text-gray-500 mt-1">Distance: {totalTrailDistance.toFixed(2)} km</div>
              </div>
              <div className="bg-white/60 p-4 rounded-xl shadow-sm border border-gray-100 transition transform hover:scale-[1.02]">
                <div className="text-xs font-semibold text-gray-500">Avg Visit Duration</div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{averageDuration}m</div>
                <div className="text-xs text-gray-500 mt-1">Per visit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 rounded-2xl shadow-lg h-full transform transition duration-400 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            <CardDescription className="text-xs text-gray-500">Admin tools & shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {canViewHeatmap(currentUser) && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 transition transform hover:scale-105"
                  onClick={() => (window.location.href = "/dashboard/sales-heatmap")}
                >
                  <BarChart3 className="h-4 w-4" />
                  View Heatmap
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start gap-2 transition transform hover:scale-105"
                onClick={() => (window.location.href = "/dashboard/user-manager")}
              >
                <Users className="h-4 w-4" />
                Manage Users
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 transition transform hover:scale-105"
                onClick={() => (window.location.href = "/dashboard/advanced-analytics")}
              >
                <TrendingUp className="h-4 w-4" />
                Advanced Analytics
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 transition transform hover:scale-105 bg-black text-white hover:bg-gray-800 border-black"
                onClick={() => (window.location.href = "/dashboard/planners")}
              >
                <Calendar className="h-4 w-4" />
                Weekly Planners
              </Button>
              
              {/* Download Button for Mobile */}
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 transition transform hover:scale-105 bg-primary/5"
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                >
                  <Download className="h-4 w-4" />
                  Download Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 p-4 rounded-2xl shadow-md transition transform hover:scale-[1.01]">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Visits vs Trails over time</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <div className="h-full w-full transition-opacity duration-500">
              <Line
                data={performanceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true, position: "top" },
                    tooltip: { mode: "index", intersect: false },
                  },
                  interaction: { mode: "nearest", axis: "x", intersect: false },
                  scales: {
                    x: { title: { display: true, text: "Date" } },
                    y: { title: { display: true, text: "Count" }, beginAtZero: true },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 rounded-2xl shadow-md transition transform hover:scale-[1.01]">
          <CardHeader>
            <CardTitle>Sales Rep Activity</CardTitle>
            <CardDescription>Top performers</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <Bar
              data={salesHeatmapChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: { title: { display: true, text: "Sales Reps (Location)" } },
                  y: { title: { display: true, text: "Count" }, beginAtZero: true },
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Admin cards + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {hasAdminAccess(currentUser) && (
            <Card className="p-4 rounded-2xl shadow-md transition transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin Features
                </CardTitle>
                <CardDescription>Super user tools and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button variant="ghost" className="flex-col items-start gap-2 p-3 rounded-lg transition hover:bg-gray-50">
                    <Users className="h-5 w-5" />
                    <div className="text-xs">Manage Users</div>
                  </Button>
                  <Button variant="ghost" className="flex-col items-start gap-2 p-3 rounded-lg transition hover:bg-gray-50">
                    <TrendingUp className="h-5 w-5" />
                    <div className="text-xs">Analytics</div>
                  </Button>
                  <Button variant="ghost" className="flex-col items-start gap-2 p-3 rounded-lg transition hover:bg-gray-50">
                    <FileText className="h-5 w-5" />
                    <div className="text-xs">Reports</div>
                  </Button>
                  <Button variant="ghost" className="flex-col items-start gap-2 p-3 rounded-lg transition hover:bg-gray-50">
                    <MapPin className="h-5 w-5" />
                    <div className="text-xs">Heatmap</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <RecentActivity activities={transformedActivity} />
        </div>

        <div className="space-y-6">
          <Card className="p-4 rounded-2xl shadow-md transition transform hover:scale-[1.01]">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Key metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-sm text-gray-500">Completion</div>
                <div className="text-sm font-semibold">{Math.round(data?.performance.completionRate || 0)}%</div>

                <div className="text-sm text-gray-500">Avg Visit</div>
                <div className="text-sm font-semibold">{Math.round(data?.performance.averageVisitDuration || 0)}m</div>

                <div className="text-sm text-gray-500">Trails This Month</div>
                <div className="text-sm font-semibold">{data?.performance.trailsThisMonth ?? 0}</div>

                <div className="text-sm text-gray-500">Visits This Month</div>
                <div className="text-sm font-semibold">{data?.performance.visitsThisMonth ?? 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Heatmap Insight</CardTitle>
              <CardDescription>Activity intensity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-center justify-center text-sm text-gray-500">
                {data?.heatmap ? "Heatmap data ready" : "No heatmap data"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}