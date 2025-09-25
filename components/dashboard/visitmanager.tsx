"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
  notes?: string;
}

interface Client {
  name: string;
  location: string;
  type?: string;
}

interface Visit {
  _id: string;
  userId: User;
  date: string;
  startTime?: string;
  endTime?: string;
  client: Client;
  contacts: Contact[];
  visitPurpose?: string;
  visitOutcome?: string;
  requestedEquipment?: string[];
  existingEquipment?: string[];
  notes?: string;
  attachments?: string[];
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

      const res = await fetch(`https://accordbackend.onrender.com/api/admin/visits/user/${userId}?${params}`, {
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

      const res = await fetch(`https://accordbackend.onrender.com/api/admin/visits/summary?${params}`, {
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

      const res = await fetch(`https://accordbackend.onrender.com/api/admin/visits/${id}`, {
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
      <div>
        <h2 className="text-xl font-semibold mb-2">Visits</h2>
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Date</th>
              <th className="border p-2">User</th>
              <th className="border p-2">Client</th>
              <th className="border p-2">Outcome</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit._id} className="hover:bg-gray-50">
                <td className="border p-2">{new Date(visit.date).toLocaleDateString()}</td>
                <td className="border p-2">{visit.userId.firstName} {visit.userId.lastName}</td>
                <td className="border p-2">{visit.client.name}</td>
                <td className="border p-2">{visit.visitOutcome || "N/A"}</td>
                <td className="border p-2">
                  <button
                    onClick={() => fetchVisitDetail(visit._id)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!visits.length || page === 3} // Adjust based on totalPages
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-2">Visit Details</h2>
            <p><strong>Date:</strong> {new Date(selectedVisit.date).toLocaleDateString()}</p>
            <p><strong>User:</strong> {selectedVisit.userId.firstName} {selectedVisit.userId.lastName}</p>
            <p><strong>Client:</strong> {selectedVisit.client.name} ({selectedVisit.client.location})</p>
            <p><strong>Outcome:</strong> {selectedVisit.visitOutcome}</p>
            <p><strong>Notes:</strong> {selectedVisit.notes}</p>
            <button
              onClick={() => setSelectedVisit(null)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitsPage;