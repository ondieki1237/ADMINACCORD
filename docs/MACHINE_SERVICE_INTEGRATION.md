# Machine-Service Integration Guide

## Overview
Complete integration between Machines and Engineering Services, enabling admins to manage service history and create new services directly from machine details.

---

## Features Implemented

### 1. Service History View
- **Location**: Machine details dialog → "View Service History" button
- **Purpose**: Display complete service history for any machine
- **Features**:
  - Timeline view of all services
  - Color-coded service types (Installation: Blue, Repair: Red, Maintenance: Yellow, Calibration: Purple)
  - Status badges for each service
  - Engineer information (name, phone)
  - Service dates and notes
  - Empty state when no history exists

### 2. Create Service from Machine
- **Location**: Machine details dialog → "Create Service" button OR Service History dialog
- **Purpose**: Create new engineering service linked to machine
- **Pre-filled Data**:
  - Machine details (model, manufacturer, serial number)
  - Facility information (name, location)
  - Machine ID for backend linking

### 3. Quick Actions on Machine Cards
- **View Details**: Opens machine details dialog
- **History**: Directly opens service history dialog (bypasses details)

---

## User Workflow

### Viewing Service History
1. Navigate to Machines page (`/dashboard/machines`)
2. Click "History" button on machine card OR click "View Details" → "View Service History"
3. Service History Dialog opens showing:
   - All past services in timeline format
   - Service type, status, dates, engineer, notes
   - Option to create new service

### Creating Service from Machine
1. Open machine details or service history dialog
2. Click "Create Service" button
3. Create Service Dialog opens with:
   - Machine info displayed (read-only reference)
   - Service type dropdown (installation, maintenance, repair, calibration)
   - Scheduled date picker
   - Engineer name and phone inputs
   - Status dropdown (scheduled, in-progress, completed, cancelled)
   - Notes textarea
4. Fill required fields:
   - Service Type *
   - Scheduled Date *
   - Engineer Name *
   - Engineer Phone *
5. Click "Create Service"
6. Service created with `machineId` linking back to machine
7. Engineer receives notification (backend handles this)

---

## Technical Implementation

### State Management
```typescript
// Dialog states
const [isServiceHistoryDialogOpen, setIsServiceHistoryDialogOpen] = useState(false)
const [isCreateServiceDialogOpen, setIsCreateServiceDialogOpen] = useState(false)

// Service form state
const [serviceFormData, setServiceFormData] = useState({
  serviceType: "maintenance",
  scheduledDate: "",
  engineerName: "",
  engineerPhone: "",
  engineerId: "",
  notes: "",
  status: "scheduled"
})
```

### React Query Hooks

#### Service History Query
```typescript
const { data: serviceHistoryData, isLoading: servicesLoading, refetch: refetchServices } = useQuery({
  queryKey: ["machine-services", machineId],
  queryFn: async () => {
    console.log(`🔧 Fetching service history for machine: ${machineId}`)
    const response = await apiService.getMachineServices(machineId, 1, 50)
    console.log("✅ Service history response:", response)
    return response
  },
  enabled: isServiceHistoryDialogOpen && !!machineId,
  staleTime: 0
})
```

#### Create Service Mutation
```typescript
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
```

### API Methods Used

#### Get Machine Services
```typescript
// lib/api.ts
getMachineServices: async (machineId: string, page = 1, limit = 10) => {
  const token = authService.getToken()
  const response = await fetch(
    `${API_BASE}/machines/${machineId}/services?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    }
  )
  if (!response.ok) throw new Error("Failed to fetch machine services")
  return response.json()
}
```

#### Create Engineering Service
```typescript
// lib/api.ts
createEngineeringService: async (payload: any) => {
  const token = authService.getToken()
  const response = await fetch(`${API_BASE}/engineering-services`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  if (!response.ok) throw new Error("Failed to create engineering service")
  return response.json()
}
```

### Helper Functions

#### Parse Services Response
```typescript
const parseServices = (data: any) => {
  if (!data) return []
  if (data.data?.docs) return data.data.docs
  if (Array.isArray(data.data)) return data.data
  if (data.docs) return data.docs
  if (Array.isArray(data)) return data
  return []
}

// Usage
const services = parseServices(serviceHistoryData)
```

#### Reset Service Form
```typescript
const resetServiceForm = () => {
  setServiceFormData({
    serviceType: "maintenance",
    scheduledDate: "",
    engineerName: "",
    engineerPhone: "",
    engineerId: "",
    notes: "",
    status: "scheduled"
  })
}
```

#### Handle Create Service
```typescript
const handleCreateService = () => {
  if (!selectedMachine) return
  
  const payload = {
    facility: {
      name: selectedMachine.facility?.name || "",
      location: selectedMachine.facility?.location || ""
    },
    serviceType: serviceFormData.serviceType,
    engineerInCharge: {
      name: serviceFormData.engineerName.trim(),
      phone: serviceFormData.engineerPhone.trim()
    },
    machineDetails: `${selectedMachine.manufacturer} ${selectedMachine.model} (S/N: ${selectedMachine.serialNumber})`,
    machineId: selectedMachine._id || selectedMachine.id, // Key linking field
    status: serviceFormData.status,
    notes: serviceFormData.notes.trim(),
    scheduledDate: serviceFormData.scheduledDate
  }

  createServiceMutation.mutate(payload)
}
```

---

## UI Components

### Service History Dialog
- **Title**: Shows machine model
- **Subtitle**: Manufacturer and serial number
- **Loading State**: Spinner animation
- **Timeline Cards**: Each service displayed in bordered card with:
  - Service type badge (color-coded)
  - Status badge
  - Date
  - Engineer icon + name + phone
  - Notes section
- **Empty State**: History icon + message
- **Actions**: Close, Create Service

### Create Service Dialog
- **Machine Info Section**: Blue background panel showing:
  - Model, Manufacturer, Serial Number, Facility
- **Service Type Dropdown**: 4 options (installation, maintenance, repair, calibration)
- **Date Picker**: Scheduled date
- **Engineer Section**: Name and phone inputs
- **Status Dropdown**: 4 options (scheduled, in-progress, completed, cancelled)
- **Notes Textarea**: Multi-line description
- **Validation**: Submit disabled until all required fields filled

### Machine Card Actions
```tsx
<div className="flex flex-col gap-2 ml-4">
  <Button size="sm" onClick={() => openMachine(machine)}>
    View Details
  </Button>
  <Button size="sm" variant="outline" onClick={() => openServiceHistory(machine)}>
    <History className="h-3 w-3 mr-1" />
    History
  </Button>
</div>
```

---

## Backend Integration

### Expected Backend Endpoints

#### GET /api/machines/:id/services
**Response Format**:
```json
{
  "data": {
    "docs": [
      {
        "_id": "service-id",
        "serviceType": "maintenance",
        "status": "completed",
        "scheduledDate": "2024-01-15T00:00:00.000Z",
        "engineerInCharge": {
          "name": "John Doe",
          "phone": "+254712345678"
        },
        "notes": "Routine maintenance completed",
        "createdAt": "2024-01-10T00:00:00.000Z"
      }
    ]
  }
}
```

#### POST /api/engineering-services
**Request Payload**:
```json
{
  "facility": {
    "name": "Kenyatta National Hospital",
    "location": "Nairobi"
  },
  "serviceType": "maintenance",
  "engineerInCharge": {
    "name": "John Doe",
    "phone": "+254712345678"
  },
  "machineDetails": "Acme Medical XRay 5000 (S/N: ABC123)",
  "machineId": "machine-object-id",
  "status": "scheduled",
  "notes": "Routine maintenance check",
  "scheduledDate": "2024-02-01T00:00:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "new-service-id",
    "serviceType": "maintenance",
    "status": "scheduled",
    "machineId": "machine-object-id"
  }
}
```

---

## Service Type Color Coding

```typescript
const serviceTypeColor = 
  service.serviceType === "installation" ? "bg-blue-100 text-blue-800" :
  service.serviceType === "repair" ? "bg-red-100 text-red-800" :
  service.serviceType === "calibration" ? "bg-purple-100 text-purple-800" :
  "bg-yellow-100 text-yellow-800" // maintenance (default)
