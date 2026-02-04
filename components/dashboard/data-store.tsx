"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, getWeek, getYear } from "date-fns"
import * as XLSX from "xlsx"
import { apiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { hasAdminAccess, hasManagerAccess } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  Database,
  Download,
  FileSpreadsheet,
  Calendar,
  Users,
  Filter,
  Columns,
  ArrowUpDown,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Building2,
  MapPin,
  Wrench,
  UserCheck,
  FileText,
  TrendingUp,
  Package,
  ArrowLeft,
  Settings,
  Eye,
  Save,
  FolderOpen,
  AlertCircle
} from "lucide-react"

// Brand Colors
const COLORS = {
  primary: "#008cf7",
  secondary: "#64748b",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#dc2626",
  text: "#1e293b",
  textLight: "#64748b",
  background: "#f8fafc",
  white: "#ffffff",
}

// Data type definitions
interface DataTypeConfig {
  id: string
  label: string
  icon: React.ElementType
  color: string
  columns: ColumnDef[]
}

interface ColumnDef {
  key: string
  label: string
  type: "string" | "number" | "date" | "array" | "boolean"
  default?: boolean
}

// Column definitions for each data type
const DATA_TYPES: DataTypeConfig[] = [
  {
    id: "visits",
    label: "Visits",
    icon: MapPin,
    color: "#008cf7",
    columns: [
      { key: "date", label: "Visit Date", type: "date", default: true },
      { key: "user.firstName", label: "Employee First Name", type: "string", default: true },
      { key: "user.lastName", label: "Employee Last Name", type: "string", default: true },
      { key: "user.email", label: "Employee Email", type: "string" },
      { key: "client.name", label: "Client Name", type: "string", default: true },
      { key: "client.type", label: "Client Type", type: "string" },
      { key: "client.location", label: "Location", type: "string", default: true },
      { key: "client.county", label: "County", type: "string" },
      { key: "visitPurpose", label: "Purpose", type: "string", default: true },
      { key: "visitOutcome", label: "Outcome", type: "string", default: true },
      { key: "productOfInterest", label: "Product of Interest", type: "string", default: true },
      { key: "contact1Name", label: "Person Met 1 - Name", type: "string", default: true },
      { key: "contact1Role", label: "Person Met 1 - Role", type: "string", default: true },
      { key: "contact1Phone", label: "Person Met 1 - Phone", type: "string", default: true },
      { key: "contact2Name", label: "Person Met 2 - Name", type: "string" },
      { key: "contact2Role", label: "Person Met 2 - Role", type: "string" },
      { key: "contact2Phone", label: "Person Met 2 - Phone", type: "string" },
      { key: "contact3Name", label: "Person Met 3 - Name", type: "string" },
      { key: "contact3Role", label: "Person Met 3 - Role", type: "string" },
      { key: "contact3Phone", label: "Person Met 3 - Phone", type: "string" },
      { key: "contacts", label: "All Contacts (Combined)", type: "array" },
      { key: "contactNames", label: "All Contact Names", type: "string" },
      { key: "contactRoles", label: "All Contact Roles", type: "string" },
      { key: "contactPhones", label: "All Contact Phones", type: "string" },
      { key: "totalPotentialValue", label: "Potential Value (KES)", type: "number", default: true },
      { key: "discussionNotes", label: "Notes", type: "string" },
      { key: "challenges", label: "Challenges", type: "string" },
      { key: "opportunities", label: "Opportunities", type: "string" },
      { key: "equipment", label: "Equipment Discussed", type: "array" },
      { key: "createdAt", label: "Created At", type: "date" },
    ]
  },
  {
    id: "leads",
    label: "Leads",
    icon: TrendingUp,
    color: "#10b981",
    columns: [
      { key: "name", label: "Lead Name", type: "string", default: true },
      { key: "company", label: "Company", type: "string", default: true },
      { key: "email", label: "Email", type: "string", default: true },
      { key: "phone", label: "Phone", type: "string", default: true },
      { key: "source", label: "Lead Source", type: "string" },
      { key: "status", label: "Status", type: "string", default: true },
      { key: "value", label: "Estimated Value", type: "number", default: true },
      { key: "assignedTo.firstName", label: "Assigned To", type: "string" },
      { key: "notes", label: "Notes", type: "string" },
      { key: "createdAt", label: "Created At", type: "date", default: true },
      { key: "updatedAt", label: "Last Updated", type: "date" },
    ]
  },
  {
    id: "machines",
    label: "Machines",
    icon: Package,
    color: "#f59e0b",
    columns: [
      { key: "serialNumber", label: "Serial Number", type: "string", default: true },
      { key: "model", label: "Model", type: "string", default: true },
      { key: "manufacturer", label: "Manufacturer", type: "string", default: true },
      { key: "facility.name", label: "Facility Name", type: "string", default: true },
      { key: "facility.location", label: "Facility Location", type: "string" },
      { key: "status", label: "Status", type: "string", default: true },
      { key: "installedDate", label: "Installed Date", type: "date" },
      { key: "warrantyExpiry", label: "Warranty Expiry", type: "date", default: true },
      { key: "lastServicedAt", label: "Last Serviced", type: "date" },
      { key: "nextServiceDue", label: "Next Service Due", type: "date", default: true },
    ]
  },
  {
    id: "engineering-services",
    label: "Engineering Services",
    icon: Wrench,
    color: "#8b5cf6",
    columns: [
      { key: "date", label: "Service Date", type: "date", default: true },
      { key: "scheduledDate", label: "Scheduled Date", type: "date" },
      { key: "facility.name", label: "Facility", type: "string", default: true },
      { key: "facility.location", label: "Location", type: "string", default: true },
      { key: "serviceType", label: "Service Type", type: "string", default: true },
      { key: "engineerInCharge.name", label: "Engineer", type: "string", default: true },
      { key: "machineDetails", label: "Machine Details", type: "string" },
      { key: "status", label: "Status", type: "string", default: true },
      { key: "conditionBefore", label: "Condition Before", type: "string" },
      { key: "conditionAfter", label: "Condition After", type: "string" },
      { key: "notes", label: "Notes", type: "string" },
    ]
  },
  {
    id: "users",
    label: "Employees",
    icon: Users,
    color: "#ec4899",
    columns: [
      { key: "employeeId", label: "Employee ID", type: "string", default: true },
      { key: "firstName", label: "First Name", type: "string", default: true },
      { key: "lastName", label: "Last Name", type: "string", default: true },
      { key: "email", label: "Email", type: "string", default: true },
      { key: "role", label: "Role", type: "string", default: true },
      { key: "department", label: "Department", type: "string" },
      { key: "region", label: "Region", type: "string", default: true },
      { key: "territory", label: "Territory", type: "string" },
      { key: "createdAt", label: "Joined Date", type: "date" },
    ]
  },
  {
    id: "follow-ups",
    label: "Follow-ups",
    icon: UserCheck,
    color: "#06b6d4",
    columns: [
      { key: "visitId", label: "Visit ID", type: "string" },
      { key: "dueDate", label: "Due Date", type: "date", default: true },
      { key: "status", label: "Status", type: "string", default: true },
      { key: "priority", label: "Priority", type: "string", default: true },
      { key: "action", label: "Action", type: "string", default: true },
      { key: "outcome", label: "Outcome", type: "string" },
      { key: "notes", label: "Notes", type: "string" },
      { key: "createdAt", label: "Created At", type: "date" },
    ]
  },
  {
    id: "quotations",
    label: "Quotations",
    icon: FileText,
    color: "#f97316",
    columns: [
      { key: "clientName", label: "Client Name", type: "string", default: true },
      { key: "clientContact", label: "Contact", type: "string" },
      { key: "clientEmail", label: "Email", type: "string" },
      { key: "productName", label: "Product", type: "string", default: true },
      { key: "productCategory", label: "Category", type: "string" },
      { key: "quantity", label: "Quantity", type: "number", default: true },
      { key: "specifications", label: "Specifications", type: "string" },
      { key: "urgency", label: "Urgency", type: "string", default: true },
      { key: "status", label: "Status", type: "string", default: true },
      { key: "responded", label: "Responded", type: "boolean" },
      { key: "createdAt", label: "Created At", type: "date", default: true },
    ]
  },
]

