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
import { BarChart3, Clock, MapPin, Shield, TrendingUp, Users, FileText, Download, Calendar, CheckCircle } from "lucide-react";
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

  // Collect all unique dates from both datasets and sort chronologically (oldest to latest)
  const allDatesSet = new Set<string>();
  visitsResDocs.forEach((v: any) => v.date && allDatesSet.add(v.date.slice(0, 10)));
  trailsDocs.forEach((t: any) => t.date && allDatesSet.add(t.date.slice(0, 10)));
  const allDates = Array.from(allDatesSet).sort((a, b) => a.localeCompare(b)); // Sort oldest to latest

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

  // Sales Heatmap chart data - sort by timestamp (oldest to latest)
  const sortedSalesHeatmap = salesHeatmap 
    ? [...salesHeatmap].sort((a: any, b: any) => {
        const dateA = new Date(a.timestamp || a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.timestamp || b.date || b.createdAt || 0).getTime();
        return dateA - dateB; // Oldest to latest
      })
    : [];

  const salesHeatmapChartData = {
    labels: sortedSalesHeatmap.map((item: any) => `${item.userName} (${item.location})`),
    datasets: [
      {
        label: "Sales Activity",
        data: sortedSalesHeatmap.map((item: any) => item.count),
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Section - Fixed Height */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title Area */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#008cf7] to-[#0066cc] shadow-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-sm text-gray-600">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName} • ${currentUser.role} • ${currentUser.region}` : "Loading..."}
                </p>
              </div>
            </div>

            {/* Action Buttons - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-[#008cf7] hover:bg-[#008cf7]/10"
                onClick={() => setShowReports(true)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-[#008cf7] hover:bg-[#008cf7]/10"
                onClick={() => setShowPerformance(true)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-[#008cf7] hover:bg-[#008cf7]/10"
                onClick={() => setShowVisits(true)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Visits
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-[#008cf7] hover:bg-[#008cf7]/10"
                onClick={() => setShowQuotations(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Quotations
              </Button>

              <div className="h-6 w-px bg-gray-300 mx-2" />

              {/* Download Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#008cf7] text-[#008cf7] hover:bg-[#008cf7] hover:text-white"
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                
                {showDownloadMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowDownloadMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                      <div className="py-2">
                        <button
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition-colors"
                          onClick={() => {
                            downloadDashboardData('csv');
                            setShowDownloadMenu(false);
                          }}
                        >
                          <FileText className="h-4 w-4 text-gray-500" />
                          Export as CSV
                        </button>
                        <button
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition-colors"
                          onClick={() => {
                            downloadDashboardData('json');
                            setShowDownloadMenu(false);
                          }}
                        >
                          <FileText className="h-4 w-4 text-gray-500" />
                          Export as JSON
                        </button>
                        <button
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition-colors"
                          onClick={() => {
                            downloadDashboardData('excel');
                            setShowDownloadMenu(false);
                          }}
                        >
                          <FileText className="h-4 w-4 text-gray-500" />
                          Analytics Excel Report
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[140px]"
              onClick={() => setShowReports(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[140px]"
              onClick={() => setShowVisits(true)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Visits
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[140px] border-[#008cf7] text-[#008cf7]"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards Row - Consistent Heights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-[#008cf7]" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Visits</p>
                <p className="text-3xl font-bold text-gray-900">{totalVisits}</p>
                <p className="text-xs text-gray-500 mt-1">This period</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  Tracking
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Trails</p>
                <p className="text-3xl font-bold text-gray-900">{totalTrails}</p>
                <p className="text-xs text-gray-500 mt-1">{totalTrailDistance.toFixed(2)} km covered</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                  Avg
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Visit Duration</p>
                <p className="text-3xl font-bold text-gray-900">{averageDuration}<span className="text-lg text-gray-500">m</span></p>
                <p className="text-xs text-gray-500 mt-1">Per visit</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {Math.round(data?.performance.completionRate || 0)}%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{data?.performance.visitsThisMonth ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">Visits this month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row - Equal Heights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white border border-gray-200/60">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#008cf7]" />
                    Performance Trends
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 mt-1">
                    Visits vs Trails over time
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              <div className="h-80">
                <Line
                  data={performanceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        display: true, 
                        position: "top",
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: { size: 12 }
                        }
                      },
                      tooltip: { 
                        mode: "index", 
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8
                      },
                    },
                    interaction: { mode: "nearest", axis: "x", intersect: false },
                    scales: {
                      x: { 
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                      },
                      y: { 
                        beginAtZero: true,
                        ticks: { font: { size: 11 } },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200/60">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#008cf7]" />
                Top Performers
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                Sales rep activity
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              <div className="h-80">
                <Bar
                  data={salesHeatmapChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8
                      }
                    },
                    scales: {
                      x: { 
                        grid: { display: false },
                        ticks: { 
                          font: { size: 10 },
                          maxRotation: 45,
                          minRotation: 45
                        }
                      },
                      y: { 
                        beginAtZero: true,
                        ticks: { font: { size: 11 } },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid - Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity activities={transformedActivity} />
          </div>

          <div className="space-y-4">
            <Card className="bg-white border border-gray-200/60">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#008cf7]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {canViewHeatmap(currentUser) && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-700 hover:bg-[#008cf7]/10 hover:text-[#008cf7]"
                      onClick={() => (window.location.href = "/dashboard/sales-heatmap")}
                    >
                      <MapPin className="h-4 w-4 mr-3" />
                      Sales Heatmap
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-[#008cf7]/10 hover:text-[#008cf7]"
                    onClick={() => (window.location.href = "/dashboard/user-manager")}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    User Management
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-[#008cf7]/10 hover:text-[#008cf7]"
                    onClick={() => (window.location.href = "/dashboard/advanced-analytics")}
                  >
                    <TrendingUp className="h-4 w-4 mr-3" />
                    Advanced Analytics
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-[#008cf7]/10 hover:text-[#008cf7]"
                    onClick={() => setShowEngineerReports(true)}
                  >
                    <FileText className="h-4 w-4 mr-3" />
                    Engineer Reports
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-black text-white hover:bg-gray-800 border-black"
                    onClick={() => (window.location.href = "/dashboard/planners")}
                  >
                    <Calendar className="h-4 w-4 mr-3" />
                    Weekly Planners
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200/60">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#008cf7]" />
                  Monthly Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Trails This Month</span>
                    <span className="text-sm font-semibold text-gray-900">{data?.performance.trailsThisMonth ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Visits This Month</span>
                    <span className="text-sm font-semibold text-gray-900">{data?.performance.visitsThisMonth ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Avg Visit Duration</span>
                    <span className="text-sm font-semibold text-gray-900">{Math.round(data?.performance.averageVisitDuration || 0)}m</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-semibold text-green-600">{Math.round(data?.performance.completionRate || 0)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}