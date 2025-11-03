"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Package, 
  DollarSign, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  X,
  Eye,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  Hospital
} from "lucide-react";
import { 
  generateVisitsExtractionPDF, 
  generateContactsExtractionPDF, 
  generateFacilitiesExtractionPDF 
} from "@/lib/visitsPdfGenerator";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  employeeId?: string;
}

interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
  designation: string;
}

interface Client {
  name: string;
  location: string;
  county: string;
  type: string;
  coordinates?: { lat: number; lng: number };
}

interface Equipment {
  name: string;
  category: string;
  quantity: number;
  estimatedValue: number;
}

interface FollowUpAction {
  action: string;
  dueDate: string;
  priority: string;
  status: string;
  assignedTo?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Visit {
  _id: string;
  userId: User;
  date: string;
  startTime?: string;
  endTime?: string;
  client: Client;
  contacts: Contact[];
  equipment: Equipment[];
  visitPurpose: string;
  visitOutcome: string;
  discussionNotes?: string;
  challenges?: string;
  opportunities?: string;
  totalPotentialValue: number;
  followUpActions: FollowUpAction[];
  photos?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface VisitSummary {
  userId: string;
  visitsCount: number;
  lastVisit: string;
  user: User;
}

interface Meta {
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Meta;
}

const VisitsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [summary, setSummary] = useState<VisitSummary[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState<number>(Number(searchParams.get("limit")) || 20);
  const [startDate, setStartDate] = useState<string | null>(searchParams.get("startDate") || null);
  const [endDate, setEndDate] = useState<string | null>(searchParams.get("endDate") || null);
  const [sort, setSort] = useState<string | null>(searchParams.get("sort") || null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(sort && { sort }),
      }).toString();

      const res = await fetch(`https://app.codewithseth.co.ke/api/admin/visits/user/${userId}?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || "Failed to fetch user visits");
      }

      const result: ApiResponse<Visit[]> = await res.json();
      if (result.success) {
        setVisits(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch visits");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        ...(limit && { limit: limit.toString() }),
      }).toString();

      const res = await fetch(`https://app.codewithseth.co.ke/api/admin/visits/summary?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || "Failed to fetch summary");
      }

      const result: ApiResponse<VisitSummary[]> = await res.json();
      if (result.success) {
        setSummary(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitDetail = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const res = await fetch(`https://app.codewithseth.co.ke/api/admin/visits/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || "Visit not found");
      }

      const result: ApiResponse<Visit> = await res.json();
      if (result.success) {
        setSelectedVisit(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch visit detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
    fetchSummary();
  }, [page, limit, startDate, endDate, sort, userId]);

  const handleUserSelect = (id: string) => {
    setUserId(id);
    setPage(1); // Reset to first page on user change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    router.push(`/visits?page=${newPage}&limit=${limit}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}${sort ? `&sort=${sort}` : ''}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Visit Records</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading && <div className="text-gray-500">Loading...</div>}

      {/* Data Extraction Section */}
      <div className="bg-gradient-to-r from-[#008cf7] to-[#0066cc] rounded-lg p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Data Extraction Tools
            </h2>
            <p className="text-sm opacity-90 mt-1">
              Extract key data from all visits into downloadable PDF reports
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Complete Visits Extraction */}
          <button
            onClick={async () => {
              if (visits.length === 0) {
                alert('No visits data to extract. Please load visits first.');
                return;
              }
              try {
                await generateVisitsExtractionPDF(visits);
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF. Please try again.');
              }
            }}
            className="bg-white hover:bg-gray-50 text-gray-900 rounded-lg p-4 transition-all hover:shadow-xl flex flex-col items-start gap-3 group"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FileText className="w-6 h-6 text-[#008cf7]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">Complete Visits</h3>
                <p className="text-xs text-gray-600">Full visit details with contacts & equipment</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded w-full">
              Includes: Facilities, contacts, equipment, values
            </div>
          </button>

          {/* Contacts Directory */}
          <button
            onClick={async () => {
              if (visits.length === 0) {
                alert('No visits data to extract. Please load visits first.');
                return;
              }
              try {
                await generateContactsExtractionPDF(visits);
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF. Please try again.');
              }
            }}
            className="bg-white hover:bg-gray-50 text-gray-900 rounded-lg p-4 transition-all hover:shadow-xl flex flex-col items-start gap-3 group"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">Contacts Directory</h3>
                <p className="text-xs text-gray-600">All contacts from visited facilities</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded w-full">
              Includes: Names, roles, phones, emails, facilities
            </div>
          </button>

          {/* Facilities Summary */}
          <button
            onClick={async () => {
              if (visits.length === 0) {
                alert('No visits data to extract. Please load visits first.');
                return;
              }
              try {
                await generateFacilitiesExtractionPDF(visits);
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF. Please try again.');
              }
            }}
            className="bg-white hover:bg-gray-50 text-gray-900 rounded-lg p-4 transition-all hover:shadow-xl flex flex-col items-start gap-3 group"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                <Hospital className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">Facilities Summary</h3>
                <p className="text-xs text-gray-600">Grouped by facility with metrics</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded w-full">
              Includes: Locations, visit counts, total values
            </div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <input
          type="date"
          value={startDate || ""}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={endDate || ""}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={sort || ""}
          onChange={(e) => setSort(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Sort by</option>
          <option value="date-asc">Date (Oldest)</option>
          <option value="date-desc">Date (Newest)</option>
        </select>
        <button
          onClick={() => router.push(`/visits`)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Clear Filters
        </button>
      </div>

      {/* User Summary */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">User Visit Summary</h2>
        <ul className="space-y-2">
          {summary.map((sum) => (
            <li
              key={sum.userId}
              className="p-2 border rounded cursor-pointer hover:bg-gray-100"
              onClick={() => handleUserSelect(sum.userId)}
            >
              {sum.user.firstName} {sum.user.lastName} - {sum.visitsCount} visits (Last: {new Date(sum.lastVisit).toLocaleDateString()})
            </li>
          ))}
        </ul>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#008cf7] to-[#0066cc]">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Visits Overview
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Sales Rep</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Client</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Purpose</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-700">Equipment</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700">Potential Value</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-700">Outcome</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visits.map((visit) => (
                <tr key={visit._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {new Date(visit.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {visit.userId.firstName} {visit.userId.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{visit.client.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {visit.client.location}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-700">{visit.visitPurpose || "N/A"}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                      <Package className="w-3 h-3" />
                      {visit.equipment?.length || 0}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-bold text-green-700">
                      {visit.totalPotentialValue > 0 
                        ? `KES ${visit.totalPotentialValue.toLocaleString()}` 
                        : '-'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      visit.visitOutcome?.toLowerCase() === 'successful' 
                        ? 'bg-green-100 text-green-800' 
                        : visit.visitOutcome?.toLowerCase() === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : visit.visitOutcome?.toLowerCase() === 'followup_required'
                        ? 'bg-blue-100 text-blue-800'
                        : visit.visitOutcome?.toLowerCase() === 'no_interest'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {visit.visitOutcome?.replace(/_/g, ' ') || "N/A"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => fetchVisitDetail(visit._id)}
                      className="bg-[#008cf7] hover:bg-[#0066cc] text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing page {page} • {visits.length} visits
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!visits.length || page === 3} // Adjust based on totalPages
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#008cf7] to-[#0066cc] text-white p-6 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">{selectedVisit.client.name}</h2>
                </div>
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedVisit.client.location}, {selectedVisit.client.county}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedVisit.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {selectedVisit.client.type || 'Client'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              
              {/* Visit Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Sales Representative</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {selectedVisit.userId.firstName} {selectedVisit.userId.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedVisit.userId.email}</p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-700">Visit Purpose</span>
                  </div>
                  <p className="font-medium text-gray-900">{selectedVisit.visitPurpose}</p>
                </div>

                <div className={`rounded-lg p-4 border ${
                  selectedVisit.visitOutcome?.toLowerCase() === 'successful' 
                    ? 'bg-green-50 border-green-200' 
                    : selectedVisit.visitOutcome?.toLowerCase() === 'pending'
                    ? 'bg-yellow-50 border-yellow-200'
                    : selectedVisit.visitOutcome?.toLowerCase() === 'followup_required'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className={`w-5 h-5 ${
                      selectedVisit.visitOutcome?.toLowerCase() === 'successful' 
                        ? 'text-green-600' 
                        : selectedVisit.visitOutcome?.toLowerCase() === 'pending'
                        ? 'text-yellow-600'
                        : selectedVisit.visitOutcome?.toLowerCase() === 'followup_required'
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`} />
                    <span className="text-sm font-semibold text-gray-700">Outcome</span>
                  </div>
                  <p className="font-medium text-gray-900 capitalize">
                    {selectedVisit.visitOutcome?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Total Potential Value */}
              {selectedVisit.totalPotentialValue > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500 p-3 rounded-full">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Total Potential Value</p>
                        <p className="text-3xl font-bold text-green-700">
                          KES {selectedVisit.totalPotentialValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-400" />
                  </div>
                </div>
              )}

              {/* Equipment Section */}
              {selectedVisit.equipment && selectedVisit.equipment.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-[#008cf7]" />
                    <h3 className="text-lg font-bold text-gray-900">Equipment Discussed</h3>
                    <span className="bg-[#008cf7] text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {selectedVisit.equipment.length} items
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Equipment Name</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Category</th>
                          <th className="text-center p-3 text-sm font-semibold text-gray-700">Quantity</th>
                          <th className="text-right p-3 text-sm font-semibold text-gray-700">Estimated Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedVisit.equipment.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-medium text-gray-900">{item.name}</td>
                            <td className="p-3 text-gray-600">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                {item.category}
                              </span>
                            </td>
                            <td className="p-3 text-center text-gray-900">{item.quantity}</td>
                            <td className="p-3 text-right font-semibold text-green-700">
                              KES {item.estimatedValue.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-green-50 border-t-2 border-green-200">
                        <tr>
                          <td colSpan={3} className="p-3 text-right font-bold text-gray-900">Total:</td>
                          <td className="p-3 text-right font-bold text-green-700 text-lg">
                            KES {selectedVisit.equipment.reduce((sum, item) => sum + (item.estimatedValue * item.quantity), 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Contacts Section */}
              {selectedVisit.contacts && selectedVisit.contacts.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-[#008cf7]" />
                    <h3 className="text-lg font-bold text-gray-900">Key Contacts</h3>
                    <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {selectedVisit.contacts.length} contacts
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedVisit.contacts.map((contact, index) => (
                      <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-gray-900 text-lg">{contact.name}</p>
                            <p className="text-sm text-gray-600">{contact.designation}</p>
                          </div>
                          <span className="bg-[#008cf7] text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {contact.role}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <a 
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#008cf7] transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            <span>{contact.phone}</span>
                          </a>
                          <a 
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#008cf7] transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{contact.email}</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discussion Notes Section */}
              {selectedVisit.discussionNotes && (
                <div className="border border-gray-200 rounded-lg p-5 bg-amber-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Discussion Notes</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedVisit.discussionNotes}
                  </p>
                </div>
              )}

              {/* Opportunities & Challenges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedVisit.opportunities && (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-bold text-gray-900">Opportunities</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedVisit.opportunities}
                    </p>
                  </div>
                )}

                {selectedVisit.challenges && (
                  <div className="border border-red-200 bg-red-50 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <h3 className="text-lg font-bold text-gray-900">Challenges</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedVisit.challenges}
                    </p>
                  </div>
                )}
              </div>

              {/* Follow-up Actions */}
              {selectedVisit.followUpActions && selectedVisit.followUpActions.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-[#008cf7]" />
                    <h3 className="text-lg font-bold text-gray-900">Follow-up Actions</h3>
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {selectedVisit.followUpActions.length} actions
                    </span>
                  </div>
                  <div className="space-y-3">
                    {selectedVisit.followUpActions.map((action, index) => (
                      <div 
                        key={index} 
                        className={`border-l-4 rounded-r-lg p-4 ${
                          action.priority?.toLowerCase() === 'high' 
                            ? 'border-red-500 bg-red-50' 
                            : action.priority?.toLowerCase() === 'medium'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-400 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-gray-900 flex-1">{action.action}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            action.priority?.toLowerCase() === 'high' 
                              ? 'bg-red-200 text-red-800' 
                              : action.priority?.toLowerCase() === 'medium'
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}>
                            {action.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due: {new Date(action.dueDate).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-1 rounded ${
                            action.status?.toLowerCase() === 'completed'
                              ? 'bg-green-200 text-green-800'
                              : action.status?.toLowerCase() === 'in_progress'
                              ? 'bg-blue-200 text-blue-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}>
                            {action.status?.replace(/_/g, ' ')}
                          </span>
                          {action.assignedTo && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {action.assignedTo.firstName} {action.assignedTo.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos Section */}
              {selectedVisit.photos && selectedVisit.photos.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-[#008cf7]" />
                    <h3 className="text-lg font-bold text-gray-900">Visit Photos</h3>
                    <span className="bg-indigo-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {selectedVisit.photos.length} photos
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedVisit.photos.map((photo, index) => (
                      <a
                        key={index}
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#008cf7] transition-all hover:shadow-lg"
                      >
                        <img
                          src={photo}
                          alt={`Visit photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
              <button
                className="px-6 py-2 bg-[#008cf7] text-white rounded-lg hover:bg-[#0066cc] transition-colors font-medium flex items-center gap-2"
                onClick={() => {
                  // Future: Export to PDF
                  alert('PDF export coming soon!');
                }}
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitsPage;