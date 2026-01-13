"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CalendarCheck, 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp, 
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
  DollarSign
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

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  region: string;
  role: string;
}

interface Visit {
  _id: string;
  userId: User;
  client: Client;
  contacts: Contact[];
  visitOutcome: string;
  date: string;
  duration: number;
  totalPotentialValue: number;
  notes: string;
  tags: string[];
  createdAt: string;
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

  // Fetch daily visits
  const { data, isLoading, error, refetch } = useQuery<ApiResponse>({
    queryKey: ["dailyReports", selectedDate, regionFilter, outcomeFilter, currentPage],
    queryFn: async () => {
      // Use centralized apiService which respects NEXT_PUBLIC_API_BASE_URL and local dev hosts
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
    enabled: typeof window !== 'undefined',
    staleTime: 1000 * 60 * 2,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Daily reports data has been updated",
    });
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
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
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
