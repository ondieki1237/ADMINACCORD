"use client"

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/api";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Edit,
  Trash2,
  Eye,
  DollarSign
} from "lucide-react";

interface Service {
  _id: string;
  date: string;
  facility: { name: string; location: string };
  serviceType: string;
  engineerInCharge?: { _id?: string; name: string; phone?: string };
  machineDetails?: string;
  conditionBefore?: string;
  conditionAfter?: string;
  otherPersonnel?: any[];
  status?: string;
  userId?: { firstName: string; lastName: string };
  nextServiceDate?: string;
  notes?: string;
  syncedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: any;
}

interface Engineer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  role: string;
  employeeId?: string;
}

type DutyType = 'installation' | 'maintenance' | 'service' | 'other';

interface EngineerReportsProps {
  onPageChange?: (page: string) => void;
}

export default function EngineerReports({ onPageChange }: EngineerReportsProps = {}) {
  // Services data
  const [services, setServices] = useState<Service[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [serviceType, setServiceType] = useState<string>("");
  const [facilityName, setFacilityName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [engineerIdFilter, setEngineerIdFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Pagination
  const [totalDocs, setTotalDocs] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);

  // Engineers
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [engineerSearch, setEngineerSearch] = useState<string>("");

  // Selection for bulk operations
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Create Duty Modal
  const [showCreateDuty, setShowCreateDuty] = useState(false);
  const [dutyType, setDutyType] = useState<DutyType>('maintenance');
  const [dutyEngineer, setDutyEngineer] = useState<string>("");
  const [dutyFacilityName, setDutyFacilityName] = useState<string>("");
  const [dutyFacilityLocation, setDutyFacilityLocation] = useState<string>("");
  const [dutyScheduledDate, setDutyScheduledDate] = useState<string>("");
  const [dutyDescription, setDutyDescription] = useState<string>("");
  const [dutyMachineDetails, setDutyMachineDetails] = useState<string>("");
  const [creatingDuty, setCreatingDuty] = useState(false);

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignEngineer, setAssignEngineer] = useState<string>("");
  const [assignScheduledDate, setAssignScheduledDate] = useState<string>("");
  const [assignNotes, setAssignNotes] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Engineer Picker Modal
  const [showEngineerPicker, setShowEngineerPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'duty' | 'assign'>('duty');

  // View Details Modal
  const [showViewService, setShowViewService] = useState(false);
  const [selectedServiceForView, setSelectedServiceForView] = useState<Service | null>(null);

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, any> = {};
      if (serviceType) filters.serviceType = serviceType;
      if (facilityName) filters.facilityName = facilityName;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (statusFilter) filters.status = statusFilter;

      let res;
      if (engineerIdFilter) {
        res = await apiService.getEngineeringServicesByEngineer(engineerIdFilter, page, limit, filters);
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

  // Fetch all users (engineers)
  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const res = await fetch("https://app.codewithseth.co.ke/api/users", {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          // Filter only engineers
          const engineerUsers = json.data.filter((u: any) => u.role?.toLowerCase() === 'engineer');
          setEngineers(engineerUsers);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchEngineers();
  }, []);

  useEffect(() => {
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
    setEngineerIdFilter("");
    setStatusFilter("");
    setPage(1);
    fetchServices();
  };

  // Create new duty/service
  const handleCreateDuty = async () => {
    if (!dutyEngineer) {
      setError("Please select an engineer");
      return;
    }
    if (!dutyFacilityName) {
      setError("Please enter facility name");
      return;
    }

    setCreatingDuty(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      const engineer = engineers.find(e => e._id === dutyEngineer);

      const payload = {
        date: dutyScheduledDate || new Date().toISOString(),
        facility: {
          name: dutyFacilityName,
          location: dutyFacilityLocation || ""
        },
        serviceType: dutyType,
        engineerInCharge: {
          _id: engineer?._id,
          name: engineer ? `${engineer.firstName} ${engineer.lastName}` : "",
          phone: engineer?.phone || engineer?.mobile || ""
        },
        machineDetails: dutyMachineDetails,
        conditionBefore: "",
        conditionAfter: "",
        status: "pending",
        notes: dutyDescription,
        scheduledDate: dutyScheduledDate || new Date().toISOString()
      };

      const res = await fetch("https://app.codewithseth.co.ke/api/engineering-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to create duty: ${res.statusText}`);
      }

      // Reset form and close modal
      setShowCreateDuty(false);
      setDutyType('maintenance');
      setDutyEngineer("");
      setDutyFacilityName("");
      setDutyFacilityLocation("");
      setDutyScheduledDate("");
      setDutyDescription("");
      setDutyMachineDetails("");

      // Refresh services list
      fetchServices();
    } catch (err: any) {
      console.error("createDuty error:", err);
      setError(err?.message || "Failed to create duty");
    } finally {
      setCreatingDuty(false);
    }
  };

  // Bulk assign selected services
  const handleBulkAssign = async () => {
    const ids = Object.keys(selectedIds).filter((id) => selectedIds[id]);
    if (ids.length === 0) {
      setError("No services selected");
      return;
    }
    if (!assignEngineer) {
      setError("Please select an engineer");
      return;
    }

    setAssignLoading(true);
    setError(null);

    try {
      const engineer = engineers.find(e => e._id === assignEngineer);
      const token = localStorage.getItem("accessToken");

      for (const id of ids) {
        const payload = {
          engineerInCharge: {
            _id: engineer?._id,
            name: engineer ? `${engineer.firstName} ${engineer.lastName}` : "",
            phone: engineer?.phone || engineer?.mobile || ""
          },
          scheduledDate: assignScheduledDate || new Date().toISOString(),
          notes: assignNotes,
          status: "assigned"
        };

        await fetch(`https://app.codewithseth.co.ke/api/engineering-services/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });
      }

      // Reset and close modal
      setShowAssignModal(false);
      setAssignEngineer("");
      setAssignScheduledDate("");
      setAssignNotes("");
      setSelectedIds({});

      // Refresh services
      fetchServices();
    } catch (err: any) {
      console.error("bulkAssign error:", err);
      setError(err?.message || "Failed to assign services");
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAllOnPage = () => {
    const newSel: Record<string, boolean> = {};
    services.forEach((s) => (newSel[s._id] = true));
    setSelectedIds(newSel);
  };

  const clearSelection = () => setSelectedIds({});

  const getSelectedEngineer = (mode: 'duty' | 'assign') => {
    const id = mode === 'duty' ? dutyEngineer : assignEngineer;
    const eng = engineers.find(e => e._id === id);
    return eng ? `${eng.firstName} ${eng.lastName}` : 'No engineer selected';
  };

  const filteredEngineers = engineers.filter(e => {
    if (!engineerSearch) return true;
    const search = engineerSearch.toLowerCase();
    return (
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search) ||
      (e.email || "").toLowerCase().includes(search) ||
      (e.employeeId || "").toLowerCase().includes(search)
    );
  });

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const getDutyTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'installation': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'service': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'assigned': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-[#008cf7] to-[#006bb8] p-3 rounded-xl shadow-lg">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Engineer Duties & Services</h1>
              <p className="text-gray-500">Manage engineer assignments and service requests</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                if (onPageChange) {
                  onPageChange('engineer-finance');
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-2 shadow-md"
            >
              <DollarSign className="h-5 w-5" />
              <span>Finance</span>
            </Button>
            <Button
              onClick={() => setShowCreateDuty(true)}
              className="bg-[#008cf7] hover:bg-[#006bb8] text-white flex items-center space-x-2 shadow-md"
            >
              <Plus className="h-5 w-5" />
              <span>Create Duty</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Services</p>
              <p className="text-3xl font-bold text-[#008cf7]">{totalDocs || services.length}</p>
            </div>
            <FileText className="h-10 w-10 text-[#008cf7]" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg border-2 border-yellow-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">
                {services.filter(s => s.status?.toLowerCase() === 'pending').length}
              </p>
            </div>
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">
                {services.filter(s => s.status?.toLowerCase() === 'completed').length}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Engineers</p>
              <p className="text-3xl font-bold text-blue-600">{engineers.length}</p>
            </div>
            <User className="h-10 w-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="h-5 w-5 text-[#008cf7]" />
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Facility Name</label>
            <input
              type="text"
              placeholder="Search facility..."
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
            >
              <option value="">All Types</option>
              <option value="installation">Installation</option>
              <option value="maintenance">Maintenance</option>
              <option value="service">Service</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
            />
          </div>

          <div className="flex items-end space-x-2">
            <Button
              onClick={handleSearch}
              className="flex-1 bg-[#008cf7] hover:bg-[#006bb8] text-white flex items-center justify-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 hover:bg-[#008cf7]/10 hover:border-[#008cf7] hover:text-[#008cf7]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="bg-[#008cf7]/10 border-2 border-[#008cf7]/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedCount} service{selectedCount > 1 ? 's' : ''} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={selectAllOnPage}
                className="text-xs"
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
            <Button
              onClick={() => setShowAssignModal(true)}
              className="bg-[#008cf7] hover:bg-[#006bb8] text-white"
            >
              Assign Selected
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 animate-spin text-[#008cf7] mx-auto mb-4" />
          <p className="text-gray-600">Loading services...</p>
        </div>
      )}

      {/* Services Table */}
      {!loading && services.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-12 text-center">
          <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Services Found</h3>
          <p className="text-gray-500">No engineer duties or services match your criteria</p>
        </div>
      ) : !loading && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#008cf7] to-[#006bb8] text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-bold">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) selectAllOnPage();
                        else clearSelection();
                      }}
                      checked={services.length > 0 && services.every(s => selectedIds[s._id])}
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-bold">Date</th>
                  <th className="px-4 py-4 text-left text-sm font-bold">Facility</th>
                  <th className="px-4 py-4 text-left text-sm font-bold">Location</th>
                  <th className="px-4 py-4 text-left text-sm font-bold">Service Type</th>
                  <th className="px-4 py-4 text-left text-sm font-bold">Engineer</th>
                  <th className="px-4 py-4 text-left text-sm font-bold">Status</th>
                  <th className="px-4 py-4 text-left text-sm font-bold">Machine</th>
                  <th className="px-4 py-4 text-center text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => (
                  <tr key={service._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[service._id]}
                        onChange={() => toggleSelect(service._id)}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(service.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {service.facility?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {service.facility?.location || 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDutyTypeColor(service.serviceType)}`}>
                        {service.serviceType}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {service.engineerInCharge?.name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                        {service.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {service.machineDetails || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-[#008cf7]/10 hover:border-[#008cf7]"
                          title="View Details"
                          onClick={() => {
                            setSelectedServiceForView(service);
                            setShowViewService(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-[#008cf7]/10 hover:border-[#008cf7]"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {services.length} of {totalDocs || services.length} services
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!hasPrevPage || page === 1}
                  variant="outline"
                  size="sm"
                  className="hover:bg-[#008cf7]/10 hover:border-[#008cf7]"
                >
                  Previous
                </Button>
                <div className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium">
                  Page {page}{totalPages ? ` / ${totalPages}` : ''}
                </div>
                <Button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasNextPage}
                  variant="outline"
                  size="sm"
                  className="hover:bg-[#008cf7]/10 hover:border-[#008cf7]"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Duty Modal */}
      {showCreateDuty && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#008cf7] to-[#006bb8] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Plus className="h-6 w-6" />
                  <h3 className="text-xl font-bold">Create New Duty</h3>
                </div>
                <button
                  onClick={() => setShowCreateDuty(false)}
                  className="hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Duty Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duty Type *
                </label>
                <select
                  value={dutyType}
                  onChange={(e) => setDutyType(e.target.value as DutyType)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
                >
                  <option value="installation">Installation</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="service">Service</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Engineer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Engineer *
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50">
                    {getSelectedEngineer('duty')}
                  </div>
                  <Button
                    onClick={() => {
                      setPickerMode('duty');
                      setShowEngineerPicker(true);
                    }}
                    className="bg-[#008cf7] hover:bg-[#006bb8]"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Select
                  </Button>
                </div>
              </div>

              {/* Facility Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    value={dutyFacilityName}
                    onChange={(e) => setDutyFacilityName(e.target.value)}
                    placeholder="Enter facility name"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facility Location
                  </label>
                  <input
                    type="text"
                    value={dutyFacilityLocation}
                    onChange={(e) => setDutyFacilityLocation(e.target.value)}
                    placeholder="Enter location"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
                  />
                </div>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={dutyScheduledDate}
                  onChange={(e) => setDutyScheduledDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
                />
              </div>

              {/* Machine Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Machine Details
                </label>
                <input
                  type="text"
                  value={dutyMachineDetails}
                  onChange={(e) => setDutyMachineDetails(e.target.value)}
                  placeholder="Machine model, serial number, etc."
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description / Notes
                </label>
                <textarea
                  value={dutyDescription}
                  onChange={(e) => setDutyDescription(e.target.value)}
                  placeholder="Additional details about the duty..."
                  rows={4}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleCreateDuty}
                  disabled={creatingDuty}
                  className="flex-1 bg-[#008cf7] hover:bg-[#006bb8] text-white py-3"
                >
                  {creatingDuty ? 'Creating...' : 'Create Duty'}
                </Button>
                <Button
                  onClick={() => setShowCreateDuty(false)}
                  variant="outline"
                  className="flex-1 py-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-[#008cf7] to-[#006bb8] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Assign Services to Engineer</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-white/80 mt-2">
                Assigning {selectedCount} service{selectedCount > 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Engineer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Engineer *
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50">
                    {getSelectedEngineer('assign')}
                  </div>
                  <Button
                    onClick={() => {
                      setPickerMode('assign');
                      setShowEngineerPicker(true);
                    }}
                    className="bg-[#008cf7] hover:bg-[#006bb8]"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Select
                  </Button>
                </div>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={assignScheduledDate}
                  onChange={(e) => setAssignScheduledDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Notes
                </label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Add notes for the engineer..."
                  rows={3}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleBulkAssign}
                  disabled={assignLoading}
                  className="flex-1 bg-[#008cf7] hover:bg-[#006bb8] text-white py-3"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Services'}
                </Button>
                <Button
                  onClick={() => setShowAssignModal(false)}
                  variant="outline"
                  className="flex-1 py-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engineer Picker Modal */}
      {showEngineerPicker && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#008cf7] to-[#006bb8] text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Select Engineer</h3>
                <button
                  onClick={() => setShowEngineerPicker(false)}
                  className="hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Search engineers..."
                value={engineerSearch}
                onChange={(e) => setEngineerSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-3">
                {filteredEngineers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No engineers found
                  </div>
                ) : (
                  filteredEngineers.map((engineer) => (
                    <button
                      key={engineer._id}
                      onClick={() => {
                        if (pickerMode === 'duty') {
                          setDutyEngineer(engineer._id);
                        } else {
                          setAssignEngineer(engineer._id);
                        }
                        setShowEngineerPicker(false);
                      }}
                      className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-[#008cf7] hover:bg-[#008cf7]/5 transition-all text-left"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">
                          {engineer.firstName} {engineer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{engineer.email}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {engineer.role} {engineer.employeeId && `• ${engineer.employeeId}`}
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-[#008cf7]" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* View Service Details Modal */}
      {showViewService && selectedServiceForView && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#008cf7] to-[#006bb8] text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Service Details</h3>
                    <p className="text-white/80 text-sm">
                      Ref: {selectedServiceForView._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewService(false)}
                  className="hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div>
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border-2 ${getStatusColor(selectedServiceForView.status)}`}>
                    {selectedServiceForView.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {new Date(selectedServiceForView.date).toLocaleDateString(undefined, { dateStyle: 'full' })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Facility & Machine */}
                <div className="space-y-6">
                  <section>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Facility Information
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="font-bold text-gray-900 text-lg">{selectedServiceForView.facility?.name}</p>
                      <p className="text-gray-600 mt-1">{selectedServiceForView.facility?.location}</p>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Machine Details
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 italic">
                      {selectedServiceForView.machineDetails || "No machine details provided."}
                    </div>
                  </section>
                </div>

                {/* Assignment & Info */}
                <div className="space-y-6">
                  <section>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personnel
                    </h4>
                    <div className="bg-[#008cf7]/5 rounded-xl p-4 border border-[#008cf7]/10">
                      <p className="text-xs text-[#008cf7] font-bold mb-1">Engineer in Charge</p>
                      <p className="font-bold text-gray-900 text-lg">
                        {selectedServiceForView.engineerInCharge?.name || "Unassigned"}
                      </p>
                      {selectedServiceForView.engineerInCharge?.phone && (
                        <p className="text-sm text-gray-600 mt-1">{selectedServiceForView.engineerInCharge.phone}</p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Service Type
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${getDutyTypeColor(selectedServiceForView.serviceType)}`}>
                        {selectedServiceForView.serviceType}
                      </span>
                      {selectedServiceForView.nextServiceDate && (
                        <p className="text-xs text-gray-500 mt-3 font-medium">
                          Next Service: {new Date(selectedServiceForView.nextServiceDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              {/* Notes Section */}
              <section>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes & Findings
                </h4>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 min-h-[120px] whitespace-pre-wrap text-gray-700 leading-relaxed font-medium">
                  {selectedServiceForView.notes || "No additional notes for this service."}
                </div>
              </section>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <Button
                onClick={() => setShowViewService(false)}
                className="bg-gray-900 hover:bg-black text-white px-8 h-12 rounded-xl font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
