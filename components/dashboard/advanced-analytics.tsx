"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("accessToken"));
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
    const fetchToken = async () => {
      try {
        const user = await authService.getCurrentUser();
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          throw new Error("No access token found. Please log in.");
        }
        setToken(accessToken);
      } catch (err) {
        setError("Authentication error: Please log in again.");
        toast({
          title: "Authentication Error",
          description: "Unable to verify user session. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    };
    fetchToken();
  }, [toast]);

  // Fetch users when token is available
  useEffect(() => {
    if (!token) return;

    setLoadingUsers(true);
    debugFetch("https://accordbackend.onrender.com/api/admin/users", token)
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
    const url = `https://accordbackend.onrender.com/api/admin/analytics/sales/${selectedUserId}`;
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
    <div className="space-y-6">
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Sales Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          {/* User Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Select a User</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {users.length > 0 ? (
                users.map((user) => (
                  <Button
                    key={user._id}
                    onClick={() => setSelectedUserId(user._id)}
                    variant={selectedUserId === user._id ? "default" : "outline"}
                    className="w-full text-left"
                  >
                    {user.firstName} {user.lastName} ({user.region})
                  </Button>
                ))
              ) : (
                <div>No users available.</div>
              )}
            </div>
          </div>

          {/* Analytics Section */}
          {selectedUserId && (
            <div className="mt-6">
              {loadingAnalytics ? (
                <div>Loading analytics...</div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : analyticsData ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      Analytics for {analyticsData.user.firstName} {analyticsData.user.lastName}
                    </h3>
                    <Button onClick={handleExport} disabled={!analyticsData}>
                      Export CSV
                    </Button>
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded">
                      <h4 className="font-semibold">Total Revenue</h4>
                      <p className="text-2xl">${analyticsData.summary.revenue.toLocaleString()}</p>
                    </div>
                    <div className="p-4 border rounded">
                      <h4 className="font-semibold">Conversion Rate</h4>
                      <p className="text-2xl">
                        {(analyticsData.summary.conversionRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 border rounded">
                      <h4 className="font-semibold">Average Deal Size</h4>
                      <p className="text-2xl">
                        ${analyticsData.summary.avgDealSize.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Top Clients Table */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-2">Top Clients</h4>
                    <table className="w-full border">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="p-2">Name</th>
                          <th className="p-2">Visits</th>
                          <th className="p-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.topClients.map((client) => (
                          <tr key={client.clientId}>
                            <td className="p-2">{client.name}</td>
                            <td className="p-2">{client.visits}</td>
                            <td className="p-2">${(client.revenue ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Top Products Table */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-2">Top Products</h4>
                    <table className="w-full border">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="p-2">Name</th>
                          <th className="p-2">Units</th>
                          <th className="p-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.topProducts.map((product) => (
                          <tr key={product.sku}>
                            <td className="p-2">{product.name}</td>
                            <td className="p-2">{product.units}</td>
                            <td className="p-2">${(product.revenue ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Optional: Revenue Over Time chart could go here. */}
                </>
              ) : (
                <div>No analytics data available.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


