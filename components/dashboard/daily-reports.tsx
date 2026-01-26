"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalendarCheck,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

interface Contact {
  name: string;
  position: string;
  phone: string;
}

interface Client {
  name: string;
  location: string;
}

interface Visit {
  _id: string;
  visitId?: string;
  userId: any;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  client?: {
    name?: string;
    type?: string;
    level?: string;
    location?: string;
  };
  contacts?: Array<{
    name?: string;
    role?: string;
    phone?: string;
    email?: string;
    department?: string;
    notes?: string;
    followUpRequired?: boolean;
    priority?: string;
  }>;
  productsOfInterest?: Array<{ name?: string; notes?: string }>;
  existingEquipment?: Array<{ name?: string; model?: string; brand?: string; quantity?: number; condition?: string }>;
  requestedEquipment?: Array<Record<string, any>>;
  visitPurpose?: string;
  visitOutcome?: string;
  competitorActivity?: string;
  marketInsights?: string;
  notes?: string;
  customData?: any;
  nextVisitDate?: string;
  attachments?: Array<{ filename?: string; originalName?: string; path?: string; mimeType?: string; size?: number; uploadedAt?: string }>;
  photos?: Array<{ filename?: string; description?: string; path?: string; uploadedAt?: string }>;
  tags?: string[];
  isFollowUpRequired?: boolean;
  followUpActions?: Array<Record<string, any>>;
  followUpVisits?: string[];
  totalPotentialValue?: number;
  syncedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Summary {
  totalVisits: number;
  date: string;
  visitsByOutcome: {
    successful: number;
    "follow-up": number;
    unsuccessful: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: Visit[];
  summary: Summary;
  meta: {
    totalDocs: number;
    page: number;
    totalPages: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function DailyReports() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // user summary states
  const [showUserSummary, setShowUserSummary] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Fetch daily visits
  const { data, isLoading, error, refetch } = useQuery<ApiResponse>({
    queryKey: ["dailyReports", selectedDate, regionFilter, outcomeFilter, currentPage],
    queryFn: async () => {
      const params: any = {
        page: currentPage,
        limit: 20,
      };
      if (selectedDate) params.date = selectedDate;
      if (regionFilter !== "all") params.region = regionFilter;
      if (outcomeFilter !== "all") params.outcome = outcomeFilter;

      const result = await apiService.getAdminDailyActivities(params as any);
      return result;
    },
    enabled: typeof window !== "undefined",
    staleTime: 1000 * 60 * 2,
  });

  // Fetch users for selector (large limit but controlled)
  const { data: usersResp } = useQuery({
    queryKey: ["users", "all"],
    queryFn: async () => {
      try {
        const res = await apiService.getUsers({ page: 1, limit: 1000 });
        return res;
      } catch (err) {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const usersList: any[] = (usersResp && (usersResp.data || usersResp.users || usersResp.docs)) || [];

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Daily reports data has been updated",
    });
  };

  const handleExportCSV = async () => {
    try {
      let start = exportStartDate;
      let end = exportEndDate;
      if (!start && !end && selectedDate) {
        start = selectedDate;
        end = selectedDate;
      }
      if (!start && !end) {
        toast({ title: "Date range required", description: "Please select a start or end date (or choose a single date).", variant: "destructive" as any });
        return;
      }

      setIsExporting(true);

      const filters: any = { page: 1, limit: 10000 };
      if (start) filters.startDate = start;
      if (end) filters.endDate = end;

      const resp = await apiService.getAdminVisits(filters);
      const visits: Visit[] = resp?.data || [];

      const header = [
        'Visit ID','Date','User FirstName','User LastName','EmployeeId','Region','Client Name','Client Location','Contacts','Outcome','Duration','PotentialValue','Notes','Tags','Created At'
      ];
      const escape = (v: any) => {
        if (v === undefined || v === null) return '';
        const s = String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };

      const rows = visits.map((v) => {
        const contacts = (v.contacts || []).map(c => `${c.name || ''} (${c.position || ''}) ${c.phone || ''}`).join('; ');
        const tags = (v.tags || []).join('; ');
        return [
          escape(v._id),escape(v.date),escape(v.userId?.firstName),escape(v.userId?.lastName),escape((v.userId as any)?.employeeId),escape((v.userId as any)?.region),escape(v.client?.name),escape(v.client?.location),escape(contacts),escape(v.visitOutcome),escape(v.duration),escape((v as any).totalPotentialValue),escape(v.notes),escape(tags),escape(v.createdAt)
        ].join(',');
      });

      const csv = [header.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const startLabel = (exportStartDate || selectedDate || 'start').replace(/-/g, '');
      const endLabel = (exportEndDate || selectedDate || 'end').replace(/-/g, '');
      a.href = url;
      a.download = `daily-visits-${startLabel}-${endLabel}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: 'Export complete', description: `Exported ${visits.length} visits` });
    } catch (err: any) {
      console.error('Export error', err);
      toast({ title: 'Export failed', description: err?.message || 'An error occurred', variant: 'destructive' as any });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateUserSummary = async () => {
    if (!selectedUserId) {
      toast({ title: 'Select user', description: 'Please select a single user to generate summary', variant: 'destructive' as any });
      return;
    }

    let start = exportStartDate;
    let end = exportEndDate;
    if (!start && !end && selectedDate) {
      start = selectedDate;
      end = selectedDate;
    }
    if (!start && !end) {
      toast({ title: 'Date range required', description: 'Please select a start or end date (or choose a single date).', variant: 'destructive' as any });
      return;
    }

    setIsGeneratingSummary(true);
    let visits: Visit[] = [];

    try {
      const resp = await apiService.getAdminVisitsByUser(selectedUserId, {
        page: 1,
        limit: 10000,
        startDate: start,
        endDate: end,
      });
      visits = resp?.data || [];
    } catch (errPrimary: any) {
      console.error('Primary user visits fetch failed', errPrimary);
      try {
        const resp2 = await apiService.getAdminVisits({ page: 1, limit: 10000, userId: selectedUserId, startDate: start, endDate: end });
        visits = resp2?.data || [];
      } catch (errFallback: any) {
        console.error('Fallback user visits fetch failed', errFallback);
        toast({ title: 'Summary failed', description: errFallback?.message || errPrimary?.message || 'Failed to fetch user visits', variant: 'destructive' as any });
        setIsGeneratingSummary(false);
        return;
      }
    }

    try {
      const totalVisits = visits.length;
      const visitsByOutcome: Record<string, number> = {};
      let totalDuration = 0;
      let totalPotential = 0;

      visits.forEach((v) => {
        const key = (v.visitOutcome || 'unknown').toLowerCase();
        visitsByOutcome[key] = (visitsByOutcome[key] || 0) + 1;
        totalDuration += Number(v.duration || 0);
        totalPotential += Number((v as any).totalPotentialValue || 0);
      });

      const headerSummary = [
        ['User', selectedUserId],
        ['StartDate', start || ''],
        ['EndDate', end || ''],
        ['TotalVisits', String(totalVisits)],
        ['TotalDurationMinutes', String(totalDuration)],
        ['TotalPotentialValue', String(totalPotential)],
      ];

      const outcomeLines = Object.entries(visitsByOutcome).map(([k, v]) => [k, String(v)]);

      const visitHeader = [
        'UserFirst','UserLast',
        'ClientName','ClientType','ClientLevel','ClientLocation',
        'ContactNames','ContactPhones','ContactRoles','ProductsOfInterest',
        'VisitPurpose','VisitOutcome','CompetitorActivity','MarketInsights','Notes','CustomData',
        'NextVisitDate','Attachments','Photos','Tags','IsFollowUpRequired','FollowUpActions','FollowUpVisits',
        'TotalPotentialValue','SyncedAt','CreatedAt','UpdatedAt'
      ];

      const escape = (v: any) => {
        if (v === undefined || v === null) return '';
        const s = String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };

      const visitRows = visits.map((v) => [
        escape((v.userId && (v.userId.firstName || '')) || ''),
        escape((v.userId && (v.userId.lastName || '')) || ''),

        escape(v.client?.name || ''),
        escape(v.client?.type || ''),
        escape(v.client?.level || ''),
        escape(v.client?.location || ''),

        // contacts split into three columns: names, phones, roles
        escape((v.contacts || []).map(c => c.name || '').join('; ')),
        escape((v.contacts || []).map(c => c.phone || '').join('; ')),
        escape((v.contacts || []).map(c => c.role || '').join('; ')),
        escape(JSON.stringify(v.productsOfInterest || [])),

        escape(v.visitPurpose || ''),
        escape(v.visitOutcome || ''),
        escape(v.competitorActivity || ''),
        escape(v.marketInsights || ''),
        escape(v.notes || ''),
        escape(JSON.stringify(v.customData || '')),

        escape(v.nextVisitDate || ''),
        escape(JSON.stringify(v.attachments || [])),
        escape(JSON.stringify(v.photos || [])),
        escape((v.tags || []).join('; ')),
        escape(String(!!v.isFollowUpRequired)),
        escape(JSON.stringify(v.followUpActions || [])),
        escape((v.followUpVisits || []).join('; ')),

        escape((v as any).totalPotentialValue || ''),
        escape(v.syncedAt || ''),
        escape(v.createdAt || ''),
        escape(v.updatedAt || ''),
      ].join(','));

      const summaryCsvLines = [
        ...headerSummary.map((r) => r.join(',')),
        ...outcomeLines.map((r) => r.join(',')),
        '',
        visitHeader.join(','),
        ...visitRows,
      ];

      const csv = summaryCsvLines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const startLabel = start ? start.replace(/-/g, '') : 'start';
      const endLabel = end ? end.replace(/-/g, '') : 'end';
      a.href = url;
      a.download = `user-summary-${selectedUserId}-${startLabel}-${endLabel}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: 'Summary created', description: `Generated summary for ${visits.length} visits` });
    } catch (err: any) {
      console.error('Summary build error', err);
      toast({ title: 'Summary failed', description: err?.message || 'An error occurred', variant: 'destructive' as any });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const getOutcomeBadgeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case "successful":
        return "bg-green-100 text-green-700 border-green-200";
      case "follow-up":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "unsuccessful":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case "successful":
        return <CheckCircle className="h-4 w-4" />;
      case "follow-up":
        return <Clock className="h-4 w-4" />;
      case "unsuccessful":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Filter visits by search query
  const filteredVisits = data?.data?.filter((visit) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      visit.userId.firstName.toLowerCase().includes(query) ||
      visit.userId.lastName.toLowerCase().includes(query) ||
      visit.client.name.toLowerCase().includes(query) ||
      visit.userId.employeeId.toLowerCase().includes(query)
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Failed to load daily reports</p>
                <p className="text-sm mt-1">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <CalendarCheck className="h-5 w-5 text-white" />
              </div>
              Daily Reports
            </h1>
            <p className="text-gray-600 mt-1">Sales team visit activities and performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <div className="flex items-center gap-2">
              <label className="text-sm">From</label>
              <Input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} />
              <label className="text-sm">To</label>
              <Input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} />
              <Button
                onClick={async () => {
                  // export handler (defined below)
                  await handleExportCSV();
                }}
                variant="secondary"
                className="gap-2"
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
              <Button
                onClick={() => setShowUserSummary((s) => !s)}
                variant="ghost"
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Create User Summary
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-gray-100 bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Visits</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {data?.summary?.totalVisits || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {data?.summary?.visitsByOutcome?.successful || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Follow-up</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">
                    {data?.summary?.visitsByOutcome?.["follow-up"] || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-100 bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Date (Optional)</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                  placeholder="All dates"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate("")}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                  >
                    Clear date filter
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Region</label>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="Nairobi">Nairobi</SelectItem>
                    <SelectItem value="Mombasa">Mombasa</SelectItem>
                    <SelectItem value="Kisumu">Kisumu</SelectItem>
                    <SelectItem value="Nakuru">Nakuru</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Outcome</label>
                <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="successful">Successful</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            {showUserSummary && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select User (only one)</label>
                <div className="flex items-center gap-2">
                  <select
                    className="border rounded px-3 py-2"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">-- choose user --</option>
                    {usersList.length > 0 ? (
                      usersList.map((u: any) => (
                        <option key={u._id || u.id} value={u._id || u.id}>{u.firstName} {u.lastName} — {u.employeeId || ''}</option>
                      ))
                    ) : (
                      // Fallback: build from visits if users endpoint is unavailable
                      Array.from(new Map((data?.data || []).map((v) => [v.userId?._id || (v.userId && v.userId.id) || `${v.userId?.firstName}_${v.userId?.lastName}`, v.userId])).values() as any).map((u: any) => (
                        <option key={u._id || u.id || `${u.firstName}_${u.lastName}`} value={u._id || u.id || ''}>{u.firstName} {u.lastName} — {u.employeeId || ''}</option>
                      ))
                    )}
                  </select>
                  <Button
                    onClick={async () => {
                      await handleCreateUserSummary();
                    }}
                    disabled={isGeneratingSummary}
                  >
                    {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visits List */}
        <div className="space-y-4">
          {filteredVisits.length === 0 ? (
            <Card className="border-gray-100 bg-white">
              <CardContent className="py-12 text-center">
                <CalendarCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No visits found for the selected filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredVisits.map((visit) => (
              <Card key={visit._id} className="border-gray-100 bg-white hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Main Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {visit.userId.firstName} {visit.userId.lastName}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {visit.userId.employeeId}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {visit.userId.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {visit.userId.region}
                            </span>
                          </div>
                        </div>
                        <Badge className={`${getOutcomeBadgeColor(visit.visitOutcome)} flex items-center gap-1`}>
                          {getOutcomeIcon(visit.visitOutcome)}
                          {visit.visitOutcome}
                        </Badge>
                      </div>

                      {/* Client Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          {visit.client.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">{visit.client.location}</p>

                        {/* Contacts */}
                        {visit.contacts && visit.contacts.length > 0 && (
                          <div className="space-y-2">
                            {visit.contacts.map((contact, idx) => (
                              <div key={idx} className="flex items-center gap-4 text-sm">
                                <span className="font-medium text-gray-900">{contact.name}</span>
                                <span className="text-gray-600">{contact.position}</span>
                                <span className="flex items-center gap-1 text-gray-600">
                                  <Phone className="h-3 w-3" />
                                  {contact.phone}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Visit Details */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          {visit.duration} min
                        </span>
                        {visit.totalPotentialValue > 0 && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            KES {visit.totalPotentialValue.toLocaleString()}
                          </span>
                        )}
                        <span className="text-gray-600">
                          {format(new Date(visit.date), "PPp")}
                        </span>
                      </div>

                      {/* Notes */}
                      {visit.notes && (
                        <div className="pt-2">
                          <p className="text-sm text-gray-700 italic">"{visit.notes}"</p>
                        </div>
                      )}

                      {/* Tags */}
                      {visit.tags && visit.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {visit.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing page {data.meta.page} of {data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!data.meta.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!data.meta.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// (Export implemented inside the component.)
