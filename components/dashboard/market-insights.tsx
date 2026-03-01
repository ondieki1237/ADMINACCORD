"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { apiService } from "@/lib/api";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Building2,
  Target,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Search,
  Filter,
  Lightbulb,
  Award,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Eye,
  Activity,
  X,
  ExternalLink
} from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
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
  Filler
} from "chart.js";
import { useRouter } from "next/navigation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// ACCORD Brand Colors
const BRAND = {
  primary: "#008cf7",       // Primary Blue
  primaryDark: "#006bb8",   // Dark Blue (hover)
  black: "#000000",
  white: "#ffffff",
  red: "#dc2626",           // Red/Danger
  green: "#059669",         // Success Green
  yellow: "#f59e0b",        // Warning Yellow
  gray: "#6b7280",
  lightGray: "#f3f4f6",
  slate: "#64748b"
};

// Chart colors using brand palette
const CHART_COLORS = [
  BRAND.primary,
  BRAND.green,
  BRAND.yellow,
  "#8b5cf6",  // purple
  "#ec4899",  // pink
  "#14b8a6",  // teal
  "#f97316",  // orange
  "#06b6d4",  // cyan
  "#84cc16",  // lime
  "#a855f7"   // violet
];

interface MarketInsight {
  visitId: string;
  facility: string;
  facilityType?: string;
  contactPerson: string;
  contactRole: string;
  contactPhone: string;
  contactEmail?: string;
  location: string;
  salesPerson: string;
  salesPersonEmail: string;
  salesPersonId?: string;
  date: string;
  visitOutcome: string;
  visitPurpose?: string;
  productsOfInterest: string[];
  notes?: string;
}

interface ProductInsight {
  product: string;
  count: number;
  uniqueFacilities: number;
  uniqueLocations: number;
}

interface MarketSummary {
  totalVisits: number;
  outcomes: { outcome: string; count: number }[];
  topProducts: { product: string; count: number }[];
  topLocations: { location: string; count: number }[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function MarketInsights() {
  const router = useRouter();
  
  // Filter states
  const [dateRange, setDateRange] = useState("thisMonth");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedOutcome, setSelectedOutcome] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  
  // Product detail modal state
  const [productDetailModal, setProductDetailModal] = useState<{ open: boolean; product: string | null }>({
    open: false,
    product: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  // Calculate date range
  const dateParams = useMemo(() => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;

    switch (dateRange) {
      case "thisWeek":
        startDate = subDays(today, 7);
        break;
      case "thisMonth":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "lastMonth":
        const lastMonth = subDays(startOfMonth(today), 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case "last90Days":
        startDate = subDays(today, 90);
        break;
      case "thisYear":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = startOfMonth(today);
    }

    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd")
    };
  }, [dateRange]);

  // Fetch market summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["market-summary", dateParams.startDate, dateParams.endDate],
    queryFn: async () => {
      const response = await apiService.getMarketInsightsSummary({
        startDate: dateParams.startDate,
        endDate: dateParams.endDate
      });
      return response.data as MarketSummary;
    },
    staleTime: 60000
  });

