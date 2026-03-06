"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth, setMonth, setYear, isWithinInterval, isSameDay, startOfWeek, endOfWeek, addDays } from "date-fns";
import { apiService } from "@/lib/api";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import { fetchAdminPlanners, type Planner, type PlannerDay } from "@/lib/plannerHelpers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Package,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Phone,
  Search,
  ChevronRight,
  BarChart3,
  PieChart,
  List,
  AlertCircle,
  Eye,
  Filter
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Types
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  region?: string;
  employeeId?: string;
}

interface Visit {
  _id: string;
  date?: string;
  startTime?: string;
  client?: { name?: string; type?: string; location?: string };
  contacts?: { name?: string; role?: string; phone?: string }[];
  productsOfInterest?: string[];
  visitPurpose?: string;
  visitOutcome?: string;
  notes?: string;
  createdAt?: string;
}

// ACCORD Brand Colors
const COLORS = {
  primary: "#008cf7",
  primaryDark: "#006bb8",
  success: "#059669",
  warning: "#f59e0b",
  danger: "#dc2626",
  purple: "#8b5cf6",
  orange: "#f97316",
  pink: "#ec4899",
  slate: "#64748b"
};

export default function AdvancedAnalytics() {
  const router = useRouter();
  const { toast } = useToast();
  
  // States
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [customMonth, setCustomMonth] = useState<{ month: number; year: number }>({ 
    month: new Date().getMonth(), 
    year: new Date().getFullYear() 
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [activeTab, setActiveTab] = useState("visits");

  // Get auth token
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  // Calculate date range for selected month
  const dateRange = useMemo(() => {
    const selectedDate = setYear(setMonth(new Date(), customMonth.month), customMonth.year);
    return {
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate),
      startStr: format(startOfMonth(selectedDate), "yyyy-MM-dd"),
      endStr: format(endOfMonth(selectedDate), "yyyy-MM-dd"),
      label: format(selectedDate, "MMMM yyyy")
    };
  }, [customMonth]);

  // Fetch all users
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await apiService.getUsers();
      return (res.data || res || []) as User[];
    },
    staleTime: 60000
  });

  const users = usersData || [];
  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch visits for selected user
  const { data: visitsData, isLoading: loadingVisits } = useQuery({
    queryKey: ["user-visits", selectedUser?._id, dateRange.startStr, dateRange.endStr],
    queryFn: async () => {
      if (!selectedUser) return [];
      const res = await apiService.getAdminVisitsByUser(selectedUser._id, {
        startDate: dateRange.startStr,
        endDate: dateRange.endStr,
        limit: 500
      });
      return (res.data?.docs || res.data || res.docs || []) as Visit[];
    },
    enabled: !!selectedUser,
    staleTime: 30000
  });

  const visits = visitsData || [];

  // Fetch planners for selected user
  const { data: plannersData, isLoading: loadingPlanners } = useQuery({
    queryKey: ["user-planners", selectedUser?._id, dateRange.startStr, dateRange.endStr],
    queryFn: async () => {
      if (!selectedUser || !token) return [];
      const res = await fetchAdminPlanners({
        token,
        userId: selectedUser._id,
        from: dateRange.startStr,
        to: dateRange.endStr,
        limit: 100
      });
      return res.data || [];
    },
    enabled: !!selectedUser && !!token,
    staleTime: 30000
  });

  const planners = plannersData || [];

  // Analytics computed from visits
  const analytics = useMemo(() => {
    // Products of interest breakdown
    const productCounts: Record<string, number> = {};
    visits.forEach(v => {
      (v.productsOfInterest || []).forEach(p => {
        const productName = (typeof p === 'string' ? p : (p as any)?.name || "Unknown").toLowerCase();
        productCounts[productName] = (productCounts[productName] || 0) + 1;
      });
    });
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Visit purpose breakdown
    const purposeCounts: Record<string, number> = {};
    visits.forEach(v => {
      const purpose = v.visitPurpose || "Not Specified";
      purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
    });
    const purposeBreakdown = Object.entries(purposeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([purpose, count]) => ({ purpose, count }));

    // Outcome breakdown
    const outcomeCounts: Record<string, number> = {};
    visits.forEach(v => {
      const outcome = v.visitOutcome || "Not Specified";
      outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
    });
    const outcomeBreakdown = Object.entries(outcomeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([outcome, count]) => ({ outcome, count }));

    // Unique clients
    const uniqueClients = new Set(visits.map(v => v.client?.name).filter(Boolean)).size;

    // Locations visited
    const locations = new Set(visits.map(v => v.client?.location).filter(Boolean));

    return {
      totalVisits: visits.length,
      uniqueClients,
      locations: Array.from(locations),
      topProducts,
      purposeBreakdown,
      outcomeBreakdown
    };
  }, [visits]);

  // Planner vs Visits comparison (missed visits)
  const plannerComparison = useMemo(() => {
    const today = new Date();
    const missedVisits: { date: string; place: string; day: string }[] = [];
    const completedPlannedVisits: { date: string; place: string; visitedAt?: string }[] = [];

    planners.forEach(planner => {
      planner.days.forEach(day => {
        if (!day.place || day.place.trim() === "" || day.place.toLowerCase() === "n/a") return;

        const planDate = parseISO(day.date);
        // Only check past dates up to today
        if (planDate > today) return;

        // Check if there's a visit on this date
        const hasVisit = visits.some(v => {
          const visitDate = v.date || v.startTime || v.createdAt;
          if (!visitDate) return false;
          return isSameDay(parseISO(visitDate), planDate);
        });

        if (hasVisit) {
          completedPlannedVisits.push({
            date: day.date,
            place: day.place,
            visitedAt: day.date
          });
        } else {
          missedVisits.push({
            date: day.date,
            place: day.place,
            day: day.day
          });
        }
      });
    });

    return {
      missedVisits: missedVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      completedPlannedVisits,
      complianceRate: completedPlannedVisits.length + missedVisits.length > 0 
        ? Math.round((completedPlannedVisits.length / (completedPlannedVisits.length + missedVisits.length)) * 100)
        : 0
    };
  }, [planners, visits]);

  // Chart data for visit purposes
  const purposeChartData = {
    labels: analytics.purposeBreakdown.map(p => p.purpose),
    datasets: [{
      data: analytics.purposeBreakdown.map(p => p.count),
      backgroundColor: [
        COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, 
        COLORS.purple, COLORS.orange, COLORS.pink, COLORS.slate
      ],
      borderWidth: 0
    }]
  };

  // Chart data for products
  const productChartData = {
    labels: analytics.topProducts.map(p => p.name.charAt(0).toUpperCase() + p.name.slice(1)),
    datasets: [{
      label: "Interest Count",
      data: analytics.topProducts.map(p => p.count),
      backgroundColor: COLORS.primary,
      borderRadius: 8
    }]
  };

  // If no user selected, show user selection
  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-[#008cf7]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008cf7] to-[#006bb8] flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  Employee Insights
                </h1>
                <p className="text-sm text-gray-500 mt-1">Select an employee to view their performance data</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* User Grid */}
          {loadingUsers ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#008cf7] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(user => (
                <Card 
                  key={user._id}
                  className="cursor-pointer hover:border-[#008cf7] hover:shadow-lg transition-all"
                  onClick={() => setSelectedUser(user)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 bg-gradient-to-br from-[#008cf7] to-[#006bb8]">
                        <AvatarFallback className="text-white text-lg font-bold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">{user.role}</Badge>
                          {user.region && (
                            <Badge variant="outline" className="text-xs">{user.region}</Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredUsers.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No employees found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // User selected - show their data
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="text-gray-600 hover:text-[#008cf7]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <Avatar className="w-12 h-12 bg-gradient-to-br from-[#008cf7] to-[#006bb8]">
                <AvatarFallback className="text-white font-bold">
                  {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h1>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            {/* Month Picker */}
            <div className="flex items-center gap-3">
              <Popover open={showMonthPicker} onOpenChange={setShowMonthPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    {dateRange.label}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="end">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-gray-700">Select Month</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }, (_, i) => (
                        <Button
                          key={i}
                          variant={customMonth.month === i ? "default" : "outline"}
                          size="sm"
                          className={`text-xs ${customMonth.month === i ? "bg-[#008cf7]" : ""}`}
                          onClick={() => {
                            setCustomMonth(prev => ({ ...prev, month: i }));
                          }}
                        >
                          {format(setMonth(new Date(), i), "MMM")}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCustomMonth(prev => ({ ...prev, year: prev.year - 1 }))}>←</Button>
                      <span className="flex-1 text-center font-medium">{customMonth.year}</span>
                      <Button variant="outline" size="sm" onClick={() => setCustomMonth(prev => ({ ...prev, year: prev.year + 1 }))} disabled={customMonth.year >= new Date().getFullYear()}>→</Button>
                    </div>
                    <Button className="w-full bg-[#008cf7]" size="sm" onClick={() => setShowMonthPicker(false)}>Apply</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-[#008cf7]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Visits</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalVisits}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#008cf7]/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#008cf7]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#059669]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Unique Clients</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.uniqueClients}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#059669]/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#059669]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#f59e0b]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Planner Compliance</p>
                  <p className="text-3xl font-bold text-gray-900">{plannerComparison.complianceRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-[#f59e0b]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#dc2626]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Missed Visits</p>
                  <p className="text-3xl font-bold text-gray-900">{plannerComparison.missedVisits.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#dc2626]/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#dc2626]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="visits" className="gap-2">
              <List className="w-4 h-4" /> Visits
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="purposes" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Purposes
            </TabsTrigger>
            <TabsTrigger value="planner" className="gap-2">
              <AlertCircle className="w-4 h-4" /> Planner Check
            </TabsTrigger>
          </TabsList>

          {/* Visits Tab */}
          <TabsContent value="visits" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#008cf7]" />
                  Visits in {dateRange.label}
                </CardTitle>
                <CardDescription>{visits.length} visits recorded</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingVisits ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#008cf7] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : visits.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No visits recorded for {dateRange.label}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {visits
                      .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
                      .map(visit => (
                        <div key={visit._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-[#008cf7]/30 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-gray-900 truncate">{visit.client?.name || "Unknown Client"}</h4>
                                <Badge className={`text-xs ${
                                  visit.visitOutcome?.toLowerCase().includes('success') || visit.visitOutcome?.toLowerCase().includes('complet')
                                    ? "bg-[#059669] text-white"
                                    : visit.visitOutcome?.toLowerCase().includes('follow')
                                    ? "bg-[#f59e0b] text-white"
                                    : visit.visitOutcome?.toLowerCase().includes('pending')
                                    ? "bg-[#008cf7] text-white"
                                    : "bg-gray-200 text-gray-700"
                                }`}>
                                  {visit.visitOutcome || "N/A"}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {visit.date ? format(parseISO(visit.date), "MMM dd, yyyy") : "No date"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {visit.client?.location || "No location"}
                                </span>
                                {visit.visitPurpose && (
                                  <Badge variant="outline" className="text-xs">{visit.visitPurpose}</Badge>
                                )}
                              </div>
                              {visit.productsOfInterest && visit.productsOfInterest.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {visit.productsOfInterest.slice(0, 3).map((p, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs bg-[#008cf7]/10 text-[#008cf7]">
                                      {typeof p === 'string' ? p : (p as any)?.name}
                                    </Badge>
                                  ))}
                                  {visit.productsOfInterest.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">+{visit.productsOfInterest.length - 3}</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#008cf7]" />
                    Products of Interest
                  </CardTitle>
                  <CardDescription>Top products discussed during visits</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.topProducts.length > 0 ? (
                    <div className="h-[300px]">
                      <Bar 
                        data={productChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { grid: { display: false } },
                            y: { grid: { display: false } }
                          }
                        }} 
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No product data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topProducts.map((product, i) => (
                      <div key={product.name} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#008cf7]/10 flex items-center justify-center text-sm font-bold text-[#008cf7]">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 capitalize">{product.name}</p>
                          <div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-[#008cf7] rounded-full"
                              style={{ width: `${(product.count / (analytics.topProducts[0]?.count || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <Badge variant="secondary">{product.count}</Badge>
                      </div>
                    ))}
                    {analytics.topProducts.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No products recorded</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Purposes Tab */}
          <TabsContent value="purposes" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#008cf7]" />
                    Visit Purpose Breakdown
                  </CardTitle>
                  <CardDescription>Why visits were made</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.purposeBreakdown.length > 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Doughnut 
                        data={purposeChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom' }
                          }
                        }} 
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No visit purpose data
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#059669]" />
                    Outcomes Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.outcomeBreakdown.map(outcome => {
                      const isSuccess = outcome.outcome.toLowerCase().includes('success') || outcome.outcome.toLowerCase().includes('complet');
                      const isFollowUp = outcome.outcome.toLowerCase().includes('follow');
                      const isPending = outcome.outcome.toLowerCase().includes('pending');
                      
                      return (
                        <div key={outcome.outcome} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            {isSuccess ? <CheckCircle2 className="w-5 h-5 text-[#059669]" /> :
                             isFollowUp ? <Clock className="w-5 h-5 text-[#f59e0b]" /> :
                             isPending ? <AlertCircle className="w-5 h-5 text-[#008cf7]" /> :
                             <XCircle className="w-5 h-5 text-gray-400" />}
                            <span className="font-medium text-gray-900">{outcome.outcome}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isSuccess ? 'bg-[#059669]' : isFollowUp ? 'bg-[#f59e0b]' : isPending ? 'bg-[#008cf7]' : 'bg-gray-400'}`}
                                style={{ width: `${(outcome.count / analytics.totalVisits) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-600 w-8">{outcome.count}</span>
                          </div>
                        </div>
                      );
                    })}
                    {analytics.outcomeBreakdown.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No outcome data</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Planner Check Tab */}
          <TabsContent value="planner" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Missed Visits */}
              <Card className="border-[#dc2626]/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#dc2626]">
                    <AlertTriangle className="w-5 h-5" />
                    Missed Planned Visits
                  </CardTitle>
                  <CardDescription>
                    Places in planner that were not visited
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPlanners ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : plannerComparison.missedVisits.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-[#059669] mx-auto mb-3" />
                      <p className="font-medium text-[#059669]">No missed visits!</p>
                      <p className="text-sm text-gray-500 mt-1">All planned visits have been completed</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {plannerComparison.missedVisits.map((missed, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                          <div className="w-10 h-10 rounded-lg bg-[#dc2626]/10 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-[#dc2626]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{missed.place}</p>
                            <p className="text-sm text-gray-500">
                              {missed.day} • {format(parseISO(missed.date), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Compliance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#008cf7]" />
                    Planner Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <div className="relative inline-flex">
                      <svg className="w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="12"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke={plannerComparison.complianceRate >= 80 ? COLORS.success : plannerComparison.complianceRate >= 50 ? COLORS.warning : COLORS.danger}
                          strokeWidth="12"
                          strokeDasharray={`${(plannerComparison.complianceRate / 100) * 352} 352`}
                          strokeLinecap="round"
                          transform="rotate(-90 64 64)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-900">{plannerComparison.complianceRate}%</span>
                      </div>
                    </div>
                    <p className="text-gray-500 mt-4">
                      {plannerComparison.completedPlannedVisits.length} of {plannerComparison.completedPlannedVisits.length + plannerComparison.missedVisits.length} planned visits completed
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 rounded-xl bg-[#059669]/10 text-center">
                      <p className="text-2xl font-bold text-[#059669]">{plannerComparison.completedPlannedVisits.length}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#dc2626]/10 text-center">
                      <p className="text-2xl font-bold text-[#dc2626]">{plannerComparison.missedVisits.length}</p>
                      <p className="text-sm text-gray-600">Missed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