```

---

## Cache Management

Both queries and mutations invalidate caches to ensure real-time updates:

```typescript
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["machine-services"] }) // Refresh service history
  qc.invalidateQueries({ queryKey: ["machines"] })         // Refresh machine list
}
```

---

## Error Handling

### Service History Loading
- Shows spinner during fetch
- Displays empty state if no services found
- Logs errors to console

### Service Creation
- Form validation prevents submission with missing fields
- Toast notifications for success/error
- Detailed error messages from backend
- Console logging for debugging

---

## Icons Used

| Icon | Usage |
|------|-------|
| `History` | Service history button, empty state |
| `ClipboardList` | Create service button |
| `UserCog` | Engineer information display |
| `Cpu` | Machine details section header |
| `Plus` | Create/add actions |

---

## Best Practices

1. **Always link services to machines**: Use `machineId` field in payload
2. **Pre-fill machine data**: Copy facility info from machine to service
3. **Validate inputs**: Require service type, date, engineer details
4. **Show machine context**: Display machine details in service form
5. **Invalidate caches**: Refresh both machines and services after mutations
6. **Handle loading states**: Show spinners, disable buttons during operations
7. **Provide feedback**: Toast notifications for all actions
8. **Log for debugging**: Console logs for API calls and responses

---

## Navigation Paths

### From Dashboard
1. Dashboard Overview → Machines Card → Machines List
2. Select machine → View Details → View Service History
3. Select machine → View Details → Create Service

### Quick Access
1. Dashboard Overview → Machines Card → Machines List
2. Select machine → History (direct)

### Cross-Dialog Navigation
1. Machine Details → View Service History → Create Service
2. Service History → Create Service (from footer button)

---

## Future Enhancements

### Potential Features
- [ ] Filter service history by type/status
- [ ] Export service history to PDF
- [ ] Link to engineer profile from service history
- [ ] In-line editing of service details
- [ ] Service cost tracking
- [ ] Automatic service scheduling based on machine's nextServiceDue
- [ ] Service reminder notifications
- [ ] Attach photos/documents to services
- [ ] Service completion verification workflow
- [ ] Service quality ratings

### Backend Improvements
- Engineer assignment notifications (email/SMS)
- Bidirectional navigation: Engineer app → View assigned machine details
- Service history analytics (MTTR, service frequency)
- Predictive maintenance alerts

---

## Testing Checklist

- [x] View service history for machine with services
- [x] View service history for machine with no services (empty state)
- [x] Create service from machine details dialog
- [x] Create service from service history dialog
- [x] Quick access via History button on machine card
- [x] Form validation (required fields)
- [x] Pre-filled machine data displays correctly
- [x] Service type dropdown works
- [x] Date picker works
- [x] Status dropdown works
- [x] Notes textarea accepts input
- [x] Submit button disabled when fields missing
- [x] Success toast on service creation
- [x] Error toast on failure
- [x] Dialog closes after success
- [x] Form resets after creation
- [x] Service history refreshes after new service created
- [x] Machine list updates (lastServicedAt, nextServiceDue if backend updates)

---

## Support

For backend API documentation, see:
- `MACHINES_ADMIN_PANEL.md` - Machine management
- `BACKEND_REQUIREMENTS.md` - Engineering services API
- `API_QUICK_REFERENCE.md` - All endpoints

For UI components:
- `components/ui/*` - Radix UI components
- `lucide-react` - Icon library

---

## Summary

This integration creates a seamless workflow for managing machine services:
- Admins can view complete service history for any machine
- Services can be created directly from machine context
- Machine data pre-fills service forms (facility, equipment details)
- Engineers are assigned and notified
- Services are linked back to machines via `machineId`
- Real-time updates via query invalidation

The result is a bidirectional Machine ↔ Service relationship that improves operational efficiency and service tracking.
