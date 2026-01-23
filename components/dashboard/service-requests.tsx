"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
    Wrench,
    Search,
    Filter,
    Calendar,
    User,
    MapPin,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Trash2,
    Eye,
    UserPlus,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    AlertCircle,
    Info
} from "lucide-react"

interface EngineeringRequest {
    _id: string
    id?: string
    requestType: "service" | "repair" | "site_survey" | "training"
    facility: {
        name: string
        location: string
    }
    contact: {
        name: string
        role: string
        phone: string
        email?: string
    }
    machine: {
        name: string
        model: string
        serialNumber: string
    }
    expectedDate: string
    notes?: string
    status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled"
    assignedEngineer?: {
        _id: string
        firstName: string
        lastName: string
        email?: string
    }
    createdAt: string
    updatedAt: string
}

interface User {
    _id: string
    firstName: string
    lastName: string
    email: string
    role: string
}

export default function ServiceRequests() {
    const [page, setPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [selectedRequest, setSelectedRequest] = useState<EngineeringRequest | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isAssignOpen, setIsAssignOpen] = useState(false)
    const [assigneeId, setAssigneeId] = useState("")

    const { toast } = useToast()
    const qc = useQueryClient()
    const currentUser = authService.getCurrentUserSync()
    const isAdmin = hasAdminAccess(currentUser)

    // Fetch Service Requests
    const { data: requestsData, isLoading, error, refetch } = useQuery({
        queryKey: ["engineering-requests", page, searchQuery, typeFilter, statusFilter],
        queryFn: async () => {
            const filters: Record<string, any> = {}
            if (searchQuery) filters.search = searchQuery
            if (typeFilter) filters.requestType = typeFilter
            if (statusFilter) filters.status = statusFilter

            return await apiService.getEngineeringRequests(page, 20, filters)
        },
        staleTime: 30000,
    })

    // Fetch Engineers for assignment
    const { data: engineersData } = useQuery({
        queryKey: ["engineers"],
        queryFn: async () => {
            const res = await apiService.getEngineers()
            return res?.data || []
        },
        enabled: isAdmin,
    })

    // Mutations
    const assignMutation = useMutation({
        mutationFn: async ({ requestId, engineerId }: { requestId: string; engineerId: string }) => {
            // 1. Assign the engineer to the request
            const assignRes = await apiService.assignEngineeringRequest(requestId, engineerId)

            // 2. If assignment success, create an Engineering Service record (the Report)
            if (assignRes.success && selectedRequest) {
                const engineer = engineers.find((e: User) => e._id === engineerId)

                await apiService.createEngineeringService({
                    date: selectedRequest.expectedDate,
                    scheduledDate: selectedRequest.expectedDate,
                    facility: {
                        name: selectedRequest.facility.name,
                        location: selectedRequest.facility.location,
                    },
                    serviceType: selectedRequest.requestType,
                    engineerInCharge: {
                        _id: engineer?._id,
                        name: engineer ? `${engineer.firstName} ${engineer.lastName}` : "Unknown",
                    },
                    machineDetails: `${selectedRequest.machine.name} (${selectedRequest.machine.model}) - SN: ${selectedRequest.machine.serialNumber}`,
                    status: "assigned",
                    notes: `Created from Service Request. Contact: ${selectedRequest.contact.name} (${selectedRequest.contact.phone}). \n\nOriginal Notes: ${selectedRequest.notes || "None"}`,
                })
            }
            return assignRes
        },
        onSuccess: () => {
            toast({ title: "Assigned & Linked", description: "Engineer assigned and report record created." })
            qc.invalidateQueries({ queryKey: ["engineering-requests"] })
            qc.invalidateQueries({ queryKey: ["engineering-services"] }) // Invalidate reports too
            setIsAssignOpen(false)
            if (selectedRequest) {
                apiService.getEngineeringRequestById(selectedRequest._id).then(res => {
                    if (res.success) setSelectedRequest(res.data)
                })
            }
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    })

    const statusMutation = useMutation({
        mutationFn: ({ requestId, status }: { requestId: string; status: string }) =>
            apiService.updateEngineeringRequestStatus(requestId, status),
        onSuccess: () => {
            toast({ title: "Status Updated", description: "Request status updated successfully" })
            qc.invalidateQueries({ queryKey: ["engineering-requests"] })
            if (selectedRequest) {
                apiService.getEngineeringRequestById(selectedRequest._id).then(res => {
                    if (res.success) setSelectedRequest(res.data)
                })
            }
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (requestId: string) => apiService.deleteEngineeringRequest(requestId),
        onSuccess: () => {
            toast({ title: "Deleted", description: "Request deleted successfully" })
            qc.invalidateQueries({ queryKey: ["engineering-requests"] })
            setIsDetailsOpen(false)
            setSelectedRequest(null)
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    })

    const handleRowClick = (request: EngineeringRequest) => {
        setSelectedRequest(request)
        setIsDetailsOpen(true)
    }

    const handleAssignClick = (e: React.MouseEvent, request: EngineeringRequest) => {
        e.stopPropagation()
        setSelectedRequest(request)
        setAssigneeId(request.assignedEngineer?._id || "")
        setIsAssignOpen(true)
    }

    const handleDelete = (requestId: string) => {
        if (confirm("Are you sure you want to delete this service request?")) {
            deleteMutation.mutate(requestId)
        }
    }

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200"
            case "assigned": return "bg-blue-100 text-blue-700 border-blue-200"
            case "in_progress": return "bg-purple-100 text-purple-700 border-purple-200"
            case "completed": return "bg-green-100 text-green-700 border-green-200"
            case "cancelled": return "bg-red-100 text-red-700 border-red-200"
            default: return "bg-gray-100 text-gray-700 border-gray-200"
        }
    }

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case "service": return "bg-blue-50 text-blue-600 border-blue-100"
            case "repair": return "bg-red-50 text-red-600 border-red-100"
            case "site_survey": return "bg-orange-50 text-orange-600 border-orange-100"
            case "training": return "bg-indigo-50 text-indigo-600 border-indigo-100"
            default: return "bg-gray-50 text-gray-600 border-gray-100"
        }
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    You do not have the required permissions to view engineering service requests.
                </p>
            </div>
        )
    }

    const requests = requestsData?.data || []
    const pagination = requestsData?.pagination || { total: 0, page: 1, pages: 1 }
    const engineers = engineersData || []

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg ring-4 ring-blue-50">
                        <ClipboardList className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Service Requests</h1>
                        <p className="text-muted-foreground font-medium">Manage incoming client service and repair requests</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => refetch()} className="neumorphic-button">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="neumorphic-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Requests</p>
                                <p className="text-3xl font-bold mt-1">{pagination.total}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neumorphic-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
                                <p className="text-3xl font-bold mt-1 text-yellow-600">
                                    {requests.filter((r: any) => r.status === 'pending').length}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neumorphic-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">In Progress</p>
                                <p className="text-3xl font-bold mt-1 text-purple-600">
                                    {requests.filter((r: any) => r.status === 'in_progress').length}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                <Wrench className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neumorphic-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Completed</p>
                                <p className="text-3xl font-bold mt-1 text-green-600">
                                    {requests.filter((r: any) => r.status === 'completed').length}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="neumorphic-card border-none overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search facility or contact..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 neumorphic-input bg-white border-none"
                            />
                        </div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border-none rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                            <option value="">All Types</option>
                            <option value="service">Service</option>
                            <option value="repair">Repair</option>
                            <option value="site_survey">Site Survey</option>
                            <option value="training">Training</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border-none rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <Button variant="ghost" onClick={() => { setSearchQuery(""); setTypeFilter(""); setStatusFilter(""); }} className="hover:bg-blue-50 text-blue-600">
                            Reset Filters
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-y border-gray-100">
                                <tr>
                                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Client / Facility</th>
                                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Request Type</th>
                                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Machine Info</th>
                                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Expected Date</th>
                                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Status</th>
                                    <th className="text-right py-4 px-6 font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                                            <p className="mt-2 text-muted-foreground font-medium">Loading requests...</p>
                                        </td>
                                    </tr>
                                ) : requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <Info className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                                            <p className="text-gray-500 font-medium">No service requests found matching your filters.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((request: EngineeringRequest) => (
                                        <tr
                                            key={request._id}
                                            className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                                            onClick={() => handleRowClick(request)}
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                                                        {request.facility.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{request.facility.name}</p>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                            <MapPin className="h-3 w-3" />
                                                            {request.facility.location}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeBadgeColor(request.requestType)} uppercase tracking-tight`}>
                                                    {request.requestType.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm font-medium text-gray-900">{request.machine.name}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">SN: {request.machine.serialNumber}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="h-4 w-4 text-blue-500" />
                                                    {new Date(request.expectedDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(request.status)} uppercase tracking-tight`}>
                                                    {request.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => handleAssignClick(e, request)}
                                                        className="text-blue-600 hover:bg-blue-100 font-bold"
                                                    >
                                                        <UserPlus className="h-4 w-4 mr-1" />
                                                        Assign
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-400 hover:text-blue-600"
                                                        onClick={(e) => { e.stopPropagation(); handleRowClick(request); }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <p className="text-sm text-muted-foreground font-medium">
                            Showing <span className="text-gray-900">{(page - 1) * 20 + 1}</span> to <span className="text-gray-900">{Math.min(page * 20, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> requests
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="neumorphic-button"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center px-4 bg-white border border-gray-100 rounded-lg text-sm font-bold shadow-sm">
                                Page {page} of {pagination.pages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= pagination.pages}
                                onClick={() => setPage(page + 1)}
                                className="neumorphic-button"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl">
                    {selectedRequest && (
                        <div className="bg-white">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
                                <div className="absolute top-6 right-6 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                                    {selectedRequest.status}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                        <ClipboardList className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedRequest.facility.name}</h2>
                                        <p className="text-white/80 font-medium flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {selectedRequest.facility.location}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                                {/* Status and Action Buttons */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block w-full mb-1">Quick Status Update</Label>
                                    {(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'] as const).map(s => (
                                        <Button
                                            key={s}
                                            size="sm"
                                            variant={selectedRequest.status === s ? "default" : "outline"}
                                            className={`rounded-full px-4 text-xs font-bold ${selectedRequest.status === s ? 'bg-blue-600' : 'hover:bg-blue-50 text-gray-600'}`}
                                            onClick={() => statusMutation.mutate({ requestId: selectedRequest._id, status: s })}
                                            disabled={statusMutation.isPending}
                                        >
                                            {s.replace('_', ' ')}
                                        </Button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: Client & Machine */}
                                    <div className="space-y-6">
                                        <section>
                                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <User className="h-4 w-4 text-blue-500" />
                                                Contact Person
                                            </h3>
                                            <Card className="bg-gray-50 border-none shadow-none rounded-xl p-4">
                                                <p className="font-bold text-gray-900">{selectedRequest.contact.name}</p>
                                                <p className="text-sm text-gray-600">{selectedRequest.contact.role}</p>
                                                <div className="mt-3 space-y-1">
                                                    <a href={`tel:${selectedRequest.contact.phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-2 font-medium">
                                                        <div className="h-6 w-6 bg-blue-100 rounded-lg flex items-center justify-center"><Clock className="h-3 w-3" /></div>
                                                        {selectedRequest.contact.phone}
                                                    </a>
                                                    {selectedRequest.contact.email && (
                                                        <a href={`mailto:${selectedRequest.contact.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-2 font-medium">
                                                            <div className="h-6 w-6 bg-blue-100 rounded-lg flex items-center justify-center"><Calendar className="h-3 w-3" /></div>
                                                            {selectedRequest.contact.email}
                                                        </a>
                                                    )}
                                                </div>
                                            </Card>
                                        </section>

                                        <section>
                                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Wrench className="h-4 w-4 text-blue-500" />
                                                Machine Details
                                            </h3>
                                            <Card className="bg-gray-50 border-none shadow-none rounded-xl p-4 space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Name:</span>
                                                    <span className="text-sm font-bold">{selectedRequest.machine.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Model:</span>
                                                    <span className="text-sm font-bold">{selectedRequest.machine.model}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Serial Number:</span>
                                                    <span className="text-sm font-bold text-blue-600">{selectedRequest.machine.serialNumber}</span>
                                                </div>
                                            </Card>
                                        </section>
                                    </div>

                                    {/* Right Column: Request & Assignment */}
                                    <div className="space-y-6">
                                        <section>
                                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                Request Info
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Expected Date</p>
                                                    <p className="text-lg font-bold text-gray-900">{new Date(selectedRequest.expectedDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Problem / Notes</p>
                                                    <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-4 leading-relaxed font-medium italic">
                                                        {selectedRequest.notes || "No additional notes provided."}
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <UserPlus className="h-4 w-4 text-blue-500" />
                                                Assigned Engineer
                                            </h3>
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                {selectedRequest.assignedEngineer ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                                                            {selectedRequest.assignedEngineer.firstName[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">
                                                                {selectedRequest.assignedEngineer.firstName} {selectedRequest.assignedEngineer.lastName}
                                                            </p>
                                                            <Button variant="link" className="h-auto p-0 text-xs text-blue-600" onClick={(e) => handleAssignClick(e, selectedRequest)}>Change</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 w-full text-center">
                                                        <p className="text-sm text-muted-foreground font-medium italic">Not currently assigned</p>
                                                        <Button size="sm" onClick={(e) => handleAssignClick(e, selectedRequest)} className="bg-blue-600 hover:bg-blue-700 font-bold">
                                                            Assign Now
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 flex items-center justify-between gap-4">
                                <Button variant="ghost" onClick={() => handleDelete(selectedRequest._id)} className="text-red-600 hover:bg-red-50 hover:text-red-700 font-bold">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Request
                                </Button>
                                <Button onClick={() => setIsDetailsOpen(false)} className="bg-gray-900 hover:bg-black font-bold px-8">
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Assignment Dialog */}
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="sm:max-w-[400px] p-0 border-none rounded-2xl overflow-hidden shadow-2xl">
                    <DialogHeader className="bg-blue-600 p-6 text-white">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <UserPlus className="h-6 w-6" />
                            Assign Engineer
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 font-medium pt-1">
                            Select an engineer to handle this request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-gray-700">Available Engineers</Label>
                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                                {engineers.length > 0 ? (
                                    engineers.map((e: User) => (
                                        <div
                                            key={e._id}
                                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${assigneeId === e._id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200 bg-gray-50/50'}`}
                                            onClick={() => setAssigneeId(e._id)}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${assigneeId === e._id ? 'bg-blue-600' : 'bg-gray-400'}`}>
                                                {e.firstName[0]}
                                            </div>
                                            <div>
                                                <p className={`font-bold ${assigneeId === e._id ? 'text-blue-700' : 'text-gray-900'}`}>{e.firstName} {e.lastName}</p>
                                                <p className="text-xs text-muted-foreground">{e.email}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-center py-4 text-muted-foreground italic">No engineers found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-gray-50 flex gap-2">
                        <Button variant="ghost" onClick={() => setIsAssignOpen(false)} className="flex-1 font-bold">Cancel</Button>
                        <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold"
                            disabled={!assigneeId || assignMutation.isPending}
                            onClick={() => selectedRequest && assignMutation.mutate({ requestId: selectedRequest._id, engineerId: assigneeId })}
                        >
                            {assignMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
