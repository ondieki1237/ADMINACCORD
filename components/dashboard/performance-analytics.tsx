"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { authService } from "@/lib/auth"
import { 
  Download, 
  RefreshCw, 
  BarChart3, 
  TrendingUp, 
  FileSpreadsheet,
  Image as ImageIcon,
  Globe,
  Calendar,
  Clock,
  Activity,
  Users,
  DollarSign,
  Target,
  Zap
} from "lucide-react"

interface AnalyticsStatus {
  lastUpdated: string | null
  isGenerating: boolean
  hasData: boolean
}

interface Visualization {
  name: string
  type: 'image' | 'html' | 'excel'
  size: number
  createdAt: string
  url: string
}

interface LiveRealtimeData {
  visits_today: number
  orders_today: number
  revenue_today: number
  successful_visits: number
  conversion_rate_today: number
  active_users: number
}

interface LiveDashboardData {
  summary: {
    total_visits: number
    total_orders: number
    total_revenue: number
    conversion_rate: number
    avg_order_value: number
  }
  conversion_funnel: {
    visits: number
    successful_visits: number
    quotations_sent: number
    orders_placed: number
    visit_success_rate: number
    quotation_conversion: number
    overall_conversion: number
  }
  top_performers: Array<{
    userId: string
    name: string
    role: string
    region: string
    visit_count: number
    order_count: number
    total_revenue: number
    conversion_rate: number
  }>
}

export function PerformanceAnalytics() {
  const [status, setStatus] = useState<AnalyticsStatus | null>(null)
  const [visualizations, setVisualizations] = useState<Visualization[]>([])
  const [dashboardUrl, setDashboardUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [liveRealtime, setLiveRealtime] = useState<LiveRealtimeData | null>(null)
  const [liveDashboard, setLiveDashboard] = useState<LiveDashboardData | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const { toast } = useToast()

  const ANALYTICS_BASE_URL = "https://app.codewithseth.co.ke/api/analytics"
  const LIVE_ANALYTICS_BASE_URL = "https://app.codewithseth.co.ke/api/analytics/live"

  useEffect(() => {
    fetchAnalyticsStatus()
    fetchVisualizations()
    fetchLiveData()
    
    // Auto-refresh live data every 30 seconds
    let refreshInterval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        fetchLiveData()
      }, 30000)
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  }, [autoRefresh])

  const makeAnalyticsRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = authService.getAccessToken()
    if (!token) {
      throw new Error("Authentication required")
    }

    const response = await fetch(`${ANALYTICS_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || 'Request failed')
    }

    return response
  }

  const fetchAnalyticsStatus = async () => {
    try {
      const response = await makeAnalyticsRequest('/status')
      const data = await response.json()
      
      if (data.success) {
        setStatus(data.data)
        setIsGenerating(data.data.isGenerating)
      }
    } catch (error) {
      console.error('Error fetching analytics status:', error)
      toast({
        title: "Error",
        description: "Failed to fetch analytics status",
        variant: "destructive",
      })
    }
  }

  const fetchVisualizations = async () => {
    setIsLoading(true)
    try {
      const response = await makeAnalyticsRequest('/visualizations')
      const data = await response.json()
      
      if (data.success) {
        setVisualizations(data.data)
        
        // Find the dashboard URL
        const dashboard = data.data.find((v: Visualization) => 
          v.name.includes('dashboard') && v.type === 'html'
        )
        if (dashboard) {
          setDashboardUrl(`${ANALYTICS_BASE_URL}${dashboard.url}`)
        }
      }
    } catch (error) {
      console.error('Error fetching visualizations:', error)
      toast({
        title: "No Analytics Available",
        description: "Please generate analytics first",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLiveData = async () => {
    setLiveLoading(true)
    try {
      // Fetch realtime data
      const realtimeResponse = await fetch(`${LIVE_ANALYTICS_BASE_URL}/realtime`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`,
        },
      })
      
      if (realtimeResponse.ok) {
        const realtimeData = await realtimeResponse.json()
        if (realtimeData.success) {
          setLiveRealtime(realtimeData.data)
        }
      }
      
      // Fetch dashboard data
      const dashboardResponse = await fetch(`${LIVE_ANALYTICS_BASE_URL}/dashboard?daysBack=30`, {
        headers: {
          'Authorization': `Bearer ${authService.getAccessToken()}`,
        },
      })
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        if (dashboardData.success) {
          setLiveDashboard(dashboardData.data)
        }
      }
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching live data:', error)
    } finally {
      setLiveLoading(false)
    }
  }

  const generateAnalytics = async (daysBack: number = 30) => {
    setIsGenerating(true)
    try {
      const response = await makeAnalyticsRequest(`/generate?daysBack=${daysBack}`, {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Analytics Generation Started",
          description: "This may take a few minutes. Please wait...",
        })
        
        // Poll for status updates
        const pollInterval = setInterval(async () => {
          const statusRes = await makeAnalyticsRequest('/status')
          const statusData = await statusRes.json()
          
          if (statusData.success && !statusData.data.isGenerating) {
            clearInterval(pollInterval)
            setIsGenerating(false)
            toast({
              title: "Analytics Ready",
              description: "Analytics have been generated successfully",
            })
            fetchAnalyticsStatus()
            fetchVisualizations()
          }
        }, 5000) // Poll every 5 seconds
        
        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval)
          setIsGenerating(false)
        }, 300000)
      }
    } catch (error) {
      console.error('Error generating analytics:', error)
      setIsGenerating(false)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate analytics",
        variant: "destructive",
      })
    }
  }

  const downloadExcelReport = async () => {
    try {
      const response = await makeAnalyticsRequest('/report/latest')
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download Started",
        description: "Excel report is being downloaded",
      })
    } catch (error) {
      console.error('Error downloading report:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download Excel report",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const imageVisualizations = visualizations.filter(v => v.type === 'image')
  const htmlVisualizations = visualizations.filter(v => 
    v.type === 'html' && !v.name.includes('dashboard')
  )

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Performance Analytics
              </CardTitle>
              <CardDescription>
                Python-powered analytics and visualizations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchAnalyticsStatus()
                  fetchVisualizations()
                }}
                disabled={isLoading || isGenerating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadExcelReport}
                disabled={!status?.hasData || isGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(status?.lastUpdated || '')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={isGenerating ? "secondary" : status?.hasData ? "default" : "outline"}>
                  {isGenerating ? 'Generating...' : status?.hasData ? 'Ready' : 'No Data'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Visualizations</p>
                <p className="font-medium">{visualizations.length} files</p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Generate Options */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => generateAnalytics(7)}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Last 7 Days
            </Button>
            <Button
              onClick={() => generateAnalytics(30)}
              disabled={isGenerating}
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Generate Analytics (30 Days)
            </Button>
            <Button
              onClick={() => generateAnalytics(90)}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Last 90 Days
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live">
            <Activity className="h-4 w-4 mr-2" />
            Live Analytics
          </TabsTrigger>
          <TabsTrigger value="dashboard" disabled={!status?.hasData}>
            <Globe className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="charts" disabled={!status?.hasData}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Charts ({imageVisualizations.length})
          </TabsTrigger>
          <TabsTrigger value="interactive" disabled={!status?.hasData}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Interactive ({htmlVisualizations.length})
          </TabsTrigger>
        </TabsList>

        {/* Live Analytics Tab */}
        <TabsContent value="live" className="mt-4">
          <div className="space-y-4">
            {/* Live Controls */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Real-Time Analytics
                    </CardTitle>
                    <CardDescription>
                      Live data updates every 30 seconds
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                      {autoRefresh ? (
                        <>
                          <Activity className="h-4 w-4 mr-2 animate-pulse" />
                          Auto-Refresh On
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4 mr-2" />
                          Auto-Refresh Off
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchLiveData}
                      disabled={liveLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${liveLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {lastUpdate && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Today's Stats */}
            {liveRealtime && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Visits Today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <p className="text-2xl font-bold">{liveRealtime.visits_today}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Orders Today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <p className="text-2xl font-bold">{liveRealtime.orders_today}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Revenue Today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                      <p className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-KE', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 0
                        }).format(liveRealtime.revenue_today)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Successful Visits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <p className="text-2xl font-bold">{liveRealtime.successful_visits}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Conversion Rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-red-500" />
                      <p className="text-2xl font-bold">{liveRealtime.conversion_rate_today?.toFixed(1) ?? '0.0'}%</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Active Users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-500 animate-pulse" />
                      <p className="text-2xl font-bold">{liveRealtime.active_users}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 30-Day Summary */}
            {liveDashboard && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>30-Day Performance Summary</CardTitle>
                    <CardDescription>Last 30 days statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Visits</p>
                        <p className="text-2xl font-bold">{liveDashboard.summary?.total_visits ?? 0}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                        <p className="text-2xl font-bold">{liveDashboard.summary?.total_orders ?? 0}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold">
                          {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                            minimumFractionDigits: 0
                          }).format(liveDashboard.summary?.total_revenue ?? 0)}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
                        <p className="text-2xl font-bold">{liveDashboard.summary?.conversion_rate?.toFixed(2) ?? '0.00'}%</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
                        <p className="text-2xl font-bold">
                          {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                            minimumFractionDigits: 0
                          }).format(liveDashboard.summary?.avg_order_value ?? 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Conversion Funnel */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                    <CardDescription>Customer journey performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">Visits</span>
                        <span className="text-2xl font-bold">{liveDashboard.conversion_funnel?.visits ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <span className="font-medium">Successful Visits</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold">{liveDashboard.conversion_funnel?.successful_visits ?? 0}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({liveDashboard.conversion_funnel?.visit_success_rate?.toFixed(1) ?? '0.0'}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">Quotations Sent</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold">{liveDashboard.conversion_funnel?.quotations_sent ?? 0}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({liveDashboard.conversion_funnel?.quotation_conversion?.toFixed(1) ?? '0.0'}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/10">
                        <span className="font-medium">Orders Placed</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary">{liveDashboard.conversion_funnel?.orders_placed ?? 0}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({liveDashboard.conversion_funnel?.overall_conversion?.toFixed(1) ?? '0.0'}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Best performing users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(liveDashboard.top_performers ?? []).slice(0, 5).map((performer, idx) => (
                        <div key={performer.userId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium">{performer.name}</p>
                              <p className="text-sm text-muted-foreground">{performer.region} • {performer.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              {new Intl.NumberFormat('en-KE', {
                                style: 'currency',
                                currency: 'KES',
                                minimumFractionDigits: 0
                              }).format(performer.total_revenue)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {performer.visit_count} visits • {performer.conversion_rate?.toFixed(1) ?? '0.0'}% conv.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Loading State */}
            {liveLoading && !liveRealtime && (
              <Card>
                <CardContent className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-lg font-medium">Loading live data...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

          {/* Interactive Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Dashboard</CardTitle>
                <CardDescription>
                  Real-time performance metrics and visualizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardUrl ? (
                  <div className="w-full h-[800px] border rounded-lg overflow-hidden">
                    <iframe
                      src={dashboardUrl}
                      className="w-full h-full"
                      style={{ border: 'none' }}
                      title="Analytics Dashboard"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Globe className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Dashboard Available</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Generate analytics to view the interactive dashboard
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {imageVisualizations.length > 0 ? (
                imageVisualizations.map((viz) => (
                  <Card key={viz.name}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {viz.name.replace(/\.(png|jpg|jpeg)$/i, '').replace(/_/g, ' ')}
                      </CardTitle>
                      <CardDescription>
                        {formatFileSize(viz.size)} • {formatDate(viz.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <img
                        src={`${ANALYTICS_BASE_URL}${viz.url}`}
                        alt={viz.name}
                        className="w-full h-auto rounded-lg border"
                      />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-2">
                  <CardContent className="flex flex-col items-center justify-center p-12">
                    <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Charts Available</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Generate analytics to view charts
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Interactive Visualizations Tab */}
          <TabsContent value="interactive" className="mt-4">
            <div className="space-y-4">
              {htmlVisualizations.length > 0 ? (
                htmlVisualizations.map((viz) => (
                  <Card key={viz.name}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {viz.name.replace(/\.html$/i, '').replace(/_/g, ' ')}
                      </CardTitle>
                      <CardDescription>
                        {formatFileSize(viz.size)} • {formatDate(viz.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-[500px] border rounded-lg overflow-hidden">
                        <iframe
                          src={`${ANALYTICS_BASE_URL}${viz.url}`}
                          className="w-full h-full"
                          style={{ border: 'none' }}
                          title={viz.name}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-12">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Interactive Visualizations</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Generate analytics to view interactive charts
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

      {/* No Data State */}
      {!status?.hasData && !isGenerating && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <BarChart3 className="h-20 w-20 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Generate performance analytics to view comprehensive insights, charts, and reports about your data.
            </p>
            <Button onClick={() => generateAnalytics(30)} size="lg">
              <TrendingUp className="h-5 w-5 mr-2" />
              Generate Analytics Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isGenerating && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Generating Analytics...</h3>
            <p className="text-sm text-muted-foreground">
              This may take a few minutes. Please wait while we analyze your data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PerformanceAnalytics