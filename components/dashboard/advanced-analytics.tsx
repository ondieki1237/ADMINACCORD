"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, TrendingUp, Users, DollarSign, Target, Calendar } from "lucide-react";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  region: string;
}

interface AnalyticsData {
  user: { firstName: string; lastName: string; email: string; role: string };
  summary: {
    visitsCount: number;
    uniqueClients: number;
    quotationsRequested: number;
    quotationsConverted: number;
    ordersPlaced: number;
    revenue: number;
    avgDealSize: number;
    conversionRate: number;
    pendingQuotations: number;
    lastVisit: string;
  };
  topClients: { clientId: string; name: string; visits: number; revenue: number }[];
  topProducts: { sku: string; name: string; units: number; revenue: number }[];
  timeSeries: { date: string; visits: number; orders: number; revenue: number; quotations: number }[];
}

export default function AdvancedAnalytics() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();

  // Debug fetch function
  const debugFetch = (url: string, token: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        const body = await res.text();
        console.log("STATUS", res.status, "BODY", body);
        try {
          return JSON.parse(body);
        } catch (e) {
          return body;
        }
      })
      .then((json) => {
        console.log("PARSED", json);
        return json;
      })
      .catch((err) => {
        console.error("FETCH ERR", err);
        throw err;
      });

  // Fetch current user and token
  useEffect(() => {
    // Run only on client: read access token from localStorage and validate via authService
    const fetchToken = async () => {
      try {
        const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (!accessToken) {
          throw new Error("No access token found. Please log in.");
        }
        // Optionally validate the token by fetching current user
        await authService.getCurrentUser();
        setToken(accessToken);
      } catch (err) {
        setError("Authentication error: Please log in again.");
        toast({
          title: "Authentication Error",
          description: "Unable to verify user session. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => {
          if (typeof window !== "undefined") window.location.href = "/login";
        }, 2000);
      }
    };

    // run on client only
    if (typeof window !== "undefined") fetchToken();
  }, [toast]);

  // Fetch users when token is available
  useEffect(() => {
    if (!token) return;

    setLoadingUsers(true);
    debugFetch("https://app.codewithseth.co.ke/api/admin/users", token)
      .then((res) => {
        if (typeof res === "string" || !res.success || !Array.isArray(res.data)) {
          throw new Error("Invalid response or no users available.");
        }
        setUsers(res.data);
        setLoadingUsers(false);
      })
      .catch((e) => {
        setError(`Error fetching users: ${e.message}`);
        setLoadingUsers(false);
        if (e.message.includes("Unauthorized")) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          toast({
            title: "Error",
            description: `Failed to fetch users: ${e.message}`,
            variant: "destructive",
          });
        }
      });
  }, [token, toast]);

  // Fetch analytics data when a user is selected
  useEffect(() => {
    if (!selectedUserId || !token) return;

    setLoadingAnalytics(true);
    setError(null);
    setAnalyticsData(null);

    // call analytics for the whole time range (no date filters)
    const url = `https://app.codewithseth.co.ke/api/admin/analytics/sales/${selectedUserId}`;
    debugFetch(url, token)
      .then((res) => {
        if (typeof res === "string" || !res.success || !res.data) {
          throw new Error("Invalid response or no analytics data available.");
        }
        setAnalyticsData(res.data);
        setLoadingAnalytics(false);
      })
      .catch((e) => {
        setError(`Error fetching analytics: ${e.message}`);
        setLoadingAnalytics(false);
        if (e.message.includes("Unauthorized")) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          toast({
            title: "Error",
            description: `Failed to fetch analytics: ${e.message}`,
            variant: "destructive",
          });
        }
      });
  }, [selectedUserId, token, toast]);

  const handleExport = () => {
    if (!analyticsData || !selectedUserId) return;

    const csvData = [
      ["Summary Metrics"],
      ["Metric,Value"],
      ...Object.entries(analyticsData.summary).map(([key, value]) => `${key},${value}`),
      [],
      ["Top Clients"],
      ["Client ID,Name,Visits,Revenue"],
      ...analyticsData.topClients.map((client) =>
        [client.clientId, client.name, client.visits, client.revenue].join(",")
      ),
      [],
      ["Top Products"],
      ["SKU,Name,Units,Revenue"],
      ...analyticsData.topProducts.map((product) =>
        [product.sku, product.name, product.units, product.revenue].join(",")
      ),
      [],
      ["Time Series"],
      ["Date,Visits,Orders,Revenue,Quotations"],
      ...analyticsData.timeSeries.map((ts) =>
        [ts.date, ts.visits, ts.orders, ts.revenue, ts.quotations].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_analytics_${selectedUserId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!token) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Please log in to view analytics.</p>
        <Button
          onClick={() => (window.location.href = "/login")}
          className="mt-4"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  if (loadingUsers) return <div>Loading users...</div>;
  if (error && !users.length && !selectedUserId) return <div className="text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Home</span>
        </button>
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-gray-500">Detailed performance insights</p>
          </div>
        </div>
      </div>

      <Card className="shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
          <CardTitle className="text-xl">User Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* User Selection */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Select a User</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {users.length > 0 ? (
                users.map((user) => (
                  <Button
                    key={user._id}
                    onClick={() => setSelectedUserId(user._id)}
                    variant={selectedUserId === user._id ? "default" : "outline"}
                    className={`w-full justify-start text-left h-auto py-3 ${
                      selectedUserId === user._id 
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md" 
                        : "hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs opacity-80">
                        {user.region} • {user.role}
                      </div>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  No users available.
                </div>
              )}
            </div>
          </div>

          {/* Analytics Section */}
          {selectedUserId && (
            <div className="space-y-6">
              {loadingAnalytics ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading analytics...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              ) : analyticsData ? (
                <>
                  <div className="flex justify-between items-center pb-4 border-b">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {analyticsData.user.firstName} {analyticsData.user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {analyticsData.user.role} • {analyticsData.user.email}
                      </p>
                    </div>
                    <Button 
                      onClick={handleExport} 
                      disabled={!analyticsData}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h4>
                        <p className="text-3xl font-bold text-gray-900">
                          {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                            minimumFractionDigits: 0
                          }).format(analyticsData.summary.revenue)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Conversion Rate</h4>
                        <p className="text-3xl font-bold text-gray-900">
                          {(analyticsData.summary.conversionRate * 100).toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Avg Deal Size</h4>
                        <p className="text-3xl font-bold text-gray-900">
                          {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                            minimumFractionDigits: 0
                          }).format(analyticsData.summary.avgDealSize)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <Users className="h-8 w-8 text-orange-600" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-600 mb-1">Total Visits</h4>
                        <p className="text-3xl font-bold text-gray-900">
                          {analyticsData.summary.visitsCount}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white border-2 border-gray-100 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Orders Placed</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.ordersPlaced}</p>
                    </div>
                    <div className="p-4 bg-white border-2 border-gray-100 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Quotations Sent</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.quotationsRequested}</p>
                    </div>
                    <div className="p-4 bg-white border-2 border-gray-100 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Converted Quotes</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.quotationsConverted}</p>
                    </div>
                    <div className="p-4 bg-white border-2 border-gray-100 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Unique Clients</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.uniqueClients}</p>
                    </div>
                  </div>

                  {/* Top Clients Table */}
                  <Card className="border-2 border-gray-100">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                      <CardTitle className="text-lg">Top Clients</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="p-4 text-left text-sm font-semibold text-gray-700">Client Name</th>
                              <th className="p-4 text-left text-sm font-semibold text-gray-700">Visits</th>
                              <th className="p-4 text-left text-sm font-semibold text-gray-700">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyticsData.topClients.map((client, idx) => (
                              <tr key={client.clientId} className={`border-b hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                <td className="p-4 font-medium text-gray-900">{client.name}</td>
                                <td className="p-4 text-gray-600">{client.visits}</td>
                                <td className="p-4 font-semibold text-green-600">
                                  {new Intl.NumberFormat('en-KE', {
                                    style: 'currency',
                                    currency: 'KES',
                                    minimumFractionDigits: 0
                                  }).format(client.revenue ?? 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Products Table */}
                  <Card className="border-2 border-gray-100">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                      <CardTitle className="text-lg">Top Products</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="p-4 text-left text-sm font-semibold text-gray-700">Product Name</th>
                              <th className="p-4 text-left text-sm font-semibold text-gray-700">Units Sold</th>
                              <th className="p-4 text-left text-sm font-semibold text-gray-700">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyticsData.topProducts.map((product, idx) => (
                              <tr key={product.sku} className={`border-b hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                <td className="p-4 font-medium text-gray-900">{product.name}</td>
                                <td className="p-4 text-gray-600">{product.units}</td>
                                <td className="p-4 font-semibold text-green-600">
                                  {new Intl.NumberFormat('en-KE', {
                                    style: 'currency',
                                    currency: 'KES',
                                    minimumFractionDigits: 0
                                  }).format(product.revenue ?? 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No analytics data available for this user.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


