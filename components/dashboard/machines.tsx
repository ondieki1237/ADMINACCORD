"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  Cog, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Wrench,
  Building2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Settings,
  ClipboardList,
  History,
  UserCog,
  Cpu
} from "lucide-react"

export default function MachinesList() {
  const [page, setPage] = useState(1)
  const [selectedMachine, setSelectedMachine] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreateServiceDialogOpen, setIsCreateServiceDialogOpen] = useState(false)
  const [isServiceHistoryDialogOpen, setIsServiceHistoryDialogOpen] = useState(false)
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [bulkMachinesText, setBulkMachinesText] = useState("")
  
  // Service form state
  const [serviceFormData, setServiceFormData] = useState({
    serviceType: "maintenance",
    scheduledDate: "",
    engineerName: "",
    engineerPhone: "",
    engineerId: "",
    engineerRole: "",
    notes: "",
    status: "scheduled"
  })

  // Form state
  const [formData, setFormData] = useState({
    serialNumber: "",
    model: "",
    manufacturer: "",
    version: "",
    facilityName: "",
    facilityLevel: "",
    facilityLocation: "",
    contactPersonName: "",
    contactPersonRole: "",
    contactPersonPhone: "",
    contactPersonEmail: "",
    installedDate: "",
    purchaseDate: "",
    warrantyExpiry: "",
    lastServicedAt: "",
    nextServiceDue: "",
    status: "active"
  })

  const { toast } = useToast()
  const qc = useQueryClient()

  const currentUser = authService.getCurrentUserSync()
  const isAdmin = hasAdminAccess(currentUser)

  // Fetch machines
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["machines", page, searchQuery],
    queryFn: async () => {
      console.log("🔍 Fetching machines from API...")
      const filters: any = {}
      if (searchQuery.trim()) filters.search = searchQuery.trim()
      
      try {
        const result = await apiService.getMachines(page, 20, filters)
        console.log("✅ Machines API response:", result)
        return result
      } catch (err: any) {
        console.error("❌ Machines fetch error:", err)
        throw err
      }
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  })

  // Parse machines
  const parseMachines = () => {
    if (!data) return []
    
    if (data.success && data.data?.docs) {
      return data.data.docs
    } else if (data.success && data.data) {
      return Array.isArray(data.data) ? data.data : [data.data]
    } else if (data.data?.docs) {
      return data.data.docs
    } else if (Array.isArray(data)) {
      return data
    }
    
    return []
  }

  const machines = parseMachines()
  const hasMachines = machines.length > 0

  // Fetch all users for service assignment
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      console.log("👷 Fetching all users from API...")
      const result = await apiService.getUsers()
      console.log("✅ Users response:", result)
      console.log("📊 Number of users:", result?.data?.docs?.length || result?.data?.length || 0)
      return result
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Parse users
  const parseUsers = () => {
    if (!usersData) return []
    
    if (usersData.success && usersData.data?.docs) {
      return usersData.data.docs
    } else if (usersData.success && usersData.data) {
      return Array.isArray(usersData.data) ? usersData.data : [usersData.data]
    } else if (usersData.data?.docs) {
      return usersData.data.docs
    } else if (Array.isArray(usersData)) {
      return usersData
    }
    
    return []
  }

  const allUsers = parseUsers()
  console.log("👥 Parsed users for dropdown:", allUsers.length, allUsers)
  
  // Debug: Log first user to see structure
  if (allUsers.length > 0) {
    console.log("🔍 First user FULL object:", JSON.stringify(allUsers[0], null, 2))
    console.log("📋 All available fields:", Object.keys(allUsers[0]))
  }

  // Fetch service history for selected machine
  const { data: serviceHistoryData, isLoading: servicesLoading, refetch: refetchServices } = useQuery({
    queryKey: ["machine-services", selectedMachine?.id || selectedMachine?._id],
    queryFn: async () => {
      const machineId = selectedMachine?.id || selectedMachine?._id
      if (!machineId) return null
      console.log("🔧 Fetching service history for machine:", machineId)
      try {
        const result = await apiService.getMachineServices(machineId, 1, 50)
        console.log("✅ Service history response:", result)
        return result
      } catch (err: any) {
        console.error("❌ Service history fetch error:", err)
        return null
      }
    },
    enabled: isServiceHistoryDialogOpen && !!(selectedMachine?.id || selectedMachine?._id),
    staleTime: 0,
  })

  // Parse service history
  const parseServices = () => {
    if (!serviceHistoryData) return []
    
    if (serviceHistoryData.success && serviceHistoryData.data?.docs) {
      return serviceHistoryData.data.docs
    } else if (serviceHistoryData.success && serviceHistoryData.data) {
      return Array.isArray(serviceHistoryData.data) ? serviceHistoryData.data : [serviceHistoryData.data]
    } else if (serviceHistoryData.data?.docs) {
      return serviceHistoryData.data.docs
    } else if (Array.isArray(serviceHistoryData)) {
      return serviceHistoryData
    }
    
    return []
  }

  const services = parseServices()

  // Mutations
  const createMachineMutation = useMutation({
    mutationFn: (payload: any) => apiService.createMachine(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machines"] })
      toast({ title: "Machine created successfully" })
      setIsCreateDialogOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      console.error("Create machine error:", err)
      toast({ title: "Failed to create machine", description: err.message, variant: "destructive" })
    },
  })

  const updateMachineMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => 
      apiService.updateMachine(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machines"] })
      toast({ title: "Machine updated successfully" })
      setIsDialogOpen(false)
    },
    onError: (err: any) => {
      console.error("Update machine error:", err)
      toast({ title: "Failed to update machine", description: err.message, variant: "destructive" })
    },
  })

  const deleteMachineMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteMachine(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machines"] })
      toast({ title: "Machine deleted successfully" })
      setIsDialogOpen(false)
    },
    onError: (err: any) => {
      console.error("Delete machine error:", err)
      toast({ title: "Failed to delete machine", description: err.message, variant: "destructive" })
    },
  })

  const createServiceMutation = useMutation({
    mutationFn: (payload: any) => apiService.createEngineeringService(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machine-services"] })
      qc.invalidateQueries({ queryKey: ["machines"] })
      toast({ title: "Service created successfully", description: "Engineer has been notified" })
      setIsCreateServiceDialogOpen(false)
      resetServiceForm()
    },
    onError: (err: any) => {
      console.error("Create service error:", err)
      toast({ title: "Failed to create service", description: err.message, variant: "destructive" })
    },
  })

  const bulkAddMachinesMutation = useMutation({
    mutationFn: async (machinesArray: any[]) => {
      const results = await Promise.allSettled(
        machinesArray.map(machine => apiService.createMachine(machine))
      )
      return results
    },
    onSuccess: (results) => {
      const successful = results.filter((r: any) => r.status === 'fulfilled').length
      const failed = results.filter((r: any) => r.status === 'rejected').length
      
      qc.invalidateQueries({ queryKey: ["machines"] })
      toast({ 
        title: `Bulk Add Complete`, 
        description: `✅ ${successful} machines added successfully. ${failed > 0 ? `❌ ${failed} failed.` : ''}` 
      })
      setIsBulkAddDialogOpen(false)
      setBulkMachinesText("")
    },
    onError: (err: any) => {
      console.error("Bulk add error:", err)
      toast({ title: "Failed to add machines", description: err.message, variant: "destructive" })
    },
  })

  const resetForm = () => {
    setFormData({
      serialNumber: "",
      model: "",
      manufacturer: "",
      version: "",
      facilityName: "",
      facilityLevel: "",
      facilityLocation: "",
      contactPersonName: "",
      contactPersonRole: "",
      contactPersonPhone: "",
      contactPersonEmail: "",
      installedDate: "",
      purchaseDate: "",
      warrantyExpiry: "",
      lastServicedAt: "",
      nextServiceDue: "",
      status: "active"
    })
  }

  const resetServiceForm = () => {
    setServiceFormData({
      serviceType: "maintenance",
      scheduledDate: "",
      engineerName: "",
      engineerPhone: "",
      engineerId: "",
      engineerRole: "",
      notes: "",
      status: "scheduled"
    })
  }

  const openMachine = (machine: any) => {
    setSelectedMachine(machine)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const handleCreate = () => {
    const payload: any = {
      serialNumber: formData.serialNumber.trim(),
      model: formData.model.trim(),
      manufacturer: formData.manufacturer.trim(),
      version: formData.version.trim(),
      facility: {
        name: formData.facilityName.trim(),
        level: formData.facilityLevel.trim(),
        location: formData.facilityLocation.trim()
      },
      contactPerson: {
        name: formData.contactPersonName.trim(),
        role: formData.contactPersonRole.trim(),
        phone: formData.contactPersonPhone.trim(),
        email: formData.contactPersonEmail.trim()
      },
      status: formData.status
    }

    if (formData.installedDate) payload.installedDate = formData.installedDate
    if (formData.purchaseDate) payload.purchaseDate = formData.purchaseDate
    if (formData.warrantyExpiry) payload.warrantyExpiry = formData.warrantyExpiry
    if (formData.lastServicedAt) payload.lastServicedAt = formData.lastServicedAt
    if (formData.nextServiceDue) payload.nextServiceDue = formData.nextServiceDue

    createMachineMutation.mutate(payload)
  }

  const handleDelete = () => {
    if (!selectedMachine) return
    if (confirm("Are you sure you want to delete this machine?")) {
      const id = selectedMachine.id || selectedMachine._id
      deleteMachineMutation.mutate(id)
    }
  }

  const openServiceHistory = (machine: any) => {
    setSelectedMachine(machine)
    setIsServiceHistoryDialogOpen(true)
  }

  const openCreateService = (machine: any) => {
    setSelectedMachine(machine)
    resetServiceForm()
    setIsCreateServiceDialogOpen(true)
  }

  const handleCreateService = () => {
    if (!selectedMachine) return
    
    const selectedUser = allUsers.find((e: any) => e._id === serviceFormData.engineerId)
    
    console.log("🚀 Creating service with user:", selectedUser)
    console.log("📦 Service form data:", serviceFormData)
    
    // Handle different possible field names
    const userName = selectedUser?.name || selectedUser?.username || selectedUser?.fullName || serviceFormData.engineerName
    const userPhone = selectedUser?.phone || selectedUser?.phoneNumber || serviceFormData.engineerPhone
    const userEmail = selectedUser?.email || ''
    
    const payload = {
      facility: {
        name: selectedMachine.facility?.name || "",
        location: selectedMachine.facility?.location || ""
      },
      serviceType: serviceFormData.serviceType,
      engineerInCharge: {
        name: userName,
        phone: userPhone,
        email: userEmail
      },
      machineDetails: `${selectedMachine.manufacturer} ${selectedMachine.model} (S/N: ${selectedMachine.serialNumber})`,
      machineId: selectedMachine._id || selectedMachine.id,
      status: serviceFormData.status,
      notes: serviceFormData.notes.trim(),
      scheduledDate: serviceFormData.scheduledDate
    }
    
    console.log("📤 Payload being sent:", payload)

    createServiceMutation.mutate(payload)
  }

  const handleEngineerSelect = (userId: string) => {
    const user = allUsers.find((e: any) => e._id === userId)
    if (user) {
      console.log("✅ Selected user:", user)
      
      // Handle firstName + lastName structure (like engineer-reports.tsx)
      const userName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.name || user.username || user.fullName || 'Unknown User'
      const userPhone = user.phone || user.mobile || user.phoneNumber || ''
      const userRole = user.role || ''
      const userEmail = user.email || ''
      
      setServiceFormData({
        ...serviceFormData,
        engineerId: user._id,
        engineerName: userName,
        engineerPhone: userPhone,
        engineerRole: userRole
      })
      
      console.log("📝 Updated service form data:", {
        engineerId: user._id,
        engineerName: userName,
        engineerPhone: userPhone,
        engineerRole: userRole,
        engineerEmail: userEmail
      })
    }
  }

  const handleBulkAdd = () => {
    try {
      // Parse JSON array from textarea
      const machinesArray = JSON.parse(bulkMachinesText)
      
      if (!Array.isArray(machinesArray)) {
        toast({ title: "Invalid format", description: "Please provide a JSON array of machines", variant: "destructive" })
        return
      }

      if (machinesArray.length === 0) {
        toast({ title: "No machines", description: "Array is empty", variant: "destructive" })
        return
      }

      // Validate each machine has minimum required fields
      const invalidMachines = machinesArray.filter((m, idx) => 
        !m.model || !m.manufacturer || !m.facility?.name
      )

      if (invalidMachines.length > 0) {
        toast({ 
          title: "Validation Error", 
          description: `${invalidMachines.length} machine(s) missing required fields (model, manufacturer, facility.name)`, 
          variant: "destructive" 
        })
        return
      }

      bulkAddMachinesMutation.mutate(machinesArray)
    } catch (err: any) {
      toast({ title: "Parse Error", description: "Invalid JSON format: " + err.message, variant: "destructive" })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200"
      case "inactive": return "bg-gray-100 text-gray-800 border-gray-200"
      case "maintenance": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "decommissioned": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle2 className="h-4 w-4" />
      case "maintenance": return <AlertCircle className="h-4 w-4" />
      case "decommissioned": return <XCircle className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#008cf7] to-[#0066cc] shadow-lg flex items-center justify-center">
                  <Cog className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Machines & Equipment</h1>
                  <p className="text-sm text-gray-600">Manage installed equipment and service history</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={async () => {
                  await qc.invalidateQueries({ queryKey: ["machines"] })
                  await refetch()
                }} 
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => setIsBulkAddDialogOpen(true)}
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Bulk Add
              </Button>
              <Button 
                onClick={openCreateDialog}
                size="sm"
                className="bg-[#008cf7] hover:bg-[#0066cc] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Machine
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <Input
              placeholder="Search by serial number, model, manufacturer, or facility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Machines</p>
                  <p className="text-2xl font-bold text-gray-900">{machines.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Cog className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {machines.filter((m: any) => m.status === 'active').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Maintenance</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {machines.filter((m: any) => m.status === 'maintenance').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Service Due</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {machines.filter((m: any) => m.nextServiceDue && new Date(m.nextServiceDue) < new Date()).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Machines List */}
        <Card className="bg-white border border-gray-200/60">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">All Machines</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {hasMachines ? `${machines.length} machine${machines.length !== 1 ? 's' : ''} found` : 'No machines available'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="animate-pulse grid gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-900 font-semibold mb-2">Failed to load machines</p>
                <p className="text-sm text-gray-600 mb-4">{(error as any)?.message || 'Unknown error'}</p>
                <Button onClick={() => refetch()} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : !hasMachines ? (
              <div className="text-center py-12">
                <Cog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900 font-semibold mb-2">No machines found</p>
                <p className="text-sm text-gray-600 mb-4">Get started by adding your first machine</p>
                <Button onClick={openCreateDialog} className="bg-[#008cf7] hover:bg-[#0070c9]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Machine
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {machines.map((machine: any) => (
                  <div 
                    key={machine.id || machine._id} 
                    className="flex items-start justify-between p-5 rounded-xl border border-gray-200 hover:border-[#008cf7]/50 hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Cog className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-lg">
                              {machine.model || 'Unnamed machine'}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(machine.status || 'active')}`}>
                              {getStatusIcon(machine.status || 'active')}
                              {machine.status || 'active'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {machine.manufacturer} {machine.version && `• v${machine.version}`}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-start gap-2 text-gray-600">
                          <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{machine.facility?.name}</p>
                            <p className="text-xs">{machine.facility?.location}</p>
                          </div>
                        </div>

                        {machine.serialNumber && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Settings className="h-4 w-4 flex-shrink-0" />
                            <span>SN: {machine.serialNumber}</span>
                          </div>
                        )}

                        {machine.nextServiceDue && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <div>
                              <span className={`text-xs font-medium ${
                                new Date(machine.nextServiceDue) < new Date() 
                                  ? 'text-red-600' 
                                  : 'text-gray-600'
                              }`}>
                                Service due: {new Date(machine.nextServiceDue).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {machine.contactPerson && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                          {machine.contactPerson.name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {machine.contactPerson.name}
                            </span>
                          )}
                          {machine.contactPerson.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {machine.contactPerson.phone}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        size="sm" 
                        onClick={() => openMachine(machine)}
                        className="bg-[#008cf7] hover:bg-[#0066cc] text-white"
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openServiceHistory(machine)}
                        className="border-[#008cf7] text-[#008cf7] hover:bg-blue-50"
                      >
                        <History className="h-3 w-3 mr-1" />
                        History
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Machine Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cog className="h-5 w-5 text-[#008cf7]" />
                Machine Details
              </DialogTitle>
            </DialogHeader>

            {selectedMachine && (
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Model</p>
                      <p className="font-semibold text-gray-900">{selectedMachine.model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Manufacturer</p>
                      <p className="font-semibold text-gray-900">{selectedMachine.manufacturer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Serial Number</p>
                      <p className="font-semibold text-gray-900">{selectedMachine.serialNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Version</p>
                      <p className="font-semibold text-gray-900">{selectedMachine.version || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedMachine.status)}`}>
                        {getStatusIcon(selectedMachine.status)}
                        {selectedMachine.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Facility Info */}
                {selectedMachine.facility && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Facility Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Name</p>
                        <p className="font-medium">{selectedMachine.facility.name}</p>
                      </div>
                      {selectedMachine.facility.level && (
                        <div>
                          <p className="text-gray-600">Level</p>
                          <p className="font-medium">{selectedMachine.facility.level}</p>
                        </div>
                      )}
                      {selectedMachine.facility.location && (
                        <div className="col-span-2">
                          <p className="text-gray-600">Location</p>
                          <p className="font-medium">{selectedMachine.facility.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Person */}
                {selectedMachine.contactPerson && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600" />
                      Contact Person
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedMachine.contactPerson.name && (
                        <p className="font-medium">{selectedMachine.contactPerson.name}</p>
                      )}
                      {selectedMachine.contactPerson.role && (
                        <p className="text-gray-600">{selectedMachine.contactPerson.role}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-gray-600">
                        {selectedMachine.contactPerson.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedMachine.contactPerson.phone}
                          </span>
                        )}
                        {selectedMachine.contactPerson.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {selectedMachine.contactPerson.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Info */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-green-600" />
                    Service Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedMachine.installedDate && (
                      <div>
                        <p className="text-gray-600">Installed</p>
                        <p className="font-medium">{new Date(selectedMachine.installedDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedMachine.lastServicedAt && (
                      <div>
                        <p className="text-gray-600">Last Service</p>
                        <p className="font-medium">{new Date(selectedMachine.lastServicedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedMachine.nextServiceDue && (
                      <div className="col-span-2">
                        <p className="text-gray-600">Next Service Due</p>
                        <p className={`font-medium ${
                          new Date(selectedMachine.nextServiceDue) < new Date() 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {new Date(selectedMachine.nextServiceDue).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedMachine.lastServiceEngineer && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Last Service Engineer</p>
                      <p className="font-medium">{selectedMachine.lastServiceEngineer.name}</p>
                      {selectedMachine.lastServiceEngineer.notes && (
                        <p className="text-xs text-gray-600 mt-2 italic">"{selectedMachine.lastServiceEngineer.notes}"</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Warranty */}
                {(selectedMachine.purchaseDate || selectedMachine.warrantyExpiry) && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {selectedMachine.purchaseDate && (
                      <div>
                        <p className="text-gray-600">Purchase Date</p>
                        <p className="font-medium">{new Date(selectedMachine.purchaseDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedMachine.warrantyExpiry && (
                      <div>
                        <p className="text-gray-600">Warranty Expiry</p>
                        <p className={`font-medium ${
                          new Date(selectedMachine.warrantyExpiry) < new Date() 
                            ? 'text-red-600' 
                            : 'text-gray-900'
                        }`}>
                          {new Date(selectedMachine.warrantyExpiry).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="pt-4 border-t border-gray-200">
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={handleDelete}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Machine
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  openServiceHistory(selectedMachine)
                  setIsDialogOpen(false)
                }}
                className="w-full sm:w-auto"
              >
                <History className="h-4 w-4 mr-2" />
                View Service History
              </Button>
              <Button 
                onClick={() => {
                  openCreateService(selectedMachine)
                  setIsDialogOpen(false)
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-[#008cf7] to-[#00a6ff]"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Create Service
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Machine Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#008cf7]" />
                Add New Machine
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Model *</Label>
                    <Input
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g., XRay 5000"
                    />
                  </div>
                  <div>
                    <Label>Manufacturer *</Label>
                    <Input
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      placeholder="e.g., Acme Medical"
                    />
                  </div>
                  <div>
                    <Label>Serial Number</Label>
                    <Input
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder="SN-12345"
                    />
                  </div>
                  <div>
                    <Label>Version</Label>
                    <Input
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="v2.0"
                    />
                  </div>
                </div>
              </div>

              {/* Facility Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Facility Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Facility Name *</Label>
                    <Input
                      value={formData.facilityName}
                      onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                      placeholder="Nairobi General Hospital"
                    />
                  </div>
                  <div>
                    <Label>Facility Level</Label>
                    <Input
                      value={formData.facilityLevel}
                      onChange={(e) => setFormData({ ...formData, facilityLevel: e.target.value })}
                      placeholder="Level 5"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Location</Label>
                    <Input
                      value={formData.facilityLocation}
                      onChange={(e) => setFormData({ ...formData, facilityLocation: e.target.value })}
                      placeholder="Nairobi"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Contact Person</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.contactPersonName}
                      onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                      placeholder="Dr. Jane Doe"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input
                      value={formData.contactPersonRole}
                      onChange={(e) => setFormData({ ...formData, contactPersonRole: e.target.value })}
                      placeholder="Radiologist"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.contactPersonPhone}
                      onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                      placeholder="+254712345678"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.contactPersonEmail}
                      onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                      placeholder="jane@hospital.co.ke"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Dates & Service</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Installed Date</Label>
                    <Input
                      type="date"
                      value={formData.installedDate}
                      onChange={(e) => setFormData({ ...formData, installedDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Purchase Date</Label>
                    <Input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Warranty Expiry</Label>
                    <Input
                      type="date"
                      value={formData.warrantyExpiry}
                      onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Last Serviced</Label>
                    <Input
                      type="date"
                      value={formData.lastServicedAt}
                      onChange={(e) => setFormData({ ...formData, lastServicedAt: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Next Service Due</Label>
                    <Input
                      type="date"
                      value={formData.nextServiceDue}
                      onChange={(e) => setFormData({ ...formData, nextServiceDue: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="decommissioned">Decommissioned</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!formData.model.trim() || !formData.manufacturer.trim() || !formData.facilityName.trim()}
                className="bg-[#008cf7] hover:bg-[#0066cc]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Machine
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Service History Dialog */}
        <Dialog open={isServiceHistoryDialogOpen} onOpenChange={setIsServiceHistoryDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#008cf7]" />
                Service History: {selectedMachine?.model || "Machine"}
              </DialogTitle>
              <p className="text-sm text-gray-600">
                {selectedMachine?.manufacturer} - S/N: {selectedMachine?.serialNumber}
              </p>
            </DialogHeader>

            <div className="py-4">
              {servicesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008cf7]"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceHistoryData && serviceHistoryData.length > 0 ? (
                    <div className="space-y-3">
                      {serviceHistoryData.map((service: any, idx: number) => {
                        const serviceTypeColor = 
                          service.serviceType === "installation" ? "bg-blue-100 text-blue-800" :
                          service.serviceType === "repair" ? "bg-red-100 text-red-800" :
                          service.serviceType === "calibration" ? "bg-purple-100 text-purple-800" :
                          "bg-yellow-100 text-yellow-800"

                        return (
                          <div key={idx} className="border-l-4 border-[#008cf7] pl-4 py-3 bg-gray-50 rounded-r-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${serviceTypeColor}`}>
                                  {service.serviceType?.toUpperCase() || "SERVICE"}
                                </span>
                                <span className={`ml-2 inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(service.status)}`}>
                                  {service.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(service.scheduledDate || service.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <UserCog className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">{service.engineerInCharge?.name || "N/A"}</span>
                                {service.engineerInCharge?.phone && (
                                  <span className="text-gray-500">• {service.engineerInCharge.phone}</span>
                                )}
                              </div>
                              
                              {service.notes && (
                                <p className="text-gray-700 mt-2">{service.notes}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No service history found for this machine</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsServiceHistoryDialogOpen(false)}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  setIsServiceHistoryDialogOpen(false)
                  openCreateService(selectedMachine)
                }}
                className="bg-gradient-to-r from-[#008cf7] to-[#00a6ff]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Service Dialog */}
        <Dialog open={isCreateServiceDialogOpen} onOpenChange={setIsCreateServiceDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#008cf7]" />
                Create Service for Machine
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Machine Info (Read-only display) */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Machine Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Model:</span>
                    <span className="ml-2 font-medium">{selectedMachine?.model}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Manufacturer:</span>
                    <span className="ml-2 font-medium">{selectedMachine?.manufacturer}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Serial Number:</span>
                    <span className="ml-2 font-medium">{selectedMachine?.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Facility:</span>
                    <span className="ml-2 font-medium">{selectedMachine?.facility?.name}</span>
                  </div>
                </div>
              </div>

              {/* Service Type */}
              <div>
                <Label>Service Type *</Label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={serviceFormData.serviceType}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, serviceType: e.target.value })}
                >
                  <option value="installation">Installation</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="repair">Repair</option>
                  <option value="calibration">Calibration</option>
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <Label>Scheduled Date *</Label>
                <Input
                  type="date"
                  value={serviceFormData.scheduledDate}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, scheduledDate: e.target.value })}
                />
              </div>

              {/* Engineer Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Assign to User</h4>
                <div>
                  <Label>Select User * {!usersLoading && `(${allUsers.length} available)`}</Label>
                  {usersLoading ? (
                    <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500">
                      Loading users...
                    </div>
                  ) : allUsers.length === 0 ? (
                    <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-red-600">
                      No users found. Please add users to the system.
                    </div>
                  ) : (
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={serviceFormData.engineerId}
                      onChange={(e) => handleEngineerSelect(e.target.value)}
                    >
                      <option value="">-- Select a user --</option>
                      {allUsers.map((user: any) => {
                        // Handle firstName + lastName structure (like engineer-reports.tsx)
                        const userName = user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.name || user.username || user.fullName || 'Unknown User'
                        const userRole = user.role || ''
                        const userPhone = user.phone || user.mobile || user.phoneNumber || ''
                        const displayText = `${userName}${userRole ? ` - ${userRole}` : ''}${userPhone ? ` (${userPhone})` : ''}`
                        
                        console.log("🎯 Rendering user option:", { _id: user._id, userName, userRole, userPhone })
                        
                        return (
                          <option key={user._id} value={user._id}>
                            {displayText}
                          </option>
                        )
                      })}
                    </select>
                  )}
                </div>
                
                {/* Display selected user details */}
                {serviceFormData.engineerId && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-sm font-medium text-gray-900">
                      {serviceFormData.engineerName === 'Unknown User' ? (
                        <span className="text-red-600">⚠️ User name not found - Please manually add name below</span>
                      ) : (
                        <>
                          {serviceFormData.engineerName}
                          {serviceFormData.engineerRole && (
                            <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                              {serviceFormData.engineerRole}
                            </span>
                          )}
                        </>
                      )}
                    </p>
                    {serviceFormData.engineerPhone && (
                      <p className="text-sm text-gray-600">{serviceFormData.engineerPhone}</p>
                    )}
                  </div>
                )}
                
                {/* Manual name override if needed */}
                {serviceFormData.engineerId && serviceFormData.engineerName === 'Unknown User' && (
                  <div>
                    <Label>Manual Name Override *</Label>
                    <Input
                      value={serviceFormData.engineerName === 'Unknown User' ? '' : serviceFormData.engineerName}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, engineerName: e.target.value })}
                      placeholder="Enter engineer name manually"
                    />
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={serviceFormData.status}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, status: e.target.value })}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes / Description</Label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[100px]"
                  value={serviceFormData.notes}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, notes: e.target.value })}
                  placeholder="Enter service description, issues to address, or special instructions..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateServiceDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateService}
                disabled={
                  !serviceFormData.serviceType || 
                  !serviceFormData.scheduledDate || 
                  !serviceFormData.engineerId ||
                  serviceFormData.engineerName === 'Unknown User' ||
                  !serviceFormData.engineerName.trim()
                }
                className="bg-gradient-to-r from-[#008cf7] to-[#00a6ff]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Add Machines Dialog */}
        <Dialog open={isBulkAddDialogOpen} onOpenChange={setIsBulkAddDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Bulk Add Machines
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Add multiple machines at once by providing a JSON array. Each machine must have at minimum: model, manufacturer, and facility.name
              </p>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">JSON Format Example:</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`[
  {
    "model": "XRay 5000",
    "manufacturer": "Acme Medical",
    "serialNumber": "ABC123",
    "version": "v2.1",
    "facility": {
      "name": "Kenyatta National Hospital",
      "level": "Level 6",
      "location": "Nairobi"
    },
    "contactPerson": {
      "name": "Jane Doe",
      "role": "Head of Radiology",
      "phone": "+254712345678",
      "email": "jane@hospital.com"
    },
    "status": "active",
    "installedDate": "2024-01-15",
    "purchaseDate": "2023-12-01",
    "warrantyExpiry": "2026-12-01"
  },
  {
    "model": "Ultrasound Pro",
    "manufacturer": "MedTech Inc",
    "facility": {
      "name": "Nairobi Hospital",
      "location": "Nairobi"
    },
    "status": "active"
  }
]`}
                </pre>
              </div>

              {/* Required Fields Notice */}
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Required fields:</strong> model, manufacturer, facility.name
                  <br />
                  <strong>Optional fields:</strong> serialNumber, version, facility.level, facility.location, contactPerson, status, dates
                </p>
              </div>

              {/* Textarea for JSON input */}
              <div>
                <Label>Paste JSON Array Here *</Label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono min-h-[300px]"
                  value={bulkMachinesText}
                  onChange={(e) => setBulkMachinesText(e.target.value)}
                  placeholder='[{"model": "XRay 5000", "manufacturer": "Acme", "facility": {"name": "KNH", "location": "Nairobi"}}, ...]'
                />
              </div>

              {/* Character count */}
              <p className="text-xs text-gray-500 text-right">
                {bulkMachinesText.length} characters
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkAdd}
                disabled={!bulkMachinesText.trim() || bulkAddMachinesMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white"
              >
                {bulkAddMachinesMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Adding Machines...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add All Machines
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
