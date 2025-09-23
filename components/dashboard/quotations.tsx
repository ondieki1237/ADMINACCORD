"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface Quotation {
  _id: string;
  hospital: string;
  location: string;
  equipmentRequired: string;
  urgency: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  response?: {
    isAvailable: boolean;
    price: number;
    availableDate: string;
    notes: string;
    respondedAt: string;
  };
}

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
}

export default function QuotationList() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // response form state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [availableDate, setAvailableDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("No authentication token found.");
      setLoading(false);
      return;
    }

    fetch("https://accordbackend.onrender.com/api/quotation/all", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or failed to fetch quotations.");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          // sort so unresponded first
          const sorted = data.data.sort((a: Quotation, b: Quotation) =>
            a.response ? 1 : -1
          );
          setQuotations(sorted);
        } else {
          setError("Failed to fetch quotations.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error fetching quotations.");
        setLoading(false);
      });
  }, []);

  async function handleRespond(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;

    const token = getToken();
    if (!token) {
      setError("No authentication token found.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`https://accordbackend.onrender.com/api/quotation/respond/${selectedId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isAvailable,
          price,
          availableDate,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to send response.");
      const data = await res.json();

      if (data.success) {
        toast.success("Response submitted successfully ✅");

        setQuotations((prev) =>
          prev
            .map((q) => (q._id === selectedId ? { ...q, response: data.data.response } : q))
            .sort((a, b) => (a.response ? 1 : -1)) // resort so unresponded at top
        );

        setSelectedId(null);
        setIsAvailable(false);
        setPrice(0);
        setAvailableDate("");
        setNotes("");
      } else {
        setError("Failed to submit response.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-4">Loading quotations...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <Toaster />
      <h1 className="text-xl font-bold mb-4">All Quotations</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Facility</th>
            <th className="border p-2">Location</th>
            <th className="border p-2">Contact</th>
            <th className="border p-2">Item Needed</th>
            <th className="border p-2">Urgency</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {quotations.map((q) => (
            <tr
              key={q._id}
              className={q.response ? "bg-green-50 text-gray-600" : ""}
            >
              <td className="border p-2">{q.contactName}</td>
              <td className="border p-2">{q.hospital}</td>
              <td className="border p-2">{q.location}</td>
              <td className="border p-2">
                {q.contactPhone}
                <br />
                <span className="text-xs text-gray-500">{q.contactEmail}</span>
              </td>
              <td className="border p-2">{q.equipmentRequired}</td>
              <td className="border p-2">{q.urgency}</td>
              <td className="border p-2">
                {new Date(q.createdAt).toLocaleString()}
              </td>
              <td className="border p-2 text-center">
                {q.response ? (
                  <CheckCircle className="text-green-600 inline w-5 h-5" />
                ) : (
                  <span className="text-red-500">Pending</span>
                )}
              </td>
              <td className="border p-2">
                {!q.response && (
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => setSelectedId(q._id)}
                  >
                    Respond
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Response Form Modal */}
      {selectedId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Respond to Quotation</h2>
            <form onSubmit={handleRespond} className="space-y-3">
              <div>
                <label className="block text-sm">Is Available?</label>
                <select
                  value={isAvailable ? "yes" : "no"}
                  onChange={(e) => setIsAvailable(e.target.value === "yes")}
                  className="border p-2 w-full"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Price</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm">Available Date</label>
                <input
                  type="date"
                  value={availableDate}
                  onChange={(e) => setAvailableDate(e.target.value)}
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border p-2 w-full"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  {submitting ? "Submitting..." : "Submit Response"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
