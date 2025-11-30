"use client"

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DollarSign,
    Plus,
    Search,
    Filter,
    Calendar,
    User,
    MapPin,
    FileText,
    RefreshCw,
    Edit,
    Trash2,
    ArrowLeft,
    XCircle,
    Briefcase
} from "lucide-react";

interface PricingRecord {
    _id: string;
    engineerId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    activityType: 'installation' | 'maintenance' | 'service' | 'previsit';
    fare: number;
    location?: string;
    facility?: string;
    machine?: string;
    otherCharges?: Array<{
        description: string;
        amount: number;
    }>;
    createdAt: string;
    createdBy?: {
        firstName: string;
        lastName: string;
    };
}

interface Engineer {
    _id: string;
    firstName: string;
    lastName: string;
    lastName: string;
    email: string;
    role?: string;
}

interface EngineerFinanceProps {
    onPageChange?: (page: string) => void;
}

export default function EngineerFinance({ onPageChange }: EngineerFinanceProps = {}) {
    const [records, setRecords] = useState<PricingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [engineerId, setEngineerId] = useState<string>("");
    const [activityType, setActivityType] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Engineers list for filter/create
    const [engineers, setEngineers] = useState<Engineer[]>([]);

    // Create Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        engineerId: "",
        activityType: "maintenance",
        fare: 0,
        location: "",
        facility: "",
        machine: "",
        otherCharges: [] as { description: string; amount: number }[]
    });

    // Fetch Engineers
    useEffect(() => {
        const fetchEngineers = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                const res = await fetch("https://app.codewithseth.co.ke/api/users", {
                    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data)) {
                        // Filter only engineers
                        const engineerUsers = json.data.filter((u: any) => u.role === 'engineer');
                        setEngineers(engineerUsers);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch engineers:", err);
            }
        };
        fetchEngineers();
    }, []);

    // Fetch Records
    const fetchRecords = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("accessToken");
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (engineerId) params.append("engineerId", engineerId);
            if (activityType) params.append("activityType", activityType);
            if (startDate) params.append("fromDate", startDate);
            if (endDate) params.append("toDate", endDate);

            const res = await fetch(`https://app.codewithseth.co.ke/api/engineering-pricing?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                },
            });

            if (!res.ok) throw new Error("Failed to fetch records");

            const json = await res.json();
            if (json.status === "success") {
                setRecords(json.data);
                setTotalDocs(json.meta?.totalDocs || 0);
                setTotalPages(Math.ceil((json.meta?.totalDocs || 0) / limit));
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [page, engineerId, activityType, startDate, endDate]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch("https://app.codewithseth.co.ke/api/engineering-pricing", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token || ""}`,
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to create record");

            const json = await res.json();
            if (json.status === "success") {
                setShowCreateModal(false);
                setFormData({
                    engineerId: "",
                    activityType: "maintenance",
                    fare: 0,
                    location: "",
                    facility: "",
                    machine: "",
                    otherCharges: []
                });
                fetchRecords();
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'installation': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'service': return 'bg-green-100 text-green-700 border-green-300';
            case 'previsit': return 'bg-purple-100 text-purple-700 border-purple-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onPageChange?.('engineer-reports')}
                            className="bg-white hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg">
                            <DollarSign className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Engineer Finance</h1>
                            <p className="text-gray-500">Manage engineering pricing and expenses</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-2 shadow-md"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add Record</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Engineer</label>
                        <select
                            value={engineerId}
                            onChange={(e) => setEngineerId(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="">All Engineers</option>
                            {engineers.map(eng => (
                                <option key={eng._id} value={eng._id}>
                                    {eng.firstName} {eng.lastName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                        <select
                            value={activityType}
                            onChange={(e) => setActivityType(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            <option value="">All Types</option>
                            <option value="installation">Installation</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="service">Service</option>
                            <option value="previsit">Pre-visit</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={() => {
                                setEngineerId("");
                                setActivityType("");
                                setStartDate("");
                                setEndDate("");
                                setPage(1);
                            }}
                            variant="outline"
                            className="w-full"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset Filters
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
                        <p className="text-gray-600">Loading records...</p>
                    </div>
                ) : records.length === 0 ? (
                    <div className="p-12 text-center">
                        <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Records Found</h3>
                        <p className="text-gray-500">Try adjusting your filters or add a new record</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold">Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold">Engineer</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold">Activity</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold">Details</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold">Fare</th>
                                    <th className="px-6 py-4 text-right text-sm font-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record) => {
                                    const otherTotal = record.otherCharges?.reduce((sum, c) => sum + c.amount, 0) || 0;
                                    const total = record.fare + otherTotal;

                                    return (
                                        <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(record.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">
                                                    {record.engineerId?.firstName} {record.engineerId?.lastName}
                                                </div>
                                                <div className="text-xs text-gray-500">{record.engineerId?.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getActivityColor(record.activityType)}`}>
                                                    {record.activityType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {record.facility && <div className="font-medium">{record.facility}</div>}
                                                {record.location && <div className="text-xs text-gray-500">{record.location}</div>}
                                                {record.machine && <div className="text-xs text-gray-500 mt-1">Machine: {record.machine}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                                KES {record.fare.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">
                                                KES {total.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                            <h3 className="text-xl font-bold">Add Pricing Record</h3>
                            <button onClick={() => setShowCreateModal(false)} className="hover:bg-white/20 p-2 rounded-full">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Engineer *</label>
                                    <select
                                        required
                                        value={formData.engineerId}
                                        onChange={(e) => setFormData({ ...formData, engineerId: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    >
                                        <option value="">Select Engineer</option>
                                        {engineers.map(eng => (
                                            <option key={eng._id} value={eng._id}>{eng.firstName} {eng.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type *</label>
                                    <select
                                        required
                                        value={formData.activityType}
                                        onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    >
                                        <option value="maintenance">Maintenance</option>
                                        <option value="installation">Installation</option>
                                        <option value="service">Service</option>
                                        <option value="previsit">Pre-visit</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fare Amount (KES) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.fare}
                                        onChange={(e) => setFormData({ ...formData, fare: Number(e.target.value) })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                        placeholder="e.g. Nairobi CBD"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name</label>
                                    <input
                                        type="text"
                                        value={formData.facility}
                                        onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Machine Details</label>
                                    <input
                                        type="text"
                                        value={formData.machine}
                                        onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={creating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {creating ? "Saving..." : "Save Record"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
