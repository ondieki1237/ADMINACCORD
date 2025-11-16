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
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, MapPin, Shield, TrendingUp, Users, FileText, Download, Calendar, CheckCircle, UserPlus, Settings, RefreshCw } from "lucide-react";
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
  overview: { totalVisits: number; totalLeads: number };
  recentActivity: any[];
  performance: { visitsThisMonth: number; leadsThisMonth: number; averageVisitDuration: number; completionRate: number };
  heatmap?: { [key: string]: number };
}

export function DashboardOverview() {
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd"),
  });
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUserSync());
  const [totalVisits, setTotalVisits] = useState(0)
  const [totalLeads, setTotalLeads] = useState(0)
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [averageDuration, setAverageDuration] = useState(0)
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
      if (typeof window === 'undefined') return;
      
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

  // Fetch leads data with total count
  useEffect(() => {
    const fetchLeads = async () => {
      if (typeof window === 'undefined') return;
      
      setLeadsLoading(true)
      try {
        const token = localStorage.getItem("accessToken")
        const res = await fetch("https://app.codewithseth.co.ke/api/admin/leads?page=1&limit=1", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
        const data = await res.json()
        
        // Handle different API response formats
        let totalCount = 0
        if (data?.data?.totalDocs) {
          // If API returns totalDocs (pagination info)
          totalCount = data.data.totalDocs
        } else if (data?.totalDocs) {
          totalCount = data.totalDocs
        } else {
          // Fallback to counting docs array
          const docs = data?.data?.docs || data?.docs || data?.data || []
          totalCount = Array.isArray(docs) ? docs.length : 0
        }
        
        setTotalLeads(totalCount)
      } catch (err) {
        console.error("Failed to fetch leads:", err)
        setTotalLeads(0)
      } finally {
        setLeadsLoading(false)
      }
    }
    fetchLeads()
  }, []);

  // API calls with React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", dateRange, currentUser?.region, currentUser?.id],
    queryFn: async () => {
      if (typeof window === 'undefined') return null;
      
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
    enabled: typeof window !== 'undefined' && !!currentUser,
  });

  // Fetch performance trend data for chart
  const { data: performanceData } = useQuery({
    queryKey: ["performance", dateRange, currentUser?.region],
    queryFn: async () => {
      if (typeof window === 'undefined') return [];
      
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
    enabled: typeof window !== 'undefined',
  });

  // Transform recent activity
  const recentActivityArr = Array.isArray(data?.recentActivity) ? data.recentActivity : [];
  const transformedActivity = recentActivityArr.map((item: any, index: number) => ({
    id: item.id || index.toString(),
    type: item.type || (index % 2 === 0 ? "visit" : "lead"),
    description: item.description || item.action || `Activity ${index + 1}`,
    timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
    client: item.client?.name || item.clientName,
  }));

  // Fetch leads data for chart
  const { data: leadsData, isLoading: leadsChartLoading } = useQuery({
    queryKey: ["allLeads"],
    queryFn: async () => {
      if (typeof window === 'undefined') return [];
      
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://app.codewithseth.co.ke/api/admin/leads?page=1&limit=1000", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      return data?.data?.docs || data?.docs || data?.data || [];
    },
    staleTime: 1000 * 60 * 5,
    enabled: typeof window !== 'undefined',
  });

  // Build date-indexed maps for visits and leads
  const visitsResDocs = data?.overview?.visits || [];
  const leadsDocs = Array.isArray(leadsData) ? leadsData : [];

  // Collect all unique dates from both datasets and sort chronologically (oldest to latest)
  const allDatesSet = new Set<string>();
  visitsResDocs.forEach((v: any) => v.date && allDatesSet.add(v.date.slice(0, 10)));
  leadsDocs.forEach((l: any) => {
    const dateStr = l.createdAt || l.date;
    if (dateStr) allDatesSet.add(dateStr.slice(0, 10));
  });
  const allDates = Array.from(allDatesSet).sort((a, b) => a.localeCompare(b)); // Sort oldest to latest

  // Count visits and leads per date
  const visitsByDate: Record<string, number> = {};
  visitsResDocs.forEach((v: any) => {
    const d = v.date?.slice(0, 10);
    if (d) visitsByDate[d] = (visitsByDate[d] || 0) + 1;
  });
  const leadsByDate: Record<string, number> = {};
  leadsDocs.forEach((l: any) => {
    const dateStr = l.createdAt || l.date;
    const d = dateStr?.slice(0, 10);
    if (d) leadsByDate[d] = (leadsByDate[d] || 0) + 1;
  });

  // Chart.js data for performance trends: Visits vs Leads
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
        label: "Leads",
        data: allDates.map((d) => leadsByDate[d] || 0),
        borderColor: "rgb(147, 51, 234)",
        backgroundColor: "rgba(147, 51, 234, 0.2)",
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

  // Download Functions
  const downloadDashboardData = async (format: 'csv' | 'json' | 'excel') => {
    if (typeof window === 'undefined') return;
    
    try {
      const dashboardData = {
        summary: {
          totalVisits,
          totalLeads,
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
        leads: leadsDocs,
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
        csvRows.push(`Total Leads,${totalLeads}`);
        csvRows.push(`Average Visit Duration (min),${averageDuration}`);
        csvRows.push('');
        
        // Visits data
        csvRows.push('Visits');
        csvRows.push('Date,Client,Location,Duration,Status');
        visitsResDocs.forEach((visit: any) => {
          csvRows.push(`${visit.date},${visit.client?.name || 'N/A'},${visit.client?.location || 'N/A'},${visit.duration || 'N/A'},${visit.status || 'N/A'}`);
        });
        csvRows.push('');
        
        // Leads data
        csvRows.push('Leads');
        csvRows.push('Date,Name,Company,Status,Value');
        leadsDocs.forEach((lead: any) => {
          const date = lead.createdAt || lead.date || 'N/A';
          csvRows.push(`${date},${lead.name || 'N/A'},${lead.company || 'N/A'},${lead.status || 'N/A'},${lead.value || 0}`);
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh handler
  const handleRefresh = async () => {
    if (typeof window === 'undefined') return;
    
    setIsRefreshing(true);
    try {
      await refetch();
      // Also refetch leads
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://app.codewithseth.co.ke/api/admin/leads?page=1&limit=1", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      let totalCount = 0;
      if (data?.data?.totalDocs) {
        totalCount = data.data.totalDocs;
      } else if (data?.totalDocs) {
        totalCount = data.totalDocs;
      } else {
        const docs = data?.data?.docs || data?.docs || data?.data || [];
        totalCount = Array.isArray(docs) ? docs.length : 0;
      }
      setTotalLeads(totalCount);
      
      toast({
        title: "Dashboard Refreshed",
        description: "All data has been updated successfully",
      });
    } catch (err) {
      console.error("Refresh failed:", err);
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading || leadsChartLoading) {
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

  // Enhanced modern professional layout with improved visual hierarchy and sidebar support
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Simplified Header - Cleaner with sidebar layout */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
          <div className="bg-gradient-to-r from-[#008cf7] to-[#006bb8] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Title Area */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
                <p className="text-sm sm:text-base text-white/90 mt-1 font-medium">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName} • ${currentUser.role} • ${currentUser.region}` : "Loading..."}
                </p>
              </div>

              {/* Actions - Desktop */}
              <div className="hidden sm:flex items-center gap-2">
                {/* Refresh Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/40 transition-all duration-200"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                {/* Enhanced Download Dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/40 transition-all duration-200"
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
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="py-2">
                          <button
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 text-sm text-gray-700 transition-colors group"
                            onClick={() => {
                              downloadDashboardData('csv');
                              setShowDownloadMenu(false);
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-[#008cf7] transition-colors">
                              <FileText className="h-4 w-4 text-[#008cf7] group-hover:text-white transition-colors" />
                            </div>
                            <div>
                              <div className="font-medium">Export as CSV</div>
                              <div className="text-xs text-gray-500">Download spreadsheet</div>
                            </div>
                          </button>
                          <button
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 text-sm text-gray-700 transition-colors group"
                            onClick={() => {
                              downloadDashboardData('json');
                              setShowDownloadMenu(false);
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                              <FileText className="h-4 w-4 text-purple-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                              <div className="font-medium">Export as JSON</div>
                              <div className="text-xs text-gray-500">Download data file</div>
                            </div>
                          </button>
                          <button
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 text-sm text-gray-700 transition-colors group"
                            onClick={() => {
                              downloadDashboardData('excel');
                              setShowDownloadMenu(false);
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-600 transition-colors">
                              <FileText className="h-4 w-4 text-green-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                              <div className="font-medium">Analytics Excel</div>
                              <div className="text-xs text-gray-500">Full analytics report</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Export Button */}
              <div className="sm:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/40"
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row - Enhanced Modern Cards with Animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Visits Card */}
          <Card className="bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-[#008cf7]" />
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                  Active
                </span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Total Visits</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{totalVisits.toLocaleString()}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  This period
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Leads Card */}
          <Card className="bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                  Prospects
                </span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Total Leads</p>
                {leadsLoading ? (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-10 w-24 bg-purple-100 animate-pulse rounded"></div>
                  </div>
                ) : (
                  <p className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{totalLeads.toLocaleString()}</p>
                )}
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Pipeline opportunities
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Visit Duration Card */}
          <Card className="bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                  Average
                </span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Visit Duration</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                  {averageDuration}<span className="text-lg sm:text-xl text-gray-400 ml-1">min</span>
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  Per visit
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Completion Rate Card */}
          <Card className="bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                  {Math.round(data?.performance.completionRate || 0)}%
                </span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Completion Rate</p>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{data?.performance.visitsThisMonth ?? 0}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Visits this month
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Enhanced Professional Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Performance Trends - Takes 2/3 width on desktop */}
          <Card className="lg:col-span-2 bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardHeader className="border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-transparent pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008cf7] to-[#006bb8] flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">Performance Trends</CardTitle>
                    <CardDescription className="text-xs text-gray-500 mt-0.5">
                      Visits vs Trails over time
                    </CardDescription>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#008cf7]"></div>
                    <span className="text-gray-600 font-medium">Visits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-gray-600 font-medium">Trails</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-4 px-4 sm:px-6">
              <div className="h-[280px] sm:h-80">
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
                          font: { size: 12, weight: 'bold' },
                          color: '#374151'
                        }
                      },
                      tooltip: { 
                        mode: "index", 
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        padding: 14,
                        cornerRadius: 10,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 }
                      },
                    },
                    interaction: { mode: "nearest", axis: "x", intersect: false },
                    scales: {
                      x: { 
                        grid: { display: false },
                        ticks: { 
                          font: { size: 11 },
                          color: '#6b7280'
                        }
                      },
                      y: { 
                        beginAtZero: true,
                        ticks: { 
                          font: { size: 11 },
                          color: '#6b7280'
                        },
                        grid: { color: 'rgba(0, 0, 0, 0.04)' }
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Top Performers - 1/3 width on desktop */}
          <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardHeader className="border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-transparent pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Top Performers</CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-0.5">
                    Sales rep activity
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-4 px-4 sm:px-6">
              <div className="h-[280px] sm:h-80">
                {heatmapLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-sm text-gray-400 flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#008cf7] rounded-full animate-spin"></div>
                      <span>Loading data...</span>
                    </div>
                  </div>
                ) : (
                  <Bar
                    data={salesHeatmapChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.85)',
                          padding: 14,
                          cornerRadius: 10,
                          titleFont: { size: 13, weight: 'bold' },
                          bodyFont: { size: 12 }
                        }
                      },
                      scales: {
                        x: { 
                          grid: { display: false },
                          ticks: { 
                            font: { size: 9 },
                            maxRotation: 45,
                            minRotation: 45,
                            color: '#6b7280'
                          }
                        },
                        y: { 
                          beginAtZero: true,
                          ticks: { 
                            font: { size: 11 },
                            color: '#6b7280'
                          },
                          grid: { color: 'rgba(0, 0, 0, 0.04)' }
                        },
                      },
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Full Width Recent Activity */}
        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <CardHeader className="border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-transparent pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008cf7] to-[#006bb8] flex items-center justify-center shadow-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Recent Activity</CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-0.5">
                    Latest visits and trails
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs bg-blue-50 text-[#008cf7] border-[#008cf7]/30">
                {transformedActivity.length} items
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {transformedActivity.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">Activity will appear here as it happens</p>
                </div>
              ) : (
                transformedActivity.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className="group flex items-start gap-3 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 border border-gray-100/50 hover:border-gray-200 transition-all duration-200"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      activity.type === 'visit' 
                        ? 'bg-blue-100 text-[#008cf7] group-hover:bg-[#008cf7] group-hover:text-white' 
                        : 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
                    }`}>
                      {activity.type === 'visit' ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        <MapPin className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">
                          {activity.description}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs whitespace-nowrap flex-shrink-0 ${
                            activity.type === 'visit' 
                              ? 'bg-blue-50 text-[#008cf7] border-[#008cf7]/30' 
                              : 'bg-purple-50 text-purple-600 border-purple-600/30'
                          }`}
                        >
                          {activity.type}
                        </Badge>
                      </div>
                      {activity.client && (
                        <p className="text-xs text-gray-500 mb-1 truncate">
                          <span className="font-medium">Client:</span> {activity.client}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(activity.timestamp).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}