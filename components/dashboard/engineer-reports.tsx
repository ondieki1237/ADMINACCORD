"use client"

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/api";
import { assignService } from "@/lib/api/engineeringService";

interface Service {
  _id: string;
  date: string;
  facility: { name: string; location: string };
  serviceType: string;
  engineerInCharge?: { name: string; phone?: string };
  machineDetails?: string;
  conditionBefore?: string;
  conditionAfter?: string;
  otherPersonnel?: any[];
  status?: string;
}

export default function EngineerReports() {
  const [services, setServices] = useState<Service[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<string>("");
  const [facilityName, setFacilityName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [engineerId, setEngineerId] = useState<string>("");

  const [totalDocs, setTotalDocs] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);

  // selection + assign controls (bulk)
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>("");
  const [assignScheduledDate, setAssignScheduledDate] = useState<string>("");
  const [assignNotes, setAssignNotes] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignFacilityName, setAssignFacilityName] = useState<string>("");
  const [assignFacilityLocation, setAssignFacilityLocation] = useState<string>("");
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [engineerSearch, setEngineerSearch] = useState<string>("");

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, any> = {};
      if (serviceType) filters.serviceType = serviceType;
      if (facilityName) filters.facilityName = facilityName;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      let res;
      if (engineerId) {
        res = await apiService.getEngineeringServicesByEngineer(engineerId, page, limit, filters);
      } else {
        res = await apiService.getEngineeringServices(page, limit, filters);
      }

      const paginated = res?.data ?? res;
      const docs = paginated?.docs ?? [];
      setServices(Array.isArray(docs) ? docs : []);

      setTotalDocs(typeof paginated.totalDocs === "number" ? paginated.totalDocs : null);
      setTotalPages(typeof paginated.totalPages === "number" ? paginated.totalPages : null);
      setHasNextPage(Boolean(paginated.hasNextPage));
      setHasPrevPage(Boolean(paginated.hasPrevPage));
    } catch (err: any) {
      console.error("fetchServices error:", err);
      setError(err?.message || "Failed to fetch services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // only fetch when page changes via pagination; use Search button for filter changes
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchServices();
  };

  const handleReset = () => {
    setFacilityName("");
    setServiceType("");
    setStartDate("");
    setEndDate("");
    setEngineerId("");
    setPage(1);
    fetchServices();
  };

  // Fetch users (engineers) for assign dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        // Use same endpoint pattern as user-manager
        const res = await fetch("http://localhost:5000/api/users", {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) return;
        const json = await res.json();
        // keep only users with role containing 'engineer' (case-insensitive)
        if (json?.success && Array.isArray(json.data)) {
          const engineers = json.data.filter((u: any) => (u.role || "").toLowerCase().includes("engineer"));
          setUsers(engineers);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchUsers();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAllOnPage = () => {
    const newSel: Record<string, boolean> = {};
    services.forEach((s) => (newSel[s._id] = true));
    setSelectedIds(newSel);
  };

  const clearSelection = () => setSelectedIds({});

  const assignSelected = async () => {
    const ids = Object.keys(selectedIds).filter((id) => selectedIds[id]);
    if (ids.length === 0) return setError("No services selected to assign.");
    if (!selectedEngineerId) return setError("Select an engineer to assign to.");

    setAssignLoading(true);
    setError(null);
    try {
      // find engineer details from users list
      const eng = users.find((u) => u._id === selectedEngineerId);
      const payloadBase = {
        engineerId: eng?._id || selectedEngineerId,
        engineerName: eng ? `${eng.firstName} ${eng.lastName}` : "",
        engineerPhone: eng?.phone || eng?.mobile || "",
        scheduledDate: assignScheduledDate ? new Date(assignScheduledDate).toISOString() : new Date().toISOString(),
        facility: {},
        activity: "maintenance",
        notes: assignNotes,
      };

      for (const id of ids) {
        const svc = services.find((s) => s._id === id);
  const facilityOverride = (assignFacilityName || assignFacilityLocation) ? { name: assignFacilityName || svc?.facility?.name, location: assignFacilityLocation || svc?.facility?.location } : undefined;
  const payload = { ...payloadBase, facility: facilityOverride ?? (svc?.facility ?? payloadBase.facility), activity: svc?.serviceType ?? payloadBase.activity };
        await assignService(id, payload);
      }

      // refresh list after assignments
      fetchServices();
      clearSelection();
    } catch (err: any) {
      console.error("assignSelected error:", err);
      setError(err?.message || "Failed to assign selected services");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Engineer Reports / Services</h1>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          className="border rounded p-2"
          placeholder="Facility name"
          value={facilityName}
          onChange={(e) => setFacilityName(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="Service type (maintenance)"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="Engineer ID (optional)"
          value={engineerId}
          onChange={(e) => setEngineerId(e.target.value)}
        />
      </div>

      <div className="mb-4 flex gap-2 items-center">
        <label className="text-sm">From:</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded" />
        <label className="text-sm">To:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded" />
        <Button onClick={handleSearch} className="ml-2">Search</Button>
        <Button variant="outline" onClick={handleReset}>Reset</Button>
      </div>

      {loading ? (
        <div>Loading services...</div>
      ) : error ? (
        <div className="text-red-600">Error: {error}</div>
      ) : (
        <div>
          <div className="mb-2 text-sm text-gray-600">{totalDocs !== null ? `${totalDocs} result(s)` : ""}</div>

          {/* Assign panel (outside table) */}
          <div className="mb-4 p-3 border rounded bg-gray-50 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAllOnPage}>Select all on page</Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm">Assign to:</label>
              <input placeholder="Search engineer" className="border p-2 rounded" value={engineerSearch} onChange={(e) => setEngineerSearch(e.target.value)} />
              <div className="flex items-center gap-2">
                <div className="border p-2 rounded">{selectedEngineerId ? (users.find(u => u._id === selectedEngineerId) ? `${users.find(u=>u._id===selectedEngineerId).firstName} ${users.find(u=>u._id===selectedEngineerId).lastName}` : selectedEngineerId) : 'No engineer selected'}</div>
                <Button size="sm" onClick={() => setShowUserPicker(true)}>Pick engineer</Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm">Scheduled:</label>
              <input type="datetime-local" className="border p-2 rounded" value={assignScheduledDate} onChange={(e) => setAssignScheduledDate(e.target.value)} />
            </div>

            <div className="flex-1 min-w-[220px]">
              <input placeholder="Notes" className="w-full border p-2 rounded" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2 w-full max-w-xs">
              <input placeholder="Facility name (override)" className="border p-2 rounded" value={(assignFacilityName as string) ?? ""} onChange={(e) => setAssignFacilityName(e.target.value)} />
              <input placeholder="Facility location (override)" className="border p-2 rounded" value={(assignFacilityLocation as string) ?? ""} onChange={(e) => setAssignFacilityLocation(e.target.value)} />
            </div>

            <div>
              <Button onClick={assignSelected} disabled={assignLoading || !Object.keys(selectedIds).some((id) => selectedIds[id]) || !selectedEngineerId}>{assignLoading ? 'Assigning...' : 'Assign Selected'}</Button>
            </div>
          </div>

          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Select</th>
                <th className="border p-2">Date (UTC)</th>
                <th className="border p-2">Service ID</th>
                <th className="border p-2">Requested By</th>
                <th className="border p-2">Facility</th>
                <th className="border p-2">Location</th>
                <th className="border p-2">Service Type</th>
                <th className="border p-2">Engineer</th>
                <th className="border p-2">Machine</th>
                <th className="border p-2">Condition Before</th>
                <th className="border p-2">Condition After</th>
                <th className="border p-2">Other Personnel</th>
                <th className="border p-2">Next Service Date</th>
                <th className="border p-2">Due / Synced At</th>
                <th className="border p-2">Created</th>
                <th className="border p-2">Updated</th>
                <th className="border p-2">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 && (
                <tr>
                  <td colSpan={18} className="p-4 text-center text-gray-500">No services found</td>
                </tr>
              )}
              {services.map((s) => (
                <tr key={s._id}>
                  <td className="border p-2 text-center"><input type="checkbox" checked={!!selectedIds[s._id]} onChange={() => toggleSelect(s._id)} /></td>
                  <td className="border p-2">{new Date(s.date).toISOString()}</td>
                  <td className="border p-2 break-all">{s._id}</td>
                  <td className="border p-2">{(s as any).userId ? `${(s as any).userId.firstName ?? ''} ${(s as any).userId.lastName ?? ''}` : ((s as any).userId ?? '-')}</td>
                  <td className="border p-2">{s.facility?.name}</td>
                  <td className="border p-2">{s.facility?.location}</td>
                  <td className="border p-2">{s.serviceType}</td>
                  <td className="border p-2">{s.engineerInCharge?.name ?? '-'}</td>
                  <td className="border p-2">{s.machineDetails || "-"}</td>
                  <td className="border p-2">{s.conditionBefore ?? '-'}</td>
                  <td className="border p-2">{s.conditionAfter ?? '-'}</td>
                  <td className="border p-2">{Array.isArray(s.otherPersonnel) ? s.otherPersonnel.join(', ') : s.otherPersonnel ?? '-'}</td>
                  <td className="border p-2">{(s as any).nextServiceDate ? new Date((s as any).nextServiceDate).toISOString() : '-'}</td>
                  <td className="border p-2">{(s as any).syncedAt ? new Date((s as any).syncedAt).toISOString() : '-'}</td>
                  <td className="border p-2">{(s as any).createdAt ? new Date((s as any).createdAt).toISOString() : '-'}</td>
                  <td className="border p-2">{(s as any).updatedAt ? new Date((s as any).updatedAt).toISOString() : '-'}</td>
                  <td className="border p-2"><pre className="text-xs max-h-24 overflow-auto">{JSON.stringify((s as any).metadata ?? {}, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between">
            <div />
            <div className="flex gap-2 items-center">
              <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!hasPrevPage || page === 1}>Prev</Button>
              <div className="px-3 py-2 border rounded">Page {page}{totalPages ? ` / ${totalPages}` : ""}</div>
              <Button onClick={() => setPage((p) => p + 1)} disabled={!hasNextPage}>Next</Button>
            </div>
          </div>
        </div>
      )}

        {/* User picker modal */}
        {showUserPicker && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Select Engineer</h3>
                <Button variant="ghost" onClick={() => setShowUserPicker(false)}>Close</Button>
              </div>

              <div className="mb-3">
                <input placeholder="Filter" className="w-full border p-2 rounded" value={engineerSearch} onChange={(e) => setEngineerSearch(e.target.value)} />
              </div>

              <div className="max-h-96 overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-100"><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Action</th></tr>
                  </thead>
                  <tbody>
                    {users.filter(u => {
                      if (!engineerSearch) return true;
                      const q = engineerSearch.toLowerCase();
                      return (`${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
                    }).map((u) => (
                      <tr key={u._id} className="border-b">
                        <td className="p-2">{u.firstName} {u.lastName}</td>
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">{u.role}</td>
                        <td className="p-2"><Button size="sm" onClick={() => { setSelectedEngineerId(u._id); setShowUserPicker(false); }}>{`Select`}</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      
    </div>
  );
}
