# Telesales Component - Developer Guide

**Component Location:** `/components/dashboard/telesales.tsx`  
**Component Name:** `TelessalesRevamp`  
**Framework:** Next.js 14 (App Router) + React 18  
**State Management:** React Hooks + TanStack React Query  

---

## Table of Contents

1. [Component Overview](#component-overview)
2. [State Management](#state-management)
3. [Key Functions](#key-functions)
4. [Mutations](#mutations)
5. [Render Functions](#render-functions)
6. [Hooks & Effects](#hooks--effects)
7. [Data Flow](#data-flow)
8. [Code Walkthrough](#code-walkthrough)
9. [Testing](#testing)
10. [Common Modifications](#common-modifications)

---

## Component Overview

### Purpose
Manages healthcare facility clients and telesales interactions. Aggregates data from visits and machines, enables call recording, and tracks activity timelines.

### Key Responsibilities
1. **Data Aggregation** - Merge visits + machines into unified client list
2. **Search & Filter** - Real-time search on client properties
3. **Add Clients** - Manual client creation
4. **Record Calls** - Multiple call type workflows
5. **Activity Tracking** - Display interaction history
6. **UI State** - Toggle between list and detail views

### Technology Stack
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { Button, Card, Dialog, Input, Textarea } from "@/components/ui/*"
import { apiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/permissions"
```

---

## State Management

### UI State Variables

```typescript
// Client selection state
const [selectedClient, setSelectedClient] = useState<Client | null>(null)

// Dialog visibility states
const [isAddClientDialog, setIsAddClientDialog] = useState(false)
const [isCallRecordingDialog, setIsCallRecordingDialog] = useState(false)

// Search input state
const [searchQuery, setSearchQuery] = useState("")
```

### Form State Variables

```typescript
// Add Client Form
const [addClientForm, setAddClientForm] = useState({
  facilityName: "",              // string
  location: "",                  // string
  contactPersonName: "",         // string
  contactPersonRole: "",         // string
  contactPersonPhone: "",        // string
  machineInstalled: false,       // boolean
})

// Call Recording Form
const [callRecordingForm, setCallRecordingForm] = useState({
  callType: "product_inquiry",           // enum
  productInterest: "",                   // string
  expectedPurchaseDate: "",              // string (date)
  machineModel: "",                      // string
  serviceAccepted: undefined,            // boolean | undefined
  notes: "",                             // string
})
```

### Auth & Permissions

```typescript
const currentUser = authService.getCurrentUserSync()
const isAdmin = hasAdminAccess(currentUser)

// Returns true if user has admin role
// Returns false if no permission - renders access denied
```

---

## Key Functions

### 1. `aggregateClients()`

**Purpose:** Merge visits and machines data into unified client list

**Algorithm:**
```
1. Create empty Map<key, Client>
2. For each visit:
   a. Create key = "facilityName-location"
   b. Check if client exists
   c. If not, create new Client record
   d. Add visit to activityHistory
3. For each machine:
   a. Create key = "facilityName-location"
   b. Check if client exists
   c. If not, create new Client record
   d. Update machineInstalled = true
   e. Add facility contact info
   f. Add installation to activityHistory
4. For each client:
   a. Sort activityHistory by date (newest first)
   b. Set lastActivity = first item
5. Return Array of Client objects
```

**Time Complexity:** O(v + m) where v = visits, m = machines

**Code Structure:**
```typescript
const aggregateClients = (): Client[] => {
  const clientMap = new Map<string, Client>()

  // Process visits
  const visitsArray = Array.isArray(visits) ? visits : []
  visitsArray.forEach((visit) => {
    // Create or update client
    const key = `${visit.client.name}-${visit.client.location || 'unknown'}`
    if (!clientMap.has(key)) {
      clientMap.set(key, { /* new Client */ })
    }
    // Add to activity history
    clientMap.get(key)!.activityHistory.push({
      type: 'visit',
      date: visit.date,
      description: `Visit - ${visit.visitPurpose}`
    })
  })

  // Process machines
  const machinesArray = Array.isArray(machines) ? machines : []
  machinesArray.forEach((machine) => {
    // Similar logic...
  })

  // Finalize
  const clients = Array.from(clientMap.values())
  clients.forEach((client) => {
    client.activityHistory.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    client.lastActivity = client.activityHistory[0]
  })

  return clients
}
```

**Called By:** useMemo hook
**Returns:** `Client[]`
**Dependencies:** `visitsData, machinesData`

---

### 2. `getDateTimeNow()`

**Purpose:** Capture current date and time for auto-recording

**Implementation:**
```typescript
const now = new Date()
const callDate = now.toISOString().split('T')[0]  // "2026-03-12"
const callTime = now.toTimeString().slice(0, 5)   // "14:30"
const year = now.getFullYear()                    // 2026
const month = now.getMonth() + 1                  // 1-12
const week = Math.ceil(now.getDate() / 7)         // 1-4/5
```

**Called By:** `recordCallMutation`
**Returns:** Object with date/time strings

---

### 3. `renderClientList()`

**Purpose:** Display list of all clients

**Conditional Rendering:**
```typescript
const renderClientList = () => (
  <div className="space-y-3">
    {filteredClients.length === 0 ? (
      // Empty state
      <div className="col-span-full text-center py-12">
        <AlertCircle/>
        <p>No clients found</p>
        <Button onClick={() => setIsAddClientDialog(true)}>
          Add New Client
        </Button>
      </div>
    ) : (
      // Client cards
      filteredClients.map((client) => (
        <Card key={client.id} onClick={() => setSelectedClient(client)}>
          {/* Card content */}
        </Card>
      ))
    )}
  </div>
)
```

**Called By:** Main render
**Returns:** JSX.Element

---

### 4. `renderClientDetails()`

**Purpose:** Display selected client's full profile

**Layout:**
```
Back Button
     ↓
Facility Card (name, location, contact, machine status)
     ↓
Action Buttons (Record Call, Call Now)
     ↓
Activity Timeline (chronological history)
```

**Back Navigation:**
```typescript
<Button onClick={() => setSelectedClient(null)}>
  <ArrowLeft className="mr-2 h-4 w-4" />
  Back to Clients
</Button>
```

**Conditional Rendering:**
```typescript
const renderClientDetails = () => {
  if (!selectedClient) return null
  
  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Details Card */}
      {/* Action Buttons */}
      {/* Activity Timeline */}
    </div>
  )
}
```

**Called By:** Main render (ternary conditional)
**Returns:** JSX.Element | null

---

## Mutations

### 1. `addClientMutation`

**Purpose:** Create new client record

**Configuration:**
```typescript
const addClientMutation = useMutation({
  mutationFn: async (data: typeof addClientForm) => {
    // Creates client object in memory
    const newClient: Client = {
      id: `manual-${Date.now()}`,
      facilityName: data.facilityName,
      location: data.location,
      machineInstalled: data.machineInstalled,
      contactPerson: {
        name: data.contactPersonName,
        role: data.contactPersonRole,
        phone: data.contactPersonPhone,
      },
      activityHistory: [{
        type: 'call',
        date: new Date().toISOString(),
        description: 'Client added to system',
      }],
      source: 'manual',
    }
    return newClient
  },
  onSuccess: () => {
    // Show success toast
    toast({
      title: "Success",
      description: "Client added successfully",
    })
    // Reset form
    setAddClientForm({
      facilityName: "",
      location: "",
      // ... all fields reset
    })
    // Close dialog
    setIsAddClientDialog(false)
    // Invalidate cache (optional - would trigger refetch)
    qc.invalidateQueries({ queryKey: ["telesales-visits"] })
    qc.invalidateQueries({ queryKey: ["telesales-machines"] })
  },
  onError: () => {
    // Show error toast
    toast({
      title: "Error",
      description: "Failed to add client",
      variant: "destructive",
    })
  },
})
```

**Invocation:**
```typescript
<Button
  onClick={() => addClientMutation.mutate(addClientForm)}
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
```

**State Management:**
- Pending: `addClientMutation.isPending`
- Error: `addClientMutation.error`
- Success: `addClientMutation.isSuccess`

---

### 2. `recordCallMutation`

**Purpose:** Create call log record via API

**Configuration:**
```typescript
const recordCallMutation = useMutation({
  mutationFn: async (data: CallRecord) => {
    if (!selectedClient) throw new Error("No client selected")

    const now = new Date()
    const callDate = now.toISOString().split('T')[0]
    const callTime = now.toTimeString().slice(0, 5)

    // Determine API payload based on call type
    if (data.callType === 'service_inquiry' && data.serviceAccepted) {
      // Service accepted: create service request
      return await apiService.createCallLog({
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
    } else {
      // Other types: regular call log
      return await apiService.createCallLog({
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
  },
  onSuccess: () => {
    // Show success toast
    toast({
      title: "Success",
      description: "Call recorded successfully",
    })
    
    // Update activity in selected client
    if (selectedClient) {
      selectedClient.activityHistory.unshift({
        type: 'call',
        date: new Date().toISOString(),
        description: `Call recorded - ${callRecordingForm.callType.replace('_', ' ')}`,
      })
    }

    // Reset form
    setCallRecordingForm({
      callType: 'product_inquiry',
      productInterest: "",
      expectedPurchaseDate: "",
      machineModel: "",
      serviceAccepted: undefined,
      notes: "",
    })

    // Close dialog
    setIsCallRecordingDialog(false)

    // Invalidate call logs cache
    qc.invalidateQueries({ queryKey: ["callLogs"] })
  },
  onError: (error: any) => {
    // Show error toast with message
    toast({
      title: "Error",
      description: error.message || "Failed to record call",
      variant: "destructive",
    })
  },
})
```

**Invocation:**
```typescript
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
```

---

## Render Functions

### Main Render Logic

```typescript
return (
  <div className="space-y-6">
    {/* Header section */}
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Telesales Management</h1>
        <p className="text-muted-foreground">Manage facilities, contacts, and sales interactions</p>
      </div>
      <div className="flex gap-2">
        {/* Refresh & Add buttons */}
      </div>
    </div>

    {/* Main content - conditional routing */}
    {selectedClient ? (
      renderClientDetails()        // Detail view
    ) : (
      <>
        {/* Search bar */}
        {/* Client list */}
      </>                           // List view
    )}

    {/* Dialogs */}
    <Dialog open={isAddClientDialog} onOpenChange={setIsAddClientDialog}>
      {/* Add Client Form */}
    </Dialog>

    <Dialog open={isCallRecordingDialog} onOpenChange={setIsCallRecordingDialog}>
      {/* Call Recording Form */}
    </Dialog>
  </div>
)
```

### Permission Guard

```typescript
if (!isAdmin) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <p className="text-red-800">
          You don't have permission to access the Telesales module.
        </p>
      </CardContent>
    </Card>
  )
}
```

---

## Hooks & Effects

### useQuery - Visits

```typescript
const { data: visitsData } = useQuery({
  queryKey: ["telesales-visits"],
  queryFn: async () => {
    const result = await apiService.getVisits(1, 1000)
    return result
  },
  staleTime: 5 * 60 * 1000,  // 5 minutes
})
```

**Why 5 minutes?**
- Balance freshness with reducing API load
- Telesales data doesn't change frequently
- Users unlikely to make 2+ visits per 5 minutes

---

### useQuery - Machines

```typescript
const { data: machinesData } = useQuery({
  queryKey: ["telesales-machines"],
  queryFn: async () => {
    const result = await apiService.getMachines(1, 1000)
    return result
  },
  staleTime: 5 * 60 * 1000,
})
```

---

### useMemo - Aggregation

```typescript
const allClients = useMemo(
  () => aggregateClients(),
  [visitsData, machinesData]  // Recalculate only on data change
)
```

**Performance Impact:**
- Without memo: recalculates on every render
- With memo: recalculates only when source data changes
- Saves ~100-200ms on each keystroke in large datasets

---

### useMemo - Filtering

```typescript
const filteredClients = useMemo(() => {
  return allClients.filter((client) =>
    client.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contactPerson?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
}, [allClients, searchQuery])
```

**Search Logic:**
- Case-insensitive matching
- Searches 3 fields: facility name, location, contact name
- Returns matching subset

---

### useQueryClient

```typescript
const qc = useQueryClient()

// Later, in mutations:
qc.invalidateQueries({ queryKey: ["telesales-visits"] })
qc.invalidateQueries({ queryKey: ["telesales-machines"] })
qc.invalidateQueries({ queryKey: ["callLogs"] })
```

**Purpose:** Invalidate cache to trigger refetch

---

## Data Flow

### Initialization Flow

```
Component Mount
     ↓
useQuery("telesales-visits") executes
  ├─ Fetches /api/visits
  ├─ Caches for 5 minutes
  └─ Returns data
     ↓
useQuery("telesales-machines") executes
  ├─ Fetches /api/machines
  ├─ Caches for 5 minutes
  └─ Returns data
     ↓
First render with null data
     ↓
Both queries resolve
     ↓
useMemo(aggregateClients) triggers
  ├─ Merges visits + machines
  ├─ Creates unified client list
  └─ Returns Client[]
     ↓
useMemo(filteredClients) triggers
  ├─ Applies search filter
  └─ Returns filtered Client[]
     ↓
Component re-renders with client list
     ↓
List displays with search ready
```

### User Interaction Flow - Recording Call

```
User clicks "Record Call"
     ↓
isCallRecordingDialog = true
     ↓
Dialog opens with form
     ↓
User fills form and clicks "Record Call"
     ↓
callRecordingForm captured
selectedClient captured
     ↓
recordCallMutation.mutate() invoked
     ↓
mutationFn executes:
  ├─ Validates selectedClient exists
  ├─ Captures date/time
  ├─ Determines call type logic
  ├─ Builds API payload
  └─ Calls apiService.createCallLog()
     ↓
API Call sent to backend
     ↓
Backend validates & saves
     ↓
Backend returns call log object
     ↓
onSuccess() executes:
  ├─ Shows toast notification
  ├─ Updates activity timeline
  ├─ Resets form
  ├─ Closes dialog
  └─ Invalidates cache
     ↓
Component re-renders (updated activity)
```

---

## Code Walkthrough

### Adding a Client

```typescript
// 1. User fills form
setAddClientForm({
  facilityName: "Aga Khan Hospital",
  location: "Nairobi",
  contactPersonName: "John Mwangi",
  contactPersonRole: "Facilities Manager",
  contactPersonPhone: "+254-700-123456",
  machineInstalled: false,
})

// 2. User clicks "Add Client" button
onClick={() => addClientMutation.mutate(addClientForm)}

// 3. mutationFn executes
mutationFn: async (data) => {
  const newClient: Client = {
    id: `manual-${Date.now()}`,  // e.g., "manual-1710226245000"
    facilityName: data.facilityName,
    location: data.location,
    machineInstalled: data.machineInstalled,
    contactPerson: {
      name: data.contactPersonName,
      role: data.contactPersonRole,
      phone: data.contactPersonPhone,
    },
    activityHistory: [{
      type: 'call',
      date: new Date().toISOString(),
      description: 'Client added to system',
    }],
    source: 'manual',
  }
  return newClient  // Immediately returns (no API call)
}

// 4. onSuccess() executes
onSuccess: () => {
  toast({ title: "Success", description: "Client added successfully" })
  
  setAddClientForm({  // Reset form
    facilityName: "",
    location: "",
    contactPersonName: "",
    contactPersonRole: "",
    contactPersonPhone: "",
    machineInstalled: false,
  })
  
  setIsAddClientDialog(false)  // Close dialog
  
  // Optionally refresh from API
  qc.invalidateQueries({ queryKey: ["telesales-visits"] })
  qc.invalidateQueries({ queryKey: ["telesales-machines"] })
}

// 5. Component re-renders
// New client available in next aggregation cycle
```

### Recording a Service Request

```typescript
// 1. User selects Client, clicks "Record Call"
// 2. Dialog opens, user selects "Service Inquiry"
// 3. Form updates to show:
//    - Machine Model input
//    - Accept/Decline buttons
// 4. User fills: machineModel = "CT Scanner X-2500"
// 5. User clicks "Accepted" button
setCallRecordingForm({
  ...callRecordingForm,
  serviceAccepted: true,
})

// 6. Form styling updates (button becomes primary)
<Button
  variant={callRecordingForm.serviceAccepted === true ? "default" : "outline"}
  onClick={() => setCallRecordingForm({...callRecordingForm, serviceAccepted: true})}
>
  <CheckCircle2 className="mr-2 h-4 w-4" />
  Accepted
</Button>

// 7. User clicks "Record Call"
recordCallMutation.mutate({
  clientId: selectedClient?.id || "",
  ...callRecordingForm,
})

// 8. mutationFn checks condition
if (
  data.callType === 'service_inquiry' &&
  data.serviceAccepted
) {
  // Service accepted path
  return await apiService.createCallLog({
    clientName: "Nairobi West Hospital",
    clientPhone: "+254-722-654321",
    callDirection: 'outbound',
    callDate: "2026-03-12",
    callTime: "15:45",
    callDuration: 0,
    callOutcome: 'interested',
    year: 2026,
    month: 3,
    week: 2,
    nextAction: "Service request created - CT Scanner X-2500",
    callNotes: "",  // User's notes if provided
  })
}

// 9. API call sent to backend
// Backend processes and creates:
//    a) Call log record
//    b) Service task for engineers
//    c) Returns {_id: "call-123456", ...}

// 10. onSuccess() executes
onSuccess: () => {
  toast({
    title: "Success",
    description: "Call recorded successfully",
  })
  
  // Add to activity timeline immediately
  if (selectedClient) {
    selectedClient.activityHistory.unshift({
      type: 'call',
      date: new Date().toISOString(),
      description: 'Call recorded - service inquiry',
    })
  }
  
  // Reset & close
  setCallRecordingForm({...})
  setIsCallRecordingDialog(false)
  qc.invalidateQueries({ queryKey: ["callLogs"] })
}

// 11. Component re-renders
// Activity timeline now shows the new call
// Timeline shows "Call recorded - service inquiry"
// Engineer team can see service task in their queue
```

---

## Testing

### Test Cases to Add

```typescript
describe('TelessalesRevamp Component', () => {
  
  // Data Aggregation Tests
  test('aggregateClients merges visits and machines', () => {
    const visits = [...]
    const machines = [...]
    const result = aggregateClients()
    // Assert merged data
  })

  test('removes duplicate clients by facility-location', () => {
    // Two sources with same facility
    // Should merge into single client record
  })

  test('sorts activity history chronologically', () => {
    // Activities should be newest first
  })

  // Search Tests
  test('filters clients by facility name', () => {
    // setSearchQuery("Aga Khan")
    // filteredClients should match
  })

  test('case-insensitive search', () => {
    // "aga khan" should match "Aga Khan Hospital"
  })

  // Mutation Tests
  test('addClientMutation creates client', async () => {
    // Call mutation
    // Assert client added to state
  })

  test('recordCallMutation sends correct payload', async () => {
    // Mock apiService.createCallLog
    // Call mutation with form data
    // Assert API called with expected payload
  })

  // UI Tests
  test('shows empty state when no clients', () => {
    // Empty visits & machines
    // Should show "No clients found" + "Add New Client" button
  })

  test('toggles between list and detail view', () => {
    // Click client
    // Detail view renders
    // Click back
    // List view renders
  })
})
```

---

## Common Modifications

### Mod 1: Add Phone Call Integration

```typescript
// Current: Just opens tel protocol
onClick={() => {
  if (selectedClient.contactPerson?.phone) {
    window.location.href = `tel:${selectedClient.contactPerson.phone}`
  }
}}

// Enhanced: With call tracking
onClick={() => {
  const phone = selectedClient.contactPerson?.phone
  if (phone) {
    // Log intent
    console.log(`Initiating call to ${phone}`)
    
    // Open phone app
    window.location.href = `tel:${phone}`
    
    // Start timer
    const callStartTime = new Date()
    
    // Could track call duration here
  }
}}
```

### Mod 2: Add Bulk Upload

```typescript
// Add state
const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null)

// Add mutation
const bulkUploadMutation = useMutation({
  mutationFn: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    // POST to API endpoint
    return await fetch('/api/clients/bulk-import', {
      method: 'POST',
      body: formData,
    }).then(r => r.json())
  },
})

// Add button in header
<Button>
  <Upload className="mr-2 h-4 w-4" />
  Bulk Import
</Button>
```

### Mod 3: Add Call Recording Audio

```typescript
// Add audio recording state
const [isRecording, setIsRecording] = useState(false)
const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
const mediaRecorderRef = useRef<MediaRecorder | null>(null)

// Start recording
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const recorder = new MediaRecorder(stream)
  mediaRecorderRef.current = recorder
  setIsRecording(true)
  recorder.start()
}

// Stop recording
const stopRecording = () => {
  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.stop()
    mediaRecorderRef.current.ondataavailable = (e) => {
      setAudioBlob(e.data)
    }
  }
  setIsRecording(false)
}

// Include in form submission
const audioFile = audioBlob
  ? new File([audioBlob], `call-${Date.now()}.wav`, { type: 'audio/wav' })
  : null
```

### Mod 4: Add Email Notifications

```typescript
// In recordCallMutation onSuccess
onSuccess: () => {
  // ... existing code ...
  
  // Send email notification
  sendEmailNotification({
    to: selectedClient.contactPerson?.email,
    subject: `Call recorded - ${selectedClient.facilityName}`,
    body: `Your call has been logged. Follow-up scheduled for: ${callRecordingForm.expectedPurchaseDate || 'TBD'}`,
  })
}
```

---

## Performance Optimization Tips

1. **Pagination:** Enable pagination for >1000 clients
   ```typescript
   const [limit, setLimit] = useState(50)  // Instead of 1000
   ```

2. **Infinite Scroll:** Implement for better UX
   ```typescript
   // Use react-intersection-observer
   const { ref } = useInView({
     onInView: () => setPage(p => p + 1)
   })
   ```

3. **Debounce Search:** Reduce filtering frequency
   ```typescript
   useEffect(() => {
     const timer = setTimeout(() => {
       setSearchQuery(delayedQuery)
     }, 300)
     return () => clearTimeout(timer)
   }, [delayedQuery])
   ```

4. **Lazy Load Details:** Load full details on panel open
   ```typescript
   const [clientDetails, setClientDetails] = useState(null)
   const loadDetails = useCallback(async (clientId) => {
     // Fetch full client details
   }, [])
   ```

---

## Deployment Checklist

- [ ] All TypeScript types defined
- [ ] Error handling for all API calls
- [ ] Loading states for async operations
- [ ] Permission checks in place
- [ ] Toast notifications configured
- [ ] Mobile responsive design tested
- [ ] Accessibility (a11y) tested
- [ ] Performance metrics checked (Lighthouse)
- [ ] API rate limiting considered
- [ ] Documentation updated