// Date range presets
const DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "thisWeek", label: "This Week" },
  { id: "lastWeek", label: "Last Week" },
  { id: "thisMonth", label: "This Month" },
  { id: "lastMonth", label: "Last Month" },
  { id: "thisQuarter", label: "This Quarter" },
  { id: "thisYear", label: "This Year" },
  { id: "all", label: "All Time" },
  { id: "lastXDays", label: "Last X Days" },
  { id: "custom", label: "Custom Range" },
]

// Helper to get nested object value with special handling for computed fields
const getNestedValue = (obj: any, path: string): any => {
  // Special handling for individual contact fields (contact1Name, contact1Role, contact1Phone, etc.)
  const contactMatch = path.match(/^contact(\d+)(Name|Role|Phone)$/)
  if (contactMatch && obj.contacts && Array.isArray(obj.contacts)) {
    const index = parseInt(contactMatch[1]) - 1 // contact1 = index 0
    const field = contactMatch[2].toLowerCase() // name, role, phone
    const contact = obj.contacts[index]
    if (contact) {
      if (field === "name") return contact.name || ""
      if (field === "role") return contact.role || contact.designation || ""
      if (field === "phone") return contact.phone || ""
    }
    return ""
  }
  
  // Special handling for combined contact fields
  if (path === "contactNames" && obj.contacts) {
    return Array.isArray(obj.contacts) 
      ? obj.contacts.map((c: any) => c.name || "").filter(Boolean).join(", ")
      : ""
  }
  if (path === "contactRoles" && obj.contacts) {
    return Array.isArray(obj.contacts) 
      ? obj.contacts.map((c: any) => c.role || c.designation || "").filter(Boolean).join(", ")
      : ""
  }
  if (path === "contactPhones" && obj.contacts) {
    return Array.isArray(obj.contacts) 
      ? obj.contacts.map((c: any) => c.phone || "").filter(Boolean).join(", ")
      : ""
  }
  // Special handling for product of interest from equipment array
  if (path === "productOfInterest" && obj.equipment) {
    return Array.isArray(obj.equipment) 
      ? obj.equipment.map((e: any) => e.name || e.product || "").filter(Boolean).join(", ")
      : (obj.productOfInterest || "")
  }
  // Default nested path resolution
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

// Helper to format value for Excel
const formatValueForExcel = (value: any, type: string, key?: string): any => {
  if (value === null || value === undefined) return ""
  
  switch (type) {
    case "date":
      try {
        return format(new Date(value), "yyyy-MM-dd HH:mm")
      } catch {
        return value
      }
    case "array":
      if (!Array.isArray(value)) return value
      // Format contacts array nicely
      if (key === "contacts") {
        return value.map((c: any) => 
          `${c.name || ""}${c.role ? ` (${c.role})` : ""}${c.phone ? ` - ${c.phone}` : ""}`
        ).filter(Boolean).join("; ")
      }
      // Format equipment array
      if (key === "equipment") {
        return value.map((e: any) => 
          `${e.name || e.product || ""}${e.quantity ? ` x${e.quantity}` : ""}`
        ).filter(Boolean).join("; ")
      }
      return JSON.stringify(value)
    case "boolean":
      return value ? "Yes" : "No"
    case "number":
      return typeof value === "number" ? value : parseFloat(value) || 0
    default:
      return String(value)
  }
}

export default function DataStore() {
  const { toast } = useToast()
  const currentUser = authService.getCurrentUserSync()
  const isAdmin = hasAdminAccess(currentUser)
  const isManager = hasManagerAccess(currentUser)

  // State
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(["visits"])
  const [datePreset, setDatePreset] = useState("thisMonth")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [customDays, setCustomDays] = useState(7)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [selectedColumns, setSelectedColumns] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    DATA_TYPES.forEach(dt => {
      initial[dt.id] = dt.columns.filter(c => c.default).map(c => c.key)
    })
    return initial
  })
  const [sortField, setSortField] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [separateSheets, setSeparateSheets] = useState(true)
  const [autoFitColumns, setAutoFitColumns] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, any[]>>({})

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date()
    switch (datePreset) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) }
      case "yesterday":
        const yesterday = subDays(now, 1)
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) }
      case "lastXDays":
        return { start: startOfDay(subDays(now, customDays)), end: endOfDay(now) }
      case "thisWeek":
        return { start: startOfWeek(now), end: endOfWeek(now) }
      case "lastWeek":
        const lastWeek = subDays(now, 7)
        return { start: startOfWeek(lastWeek), end: endOfWeek(lastWeek) }
      case "thisMonth":
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case "lastMonth":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
      case "thisQuarter":
        return { start: startOfQuarter(now), end: endOfQuarter(now) }
      case "thisYear":
        return { start: startOfYear(now), end: endOfYear(now) }
      case "all":
        return { start: null, end: null }
      case "custom":
        return {
          start: customStartDate ? new Date(customStartDate) : null,
          end: customEndDate ? new Date(customEndDate) : null
        }
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) }
    }
  }, [datePreset, customStartDate, customEndDate, customDays])

  // Fetch users for employee filter
  const { data: usersData } = useQuery({
    queryKey: ["users-for-export"],
    queryFn: async () => {
      const result = await apiService.getUsers()
      return result.data || result || []
    },
    enabled: isAdmin || isManager,
  })

  const users = useMemo(() => {
    if (!usersData) return []
    return Array.isArray(usersData) ? usersData : usersData.docs || []
  }, [usersData])

  // Get unique regions
  const regions = useMemo(() => {
    const regionSet = new Set<string>()
    users.forEach((u: any) => {
      if (u.region) regionSet.add(u.region)
    })
    return Array.from(regionSet).sort()
  }, [users])

  // Toggle data type selection
  const toggleDataType = (id: string) => {
    setSelectedDataTypes(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    )
  }

  // Toggle column selection
  const toggleColumn = (dataType: string, columnKey: string) => {
    setSelectedColumns(prev => ({
      ...prev,
      [dataType]: prev[dataType]?.includes(columnKey)
        ? prev[dataType].filter(c => c !== columnKey)
        : [...(prev[dataType] || []), columnKey]
    }))
  }

  // Select all columns for a data type
  const selectAllColumns = (dataType: string) => {
    const dtConfig = DATA_TYPES.find(dt => dt.id === dataType)
    if (dtConfig) {
      setSelectedColumns(prev => ({
        ...prev,
        [dataType]: dtConfig.columns.map(c => c.key)
      }))
    }
  }

  // Clear all columns for a data type
  const clearAllColumns = (dataType: string) => {
    setSelectedColumns(prev => ({
      ...prev,
      [dataType]: []
    }))
  }

  // Toggle employee selection
  const toggleEmployee = (userId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Fetch data for a specific type (with employee filter)
  const fetchDataForType = async (dataType: string, skipEmployeeFilter: boolean = false): Promise<any[]> => {
    const startDate = dateRange.start ? format(dateRange.start, "yyyy-MM-dd") : undefined
    const endDate = dateRange.end ? format(dateRange.end, "yyyy-MM-dd") : undefined

    try {
      let result: any

      switch (dataType) {
        case "visits":
          result = await apiService.getAdminVisits({
            startDate,
            endDate,
            limit: 10000,
            ...(!skipEmployeeFilter && selectedEmployees.length > 0 && { userId: selectedEmployees.join(",") }),
            ...(selectedRegion !== "all" && { region: selectedRegion }),
          })
          break
        case "leads":
          result = await apiService.getLeads(1, 10000, {
            startDate,
            endDate,
          }, isAdmin)
          break
        case "machines":
          result = await apiService.getMachines(1, 10000, {})
          break
        case "engineering-services":
          result = await apiService.getEngineeringServices(1, 10000, {
            startDate,
            endDate,
          })
          break
        case "users":
          result = await apiService.getUsers({
            ...(selectedRegion !== "all" && { region: selectedRegion }),
          })
          break
        case "follow-ups":
          result = await apiService.getFollowUps({
            startDate,
            endDate,
            page: 1,
            limit: 10000,
          })
          break
        case "quotations":
          result = await apiService.getQuotations(1, 10000, {})
          break
        default:
          return []
      }

      // Extract docs array from various response formats
      const docs = result?.data?.docs || result?.docs || result?.data || result || []
      return Array.isArray(docs) ? docs : []
    } catch (error) {
      console.error(`Error fetching ${dataType}:`, error)
      return []
    }
  }

  // Generate preview
  const generatePreview = async () => {
    const preview: Record<string, any[]> = {}
    
    for (const dataType of selectedDataTypes) {
      const data = await fetchDataForType(dataType)
      preview[dataType] = data.slice(0, 10) // First 10 records for preview
    }
    
    setPreviewData(preview)
  }

  // Helper: Build rows for a dataset
  const buildDataRows = (
    data: any[],
    columns: string[],
    dtConfig: typeof DATA_TYPES[0],
    groupByWeek: boolean = false
  ): any[][] => {
    const rows: any[][] = []

    if (groupByWeek && data.length > 0) {
      // Group data by week
      const weekGroups: Record<string, any[]> = {}
      
      data.forEach((item: any) => {
        const dateField = item.visitDate || item.createdAt || item.date
        if (dateField) {
          const itemDate = new Date(dateField)
          const weekNum = getWeek(itemDate)
          const year = getYear(itemDate)
          const weekKey = `Week ${weekNum} (${year})`
          if (!weekGroups[weekKey]) weekGroups[weekKey] = []
          weekGroups[weekKey].push(item)
        } else {
          if (!weekGroups["No Date"]) weekGroups["No Date"] = []
          weekGroups["No Date"].push(item)
        }
      })

      // Sort weeks
      const sortedWeeks = Object.keys(weekGroups).sort((a, b) => {
        if (a === "No Date") return 1
        if (b === "No Date") return -1
        return a.localeCompare(b)
      })

      sortedWeeks.forEach((weekKey, idx) => {
        // Add week header
        if (idx > 0) rows.push([]) // Empty row between weeks
        rows.push([`📅 ${weekKey}`])
        rows.push([]) // Empty row after week header

        // Add column headers
        if (includeHeaders) {
          const headers = columns.map(colKey => {
            const colDef = dtConfig.columns.find(c => c.key === colKey)
            return colDef?.label || colKey
          })
          rows.push(headers)
        }

        // Add data rows for this week
        weekGroups[weekKey].forEach((item: any) => {
          const row = columns.map(colKey => {
            const colDef = dtConfig.columns.find(c => c.key === colKey)
            const value = getNestedValue(item, colKey)
            return formatValueForExcel(value, colDef?.type || "string", colKey)
          })
          rows.push(row)
        })

        // Add week subtotal
        rows.push([`Subtotal: ${weekGroups[weekKey].length} records`])
      })
    } else {
      // Regular rows without week grouping
      if (includeHeaders) {
        const headers = columns.map(colKey => {
          const colDef = dtConfig.columns.find(c => c.key === colKey)
          return colDef?.label || colKey
        })
        rows.push(headers)
      }

      data.forEach((item: any) => {
        const row = columns.map(colKey => {
          const colDef = dtConfig.columns.find(c => c.key === colKey)
          const value = getNestedValue(item, colKey)
          return formatValueForExcel(value, colDef?.type || "string", colKey)
        })
        rows.push(row)
      })
    }

    return rows
  }

  // Helper: Create worksheet with formatting
  const createWorksheet = (rows: any[][], columns: string[]) => {
    const worksheet = XLSX.utils.aoa_to_sheet(rows)

    // Auto-fit columns if enabled
    if (autoFitColumns) {
      const colWidths = columns.map((_, i) => {
        let maxWidth = 10
        rows.forEach(row => {
          const cellValue = row[i]?.toString() || ""
          maxWidth = Math.max(maxWidth, Math.min(cellValue.length + 2, 50))
        })
        return { wch: maxWidth }
      })
      worksheet["!cols"] = colWidths
    }

    return worksheet
  }

  // Fetch data for a specific employee
  const fetchDataForEmployee = async (dataType: string, employeeId: string): Promise<any[]> => {
    const startDate = dateRange.start ? format(dateRange.start, "yyyy-MM-dd") : undefined
    const endDate = dateRange.end ? format(dateRange.end, "yyyy-MM-dd") : undefined

    try {
      let result: any

      switch (dataType) {
        case "visits":
          result = await apiService.getAdminVisits({
            startDate,
            endDate,
            limit: 10000,
            userId: employeeId,
            ...(selectedRegion !== "all" && { region: selectedRegion }),
          })
          break
        case "leads":
          result = await apiService.getLeads(1, 10000, {
            startDate,
            endDate,
            userId: employeeId,
          }, isAdmin)
          break
        case "follow-ups":
          result = await apiService.getFollowUps({
            startDate,
            endDate,
            page: 1,
            limit: 10000,
            userId: employeeId,
          })
          break
        default:
          return []
      }

      const docs = result?.data?.docs || result?.docs || result?.data || result || []
      return Array.isArray(docs) ? docs : []
    } catch (error) {
      console.error(`Error fetching ${dataType} for employee ${employeeId}:`, error)
      return []
    }
  }

  // Generate Excel export
  const generateExcel = async () => {
    if (selectedDataTypes.length === 0) {
      toast({
        title: "No Data Selected",
        description: "Please select at least one data type to export.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      const workbook = XLSX.utils.book_new()
      let totalRecords = 0

      // Check if we should group by week (monthly-related presets)
      const isMonthlyReport = ["thisMonth", "lastMonth"].includes(datePreset)

      for (const dataType of selectedDataTypes) {
        const dtConfig = DATA_TYPES.find(dt => dt.id === dataType)
        if (!dtConfig) continue

        const columns = selectedColumns[dataType] || []

        if (columns.length === 0) {
          toast({
            title: "No Columns Selected",
            description: `Please select columns for ${dtConfig.label}.`,
            variant: "destructive",
          })
          continue
        }

        // When employees are selected, create separate sheets per employee
        if (selectedEmployees.length >= 1) {
          const startDate = dateRange.start ? format(dateRange.start, "yyyy-MM-dd") : undefined
          const endDate = dateRange.end ? format(dateRange.end, "yyyy-MM-dd") : undefined

          // Fetch data for EACH employee separately
          for (const empId of selectedEmployees) {
            const emp = users.find((u: any) => u._id === empId)
            const empName = emp ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() : `Employee`

            // Fetch data for this specific employee
            let result: any
            let employeeData: any[] = []

            try {
              switch (dataType) {
                case "visits":
                  result = await apiService.getAdminVisits({
                    startDate,
                    endDate,
                    limit: 10000,
                    userId: empId,
                    ...(selectedRegion !== "all" && { region: selectedRegion }),
                  })
                  break
                case "leads":
                  result = await apiService.getLeads(1, 10000, {
                    startDate,
                    endDate,
                    userId: empId,
                  }, isAdmin)
                  break
                case "follow-ups":
                  result = await apiService.getFollowUps({
                    startDate,
                    endDate,
                    page: 1,
                    limit: 10000,
                    userId: empId,
                  })
                  break
                default:
                  // For data types that don't support per-user filtering, skip separate sheets
                  continue
              }

              const docs = result?.data?.docs || result?.docs || result?.data || result || []
              employeeData = Array.isArray(docs) ? docs : []
            } catch (error) {
              console.error(`Error fetching ${dataType} for ${empName}:`, error)
              continue
            }

            // Skip if no data for this employee
            if (employeeData.length === 0) {
              console.log(`No data for employee: ${empName}`)
              continue
            }

            const rows = buildDataRows(employeeData, columns, dtConfig, isMonthlyReport)
            totalRecords += employeeData.length

            // Add summary if enabled
            if (includeSummary) {
              rows.push([])
              rows.push([`Employee: ${empName}`])
              rows.push([`Total Records: ${employeeData.length}`])
              rows.push([`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`])
              if (dateRange.start && dateRange.end) {
                rows.push([`Date Range: ${format(dateRange.start, "yyyy-MM-dd")} to ${format(dateRange.end, "yyyy-MM-dd")}`])
              }
            }

            const worksheet = createWorksheet(rows, columns)

            // Sheet name: Employee name (max 31 chars for Excel, clean invalid chars)
            const cleanName = empName.replace(/[:\\/?*\[\]]/g, "").trim().substring(0, 31) || `Employee_${selectedEmployees.indexOf(empId) + 1}`
            
            // Ensure unique sheet name
            let finalSheetName = cleanName
            let counter = 1
            while (workbook.SheetNames.includes(finalSheetName)) {
              finalSheetName = `${cleanName.substring(0, 28)}_${counter++}`
            }
            
            XLSX.utils.book_append_sheet(workbook, worksheet, finalSheetName)
          }
        } else {
          // No employee filter - single sheet per data type
          const singleData = await fetchDataForType(dataType)
          const rows = buildDataRows(singleData, columns, dtConfig, isMonthlyReport)
          totalRecords += singleData.length

          // Add summary if enabled
          if (includeSummary) {
            rows.push([])
            rows.push([`Total Records: ${singleData.length}`])
            rows.push([`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`])
            rows.push([`Generated By: ${currentUser?.firstName} ${currentUser?.lastName}`])
            if (dateRange.start && dateRange.end) {
              rows.push([`Date Range: ${format(dateRange.start, "yyyy-MM-dd")} to ${format(dateRange.end, "yyyy-MM-dd")}`])
            }
          }

          const worksheet = createWorksheet(rows, columns)

          // Add to workbook
          if (separateSheets) {
            XLSX.utils.book_append_sheet(workbook, worksheet, dtConfig.label.substring(0, 31))
          } else {
            if (workbook.SheetNames.length === 0) {
              XLSX.utils.book_append_sheet(workbook, worksheet, "Export Data")
            } else {
              const existingSheet = workbook.Sheets["Export Data"]
              const existingRange = XLSX.utils.decode_range(existingSheet["!ref"] || "A1")
              const newStartRow = existingRange.e.r + 3
              XLSX.utils.sheet_add_aoa(existingSheet, [[`--- ${dtConfig.label} ---`]], { origin: { r: newStartRow, c: 0 } })
              XLSX.utils.sheet_add_aoa(existingSheet, rows, { origin: { r: newStartRow + 1, c: 0 } })
            }
          }
        }
      }

      // Generate filename
      const dateStr = format(new Date(), "yyyyMMdd_HHmmss")
      const dataTypesStr = selectedDataTypes.length === 1 
        ? DATA_TYPES.find(dt => dt.id === selectedDataTypes[0])?.label || "Data"
        : "AllData"
      const filename = `ACCORD_${dataTypesStr}_${dateStr}.xlsx`

      // Download
      XLSX.writeFile(workbook, filename)

      toast({
        title: "Export Successful",
        description: `Exported ${totalRecords} records to ${filename}`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "An error occurred while generating the Excel file.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Calculate total selected records (estimate)
  const selectedCount = useMemo(() => {
    return Object.values(previewData).reduce((sum, arr) => sum + arr.length, 0)
  }, [previewData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#008cf7] rounded-lg">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Data Store</h1>
            <p className="text-slate-500">Generate custom Excel reports from your data</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Data Types & Date Range */}
        <div className="space-y-6">
          {/* Data Types Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#008cf7]" />
                Data Types
              </CardTitle>
              <CardDescription>Select which data to include</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {DATA_TYPES.map(dt => {
                const Icon = dt.icon
                const isSelected = selectedDataTypes.includes(dt.id)
                return (
                  <div
                    key={dt.id}
                    onClick={() => toggleDataType(dt.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-blue-50 border-2 border-[#008cf7]" 
                        : "bg-slate-50 border-2 border-transparent hover:border-slate-200"
                    }`}
                  >
                    <Checkbox checked={isSelected} />
                    <Icon className="h-5 w-5" style={{ color: dt.color }} />
                    <span className="font-medium text-slate-700">{dt.label}</span>
                    {isSelected && (
                      <Badge variant="secondary" className="ml-auto">
                        {selectedColumns[dt.id]?.length || 0} cols
                      </Badge>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#008cf7]" />
                Date Range
              </CardTitle>
              <CardDescription>Filter data by date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {DATE_PRESETS.slice(0, 9).map(preset => (
                  <Button
                    key={preset.id}
                    variant={datePreset === preset.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDatePreset(preset.id)}
                    className={datePreset === preset.id ? "bg-[#008cf7]" : ""}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Dynamic Days Selector */}
              <div className="flex gap-2 items-center">
                <Button
                  variant={datePreset === "lastXDays" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDatePreset("lastXDays")}
                  className={`flex-1 ${datePreset === "lastXDays" ? "bg-[#008cf7]" : ""}`}
                >
                  Last
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={e => {
                    setCustomDays(parseInt(e.target.value) || 7)
                    setDatePreset("lastXDays")
                  }}
                  className="w-20 text-center"
                />
                <span className="text-sm text-slate-600">Days</span>
              </div>

              {/* Custom Date Range */}
              <Button
                variant={datePreset === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setDatePreset("custom")}
                className={`w-full ${datePreset === "custom" ? "bg-[#008cf7]" : ""}`}
              >
                Custom Date Range
              </Button>

              {datePreset === "custom" && (
                <div className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs text-slate-500">Start Date</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">End Date</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {dateRange.start && dateRange.end && (
                <div className="text-sm text-slate-500 bg-slate-50 p-2 rounded">
                  {format(dateRange.start, "MMM d, yyyy")} → {format(dateRange.end, "MMM d, yyyy")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Employees & Columns */}
        <div className="space-y-6">
          {/* Employee Filter */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-[#008cf7]" />
                Employees
              </CardTitle>
              <CardDescription>Filter by specific employees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ScrollArea className="h-48 border rounded-lg">
                <div className="p-2 space-y-1">
                  <div
                    onClick={() => setSelectedEmployees([])}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                      selectedEmployees.length === 0 ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <Checkbox checked={selectedEmployees.length === 0} />
                    <span className="font-medium">All Employees</span>
                  </div>
                  <Separator />
                  {users
                    .filter((u: any) => selectedRegion === "all" || u.region === selectedRegion)
                    .map((user: any) => (
                      <div
                        key={user._id}
                        onClick={() => toggleEmployee(user._id)}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                          selectedEmployees.includes(user._id) ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <Checkbox checked={selectedEmployees.includes(user._id)} />
                        <span>{user.firstName} {user.lastName}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    ))
                  }
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Column Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Columns className="h-5 w-5 text-[#008cf7]" />
                Columns
              </CardTitle>
              <CardDescription>Select columns to include</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={selectedDataTypes[0] || "visits"} className="w-full">
                <TabsList className="w-full flex-wrap h-auto">
                  {selectedDataTypes.map(dtId => {
                    const dt = DATA_TYPES.find(d => d.id === dtId)
                    return dt ? (
                      <TabsTrigger key={dt.id} value={dt.id} className="flex-1">
                        {dt.label}
                      </TabsTrigger>
                    ) : null
                  })}
                </TabsList>

                {selectedDataTypes.map(dtId => {
                  const dt = DATA_TYPES.find(d => d.id === dtId)
                  if (!dt) return null
                  return (
                    <TabsContent key={dt.id} value={dt.id} className="mt-4">
                      <div className="flex gap-2 mb-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => selectAllColumns(dt.id)}
                        >
                          Select All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => clearAllColumns(dt.id)}
                        >
                          Clear All
                        </Button>
                      </div>
                      <ScrollArea className="h-48">
                        <div className="space-y-1">
                          {dt.columns.map(col => (
                            <div
                              key={col.key}
                              onClick={() => toggleColumn(dt.id, col.key)}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                                selectedColumns[dt.id]?.includes(col.key) 
                                  ? "bg-blue-50" 
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <Checkbox checked={selectedColumns[dt.id]?.includes(col.key)} />
                              <span className="text-sm">{col.label}</span>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {col.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  )
                })}
              </Tabs>

              {selectedDataTypes.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a data type to configure columns</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Options & Actions */}
        <div className="space-y-6">
          {/* Sorting & Options */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#008cf7]" />
                Options
              </CardTitle>
              <CardDescription>Configure export options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sorting */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                <div className="flex gap-2">
                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="createdAt">Created At</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                  >
                    <ArrowUpDown className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Export Options */}
              <div className="space-y-3">
                <div
                  onClick={() => setIncludeHeaders(!includeHeaders)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Checkbox checked={includeHeaders} />
                  <span className="text-sm">Include Headers</span>
                </div>
                <div
                  onClick={() => setIncludeSummary(!includeSummary)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Checkbox checked={includeSummary} />
                  <span className="text-sm">Add Summary Row</span>
                </div>
                <div
                  onClick={() => setSeparateSheets(!separateSheets)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Checkbox checked={separateSheets} />
                  <span className="text-sm">Separate Sheets per Type</span>
                </div>
                <div
                  onClick={() => setAutoFitColumns(!autoFitColumns)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Checkbox checked={autoFitColumns} />
                  <span className="text-sm">Auto-fit Column Widths</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#008cf7]" />
                Preview
              </CardTitle>
              <CardDescription>Preview first 10 records</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={generatePreview}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Preview
              </Button>

              {Object.keys(previewData).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(previewData).map(([type, data]) => {
                    const dt = DATA_TYPES.find(d => d.id === type)
                    return (
                      <div key={type} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="font-medium">{dt?.label}</span>
                        <Badge>{data.length} records</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                  Click "Load Preview" to see data count
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Button */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-[#008cf7] to-blue-600">
            <CardContent className="pt-6">
              <Button
                className="w-full h-14 text-lg font-semibold bg-white text-[#008cf7] hover:bg-blue-50"
                onClick={generateExcel}
                disabled={isExporting || selectedDataTypes.length === 0}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Generate Excel Report
                  </>
                )}
              </Button>

              <div className="mt-4 text-center text-white/80 text-sm">
                {selectedDataTypes.length} data type(s) selected
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
