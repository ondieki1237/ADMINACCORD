"use client"

import React, { useState, useMemo, useRef } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Phone,
  Plus,
  ChevronRight,
  MapPin,
  User,
  Calendar,
  Clock,
  Package,
  Wrench,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Search,
  RefreshCw,
  History,
  Download,
  Edit,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Client {
  id: string
  facilityName: string
  location: string
  machineInstalled: boolean
  contactPerson?: {
    name: string
    role: string
    phone: string
  }
  lastActivity?: {
    type: 'visit' | 'installation' | 'call' | 'service'
    date: string
    description: string
  }
  activityHistory: Array<{
    type: 'visit' | 'installation' | 'call' | 'service'
    date: string
    description: string
  }>
  source: 'visit' | 'machine' | 'manual'
}

interface CallRecord {
  clientId: string
  callType: 'product_inquiry' | 'service_inquiry' | 'machine_inquiry' | 'follow_up'
  outcome?: string
  productInterest?: string
  expectedPurchaseDate?: string
  machineModel?: string
  serviceAccepted?: boolean
  notes?: string
}

export default function TelessalesRevamp() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const currentUser = authService.getCurrentUserSync()
  const isAdmin = hasAdminAccess(currentUser)

  // ==================== State Management ====================
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const contentsContainerRef = useRef<HTMLDivElement>(null)
  const [isAddClientDialog, setIsAddClientDialog] = useState(false)
  const [isEditClientDialog, setIsEditClientDialog] = useState(false)
  const [isCreateClientDialog, setIsCreateClientDialog] = useState(false)
  const [isNewClientsViewDialog, setIsNewClientsViewDialog] = useState(false)
  const [isQuickInstallDialog, setIsQuickInstallDialog] = useState(false)
  const [isEditingMachine, setIsEditingMachine] = useState(false)
  const [isCallRecordingDialog, setIsCallRecordingDialog] = useState(false)
  const [isSummaryDialog, setIsSummaryDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSource, setFilterSource] = useState<'all' | 'machine' | 'visit'>('all')
  const [summaryData, setSummaryData] = useState<any>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [showMachinesDue, setShowMachinesDue] = useState(false)
  const [sortMachinesDue, setSortMachinesDue] = useState<'asc' | 'desc'>('desc')

  // Add client form state
  const [addClientForm, setAddClientForm] = useState({
    facilityName: "",
    location: "",
    contactPersonName: "",
    contactPersonRole: "",
    contactPersonPhone: "",
    machineInstalled: false,
  })

  // Edit client form state
  const [editClientForm, setEditClientForm] = useState({
    facilityName: "",
    facilityLevel: "",
    location: "",
    contactPersonName: "",
    contactPersonRole: "",
    contactPersonPhone: "",
    contactPersonEmail: "",
    model: "",
    manufacturer: "",
    installedDate: "",
    purchaseDate: "",
    warrantyExpiry: "",
    lastServicedAt: "",
    nextServiceDue: "",
    status: "active",
  })

  // New client form state
  const [quickInstallForm, setQuickInstallForm] = useState({
    facilityName: "",
    location: "",
    contactPerson: "",
    phoneNumber: "",
    role: "",
    machineInstalled: false,
    machineName: "",
    serialNumber: "",
    manufacturer: "",
  })

  // Client without machine form state
  const [newClientForm, setNewClientForm] = useState({
    facilityName: "",
    location: "",
    contactPerson: "",
    phoneNumber: "",
    role: "",
  })

  // Call recording form state
  const [callRecordingForm, setCallRecordingForm] = useState({
    callType: "product_inquiry" as 'product_inquiry' | 'service_inquiry' | 'machine_inquiry' | 'follow_up',
    productInterest: "",
    expectedPurchaseDate: "",
    machineModel: "",
    serviceAccepted: undefined as boolean | undefined,
    notes: "",
  })

  // ==================== Data Fetching ====================
  
  // Fetch visits
  const { data: visitsData } = useQuery({
    queryKey: ["telesales-visits"],
    queryFn: async () => {
      const result = await apiService.getVisits(1, 1000)
      return result
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch machines
  const { data: machinesData } = useQuery({
    queryKey: ["telesales-machines"],
    queryFn: async () => {
      const result = await apiService.getMachines(1, 1000)
      return result
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch clients (prospects)
  const { data: clientsData } = useQuery({
    queryKey: ["telesales-clients"],
    queryFn: async () => {
      const result = await apiService.getClients(1, 1000)
      return result
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch call history for selected client
  const { data: callHistoryData } = useQuery({
    queryKey: ["client-call-history", selectedClient?.facilityName],
    queryFn: async () => {
      if (!selectedClient) return null
      const result = await apiService.getTelesalesHistory({
        facilityName: selectedClient.facilityName,
        limit: 100,
      })
      return result
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!selectedClient,
  })

  // ==================== Helper Functions ====================

  const aggregateClients = (): Client[] => {
    const clientMap = new Map<string, Client>()

    // Parse visits and add to client map
    const visitsDocsArray = visitsData?.data?.docs || []
    const visitsArray = Array.isArray(visitsDocsArray) ? visitsDocsArray.filter(v => v != null) : []

    visitsArray.forEach((visit: any) => {
      if (!visit || !visit.client) return
      
      const facilityName = visit.client?.name
      const location = visit.client?.location
      
      if (facilityName) {
        const key = `${facilityName}-${location || 'unknown'}`
        
        if (!clientMap.has(key)) {
          // Get first contact from contacts array
          const firstContact = Array.isArray(visit.contacts) && visit.contacts.length > 0 ? visit.contacts[0] : null
          
          clientMap.set(key, {
            id: `visit-${visit._id || 'unknown'}`,
            facilityName,
            location: location || "Unknown Location",
            machineInstalled: false,
            contactPerson: firstContact ? {
              name: firstContact.name || "Unknown",
              role: firstContact.role || "Contact",
              phone: firstContact.phone || "",
            } : undefined,
            activityHistory: [],
            source: 'visit',
          })
        }

        const client = clientMap.get(key)!
        client.activityHistory.push({
          type: 'visit',
          date: visit.date || '',
          description: `Visit - ${visit.visitPurpose || 'No purpose specified'}`,
        })
      }
    })

    // Parse machines and add/update in client map
    // Machines API returns: { data: { docs: [...], totalDocs, etc } }
    const machinesArray = Array.isArray(machinesData?.data?.docs) ? machinesData.data.docs.filter(m => m != null) : []

    machinesArray.forEach((machine: any) => {
      if (!machine || !machine.facility) return
      
      // Get facility from facility object (not array)
      const facility = machine.facility
      const facilityName = facility?.name
      const location = facility?.location
      
      // Get contact from contactPerson (single object, not array)
      const contact = machine.contactPerson
      const key = `${facilityName}-${location}`
      
      if (facilityName) {

        if (!clientMap.has(key)) {
          clientMap.set(key, {
            id: `machine-${machine._id || 'unknown'}`,
            facilityName: facilityName,
            location: location || "Unknown Location",
            machineInstalled: true,
            contactPerson: contact && contact.name ? {
              name: contact.name || "Unknown",
              role: contact.role || "Contact",
              phone: contact.phone || "",
            } : undefined,
            activityHistory: [],
            source: 'machine',
          })
        } else {
          const client = clientMap.get(key)!
          client.machineInstalled = true
          if (!client.contactPerson && contact && contact.name) {
            client.contactPerson = {
              name: contact.name || "Unknown",
              role: contact.role || "Contact",
              phone: contact.phone || "",
            }
          }
        }

        const client = clientMap.get(key)!
        client.activityHistory.push({
          type: 'installation',
          date: machine.installedDate || '',
          description: `Machine Installation - ${machine.model || 'Unknown Model'}`,
        })
      }
    })

    // Parse clients (prospects) from /api/admin/clients endpoint
    // Handle different response structures: data.docs or just data
    let clientsArray = []
    
    if (Array.isArray(clientsData?.data?.docs)) {
      clientsArray = clientsData.data.docs.filter(c => c != null)
    } else if (Array.isArray(clientsData?.data)) {
      clientsArray = clientsData.data.filter(c => c != null)
    } else if (Array.isArray(clientsData)) {
      clientsArray = clientsData.filter(c => c != null)
    }

    clientsArray.forEach((client: any) => {
      if (!client || !client.name) return
      
      const facilityName = client.name
      const location = client.location || "Unknown Location"
      const key = `${facilityName}-${location}`
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: `client-${client._id || 'unknown'}`,
          facilityName,
          location,
          machineInstalled: false,
          contactPerson: client.contactPerson && client.contactPerson.name ? {
            name: client.contactPerson.name || "Unknown",
            role: client.contactPerson.role || "Contact",
            phone: client.contactPerson.phone || "",
          } : undefined,
          activityHistory: [{
            type: 'visit',
            date: client.createdAt || '',
            description: 'Client created',
          }],
          source: 'manual',
        })
      }
    })

    // Set last activity and sort history
    const clients = Array.from(clientMap.values())
    clients.forEach((client) => {
      client.activityHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      client.lastActivity = client.activityHistory[0]
    })

    return clients
  }

  const allClients = useMemo(() => aggregateClients(), [visitsData, machinesData, clientsData])

  const filteredClients = useMemo(() => {
    return allClients.filter((client) => {
      const matchesSearch = 
        client.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contactPerson?.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = filterSource === 'all' || client.source === filterSource
      
      return matchesSearch && matchesFilter
    })
  }, [allClients, searchQuery, filterSource])

  // ==================== Machines Due for Service ====================

  const machinesDueForService = useMemo(() => {
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    const machinesArray = Array.isArray(machinesData?.data?.docs) ? machinesData.data.docs : []

    const dueList = machinesArray.filter((machine: any) => {
      // Only include machines that HAVE been serviced and are overdue
      // Exclude machines with no lastServicedAt
      if (!machine.lastServicedAt) {
        return false
      }

      const lastServiced = new Date(machine.lastServicedAt)
      return lastServiced < oneYearAgo
    }).map((machine: any) => {
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(machine.lastServicedAt).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      return {
        id: machine._id,
        facilityName: machine.facility?.name || "Unknown",
        location: machine.facility?.location || "Unknown",
        model: machine.model || "Unknown Model",
        lastServicedAt: machine.lastServicedAt,
        nextServiceDue: machine.nextServiceDue,
        contactPerson: machine.contactPerson || {},
        daysOverdue: daysOverdue,
      }
    })

    // Sort by days overdue
    return dueList.sort((a: any, b: any) => {
      return sortMachinesDue === 'desc' 
        ? b.daysOverdue - a.daysOverdue
        : a.daysOverdue - b.daysOverdue
    })
  }, [machinesData, sortMachinesDue])

  // ==================== Mutations ====================

  const addClientMutation = useMutation({
    mutationFn: async (data: typeof addClientForm) => {
      // Create a visit record in the database to register the new client
      const visitPayload = {
        date: new Date().toISOString(),
        startTime: new Date().toLocaleTimeString(),
        client: {
          name: data.facilityName,
          type: 'other',
          location: data.location,
        },
        visitPurpose: 'Client registration',
        contacts: [
          {
            name: data.contactPersonName,
            role: data.contactPersonRole,
          }
        ],
      }
      
      // Save to database via API
      const result = await apiService.createVisit(visitPayload)
      return result
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Client added successfully",
      })
      setAddClientForm({
        facilityName: "",
        location: "",
        contactPersonName: "",
        contactPersonRole: "",
        contactPersonPhone: "",
        machineInstalled: false,
      })
      setIsAddClientDialog(false)
      qc.invalidateQueries({ queryKey: ["telesales-visits"] })
      qc.invalidateQueries({ queryKey: ["telesales-machines"] })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add client",
        variant: "destructive",
      })
    },
  })

  const recordCallMutation = useMutation({
    mutationFn: async (data: CallRecord) => {
      if (!selectedClient) throw new Error("No client selected")

      const now = new Date()
      const callDate = now.toISOString().split('T')[0]
      const callTime = now.toTimeString().slice(0, 5)

      // If service inquiry and service accepted, create engineer task
      if (
        data.callType === 'service_inquiry' &&
        data.serviceAccepted
      ) {
        // Create service request that will go to engineer reports
        await apiService.createCallLog({
          clientName: selectedClient.facilityName,
          clientPhone: selectedClient.contactPerson?.phone || "",
          callDirection: 'outbound',
          callDate,
          callTime,
          callDuration: 0,
          callOutcome: 'interested',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          week: Math.ceil(now.getDate() / 7),
          nextAction: `Service request created - ${data.machineModel}`,
          callNotes: data.notes,
        })

        // Also create the service request record
        // This would be a separate API endpoint for service requests
        console.log("Creating service request for engineer:", {
          facilityName: selectedClient.facilityName,
          machineModel: data.machineModel,
          contactPerson: selectedClient.contactPerson,
          requestDate: callDate,
          requestTime: callTime,
        })
      } else {
        // Record regular call log
        await apiService.createCallLog({
          clientName: selectedClient.facilityName,
          clientPhone: selectedClient.contactPerson?.phone || "",
          callDirection: 'outbound',
          callDate,
          callTime,
          callDuration: 0,
          callOutcome: 'interested',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          week: Math.ceil(now.getDate() / 7),
          nextAction:
            data.callType === 'product_inquiry'
              ? `Product inquiry: ${data.productInterest}`
              : `${data.callType.replace('_', ' ')}`,
          followUpDate: data.expectedPurchaseDate,
          callNotes: data.notes,
        })
      }

      return true
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Call recorded successfully",
      })
      
      if (selectedClient) {
        selectedClient.activityHistory.unshift({
          type: 'call',
          date: new Date().toISOString(),
          description: `Call recorded - ${callRecordingForm.callType.replace('_', ' ')}`,
        })
      }

      setCallRecordingForm({
        callType: 'product_inquiry',
        productInterest: "",
        expectedPurchaseDate: "",
        machineModel: "",
        serviceAccepted: undefined,
        notes: "",
      })
      setIsCallRecordingDialog(false)
      qc.invalidateQueries({ queryKey: ["callLogs"] })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record call",
        variant: "destructive",
      })
    },
  })

  const updateMachineMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedClient) throw new Error("No client selected")
      
      // Extract machine ID from client ID (format: machine-{_id})
      const machineId = selectedClient.id.replace('machine-', '')
      
      // Build payload only with non-empty fields
      const updatePayload: any = {}

      // Build facility object with only non-empty fields
      const facilityData: any = {}
      if (data.facilityName?.trim()) facilityData.name = data.facilityName.trim()
      if (data.facilityLevel?.trim()) facilityData.level = data.facilityLevel.trim()
      if (data.location?.trim()) facilityData.location = data.location.trim()
      
      if (Object.keys(facilityData).length > 0) {
        updatePayload.facility = facilityData
      }

      // Build contactPerson object with only non-empty fields
      const contactData: any = {}
      if (data.contactPersonName?.trim()) contactData.name = data.contactPersonName.trim()
      if (data.contactPersonRole?.trim()) contactData.role = data.contactPersonRole.trim()
      if (data.contactPersonPhone?.trim()) contactData.phone = data.contactPersonPhone.trim()
      if (data.contactPersonEmail?.trim()) contactData.email = data.contactPersonEmail.trim()
      
      if (Object.keys(contactData).length > 0) {
        updatePayload.contactPerson = contactData
      }

      // Add individual fields only if they have values
      if (data.model?.trim()) updatePayload.model = data.model.trim()
      if (data.manufacturer?.trim()) updatePayload.manufacturer = data.manufacturer.trim()
      if (data.installedDate?.trim()) updatePayload.installedDate = data.installedDate
      if (data.purchaseDate?.trim()) updatePayload.purchaseDate = data.purchaseDate
      if (data.warrantyExpiry?.trim()) updatePayload.warrantyExpiry = data.warrantyExpiry
      if (data.lastServicedAt?.trim()) updatePayload.lastServicedAt = data.lastServicedAt
      if (data.nextServiceDue?.trim()) updatePayload.nextServiceDue = data.nextServiceDue
      if (data.status?.trim()) updatePayload.status = data.status

      // Check if there are any fields to update
      if (Object.keys(updatePayload).length === 0) {
        throw new Error("No fields to update. Please fill in at least one field.")
      }

      const result = await apiService.updateMachine(machineId, updatePayload)
      return result
    },
    onSuccess: (result: any) => {
      toast({
        title: "Success",
        description: `Machine updated successfully! ${result.data?.audit?.changedCount || 0} field(s) changed.`,
      })
      
      setIsEditClientDialog(false)
      setIsEditingMachine(false)
      
      // Refresh the data
      qc.invalidateQueries({ queryKey: ["telesales-machines"] })
      qc.invalidateQueries({ queryKey: ["client-call-history"] })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update machine",
        variant: "destructive",
      })
      setIsEditingMachine(false)
    },
  })

  const quickInstallMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        facility: {
          name: data.facilityName,
          location: data.location,
        },
        contactPerson: {
          name: data.contactPerson,
          phone: data.phoneNumber,
          role: data.role,
        },
      }

      // Add machine details if installing a machine
      if (data.machineInstalled) {
        Object.assign(payload, {
          model: data.machineName,
          serialNumber: data.serialNumber,
          manufacturer: data.manufacturer,
        })
      }

      // Call the API endpoint to create a machine (which also creates the facility/client)
      const result = await apiService.createMachine(payload)

      return result
    },
    onSuccess: (result: any) => {
      toast({
        title: "Success",
        description: quickInstallForm.machineInstalled
          ? "Client and machine created successfully!"
          : "Client created successfully!",
      })

      // Reset form
      setQuickInstallForm({
        facilityName: "",
        location: "",
        contactPerson: "",
        phoneNumber: "",
        role: "",
        machineInstalled: false,
        machineName: "",
        serialNumber: "",
        manufacturer: "",
      })

      setIsQuickInstallDialog(false)

      // Refresh the data
      qc.invalidateQueries({ queryKey: ["telesales-machines"] })
      qc.invalidateQueries({ queryKey: ["telesales-visits"] })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      })
    },
  })

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        facility: {
          name: data.facilityName,
          location: data.location,
        },
        contactPerson: {
          name: data.contactPerson,
          phone: data.phoneNumber,
          role: data.role || "Contact",
        },
      }

      const result = await apiService.createClient(payload)
      return result
    },
    onSuccess: (result: any) => {
      toast({
        title: "Success",
        description: "New client created successfully!",
      })

      // Reset form
      setNewClientForm({
        facilityName: "",
        location: "",
        contactPerson: "",
        phoneNumber: "",
        role: "",
      })

      setIsCreateClientDialog(false)

      // Refresh the data
      qc.invalidateQueries({ queryKey: ["telesales-machines"] })
      qc.invalidateQueries({ queryKey: ["telesales-visits"] })
      qc.invalidateQueries({ queryKey: ["telesales-clients"] })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      })
    },
  })

  // ==================== Summary Function ====================

  const fetchTelesalesSummary = async () => {
    try {
      setSummaryLoading(true)
      const response = await apiService.getTelesalesSummary()
      if (response.success) {
        setSummaryData(response.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch summary",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch summary",
        variant: "destructive",
      })
    } finally {
      setSummaryLoading(false)
    }
  }

  const openSummaryDialog = () => {
    setIsSummaryDialog(true)
    fetchTelesalesSummary()
  }

  // ==================== Export Functions ====================

  const getLastCallDate = (client: Client): string => {
    const callActivity = client.activityHistory.find(a => a.type === 'call')
    if (callActivity) {
      return new Date(callActivity.date).toLocaleDateString()
    }
    return "Never called"
  }

  const exportToExcel = () => {
    try {
      // Prepare data for export
      const data = filteredClients.map(client => ({
        'Client Name': client.facilityName,
        'Location': client.location,
        'Machine Installed': client.machineInstalled ? 'Yes' : 'No',
        'Contact Phone': client.contactPerson?.phone || '',
        'Contact Person Name': client.contactPerson?.name || '',
        'Contact Role': client.contactPerson?.role || '',
        'Last Call Date': getLastCallDate(client),
        'Last Activity': client.lastActivity?.description || 'No activity',
        'Activity Date': client.lastActivity?.date ? new Date(client.lastActivity.date).toLocaleDateString() : '',
      }))

      // Create CSV content
      const headers = Object.keys(data[0] || {})
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value).replace(/"/g, '""')
            return escaped.includes(',') ? `"${escaped}"` : escaped
          }).join(',')
        )
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `telesales_clients_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: `Downloaded ${data.length} clients`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  // ==================== Render Functions ====================

  const renderClientList = () => (
    <div className="space-y-3">
      {filteredClients.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No clients found</p>
        </div>
      ) : (
        filteredClients.map((client) => (
          <Card
            key={client.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              // Save current scroll position before opening client details
              if (contentsContainerRef.current) {
                setScrollPosition(contentsContainerRef.current.scrollTop)
              }
              setSelectedClient(client)
            }}
          >
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{client.facilityName}</h3>
                    <Badge 
                      variant="outline" 
                      className={
                        client.source === 'machine' ? 'bg-green-100 text-green-800 border-green-300' :
                        client.source === 'visit' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                        'bg-blue-100 text-blue-800 border-blue-300'
                      }
                    >
                      {client.source === 'machine' ? 'Machine' : client.source === 'visit' ? 'Visit' : 'Manual'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {client.location}
                    </div>
                    {client.contactPerson && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {client.contactPerson.name} ({client.contactPerson.role})
                      </div>
                    )}
                    {client.lastActivity && (
                      <div className="flex items-center gap-2 mt-3">
                        <Calendar className="h-4 w-4" />
                        Last Activity: {client.lastActivity.description}
                        {client.lastActivity.date && (
                          <>
                            {" "}•{" "}
                            {new Date(client.lastActivity.date).toLocaleDateString()}
                          </>
                        )}
                      </div>
                    )}
                    {client.activityHistory.some(a => a.type === 'call') && (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-600 font-medium">Last Called: {getLastCallDate(client)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {client.machineInstalled && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Machine Installed
                    </Badge>
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  const renderClientDetails = () => {
    if (!selectedClient) return null

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedClient(null)
              // Restore scroll position after a short delay to allow re-render
              setTimeout(() => {
                if (contentsContainerRef.current) {
                  contentsContainerRef.current.scrollTop = scrollPosition
                }
              }, 0)
            }}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </div>

        {/* Facility Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{selectedClient.facilityName}</CardTitle>
            <CardDescription>{selectedClient.location}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">CONTACT PERSON</Label>
                <p className="mt-1 font-medium">
                  {selectedClient.contactPerson?.name || "Not specified"}
                </p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">ROLE</Label>
                <p className="mt-1 font-medium">
                  {selectedClient.contactPerson?.role || "Not specified"}
                </p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">PHONE</Label>
                <p className="mt-1 font-medium flex items-center gap-2">
                  {selectedClient.contactPerson?.phone || "Not specified"}
                  {selectedClient.contactPerson?.phone && (
                    <Phone className="h-4 w-4 text-blue-600" />
                  )}
                </p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">MACHINE STATUS</Label>
                <Badge className={selectedClient.machineInstalled ? "bg-green-100 text-green-800 mt-1" : "bg-gray-100 text-gray-800 mt-1"}>
                  {selectedClient.machineInstalled ? "Installed" : "Not Installed"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {selectedClient.source === 'machine' && selectedClient.machineInstalled && (
            <Button
              onClick={() => {
                // Populate edit form with current client data
                setEditClientForm({
                  facilityName: selectedClient.facilityName,
                  facilityLevel: "",
                  location: selectedClient.location,
                  contactPersonName: selectedClient.contactPerson?.name || "",
                  contactPersonRole: selectedClient.contactPerson?.role || "",
                  contactPersonPhone: selectedClient.contactPerson?.phone || "",
                  contactPersonEmail: "",
                  model: "",
                  manufacturer: "",
                  installedDate: "",
                  purchaseDate: "",
                  warrantyExpiry: "",
                  lastServicedAt: "",
                  nextServiceDue: "",
                  status: "active",
                })
                setIsEditClientDialog(true)
              }}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Details
            </Button>
          )}
          <Button
            onClick={() => setIsCallRecordingDialog(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Phone className="mr-2 h-4 w-4" />
            Record Call
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (selectedClient.contactPerson?.phone) {
                window.location.href = `tel:${selectedClient.contactPerson.phone}`
              } else {
                toast({
                  title: "No phone number",
                  description: "Contact person has no phone number registered",
                  variant: "destructive",
                })
              }
            }}
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Call Now
          </Button>
        </div>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedClient.activityHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded yet</p>
            ) : (
              <div className="space-y-4">
                {selectedClient.activityHistory.map((activity, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-blue-100 p-2">
                        {activity.type === 'visit' && <MapPin className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'installation' && <Package className="h-4 w-4 text-green-600" />}
                        {activity.type === 'call' && <Phone className="h-4 w-4 text-purple-600" />}
                        {activity.type === 'service' && <Wrench className="h-4 w-4 text-orange-600" />}
                      </div>
                      {idx < selectedClient.activityHistory.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="py-2">
                      <p className="font-medium">{activity.description}</p>
                      {activity.date && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.date).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Call History
            </CardTitle>
            <CardDescription>
              {callHistoryData?.data?.length || 0} call(s) recorded for this facility
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!callHistoryData || callHistoryData?.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No call history found</p>
            ) : (
              <div className="space-y-4">
                {callHistoryData.data.map((call: any, idx: number) => (
                  <div key={call._id || idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">DATE & TIME</Label>
                        <p className="mt-1 font-medium">
                          {new Date(call.callDate).toLocaleDateString()} at {call.callTime}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">CALL OUTCOME</Label>
                        <div className="mt-1">
                          <Badge className={
                            call.callOutcome === 'interested' ? 'bg-green-100 text-green-800' :
                            call.callOutcome === 'sale_closed' ? 'bg-blue-100 text-blue-800' :
                            call.callOutcome === 'follow_up_needed' ? 'bg-yellow-100 text-yellow-800' :
                            call.callOutcome === 'no_answer' ? 'bg-gray-100 text-gray-800' :
                            call.callOutcome === 'not_interested' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {call.callOutcome?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">CALLED BY</Label>
                        <p className="mt-1 font-medium">
                          {call.createdBy 
                            ? `${call.createdBy.firstName} ${call.createdBy.lastName}`
                            : 'Unknown'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">CALL DIRECTION</Label>
                        <p className="mt-1 font-medium">
                          {call.callDirection === 'outbound' ? '📞 Outgoing' : '📱 Incoming'}
                        </p>
                      </div>
                    </div>

                    {call.nextAction && (
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">PURPOSE / NEXT ACTION</Label>
                        <p className="mt-1 text-sm text-gray-700">{call.nextAction}</p>
                      </div>
                    )}

                    {call.callNotes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <Label className="text-xs font-semibold text-muted-foreground">NOTES</Label>
                        <p className="mt-1 text-sm text-gray-600">{call.callNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== Main Render ====================

  if (!isAdmin) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800">You don't have permission to access the Telesales module.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Telesales Management</h1>
          <p className="text-muted-foreground">Manage facilities, contacts, and sales interactions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["telesales-visits"] })
              qc.invalidateQueries({ queryKey: ["telesales-machines"] })
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openSummaryDialog}
          >
            Summary
          </Button>
          <Link href="/dashboard/telesales/history">
            <Button
              variant="outline"
              size="sm"
            >
              <History className="h-4 w-4 mr-2" />
              Call History
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setIsQuickInstallDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Machine
          </Button>
          <Button
            onClick={() => setIsCreateClientDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Client Prospect
          </Button>
          <Button
            onClick={() => setIsNewClientsViewDialog(true)}
            variant="outline"
          >
            <User className="mr-2 h-4 w-4" />
            New Clients List
          </Button>
        </div>
      </div>

      {/* Debug Info - Remove in Production */}
      {allClients.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm font-mono">
              <p><strong>Debug Info:</strong></p>
              <p>Visits loaded: {visitsData ? '✓' : '✗'}</p>
              <p>Machines loaded: {machinesData ? '✓' : '✗'}</p>
              <p className="mt-3"><strong>Machines Count:</strong> {Array.isArray(machinesData?.data?.docs) ? machinesData.data.docs.length : '0'}</p>
              <p><strong>Visits Count:</strong> {Array.isArray(visitsData?.data?.docs) ? visitsData.data.docs.length : '0'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div ref={contentsContainerRef} className="overflow-y-auto">
        {selectedClient ? (
          renderClientDetails()
        ) : (
          <>
            {/* Search Bar */}
            <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by facility name, location, or contact..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={filterSource === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSource('all')}
              className={filterSource === 'all' ? 'bg-blue-600' : ''}
            >
              All Clients ({allClients.length})
            </Button>
            <Button
              variant={filterSource === 'machine' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSource('machine')}
              className={filterSource === 'machine' ? 'bg-green-600' : ''}
            >
              Machines ({allClients.filter(c => c.source === 'machine').length})
            </Button>
            <Button
              variant={filterSource === 'visit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSource('visit')}
              className={filterSource === 'visit' ? 'bg-purple-600' : ''}
            >
              Visits ({allClients.filter(c => c.source === 'visit').length})
            </Button>
          </div>

          {/* Machines Due for Service */}
          {machinesDueForService.length > 0 && showMachinesDue && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-orange-900">
                      Machines Due for Service ({machinesDueForService.length})
                    </CardTitle>
                    <p className="text-sm text-orange-800 mt-2">
                      These machines have not been serviced in the last year
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortMachinesDue(sortMachinesDue === 'desc' ? 'asc' : 'desc')}
                      className="text-xs"
                    >
                      Sort: {sortMachinesDue === 'desc' ? 'Most' : 'Least'} Overdue
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMachinesDue(false)}
                      className="text-orange-700 hover:bg-orange-200"
                    >
                      Hide
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {machinesDueForService.map((machine: any) => (
                  <Card 
                    key={machine.id}
                    className="border-orange-200 cursor-pointer hover:shadow-md hover:bg-orange-100 transition-all"
                    onClick={() => {
                      // Find the matching client from allClients
                      const matchingClient = allClients.find(
                        c => c.facilityName === machine.facilityName && c.location === machine.location
                      )
                      if (matchingClient) {
                        setSelectedClient(matchingClient)
                      }
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{machine.facilityName}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{machine.model}</p>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              {machine.location}
                            </div>
                            {machine.contactPerson?.name && (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                {machine.contactPerson.name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-red-100 text-red-800 mb-2">
                            {machine.daysOverdue === -1 
                              ? 'Never Serviced' 
                              : `${machine.daysOverdue} days overdue`
                            }
                          </Badge>
                          {machine.lastServicedAt && (
                            <p className="text-xs text-muted-foreground">
                              Last: {new Date(machine.lastServicedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}
          
          {machinesDueForService.length > 0 && !showMachinesDue && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMachinesDue(true)}
              className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              Show Machines Due for Service ({machinesDueForService.length})
            </Button>
          )}

          {/* Client List */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Clients ({filteredClients.length})
            </h2>
            {renderClientList()}
          </div>
        </>
        )}
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isAddClientDialog} onOpenChange={setIsAddClientDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="facility-name">Facility Name *</Label>
              <Input
                id="facility-name"
                placeholder="e.g., Aga Khan Hospital"
                value={addClientForm.facilityName}
                onChange={(e) =>
                  setAddClientForm({ ...addClientForm, facilityName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Nairobi, Kenya"
                value={addClientForm.location}
                onChange={(e) =>
                  setAddClientForm({ ...addClientForm, location: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="contact-name">Contact Person Name *</Label>
              <Input
                id="contact-name"
                placeholder="Full name"
                value={addClientForm.contactPersonName}
                onChange={(e) =>
                  setAddClientForm({
                    ...addClientForm,
                    contactPersonName: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="contact-role">Contact Role *</Label>
              <Input
                id="contact-role"
                placeholder="e.g., Facilities Manager"
                value={addClientForm.contactPersonRole}
                onChange={(e) =>
                  setAddClientForm({
                    ...addClientForm,
                    contactPersonRole: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Contact Phone *</Label>
              <Input
                id="contact-phone"
                placeholder="Phone number"
                value={addClientForm.contactPersonPhone}
                onChange={(e) =>
                  setAddClientForm({
                    ...addClientForm,
                    contactPersonPhone: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addClientForm.machineInstalled}
                  onChange={(e) =>
                    setAddClientForm({
                      ...addClientForm,
                      machineInstalled: e.target.checked,
                    })
                  }
                />
                Machine Installed at this facility
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddClientDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                addClientMutation.mutate(addClientForm)
              }
              disabled={
                !addClientForm.facilityName ||
                !addClientForm.location ||
                !addClientForm.contactPersonName ||
                !addClientForm.contactPersonRole ||
                !addClientForm.contactPersonPhone
              }
            >
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Machine Dialog */}
      <Dialog open={isQuickInstallDialog} onOpenChange={setIsQuickInstallDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Machine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Facility Information */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-3">Facility Information</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="facility-name">Facility Name *</Label>
                  <Input
                    id="facility-name"
                    placeholder="Hospital/Clinic name"
                    value={quickInstallForm.facilityName}
                    onChange={(e) => setQuickInstallForm({...quickInstallForm, facilityName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="City/Address"
                    value={quickInstallForm.location}
                    onChange={(e) => setQuickInstallForm({...quickInstallForm, location: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-3">Contact Person</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="contact-person">Contact Name *</Label>
                  <Input
                    id="contact-person"
                    placeholder="Person name"
                    value={quickInstallForm.contactPerson}
                    onChange={(e) => setQuickInstallForm({...quickInstallForm, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+254-700-000000"
                    value={quickInstallForm.phoneNumber}
                    onChange={(e) => setQuickInstallForm({...quickInstallForm, phoneNumber: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    placeholder="Facility Manager, Doctor, etc."
                    value={quickInstallForm.role}
                    onChange={(e) => setQuickInstallForm({...quickInstallForm, role: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Machine Installation */}
            <div className="border-b pb-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="machine-installed"
                  checked={quickInstallForm.machineInstalled}
                  onChange={(e) => setQuickInstallForm({...quickInstallForm, machineInstalled: e.target.checked})}
                />
                <Label htmlFor="machine-installed" className="font-semibold text-sm cursor-pointer">
                  Install Machine
                </Label>
              </div>

              {quickInstallForm.machineInstalled && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="machine-name">Machine Name/Model</Label>
                    <Input
                      id="machine-name"
                      placeholder="e.g., X-Ray Model 5000"
                      value={quickInstallForm.machineName}
                      onChange={(e) => setQuickInstallForm({...quickInstallForm, machineName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="serial-number">Serial Number</Label>
                    <Input
                      id="serial-number"
                      placeholder="e.g., SN-2026-001"
                      value={quickInstallForm.serialNumber}
                      onChange={(e) => setQuickInstallForm({...quickInstallForm, serialNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      placeholder="e.g., Siemens"
                      value={quickInstallForm.manufacturer}
                      onChange={(e) => setQuickInstallForm({...quickInstallForm, manufacturer: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsQuickInstallDialog(false)}
              disabled={quickInstallMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => quickInstallMutation.mutate(quickInstallForm)}
              className="bg-green-600 hover:bg-green-700"
              disabled={
                !quickInstallForm.facilityName ||
                !quickInstallForm.location ||
                !quickInstallForm.contactPerson ||
                !quickInstallForm.phoneNumber ||
                !quickInstallForm.role ||
                (quickInstallForm.machineInstalled && 
                  (!quickInstallForm.machineName || !quickInstallForm.serialNumber || !quickInstallForm.manufacturer)) ||
                quickInstallMutation.isPending
              }
            >
              {quickInstallMutation.isPending ? "Registering..." : "Register Facility"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Client (Prospect) Dialog */}
      <Dialog open={isCreateClientDialog} onOpenChange={setIsCreateClientDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Client Prospect</DialogTitle>
            <DialogDescription>Create a new client prospect without machine installation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Facility Information */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-3">Facility Information</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="new-facility-name">Facility Name *</Label>
                  <Input
                    id="new-facility-name"
                    placeholder="Hospital/Clinic name"
                    value={newClientForm.facilityName}
                    onChange={(e) => setNewClientForm({...newClientForm, facilityName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="new-location">Location</Label>
                  <Input
                    id="new-location"
                    placeholder="City/Address"
                    value={newClientForm.location}
                    onChange={(e) => setNewClientForm({...newClientForm, location: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Contact Person</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="new-contact-person">Contact Name *</Label>
                  <Input
                    id="new-contact-person"
                    placeholder="Person name"
                    value={newClientForm.contactPerson}
                    onChange={(e) => setNewClientForm({...newClientForm, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="new-phone">Phone Number *</Label>
                  <Input
                    id="new-phone"
                    placeholder="+254-700-000000"
                    value={newClientForm.phoneNumber}
                    onChange={(e) => setNewClientForm({...newClientForm, phoneNumber: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="new-role">Role</Label>
                  <Input
                    id="new-role"
                    placeholder="Facility Manager, Doctor, etc."
                    value={newClientForm.role}
                    onChange={(e) => setNewClientForm({...newClientForm, role: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateClientDialog(false)}
              disabled={createClientMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createClientMutation.mutate(newClientForm)}
              className="bg-green-600 hover:bg-green-700"
              disabled={
                !newClientForm.facilityName ||
                !newClientForm.contactPerson ||
                !newClientForm.phoneNumber ||
                createClientMutation.isPending
              }
            >
              {createClientMutation.isPending ? "Creating..." : "Create Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Clients List Dialog */}
      <Dialog open={isNewClientsViewDialog} onOpenChange={setIsNewClientsViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clients Without Machines</DialogTitle>
            <DialogDescription>Prospects and clients without active machine installations</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {(() => {
              const newClients = allClients.filter(c => !c.machineInstalled && c.source !== 'visit')
              
              if (newClients.length === 0) {
                return (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No clients without machines found</p>
                  </div>
                )
              }

              return (
                <div className="space-y-3">
                  {newClients.map((client) => (
                    <div
                      key={client.id}
                      className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedClient(client)
                        setIsNewClientsViewDialog(false)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-sm">{client.facilityName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <p className="text-xs text-gray-500">{client.location}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-50">
                          Prospect
                        </Badge>
                      </div>

                      {client.contactPerson && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {client.contactPerson.name}
                            {client.contactPerson.role && ` - ${client.contactPerson.role}`}
                          </div>
                          {client.contactPerson.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {client.contactPerson.phone}
                            </div>
                          )}
                        </div>
                      )}

                      {client.lastActivity && (
                        <div className="text-xs text-gray-500 pt-2 border-t">
                          Last activity: {new Date(client.lastActivity.date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewClientsViewDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call Recording Dialog */}
      <Dialog open={isCallRecordingDialog} onOpenChange={setIsCallRecordingDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Call - {selectedClient?.facilityName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Call Type Selection */}
            <div>
              <Label htmlFor="call-type">Call Type *</Label>
              <Select
                value={callRecordingForm.callType}
                onValueChange={(value: any) =>
                  setCallRecordingForm({
                    ...callRecordingForm,
                    callType: value,
                    productInterest: "",
                    machineModel: "",
                    serviceAccepted: undefined,
                  })
                }
              >
                <SelectTrigger id="call-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_inquiry">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Product Inquiry
                    </div>
                  </SelectItem>
                  <SelectItem value="service_inquiry">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Service Inquiry
                    </div>
                  </SelectItem>
                  <SelectItem value="machine_inquiry">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Machine Inquiry
                    </div>
                  </SelectItem>
                  <SelectItem value="follow_up">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Follow Up
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Inquiry Fields */}
            {callRecordingForm.callType === "product_inquiry" && (
              <>
                <div>
                  <Label htmlFor="product-interest">Product Interested In *</Label>
                  <Input
                    id="product-interest"
                    placeholder="Product name"
                    value={callRecordingForm.productInterest}
                    onChange={(e) =>
                      setCallRecordingForm({
                        ...callRecordingForm,
                        productInterest: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="purchase-date">Expected Purchase Date</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={callRecordingForm.expectedPurchaseDate}
                    onChange={(e) =>
                      setCallRecordingForm({
                        ...callRecordingForm,
                        expectedPurchaseDate: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}

            {/* Service Inquiry Fields */}
            {callRecordingForm.callType === "service_inquiry" && (
              <>
                <div>
                  <Label htmlFor="machine-model">Machine Model *</Label>
                  <Input
                    id="machine-model"
                    placeholder="Machine model name"
                    value={callRecordingForm.machineModel}
                    onChange={(e) =>
                      setCallRecordingForm({
                        ...callRecordingForm,
                        machineModel: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Service Status *</Label>
                  <div className="flex gap-3 mt-2">
                    <Button
                      variant={
                        callRecordingForm.serviceAccepted === true
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setCallRecordingForm({
                          ...callRecordingForm,
                          serviceAccepted: true,
                        })
                      }
                      className="flex-1"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Accepted
                    </Button>
                    <Button
                      variant={
                        callRecordingForm.serviceAccepted === false
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setCallRecordingForm({
                          ...callRecordingForm,
                          serviceAccepted: false,
                        })
                      }
                      className="flex-1"
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Declined
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Machine Inquiry Fields */}
            {callRecordingForm.callType === "machine_inquiry" && (
              <div>
                <Label htmlFor="machine-inquiry">Machine Details</Label>
                <Input
                  id="machine-inquiry"
                  placeholder="Machine details or inquiry specifics"
                  value={callRecordingForm.machineModel}
                  onChange={(e) =>
                    setCallRecordingForm({
                      ...callRecordingForm,
                      machineModel: e.target.value,
                    })
                  }
                />
              </div>
            )}

            {/* Common Notes Field */}
            <div>
              <Label htmlFor="call-notes">Notes</Label>
              <Textarea
                id="call-notes"
                placeholder="Add any additional notes about the call..."
                value={callRecordingForm.notes}
                onChange={(e) =>
                  setCallRecordingForm({
                    ...callRecordingForm,
                    notes: e.target.value,
                  })
                }
                className="min-h-20"
              />
            </div>

            {/* Auto-recorded info */}
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-900">
              <Clock className="h-4 w-4 inline mr-2" />
              Date and time will be recorded automatically when you save this call.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCallRecordingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                recordCallMutation.mutate({
                  clientId: selectedClient?.id || "",
                  ...callRecordingForm,
                })
              }
              disabled={
                !callRecordingForm.productInterest &&
                callRecordingForm.callType === "product_inquiry"
              }
            >
              Record Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditClientDialog} onOpenChange={setIsEditClientDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Facility Details - {selectedClient?.facilityName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Facility Section */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="font-semibold text-sm">Facility Information</h3>
              <div>
                <Label>Facility Name</Label>
                <Input
                  value={editClientForm.facilityName}
                  onChange={(e) => setEditClientForm({...editClientForm, facilityName: e.target.value})}
                  placeholder="Facility name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Facility Level</Label>
                  <Input
                    value={editClientForm.facilityLevel}
                    onChange={(e) => setEditClientForm({...editClientForm, facilityLevel: e.target.value})}
                    placeholder="Primary, Secondary, Tertiary"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={editClientForm.location}
                    onChange={(e) => setEditClientForm({...editClientForm, location: e.target.value})}
                    placeholder="City/Address"
                  />
                </div>
              </div>
            </div>

            {/* Contact Person Section */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="font-semibold text-sm">Contact Person</h3>
              <div>
                <Label>Contact Name</Label>
                <Input
                  value={editClientForm.contactPersonName}
                  onChange={(e) => setEditClientForm({...editClientForm, contactPersonName: e.target.value})}
                  placeholder="Person name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Role</Label>
                  <Input
                    value={editClientForm.contactPersonRole}
                    onChange={(e) => setEditClientForm({...editClientForm, contactPersonRole: e.target.value})}
                    placeholder="Job role/title"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editClientForm.contactPersonPhone}
                    onChange={(e) => setEditClientForm({...editClientForm, contactPersonPhone: e.target.value})}
                    placeholder="+254-700-000000"
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editClientForm.contactPersonEmail}
                  onChange={(e) => setEditClientForm({...editClientForm, contactPersonEmail: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Machine Information Section */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="font-semibold text-sm">Machine Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Model</Label>
                  <Input
                    value={editClientForm.model}
                    onChange={(e) => setEditClientForm({...editClientForm, model: e.target.value})}
                    placeholder="Machine model"
                  />
                </div>
                <div>
                  <Label>Manufacturer</Label>
                  <Input
                    value={editClientForm.manufacturer}
                    onChange={(e) => setEditClientForm({...editClientForm, manufacturer: e.target.value})}
                    placeholder="Manufacturer name"
                  />
                </div>
              </div>
            </div>

            {/* Service Dates Section */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="font-semibold text-sm">Service Dates</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Installed Date</Label>
                  <Input
                    type="date"
                    value={editClientForm.installedDate}
                    onChange={(e) => setEditClientForm({...editClientForm, installedDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Purchase Date</Label>
                  <Input
                    type="date"
                    value={editClientForm.purchaseDate}
                    onChange={(e) => setEditClientForm({...editClientForm, purchaseDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Warranty Expiry</Label>
                  <Input
                    type="date"
                    value={editClientForm.warrantyExpiry}
                    onChange={(e) => setEditClientForm({...editClientForm, warrantyExpiry: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Last Serviced</Label>
                  <Input
                    type="date"
                    value={editClientForm.lastServicedAt}
                    onChange={(e) => setEditClientForm({...editClientForm, lastServicedAt: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Next Service Due</Label>
                  <Input
                    type="date"
                    value={editClientForm.nextServiceDue}
                    onChange={(e) => setEditClientForm({...editClientForm, nextServiceDue: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editClientForm.status}
                    onValueChange={(value) => setEditClientForm({...editClientForm, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="decommissioned">Decommissioned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditClientDialog(false)}
              disabled={isEditingMachine}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsEditingMachine(true)
                updateMachineMutation.mutate(editClientForm)
              }}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isEditingMachine}
            >
              {isEditingMachine ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Telesales Summary Dialog */}
      <Dialog open={isSummaryDialog} onOpenChange={setIsSummaryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Telesales Summary</DialogTitle>
          </DialogHeader>
          
          {summaryLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading summary...</p>
            </div>
          ) : summaryData ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Calls</p>
                    <p className="text-3xl font-bold">{summaryData.totalCalls}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Avg Duration (sec)</p>
                    <p className="text-3xl font-bold">{Math.round(summaryData.avgDuration || 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-3xl font-bold text-green-600">{summaryData.conversionRate}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="text-3xl font-bold text-blue-600">{summaryData.interestRate}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* Call Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Calls by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Product Inquiries</p>
                      <p className="text-2xl font-bold">{summaryData.productInquiries}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service Inquiries</p>
                      <p className="text-2xl font-bold">{summaryData.serviceInquiries}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Machine Inquiries</p>
                      <p className="text-2xl font-bold">{summaryData.machineInquiries}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Follow-ups</p>
                      <p className="text-2xl font-bold">{summaryData.followUps}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Call Outcomes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Outcomes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Interested</p>
                      <p className="text-2xl font-bold text-green-600">{summaryData.interested}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sales Closed</p>
                      <p className="text-2xl font-bold text-blue-600">{summaryData.saleClosed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Follow-up Needed</p>
                      <p className="text-2xl font-bold text-yellow-600">{summaryData.followUpNeeded}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">No Answer</p>
                      <p className="text-2xl font-bold text-gray-600">{summaryData.noAnswer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Not Interested</p>
                      <p className="text-2xl font-bold text-red-600">{summaryData.notInterested}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