  // Fetch product insights
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["market-products", dateParams.startDate, dateParams.endDate],
    queryFn: async () => {
      const response = await apiService.getMarketInsightsProducts({
        startDate: dateParams.startDate,
        endDate: dateParams.endDate
      });
      return (response.data || []) as ProductInsight[];
    },
    staleTime: 60000
  });

  // Fetch visit insights with filters and pagination
  const { data: visitsResponse, isLoading: visitsLoading, refetch, isRefetching } = useQuery({
    queryKey: [
      "market-visits", 
      dateParams.startDate, 
      dateParams.endDate, 
      selectedProduct, 
      selectedOutcome, 
      selectedLocation,
      currentPage,
      pageSize
    ],
    queryFn: async () => {
      const response = await apiService.getMarketInsights({
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
        product: selectedProduct !== "all" ? selectedProduct : undefined,
        outcome: selectedOutcome !== "all" ? selectedOutcome : undefined,
        location: selectedLocation !== "all" ? selectedLocation : undefined,
        page: currentPage,
        limit: pageSize
      });
      return {
        data: (response.data || []) as MarketInsight[],
        meta: response.meta as PaginationMeta
      };
    },
    staleTime: 30000
  });

  const visits = visitsResponse?.data || [];
  const pagination = visitsResponse?.meta;
  const summary = summaryData;
  const products = productsData || [];

  // Extract unique values for filters
  const uniqueProducts = useMemo(() => {
    return products.map(p => p.product).sort();
  }, [products]);

  const uniqueLocations = useMemo(() => {
    return summary?.topLocations?.map(l => l.location) || [];
  }, [summary]);

  // Filter visits by search query (client-side)
  const filteredVisits = useMemo(() => {
    if (!searchQuery) return visits;
    const query = searchQuery.toLowerCase();
    return visits.filter(v =>
      v.facility?.toLowerCase().includes(query) ||
      v.contactPerson?.toLowerCase().includes(query) ||
      v.salesPerson?.toLowerCase().includes(query) ||
      v.location?.toLowerCase().includes(query)
    );
  }, [visits, searchQuery]);

  // Analytics from summary
  const analytics = useMemo(() => {
    if (!summary) {
      return {
        totalVisits: 0,
        successfulVisits: 0,
        pendingVisits: 0,
        followUpNeeded: 0,
        conversionRate: 0,
        outcomeBreakdown: []
      };
    }

    const successful = summary.outcomes?.find(o => 
      o.outcome?.toLowerCase() === 'successful' || o.outcome?.toLowerCase() === 'completed'
    )?.count || 0;
    
    const pending = summary.outcomes?.find(o => 
      o.outcome?.toLowerCase() === 'pending'
    )?.count || 0;
    
    const followUp = summary.outcomes?.find(o => 
      o.outcome?.toLowerCase().includes('follow')
    )?.count || 0;

    return {
      totalVisits: summary.totalVisits || 0,
      successfulVisits: successful,
      pendingVisits: pending,
      followUpNeeded: followUp,
      conversionRate: summary.totalVisits > 0 ? Math.round((successful / summary.totalVisits) * 100) : 0,
      outcomeBreakdown: summary.outcomes || []
    };
  }, [summary]);

  // Chart configurations
  const productChartData = {
    labels: products.slice(0, 10).map(p => p.product.length > 18 ? p.product.slice(0, 18) + "..." : p.product),
    datasets: [{
      label: "Requests",
      data: products.slice(0, 10).map(p => p.count),
      backgroundColor: CHART_COLORS,
      borderRadius: 6,
      borderSkipped: false
    }]
  };

  const locationChartData = {
    labels: (summary?.topLocations || []).slice(0, 8).map(l => 
      l.location.length > 12 ? l.location.slice(0, 12) + "..." : l.location
    ),
    datasets: [{
      data: (summary?.topLocations || []).slice(0, 8).map(l => l.count),
      backgroundColor: CHART_COLORS.slice(0, 8),
      borderWidth: 0
    }]
  };

  const outcomeChartData = {
    labels: analytics.outcomeBreakdown.map(o => o.outcome),
    datasets: [{
      data: analytics.outcomeBreakdown.map(o => o.count),
      backgroundColor: [BRAND.green, BRAND.yellow, BRAND.primary, BRAND.red, BRAND.gray],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: "#f1f5f9" }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { boxWidth: 12, padding: 15, font: { size: 12 } }
      }
    },
    cutout: '60%'
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredVisits.length) return;
    
    const headers = ["Facility", "Contact", "Role", "Phone", "Email", "Location", "Sales Person", "Date", "Outcome", "Products"];
    const rows = filteredVisits.map(v => [
      v.facility,
      v.contactPerson,
      v.contactRole,
      v.contactPhone,
      v.contactEmail || "",
      v.location,
      v.salesPerson,
      v.date ? format(parseISO(v.date), "yyyy-MM-dd") : "",
      v.visitOutcome,
      v.productsOfInterest?.join("; ") || ""
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `market-insights-${dateParams.startDate}-to-${dateParams.endDate}.csv`;
    link.click();
  };

  const isLoading = summaryLoading || productsLoading || visitsLoading;

  if (isLoading && !summary && !products.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#008cf7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading Market Insights...</p>
          <p className="text-sm text-gray-400 mt-1">Analyzing your sales data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header - ACCORD Branded */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-[#008cf7] hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008cf7] to-[#006bb8] flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  Market Insights
                </h1>
                <p className="text-sm text-gray-500 mt-1">Data-driven decisions for sales success</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[160px] bg-white border-gray-200">
                  <Calendar className="w-4 h-4 mr-2 text-[#008cf7]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="last90Days">Last 90 Days</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="border-gray-200 hover:bg-blue-50 hover:border-[#008cf7] hover:text-[#008cf7]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Button
                size="sm"
                onClick={exportToCSV}
                disabled={!filteredVisits.length}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* Key Metrics - ACCORD Branded Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Visits"
            value={analytics.totalVisits}
            icon={Target}
            color="primary"
            trend={analytics.totalVisits > 0 ? `${dateRange}` : undefined}
          />
          <MetricCard
            title="Successful"
            value={analytics.successfulVisits}
            icon={CheckCircle2}
            color="green"
            trend={analytics.conversionRate > 0 ? `${analytics.conversionRate}% rate` : undefined}
          />
          <MetricCard
            title="Pending"
            value={analytics.pendingVisits}
            icon={Clock}
            color="yellow"
          />
          <MetricCard
            title="Follow-up Needed"
            value={analytics.followUpNeeded}
            icon={AlertTriangle}
            color="red"
            trend="Requires attention"
          />
        </div>

        {/* Strategic Insight Banner - ACCORD Primary Blue */}
        <Card className="bg-gradient-to-r from-[#008cf7] to-[#006bb8] text-white border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Lightbulb className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Strategic Market Insight</h3>
                {products.length > 0 && summary?.topLocations?.length ? (
                  <p className="text-blue-100 leading-relaxed">
                    <strong className="text-white">{products[0]?.product}</strong> is your most requested product 
                    with <strong className="text-white">{products[0]?.count} requests</strong> from {" "}
                    <strong className="text-white">{products[0]?.uniqueFacilities} unique facilities</strong>.
                    Focus your marketing efforts on <strong className="text-white">{summary.topLocations[0]?.location}</strong> region 
                    where demand is highest with <strong className="text-white">{summary.topLocations[0]?.count} visits</strong>.
                  </p>
                ) : (
                  <p className="text-blue-100">
                    Start collecting visit data to unlock powerful market insights and product demand analysis.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-sm p-1 h-auto flex-wrap gap-1">
            <TabsTrigger 
              value="products" 
              className="data-[state=active]:bg-[#008cf7] data-[state=active]:text-white px-4 py-2.5 rounded-md"
            >
              <Package className="w-4 h-4 mr-2" />
              Product Demand
            </TabsTrigger>
            <TabsTrigger 
              value="locations" 
              className="data-[state=active]:bg-[#008cf7] data-[state=active]:text-white px-4 py-2.5 rounded-md"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Regional Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="outcomes" 
              className="data-[state=active]:bg-[#008cf7] data-[state=active]:text-white px-4 py-2.5 rounded-md"
            >
              <Activity className="w-4 h-4 mr-2" />
              Visit Outcomes
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="data-[state=active]:bg-[#008cf7] data-[state=active]:text-white px-4 py-2.5 rounded-md"
            >
              <Eye className="w-4 h-4 mr-2" />
              Detailed Records
            </TabsTrigger>
          </TabsList>

          {/* Product Demand Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 rounded-lg bg-[#008cf7]/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#008cf7]" />
                    </div>
                    Top Requested Products
                  </CardTitle>
                  <CardDescription>Most in-demand products from facility visits</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[320px]">
                    {products.length > 0 ? (
                      <Bar data={productChartData} options={chartOptions} />
                    ) : (
                      <EmptyState message="No product data available" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-600" />
                    </div>
                    Product Performance
                  </CardTitle>
                  <CardDescription>Detailed breakdown with facility reach - Click to view facilities</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {products.slice(0, 6).map((product, index) => (
                    <div 
                      key={product.product} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-[#008cf7]/10 hover:border-[#008cf7] border border-transparent cursor-pointer transition-all group"
                      onClick={() => setProductDetailModal({ open: true, product: product.product })}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? "bg-yellow-500" : 
                          index === 1 ? "bg-gray-400" : 
                          index === 2 ? "bg-amber-700" : "bg-gray-300"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-[#008cf7]">{product.product}</p>
                          <p className="text-xs text-gray-500">
                            {product.uniqueFacilities} facilities • {product.uniqueLocations} locations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-[#008cf7]">{product.count}</p>
                          <p className="text-xs text-gray-500">requests</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#008cf7] transition-colors" />
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && <EmptyState message="No product data available" />}
                </CardContent>
              </Card>
            </div>

            {/* Product Strategy Tip */}
            {products.length >= 2 && (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Product Strategy Tip</h4>
                      <p className="text-sm text-gray-600">
                        Consider bundling <strong>{products[0]?.product}</strong> with <strong>{products[1]?.product}</strong> for 
                        cross-selling opportunities. These products show complementary demand patterns across{" "}
                        <strong>{products[0]?.uniqueLocations + products[1]?.uniqueLocations}</strong> combined locations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Regional Analysis Tab */}
          <TabsContent value="locations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 rounded-lg bg-[#008cf7]/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-[#008cf7]" />
                    </div>
                    Regional Distribution
                  </CardTitle>
                  <CardDescription>Visit concentration by location</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[320px] flex items-center justify-center">
                    {summary?.topLocations?.length ? (
                      <Doughnut data={locationChartData} options={doughnutOptions} />
                    ) : (
                      <EmptyState message="No location data available" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                    High-Opportunity Regions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {(summary?.topLocations || []).map((loc, index) => (
                    <div 
                      key={loc.location} 
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[#008cf7] hover:bg-blue-50/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-[#008cf7]" />
                        <span className="font-medium text-gray-900">{loc.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{loc.count} visits</span>
                        {index < 3 && (
                          <Badge className="bg-[#059669] text-white hover:bg-[#059669]">
                            Hot Zone
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {!summary?.topLocations?.length && <EmptyState message="No location data available" />}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Visit Outcomes Tab */}
          <TabsContent value="outcomes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 rounded-lg bg-[#008cf7]/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-[#008cf7]" />
                    </div>
                    Outcome Distribution
                  </CardTitle>
                  <CardDescription>Visit results breakdown</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[320px] flex items-center justify-center">
                    {analytics.outcomeBreakdown.length > 0 ? (
                      <Doughnut data={outcomeChartData} options={doughnutOptions} />
                    ) : (
                      <EmptyState message="No outcome data available" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    Conversion Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-gradient-to-br from-[#008cf7]/5 to-[#006bb8]/10 rounded-xl">
                      <p className="text-5xl font-bold text-[#008cf7]">{analytics.conversionRate}%</p>
                      <p className="text-gray-600 mt-2">Overall Conversion Rate</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {analytics.outcomeBreakdown.map((outcome, i) => (
                        <div key={outcome.outcome} className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{outcome.count}</p>
                          <p className="text-sm text-gray-500 capitalize">{outcome.outcome.replace(/_/g, " ")}</p>
                          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${analytics.totalVisits > 0 ? (outcome.count / analytics.totalVisits) * 100 : 0}%`,
                                backgroundColor: CHART_COLORS[i % CHART_COLORS.length]
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Detailed Records Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <div className="w-8 h-8 rounded-lg bg-[#008cf7]/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-[#008cf7]" />
                      </div>
                      Visit Records
                    </CardTitle>
                    <CardDescription>
                      {pagination ? `${pagination.total} total records • Page ${pagination.page} of ${pagination.totalPages}` : `${filteredVisits.length} records`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-[180px] border-gray-200"
                      />
                    </div>
                    <Select value={selectedProduct} onValueChange={(v) => { setSelectedProduct(v); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[160px] border-gray-200">
                        <Package className="w-4 h-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {uniqueProducts.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedOutcome} onValueChange={(v) => { setSelectedOutcome(v); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[140px] border-gray-200">
                        <Filter className="w-4 h-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="All Outcomes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Outcomes</SelectItem>
                        <SelectItem value="successful">Successful</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="followup_required">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedLocation} onValueChange={(v) => { setSelectedLocation(v); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[150px] border-gray-200">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {uniqueLocations.map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Facility</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Contact</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Location</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Sales Rep</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Products</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Outcome</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVisits.map((item, index) => (
                        <tr key={item.visitId || index} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-gray-900">{item.facility}</p>
                              {item.facilityType && (
                                <p className="text-xs text-gray-500 capitalize">{item.facilityType}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-gray-900">{item.contactPerson}</p>
                              <p className="text-xs text-gray-500 capitalize">{item.contactRole}</p>
                              {item.contactPhone && (
                                <p className="text-xs text-[#008cf7] flex items-center gap-1 mt-1">
                                  <Phone className="w-3 h-3" />
                                  {item.contactPhone}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {item.location}
                            </span>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-gray-900">{item.salesPerson}</p>
                              <p className="text-xs text-gray-500">{item.salesPersonEmail}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {item.productsOfInterest?.slice(0, 2).map((p, i) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                                  {p}
                                </Badge>
                              ))}
                              {item.productsOfInterest?.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.productsOfInterest.length - 2}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={`${
                              item.visitOutcome?.toLowerCase() === "successful" || item.visitOutcome?.toLowerCase() === "completed"
                                ? "bg-[#059669] text-white hover:bg-[#059669]" 
                                : item.visitOutcome?.toLowerCase().includes("follow") 
                                ? "bg-[#f59e0b] text-white hover:bg-[#f59e0b]"
                                : item.visitOutcome?.toLowerCase() === "pending"
                                ? "bg-[#008cf7] text-white hover:bg-[#008cf7]"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {item.visitOutcome || "N/A"}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {item.date ? format(parseISO(item.date), "MMM dd, yyyy") : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredVisits.length === 0 && (
                    <div className="text-center py-16">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No records found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="border-gray-200"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={currentPage === pageNum ? "bg-[#008cf7] hover:bg-[#006bb8]" : "border-gray-200"}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={currentPage === pagination.totalPages}
                        className="border-gray-200"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Recommendations */}
        <Card className="border-[#059669]/20 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#059669]/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
              </div>
              Recommended Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionCard
                icon={Target}
                title="Focus on Top Products"
                description={products[0] 
                  ? `Prioritize ${products[0].product} in your sales pitches` 
                  : "Collect more data for recommendations"}
                color="primary"
              />
              <ActionCard
                icon={MapPin}
                title="Expand in Hot Zones"
                description={summary?.topLocations?.[0]
                  ? `Increase coverage in ${summary.topLocations[0].location}` 
                  : "More location data needed"}
                color="green"
              />
              <ActionCard
                icon={Users}
                title="Follow-up Priority"
                description={`${analytics.followUpNeeded} facilities need immediate follow-up`}
                color="yellow"
              />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal 
        open={productDetailModal.open}
        onClose={() => setProductDetailModal({ open: false, product: null })}
        productName={productDetailModal.product}
        dateRange={dateParams}
      />
    </div>
  );
}

// Metric Card Component - ACCORD Branded
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: "primary" | "green" | "yellow" | "red"; 
  trend?: string;
}) {
  const colorConfig = {
    primary: {
      border: "border-l-[#008cf7]",
      bg: "bg-[#008cf7]/5",
      icon: "bg-[#008cf7]/10 text-[#008cf7]"
    },
    green: {
      border: "border-l-[#059669]",
      bg: "bg-[#059669]/5",
      icon: "bg-[#059669]/10 text-[#059669]"
    },
    yellow: {
      border: "border-l-[#f59e0b]",
      bg: "bg-[#f59e0b]/5",
      icon: "bg-[#f59e0b]/10 text-[#f59e0b]"
    },
    red: {
      border: "border-l-[#dc2626]",
      bg: "bg-[#dc2626]/5",
      icon: "bg-[#dc2626]/10 text-[#dc2626]"
    }
  };

  const config = colorConfig[color];

  return (
    <Card className={`border-l-4 ${config.border} shadow-sm hover:shadow-md transition-shadow bg-white`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
            {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
          </div>
          <div className={`p-3 rounded-xl ${config.icon}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Action Card Component - ACCORD Branded
function ActionCard({
  icon: Icon,
  title,
  description,
  color
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: "primary" | "green" | "yellow";
}) {
  const colorConfig = {
    primary: "bg-[#008cf7]/10 text-[#008cf7]",
    green: "bg-[#059669]/10 text-[#059669]",
    yellow: "bg-[#f59e0b]/10 text-[#f59e0b]"
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-[#008cf7]/30 transition-all">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorConfig[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <Package className="w-12 h-12 text-gray-300 mb-4" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

// Product Detail Modal Component - Fetches ALL facilities for selected product
function ProductDetailModal({
  open,
  onClose,
  productName,
  dateRange
}: {
  open: boolean;
  onClose: () => void;
  productName: string | null;
  dateRange: { startDate: string; endDate: string };
}) {
  // Fetch ALL visits for the selected product (limit 500 to get all data)
  const { data: productVisitsData, isLoading } = useQuery({
    queryKey: ["product-detail-visits", productName, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (!productName) return [];
      const response = await apiService.getMarketInsights({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        product: productName,
        limit: 500 // Get all facilities
      });
      return (response.data || []) as MarketInsight[];
    },
    enabled: open && !!productName,
    staleTime: 30000
  });

  const productVisits = productVisitsData || [];

  // Get unique facilities with their details
  const facilityDetails = useMemo(() => {
    const facilityMap = new Map<string, {
      facility: string;
      facilityType?: string;
      location: string;
      contacts: Array<{
        name: string;
        role: string;
        phone: string;
        email?: string;
      }>;
      salesVisits: Array<{
        salesPerson: string;
        salesPersonEmail: string;
        date: string;
        outcome: string;
      }>;
    }>();

    productVisits.forEach(visit => {
      const key = visit.facility;
      if (!facilityMap.has(key)) {
        facilityMap.set(key, {
          facility: visit.facility,
          facilityType: visit.facilityType,
          location: visit.location,
          contacts: [],
          salesVisits: []
        });
      }

      const entry = facilityMap.get(key)!;

      // Add contact if not already added
      const contactKey = `${visit.contactPerson}-${visit.contactPhone}`;
      if (!entry.contacts.some(c => `${c.name}-${c.phone}` === contactKey)) {
        entry.contacts.push({
          name: visit.contactPerson,
          role: visit.contactRole,
          phone: visit.contactPhone,
          email: visit.contactEmail
        });
      }

      // Add sales visit
      entry.salesVisits.push({
        salesPerson: visit.salesPerson,
        salesPersonEmail: visit.salesPersonEmail,
        date: visit.date,
        outcome: visit.visitOutcome
      });
    });

    return Array.from(facilityMap.values());
  }, [productVisits]);

  if (!productName) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[98vw] w-[1600px] max-h-[90vh] overflow-hidden flex flex-col bg-white/95 backdrop-blur-md border-0 shadow-2xl">
        <DialogHeader className="border-b border-gray-100 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#008cf7] to-[#006bb8] flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {productName}
                </DialogTitle>
                <DialogDescription className="text-gray-500 mt-1">
                  {isLoading ? "Loading..." : `${facilityDetails.length} facilities interested • ${productVisits.length} total visits`}
                </DialogDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6 px-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#008cf7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading facility data...</p>
              </div>
            </div>
          ) : facilityDetails.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-lg">No facility data available</p>
              <p className="text-sm text-gray-400 mt-2">
                No facilities have shown interest in {productName} during this period
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {facilityDetails.map((facility, index) => (
                <div 
                  key={facility.facility} 
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#008cf7] hover:shadow-lg transition-all"
                >
                  {/* Facility Header */}
                  <div className="bg-gradient-to-r from-[#008cf7]/5 to-white px-8 py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-xl bg-[#008cf7]/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-7 h-7 text-[#008cf7]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-xl">{facility.facility}</h3>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#008cf7]" />
                              {facility.location}
                            </span>
                            {facility.facilityType && (
                              <Badge variant="secondary" className="text-sm capitalize bg-gray-100 px-3 py-1">
                                {facility.facilityType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-[#008cf7] text-white hover:bg-[#006bb8] text-base px-4 py-2">
                        {facility.salesVisits.length} visit{facility.salesVisits.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>

                  {/* Contacts & Sales Visits - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    {/* Contacts Section */}
                    <div className="p-8 min-w-0">
                      <h4 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#008cf7]" />
                        Contact Persons ({facility.contacts.length})
                      </h4>
                      <div className="space-y-4">
                        {facility.contacts.map((contact, cIndex) => (
                          <div 
                            key={cIndex}
                            className="bg-gray-50 rounded-xl p-5 border border-gray-100"
                          >
                            <p className="font-bold text-gray-900 text-lg">{contact.name}</p>
                            <p className="text-sm text-gray-500 capitalize mt-1 mb-4">{contact.role}</p>
                            <div className="flex flex-col gap-3">
                              {contact.phone && (
                                <a 
                                  href={`tel:${contact.phone}`}
                                  className="text-sm text-[#008cf7] hover:underline flex items-center gap-2 bg-[#008cf7]/5 px-4 py-2.5 rounded-lg"
                                >
                                  <Phone className="w-4 h-4 flex-shrink-0" />
                                  <span>{contact.phone}</span>
                                </a>
                              )}
                              {contact.email && (
                                <a 
                                  href={`mailto:${contact.email}`}
                                  className="text-sm text-[#008cf7] hover:underline flex items-center gap-2 bg-[#008cf7]/5 px-4 py-2.5 rounded-lg"
                                >
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <span className="break-all">{contact.email}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sales Visits Section */}
                    <div className="p-8 min-w-0">
                      <h4 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
                        <Target className="w-5 h-5 text-[#059669]" />
                        Sales Visits ({facility.salesVisits.length})
                      </h4>
                      <div className="space-y-4">
                        {facility.salesVisits.map((visit, vIndex) => (
                          <div 
                            key={vIndex}
                            className="bg-gray-50 rounded-xl p-5 border border-gray-100"
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex items-start justify-between gap-4">
                                <p className="font-bold text-gray-900 text-lg">{visit.salesPerson}</p>
                                <Badge className={`text-sm px-3 py-1.5 flex-shrink-0 whitespace-nowrap ${
                                  visit.outcome?.toLowerCase() === 'successful' || visit.outcome?.toLowerCase() === 'completed'
                                    ? "bg-[#059669] text-white" 
                                    : visit.outcome?.toLowerCase().includes('follow') 
                                    ? "bg-[#f59e0b] text-white"
                                    : visit.outcome?.toLowerCase() === 'pending'
                                    ? "bg-[#008cf7] text-white"
                                    : "bg-gray-200 text-gray-700"
                                }`}>
                                  {visit.outcome || "N/A"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 break-all">{visit.salesPersonEmail}</p>
                              <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                {visit.date ? format(parseISO(visit.date), "MMMM dd, yyyy") : "N/A"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">
              Showing data from <span className="font-medium text-gray-700">{dateRange.startDate}</span> to <span className="font-medium text-gray-700">{dateRange.endDate}</span>
            </p>
            {!isLoading && (
              <Badge variant="outline" className="text-[#008cf7] border-[#008cf7]">
                {facilityDetails.length} facilities • {productVisits.length} visits
              </Badge>
            )}
          </div>
          <Button 
            onClick={onClose}
            className="bg-[#008cf7] hover:bg-[#006bb8] text-white px-6"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
