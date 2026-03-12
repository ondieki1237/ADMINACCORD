"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { apiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Phone,
  Calendar,
  MapPin,
  Search,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface CallActivity {
  _id: string
  clientName: string
  clientPhone: string
  callDate: string
  callTime: string
  callDirection: 'inbound' | 'outbound'
  callOutcome: 'no_answer' | 'interested' | 'follow_up_needed' | 'not_interested' | 'sale_closed'
  callDuration: number
  callNotes?: string
  nextAction?: string
  year?: number
  month?: number
  week?: number
  createdBy?: { firstName: string; lastName: string }
}

export default function TelesalesHistory() {
  const { toast } = useToast()
  const currentUser = authService.getCurrentUserSync()
  const isAdmin = hasAdminAccess(currentUser)

  // ==================== State Management ====================
  const [sortBy, setSortBy] = useState<'date' | 'outcome'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterOutcome, setFilterOutcome] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState("")
  const [facilityFilter, setFacilityFilter] = useState("")
  const [page, setPage] = useState(1)

  // ==================== Data Fetching ====================
  const { data: callLogsData, isLoading } = useQuery({
    queryKey: ["telesales-history", facilityFilter, page],
    queryFn: async () => {
      const result = await apiService.getTelesalesHistory({
        facilityName: facilityFilter || undefined,
        page,
        limit: 50,
      })
      console.log("Telesales history:", result)
      return result
    },
    staleTime: 5 * 60 * 1000,
  })

  // ==================== Filter & Sort ====================
  const callLogs = useMemo(() => {
    const logs = (callLogsData?.data || []) as CallActivity[]

    // Filter by outcome
    let filtered = logs.filter((log) =>
      filterOutcome === 'all' ? true : log.callOutcome === filterOutcome
    )

    // Filter by search
    filtered = filtered.filter((log) =>
      log.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.clientPhone.includes(searchQuery.toLowerCase())
    )

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.callDate).getTime()
        const dateB = new Date(b.callDate).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      } else {
        // Sort by outcome
        return sortOrder === 'desc'
          ? a.callOutcome.localeCompare(b.callOutcome)
          : b.callOutcome.localeCompare(a.callOutcome)
      }
    })

    return filtered
  }, [callLogsData, filterOutcome, searchQuery, sortBy, sortOrder])

  // ==================== Render Functions ====================

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'interested':
        return <Badge className="bg-green-100 text-green-800">Interested</Badge>
      case 'sale_closed':
        return <Badge className="bg-blue-100 text-blue-800">Sale Closed</Badge>
      case 'follow_up_needed':
        return <Badge className="bg-yellow-100 text-yellow-800">Follow-up Needed</Badge>
      case 'no_answer':
        return <Badge className="bg-gray-100 text-gray-800">No Answer</Badge>
      case 'not_interested':
        return <Badge className="bg-red-100 text-red-800">Not Interested</Badge>
      default:
        return <Badge>{outcome}</Badge>
    }
  }

  const renderHistoryList = () => (
    <div className="space-y-3">
      {callLogs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No call history found
          </CardContent>
        </Card>
      ) : (
        callLogs.map((log) => (
          <Card key={log._id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{log.clientName}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {log.clientPhone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(log.callDate).toLocaleDateString()} at {log.callTime}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {log.callDirection === 'outbound' ? 'Outgoing' : 'Incoming'} call
                    </div>
                    {log.callDuration > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Duration: {Math.floor(log.callDuration / 60)}m {log.callDuration % 60}s
                      </div>
                    )}
                    {log.callNotes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <p className="text-xs font-semibold text-gray-700">Notes:</p>
                        <p className="text-xs text-gray-600">{log.callNotes}</p>
                      </div>
                    )}
                    {log.nextAction && (
                      <div className="mt-2 text-xs font-semibold text-blue-600">
                        Next Action: {log.nextAction}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getOutcomeBadge(log.callOutcome)}
                  {log.createdBy && (
                    <p className="text-xs text-muted-foreground">
                      By {log.createdBy.firstName} {log.createdBy.lastName}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Back Button and Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/dashboard/telesales">
          <Button variant="ghost" size="sm" className="hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Telesales
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Call History</h1>
          <p className="text-sm text-muted-foreground">View and analyze all telesales call activities</p>
        </div>
      </div>

      {/* Filters and Sorting - Compact */}
      <Card className="border">
        <CardContent className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Facility Filter */}
            <div>
              <Label className="text-xs mb-1 block">Facility</Label>
              <div className="flex gap-1">
                <Input
                  placeholder="Facility name..."
                  className="flex-1 h-8 text-xs"
                  value={facilityFilter}
                  onChange={(e) => setFacilityFilter(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    setPage(1)
                    toast({
                      title: "Success",
                      description: `Searching for facility: ${facilityFilter || 'All'}`,
                    })
                  }}
                  className="bg-blue-600 hover:bg-blue-700 h-8 text-xs px-2"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Search by Name/Phone */}
            <div>
              <Label className="text-xs mb-1 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Name or phone..."
                  className="pl-7 h-8 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Outcome Filter */}
            <div>
              <Label className="text-xs mb-1 block">Outcome</Label>
              <Select value={filterOutcome} onValueChange={setFilterOutcome}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="sale_closed">Sale Closed</SelectItem>
                  <SelectItem value="follow_up_needed">Follow-up</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs mb-1 block">Sort</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="outcome">Outcome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Order</Label>
                <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest</SelectItem>
                    <SelectItem value="asc">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold">
          Call Records ({callLogs.length})
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="h-8"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* History List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Loading call history...
          </CardContent>
        </Card>
      ) : (
        renderHistoryList()
      )}
    </div>
  )
}
