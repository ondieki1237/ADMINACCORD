"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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

      const res = await fetch("http://localhost:5000/api/reports", {
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
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}/status`, {
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
        `http://localhost:5000/api/reports/${report._id}/download?raw=true`,
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

  if (loading) return <div className="p-4">Loading reports...</div>;
  if (error)
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <div className="flex gap-2">
          <Button onClick={fetchReports}>Retry</Button>
        </div>
      </div>
    );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">All Reports</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">User</th>
            <th className="border p-2">Week</th>
            <th className="border p-2">Report</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Admin Notes</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            // View URL: prefer direct cloud URL if provided
            const viewUrl = report.fileUrl ?? (report.filePath ? `http://localhost:5000${report.filePath}` : null);

            return (
              <tr key={report._id}>
                <td className="border p-2">
                  {report.userId.firstName} {report.userId.lastName} ({report.userId.email})
                </td>
                <td className="border p-2">
                  {new Date(report.weekStart).toLocaleDateString()} -{" "}
                  {new Date(report.weekEnd).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  {viewUrl ? (
                    <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      View PDF
                    </a>
                  ) : (
                    <span className="text-gray-500">No file</span>
                  )}
                </td>
                <td className="border p-2">{report.status}</td>
                <td className="border p-2">{report.adminNotes || "None"}</td>
                <td className="border p-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(report)}
                        disabled={downloadingId === report._id}
                      >
                        {downloadingId === report._id ? "Downloading..." : "Download"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(viewUrl ?? `http://localhost:5000/api/reports/${report._id}/download`, "_blank")}
                      >
                        Open
                      </Button>
                    </div>

                    {report.status === "pending" && (
                      <>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as "approved" | "rejected")}
                          className="border rounded p-1"
                        >
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Admin notes"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="border rounded p-1"
                        />
                        <Button size="sm" onClick={() => handleUpdateStatus(report._id)} disabled={updatingId === report._id}>
                          {updatingId === report._id ? "Updating..." : "Update Status"}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}