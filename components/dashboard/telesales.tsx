"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Phone,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  PhoneIncoming,
  PhoneOutgoing,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PhoneOff,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Filter,
  Download,
  Bell,
  Tag,
  User,
  MapPin,
  FileText
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface CallLog {
  _id: string
  clientName: string
  clientFacilityName?: string
  clientRole?: string
  clientPhone: string
  callDirection: 'inbound' | 'outbound'
  callDate: string
  callTime: string
  callDuration: number
  callOutcome: 'no_answer' | 'interested' | 'follow_up_needed' | 'not_interested' | 'sale_closed'
  nextAction?: string
  followUpDate?: string
  callNotes?: string
  tags?: string[]
  year: number
  month: number
  week: number
  createdBy: {
    _id: string
    firstName: string
    lastName: string
  }
  // relatedLead and relatedVisit removed
  createdAt: string
  updatedAt: string
}

interface FolderTreeData {
  year: number
  totalCalls: number
  months: {
    month: number
    monthName: string
    totalCalls: number
    weeks: {
      week: number
      count: number
      firstCall: string
      lastCall: string
    }[]
  }[]
}

interface Statistics {
  totalCalls: number
  totalDuration: number
  avgDuration: number
  inboundCalls: number
  outboundCalls: number
  noAnswer: number
  interested: number
  followUpNeeded: number
  notInterested: number
  saleClosed: number
  conversionRate: string
}

export default function TelesalesDashboard() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [filterYear, setFilterYear] = useState<number | undefined>()
  const [filterMonth, setFilterMonth] = useState<number | undefined>()
  const [filterWeek, setFilterWeek] = useState<number | undefined>()
  const [filterOutcome, setFilterOutcome] = useState<string>("all")
  const [filterDirection, setFilterDirection] = useState<string>("all")
  const { toast } = useToast()
  const qc = useQueryClient()

  const currentUser = authService.getCurrentUserSync()
  const isAdmin = hasAdminAccess(currentUser)

  // Helper function to calculate ISO week number
  const getISOWeek = (date: Date): number => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return weekNo
  }

  // Helper function to get year, month, week from date string
  const getDateComponents = (dateString: string) => {
    const date = new Date(dateString)
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1, // JavaScript months are 0-indexed
      week: getISOWeek(date)
    }
  }

  // Form state for both create and edit
  const [formData, setFormData] = useState({
    clientName: "",
    clientFacilityName: "",
    clientRole: "",
    clientPhone: "",
    callDirection: "outbound" as 'inbound' | 'outbound',
    callDate: new Date().toISOString().split('T')[0],
    callTime: new Date().toTimeString().slice(0, 5),
    callDuration: "",
    callOutcome: "interested" as CallLog['callOutcome'],
    nextAction: "",
    followUpDate: "",
    callNotes: "",
    tags: "",
  })

  // Fetch call logs
  const { data: callLogsData, isLoading, error, refetch } = useQuery({
    queryKey: ["callLogs", page, searchQuery, filterYear, filterMonth, filterWeek, filterOutcome, filterDirection],
    queryFn: async () => {
      const filters: any = {
        page,
        limit: 20,
      }
      if (searchQuery) filters.search = searchQuery
      if (filterYear) filters.year = filterYear
      if (filterMonth) filters.month = filterMonth
      if (filterWeek) filters.week = filterWeek
      if (filterOutcome && filterOutcome !== 'all') filters.callOutcome = filterOutcome
      if (filterDirection && filterDirection !== 'all') filters.callDirection = filterDirection

      return apiService.getCallLogs(filters)
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    retry: 1,
  })

  // Fetch folder tree
  const { data: folderTreeData } = useQuery({
    queryKey: ["callLogsFolderTree"],
    queryFn: () => apiService.getCallLogFolderTree(),
    staleTime: 60000, // Cache for 1 minute
  })

  // Fetch statistics
  const { data: statisticsData } = useQuery({
    queryKey: ["callLogsStatistics", filterYear, filterMonth, filterWeek],
    queryFn: () => {
      const filters: any = {}
      if (filterYear) filters.year = filterYear
      if (filterMonth) filters.month = filterMonth
      if (filterWeek) filters.week = filterWeek
      return apiService.getCallLogStatistics(filters)
    },
    staleTime: 60000,
  })

  // Fetch follow-ups
  const { data: followUpsData } = useQuery({
    queryKey: ["callLogsFollowUps"],
    queryFn: () => apiService.getCallLogFollowUps(7),
    staleTime: 300000, // Cache for 5 minutes
  })

  // Create call log mutation
  const createMutation = useMutation({
    mutationFn: (newData: any) => apiService.createCallLog(newData),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Call log created successfully",
        variant: "default",
      })
      qc.invalidateQueries({ queryKey: ["callLogs"] })
      qc.invalidateQueries({ queryKey: ["callLogsFolderTree"] })
      qc.invalidateQueries({ queryKey: ["callLogsStatistics"] })
      setIsCreateDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create call log",
        variant: "destructive",
      })
    },
  })

  // Update call log mutation
  const updateMutation = useMutation({
    mutationFn: (updateData: any) => {
      const callLogId = selectedCallLog?._id
      if (!callLogId) throw new Error("Call log ID is required")
      return apiService.updateCallLog(callLogId, updateData)
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Call log updated successfully",
        variant: "default",
      })
      qc.invalidateQueries({ queryKey: ["callLogs"] })
      qc.invalidateQueries({ queryKey: ["callLogsFolderTree"] })
      qc.invalidateQueries({ queryKey: ["callLogsStatistics"] })
      setIsDialogOpen(false)
      setSelectedCallLog(null)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update call log",
        variant: "destructive",
      })
    },
  })

  // Delete call log mutation
  const deleteMutation = useMutation({
    mutationFn: (callLogId: string) => apiService.deleteCallLog(callLogId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Call log deleted successfully",
        variant: "default",
      })
      qc.invalidateQueries({ queryKey: ["callLogs"] })
      qc.invalidateQueries({ queryKey: ["callLogsFolderTree"] })
      qc.invalidateQueries({ queryKey: ["callLogsStatistics"] })
      setSelectedCallLog(null)
      setIsViewDialogOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete call log",
        variant: "destructive",
      })
    },
  })

  const resetForm = () => {
    setFormData({
      clientName: "",
      clientFacilityName: "",
      clientRole: "",
      clientPhone: "",
      callDirection: "outbound",
      callDate: new Date().toISOString().split('T')[0],
      callTime: new Date().toTimeString().slice(0, 5),
      callDuration: "",
      callOutcome: "interested",
      nextAction: "",
      followUpDate: "",
      callNotes: "",
      tags: "",
    })
  }

  const handleEdit = (callLog: CallLog) => {
    setSelectedCallLog(callLog)
    setFormData({
      clientName: callLog.clientName,
      clientFacilityName: callLog.clientFacilityName || "",
      clientRole: callLog.clientRole || "",
      clientPhone: callLog.clientPhone,
      callDirection: callLog.callDirection,
      callDate: callLog.callDate.split('T')[0],
      callTime: callLog.callTime,
      callDuration: callLog.callDuration.toString(),
      callOutcome: callLog.callOutcome,
      nextAction: callLog.nextAction || "",
      followUpDate: callLog.followUpDate ? callLog.followUpDate.split('T')[0] : "",
      callNotes: callLog.callNotes || "",
      tags: callLog.tags?.join(", ") || "",
    })
    setIsDialogOpen(true)
  }

  const handleView = (callLog: CallLog) => {
    setSelectedCallLog(callLog)
    setIsViewDialogOpen(true)
  }

  const handleCreateClick = () => {
    resetForm()
    setSelectedCallLog(null)
    setIsCreateDialogOpen(true)
  }

  const handleSave = async () => {
    // Validation
    if (!formData.clientName || !formData.clientFacilityName || !formData.clientRole || !formData.clientPhone || !formData.callDuration) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Calculate year, month, week from callDate
    const dateComponents = getDateComponents(formData.callDate)

    const payload = {
      clientName: formData.clientName,
      clientFacilityName: formData.clientFacilityName || undefined,
      clientRole: formData.clientRole || undefined,
      clientPhone: formData.clientPhone,
      callDirection: formData.callDirection,
      callDate: formData.callDate,
      callTime: formData.callTime,
      callDuration: parseInt(formData.callDuration),
      callOutcome: formData.callOutcome,
      year: dateComponents.year,
      month: dateComponents.month,
      week: dateComponents.week,
      nextAction: formData.nextAction || undefined,
      followUpDate: formData.followUpDate || undefined,
      callNotes: formData.callNotes || undefined,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    }

    if (selectedCallLog) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (callLogId: string) => {
    if (confirm("Are you sure you want to delete this call log?")) {
      deleteMutation.mutate(callLogId)
    }
  }

  const toggleYear = (year: number) => {
    const newSet = new Set(expandedYears)
    if (newSet.has(year)) {
      newSet.delete(year)
    } else {
      newSet.add(year)
    }
    setExpandedYears(newSet)
  }

  const toggleMonth = (yearMonth: string) => {
    const newSet = new Set(expandedMonths)
    if (newSet.has(yearMonth)) {
      newSet.delete(yearMonth)
    } else {
      newSet.add(yearMonth)
    }
    setExpandedMonths(newSet)
  }

  const handleFolderClick = (year?: number, month?: number, week?: number) => {
    setFilterYear(year)
    setFilterMonth(month)
    setFilterWeek(week)
    setPage(1)
  }

  const clearFilters = () => {
    setFilterYear(undefined)
    setFilterMonth(undefined)
    setFilterWeek(undefined)
    setFilterOutcome("all")
    setFilterDirection("all")
    setSearchQuery("")
    setPage(1)
  }

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'no_answer': return <PhoneOff className="h-4 w-4" />
      case 'interested': return <CheckCircle2 className="h-4 w-4" />
      case 'follow_up_needed': return <AlertCircle className="h-4 w-4" />
      case 'not_interested': return <XCircle className="h-4 w-4" />
      case 'sale_closed': return <DollarSign className="h-4 w-4" />
      default: return <Phone className="h-4 w-4" />
    }
  }

  const getOutcomeBadgeVariant = (outcome: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (outcome) {
      case 'sale_closed': return 'default'
      case 'interested': return 'default'
      case 'follow_up_needed': return 'secondary'
      case 'not_interested': return 'destructive'
      case 'no_answer': return 'outline'
      default: return 'outline'
    }
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'no_answer': return 'text-gray-600'
      case 'interested': return 'text-green-600'
      case 'follow_up_needed': return 'text-yellow-600'
      case 'not_interested': return 'text-red-600'
      case 'sale_closed': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const formatOutcome = (outcome: string) => {
    return outcome.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const stats: Statistics | undefined = statisticsData?.data

  const callLogs: CallLog[] = callLogsData?.data || []
  const pagination = callLogsData?.pagination || { total: 0, page: 1, pages: 1 }
  const folderTree: FolderTreeData[] = folderTreeData?.data || []
  const followUps: CallLog[] = followUpsData?.data || []
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg">
              <Phone className="h-6 w-6 text-white" />
            </div>
            Telesales Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Track and manage client calls, follow-ups, and conversions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateClick} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Log Call
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCalls}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.inboundCalls} in / {stats.outboundCalls} out
                  </p>
                </div>
                <Phone className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.saleClosed} sales closed
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.avgDuration} min</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.totalDuration} min total
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.followUpNeeded}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {followUps.length} upcoming
                  </p>
                </div>
                <Bell className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folder Tree Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              Call History
            </CardTitle>
            <CardDescription>Browse by date</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {filterYear || filterMonth || filterWeek ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full mb-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            ) : null}
            
            <div className="space-y-2">
              {folderTree.map((yearData) => (
                <div key={yearData.year}>
                  <button
                    onClick={() => toggleYear(yearData.year)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                      filterYear === yearData.year && !filterMonth ? 'bg-red-50 text-red-600' : ''
                    }`}
                  >
                    {expandedYears.has(yearData.year) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">{yearData.year}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {yearData.totalCalls}
                    </Badge>
                  </button>

                  {expandedYears.has(yearData.year) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {yearData.months.map((monthData) => {
                        const yearMonth = `${yearData.year}-${monthData.month}`
                        return (
                          <div key={yearMonth}>
                            <button
                              onClick={() => toggleMonth(yearMonth)}
                              className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm ${
                                filterYear === yearData.year && filterMonth === monthData.month && !filterWeek
                                  ? 'bg-red-50 text-red-600'
                                  : ''
                              }`}
                            >
                              {expandedMonths.has(yearMonth) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              <span className="font-medium">{monthData.monthName}</span>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {monthData.totalCalls}
                              </Badge>
                            </button>

                            {expandedMonths.has(yearMonth) && (
                              <div className="ml-6 mt-1 space-y-1">
                                {monthData.weeks.map((weekData) => (
                                  <button
                                    key={weekData.week}
                                    onClick={() => handleFolderClick(yearData.year, monthData.month, weekData.week)}
                                    className={`w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-xs ${
                                      filterYear === yearData.year &&
                                      filterMonth === monthData.month &&
                                      filterWeek === weekData.week
                                        ? 'bg-red-50 text-red-600 font-medium'
                                        : ''
                                    }`}
                                  >
                                    <span>Week {weekData.week}</span>
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                      {weekData.count}
                                    </Badge>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call Logs List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search client name or notes..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setPage(1)
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={filterOutcome} onValueChange={(value) => {
                  setFilterOutcome(value)
                  setPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="follow_up_needed">Follow-up Needed</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                    <SelectItem value="sale_closed">Sale Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterDirection} onValueChange={(value) => {
                  setFilterDirection(value)
                  setPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Calls</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Call Logs */}
          {isLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-500 mt-4">Loading call logs...</p>
              </CardContent>
            </Card>
          ) : callLogs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Phone className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mt-4">No call logs found</h3>
                <p className="text-gray-500 mt-2">Start by logging your first call</p>
                <Button onClick={handleCreateClick} className="mt-4 bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Log First Call
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {callLogs.map((callLog) => (
                <Card
                  key={callLog._id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleView(callLog)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            callLog.callDirection === 'inbound' ? 'bg-blue-50' : 'bg-green-50'
                          }`}>
                            {callLog.callDirection === 'inbound' ? (
                              <PhoneIncoming className={`h-5 w-5 ${
                                callLog.callDirection === 'inbound' ? 'text-blue-600' : 'text-green-600'
                              }`} />
                            ) : (
                              <PhoneOutgoing className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{callLog.clientName}</h3>
                            <p className="text-sm text-gray-500">{callLog.clientPhone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getOutcomeBadgeVariant(callLog.callOutcome)} className="capitalize">
                              {formatOutcome(callLog.callOutcome)}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(callLog.callDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{callLog.callTime} ({callLog.callDuration} min)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{callLog.createdBy.firstName} {callLog.createdBy.lastName}</span>
                          </div>
                        </div>

                        {callLog.callNotes && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {callLog.callNotes}
                          </p>
                        )}

                        {callLog.tags && callLog.tags.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {callLog.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {callLog.followUpDate && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded inline-flex">
                            <Bell className="h-4 w-4" />
                            <span>Follow-up: {new Date(callLog.followUpDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(callLog)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(callLog._id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsDialogOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCallLog ? "Edit Call Log" : "Log New Call"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Dr. John Smith"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="clientPhone">Client Phone *</Label>
              <Input
                id="clientPhone"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                placeholder="+254712345678"
              />
            </div>

            
              <Label htmlFor="callDirection">Call Direction *</Label>
              <Select
                value={formData.callDirection}
                onValueChange={(value: 'inbound' | 'outbound') =>
                  setFormData({ ...formData, callDirection: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">
                    <div className="flex items-center gap-2">
                      <PhoneIncoming className="h-4 w-4" />
                      Inbound
                    </div>
                  </SelectItem>
                  <SelectItem value="outbound">
                    <div className="flex items-center gap-2">
                      <PhoneOutgoing className="h-4 w-4" />
                      Outbound
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="callOutcome">Call Outcome *</Label>
              <Select
                value={formData.callOutcome}
                onValueChange={(value: CallLog['callOutcome']) =>
                  setFormData({ ...formData, callOutcome: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="follow_up_needed">Follow-up Needed</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="sale_closed">Sale Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="callDate">Call Date *</Label>
              <Input
                id="callDate"
                type="date"
                value={formData.callDate}
                onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="callTime">Call Time *</Label>
              <Input
                id="callTime"
                type="time"
                value={formData.callTime}
                onChange={(e) => setFormData({ ...formData, callTime: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="callDuration">Duration (minutes) *</Label>
              <Input
                id="callDuration"
                type="number"
                min="0"
                value={formData.callDuration}
                onChange={(e) => setFormData({ ...formData, callDuration: e.target.value })}
                placeholder="15"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="nextAction">Next Action</Label>
              <Input
                id="nextAction"
                value={formData.nextAction}
                onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                placeholder="Send product brochure"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="followUpDate">Follow-up Date</Label>
              <Input
                id="followUpDate"
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="callNotes">Call Notes</Label>
              <Textarea
                id="callNotes"
                value={formData.callNotes}
                onChange={(e) => setFormData({ ...formData, callNotes: e.target.value })}
                placeholder="Detailed notes about the call..."
                rows={4}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="high-priority, x-ray, urgent"
              />
            </div>
            <div>
              <Label htmlFor="clientFacilityName">Client Facility Name *</Label>
              <Input
                id="clientFacilityName"
                value={formData.clientFacilityName}
                onChange={(e) => setFormData({ ...formData, clientFacilityName: e.target.value })}
                placeholder="City Hospital"
              />
            </div>
            <div>
              <Label htmlFor="clientRole">Client Role *</Label>
              <Input
                id="clientRole"
                value={formData.clientRole}
                onChange={(e) => setFormData({ ...formData, clientRole: e.target.value })}
                placeholder="Radiologist, Procurement, etc."
              />
            </div>
            <div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setIsDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Call Log</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Call Log Details</DialogTitle>
          </DialogHeader>

          {selectedCallLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  selectedCallLog.callDirection === 'inbound' ? 'bg-blue-50' : 'bg-green-50'
                }`}>
                  {selectedCallLog.callDirection === 'inbound' ? (
                    <PhoneIncoming className={`h-6 w-6 ${
                      selectedCallLog.callDirection === 'inbound' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  ) : (
                    <PhoneOutgoing className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedCallLog.clientName}</h3>
                  <p className="text-gray-600">{selectedCallLog.clientPhone}</p>
                  {(selectedCallLog.clientFacilityName || selectedCallLog.clientRole) && (
                    <p className="text-sm text-gray-500">{selectedCallLog.clientRole ? `${selectedCallLog.clientRole}` : ''}{selectedCallLog.clientRole && selectedCallLog.clientFacilityName ? ' • ' : ''}{selectedCallLog.clientFacilityName ? `${selectedCallLog.clientFacilityName}` : ''}</p>
                  )}
                </div>
                <Badge variant={getOutcomeBadgeVariant(selectedCallLog.callOutcome)} className="text-sm capitalize">
                  {formatOutcome(selectedCallLog.callOutcome)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(selectedCallLog.callDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{selectedCallLog.callTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{selectedCallLog.callDuration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Logged By</p>
                  <p className="font-medium">
                    {selectedCallLog.createdBy.firstName} {selectedCallLog.createdBy.lastName}
                  </p>
                </div>
              </div>

              {selectedCallLog.nextAction && (
                <div>
                  <Label className="text-gray-600">Next Action</Label>
                  <p className="mt-1 p-3 bg-blue-50 rounded-lg">{selectedCallLog.nextAction}</p>
                </div>
              )}

              {selectedCallLog.followUpDate && (
                <div>
                  <Label className="text-gray-600">Follow-up Date</Label>
                  <p className="mt-1 flex items-center gap-2 p-3 bg-yellow-50 rounded-lg text-yellow-800">
                    <Bell className="h-4 w-4" />
                    {new Date(selectedCallLog.followUpDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {selectedCallLog.callNotes && (
                <div>
                  <Label className="text-gray-600">Call Notes</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {selectedCallLog.callNotes}
                  </p>
                </div>
              )}

              {selectedCallLog.tags && selectedCallLog.tags.length > 0 && (
                <div>
                  <Label className="text-gray-600">Tags</Label>
                  <div className="flex gap-2 mt-2">
                    {selectedCallLog.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewDialogOpen(false)
                if (selectedCallLog) handleEdit(selectedCallLog)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedCallLog) handleDelete(selectedCallLog._id)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
