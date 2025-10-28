"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Eye, 
  Check, 
  X, 
  Clock, 
  RefreshCw,
  Filter,
  Search
} from "lucide-react";
import { generateReportsSummaryPDF, generateIndividualReportPDF } from "@/lib/reportsPdfGenerator";
import type { Report as ReportPdfType } from "@/lib/reportsPdfGenerator";

interface Report {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  report?: string;
  filePath?: string;
  fileName?: string;
  fileUrl?: string;
  filePublicId?: string;
  weekStart: string;
  weekEnd: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string | null;
  createdAt: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<"approved" | "rejected">("approved");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No auth token found in localStorage (accessToken).");
        setLoading(false);
        return;
      }

      const res = await fetch("https://app.codewithseth.co.ke/api/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.text();
        setError(`Server returned ${res.status}: ${body || res.statusText}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReports(data.data);
      } else {
        setError("Unexpected response shape from /api/reports.");
      }
    } catch (err: any) {
      setError(err?.message || "Network error fetching reports.");
      console.error("fetchReports error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("No auth token");
      return;
    }

    setUpdatingId(reportId);
    try {
      const res = await fetch(`https://app.codewithseth.co.ke/api/reports/${reportId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        alert(`Failed to update status: ${res.status} ${txt}`);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setReports((prev) =>
          prev.map((r) =>
            r._id === reportId ? { ...r, status: newStatus, adminNotes } : r
          )
        );
        setAdminNotes("");
      } else {
        alert("Failed to update status: unexpected response.");
      }
    } catch (err) {
      console.error("update status error:", err);
      alert("Error updating status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Download using server-provided URL (avoids CORS / upstream errors)
  const handleDownload = async (report: Report) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("No auth token");
      return;
    }

    setDownloadingId(report._id);
    try {
      // ask server to return the final download URL (server will validate token)
      const res = await fetch(
        `https://app.codewithseth.co.ke/api/reports/${report._id}/download?raw=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to get download URL: ${res.status} ${txt}`);
      }

      const data = await res.json();
      const url: string | undefined = data?.url;
      if (!url) throw new Error("No download URL returned from server.");

      // open the cloudinary (or file) URL in a new tab so browser handles the redirect/download
      window.open(url, "_blank", "noopener");

      // optional: force download in background (uncomment if desired and server returns a CORS-enabled URL)
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = report.fileName ?? `report-${report._id}.pdf`;
      // document.body.appendChild(a);
      // a.click();
      // a.remove();
    } catch (err: any) {
      console.error("download error:", err);
      alert(err?.message || "Failed to download report. Ensure your JWT is present and you have permissions.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleGenerateSummaryPDF = async () => {
    try {
      setGeneratingPdf(true);
      const adminName = 'Admin'; // Get from auth context
      await generateReportsSummaryPDF(filteredReports, adminName, statusFilter);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleGenerateIndividualPDF = async (report: Report) => {
    try {
      setGeneratingPdf(true);
      const adminName = 'Admin'; // Get from auth context
      await generateIndividualReportPDF(report as ReportPdfType, adminName);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate individual PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      report.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.userId.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const approvedCount = reports.filter(r => r.status === 'approved').length;
  const rejectedCount = reports.filter(r => r.status === 'rejected').length;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-12 w-12 animate-spin text-[#008cf7] mx-auto mb-4" />
        <p className="text-gray-600">Loading reports...</p>
      </div>
    </div>
  );
  
  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-2xl mx-auto">
          <div className="text-red-600 font-semibold mb-4">Error: {error}</div>
          <Button onClick={fetchReports} className="bg-[#008cf7] hover:bg-[#006bb8]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="bg-gradient-to-br from-[#008cf7] to-[#006bb8] p-3 rounded-xl shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weekly Reports</h1>
            <p className="text-gray-500">Manage and review staff activity reports</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Reports</p>
              <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
            </div>
            <FileText className="h-10 w-10 text-[#008cf7]" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg border-2 border-yellow-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <Check className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-lg border-2 border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
            </div>
            <X className="h-10 w-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="flex items-center space-x-3 flex-1 min-w-[200px]">
            <Search className="h-5 w-5 text-gray-600" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm font-medium bg-white hover:border-gray-300 focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleGenerateSummaryPDF}
              disabled={generatingPdf || filteredReports.length === 0}
              className="bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center space-x-2 shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Summary PDF</span>
            </Button>
            <Button
              onClick={fetchReports}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2 hover:bg-[#008cf7]/10 hover:border-[#008cf7] transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reports Found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'No reports have been submitted yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#008cf7] to-[#006bb8] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold">#</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Staff Member</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Week Period</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Submitted</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Admin Notes</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, index) => {
                  const statusBadge = 
                    report.status === 'approved' ? 'bg-green-100 text-green-700 border-green-300' :
                    report.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-300' :
                    'bg-yellow-100 text-yellow-700 border-yellow-300';
                  
                  const viewUrl = report.fileUrl ?? (report.filePath ? `https://accordbackend.onrender.com${report.filePath}` : null);

                  return (
                    <tr key={report._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {report.userId.firstName} {report.userId.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{report.userId.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(report.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{" "}
                        {new Date(report.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${statusBadge}`}>
                          {report.status === 'approved' && <Check className="h-3 w-3 mr-1" />}
                          {report.status === 'rejected' && <X className="h-3 w-3 mr-1" />}
                          {report.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {report.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {report.adminNotes ? (
                          <p className="max-w-xs truncate" title={report.adminNotes}>{report.adminNotes}</p>
                        ) : (
                          <span className="text-gray-400 italic">No notes</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleGenerateIndividualPDF(report)}
                            disabled={generatingPdf}
                            className="bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                            title="Download Report PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {viewUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(viewUrl, "_blank")}
                              title="View Original File"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {report.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const modal = document.getElementById(`modal-${report._id}`);
                                if (modal) modal.classList.remove('hidden');
                              }}
                              className="bg-[#008cf7]/10 text-[#008cf7] hover:bg-[#008cf7]/20 border-[#008cf7]/30"
                            >
                              Review
                            </Button>
                          )}
                        </div>

                        {/* Review Modal */}
                        {report.status === 'pending' && (
                          <div id={`modal-${report._id}`} className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                              <h3 className="text-lg font-bold text-gray-900 mb-4">Review Report</h3>
                              <p className="text-sm text-gray-600 mb-4">
                                Update status for <strong>{report.userId.firstName} {report.userId.lastName}</strong>
                              </p>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                  </label>
                                  <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as "approved" | "rejected")}
                                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20"
                                  >
                                    <option value="approved">✓ Approved</option>
                                    <option value="rejected">✗ Rejected</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Admin Notes
                                  </label>
                                  <textarea
                                    placeholder="Add notes about this report..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20"
                                    rows={3}
                                  />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                  <Button
                                    onClick={() => {
                                      handleUpdateStatus(report._id);
                                      const modal = document.getElementById(`modal-${report._id}`);
                                      if (modal) modal.classList.add('hidden');
                                    }}
                                    disabled={updatingId === report._id}
                                    className="flex-1 bg-[#008cf7] hover:bg-[#006bb8]"
                                  >
                                    {updatingId === report._id ? 'Updating...' : 'Update Status'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      const modal = document.getElementById(`modal-${report._id}`);
                                      if (modal) modal.classList.add('hidden');
                                    }}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}