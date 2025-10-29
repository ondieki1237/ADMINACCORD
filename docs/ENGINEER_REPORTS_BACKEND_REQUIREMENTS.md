# Engineer Reports/Duties System - Backend Requirements

## Overview
Updated engineer reports system with enhanced functionality for creating duties, assigning engineers, and managing service requests.

---

## API Endpoints Required

### 1. **GET /api/engineering-services**
Fetch paginated list of all engineering services/duties

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `serviceType` (string) - Filter by type: installation, maintenance, service, other
- `facilityName` (string) - Filter by facility name (partial match)
- `startDate` (string) - Filter from date (ISO format)
- `endDate` (string) - Filter to date (ISO format)
- `status` (string) - Filter by status: pending, assigned, completed, cancelled
- `engineerId` (string) - Filter by assigned engineer

**Response:**
```json
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "service123",
        "date": "2025-01-15T10:00:00Z",
        "facility": {
          "name": "City Hospital",
          "location": "Downtown, Nairobi"
        },
        "serviceType": "maintenance",
        "engineerInCharge": {
          "_id": "eng123",
          "name": "John Doe",
          "phone": "+254712345678"
        },
        "machineDetails": "Model X500 - Serial #12345",
        "conditionBefore": "Machine not functioning",
        "conditionAfter": "Fully operational",
        "status": "completed",
        "notes": "Replaced faulty component",
        "scheduledDate": "2025-01-15T08:00:00Z",
        "userId": {
          "firstName": "Admin",
          "lastName": "User"
        },
        "createdAt": "2025-01-10T12:00:00Z",
        "updatedAt": "2025-01-15T14:30:00Z"
      }
    ],
    "totalDocs": 45,
    "totalPages": 3,
    "page": 1,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 2. **POST /api/engineering-services**
Create a new engineering duty/service request

**Request Body:**
```json
{
  "date": "2025-02-01T09:00:00Z",
  "facility": {
    "name": "Metro Hospital",
    "location": "Westlands, Nairobi"
  },
  "serviceType": "installation",
  "engineerInCharge": {
    "_id": "eng456",
    "name": "Jane Smith",
    "phone": "+254723456789"
  },
  "machineDetails": "New CT Scanner - Model Y200",
  "status": "pending",
  "notes": "Installation of new equipment",
  "scheduledDate": "2025-02-01T08:00:00Z",
  "conditionBefore": "",
  "conditionAfter": ""
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "service789",
    "date": "2025-02-01T09:00:00Z",
    "facility": {
      "name": "Metro Hospital",
      "location": "Westlands, Nairobi"
    },
    "serviceType": "installation",
    "engineerInCharge": {
      "_id": "eng456",
      "name": "Jane Smith",
      "phone": "+254723456789"
    },
    "status": "pending",
    "createdAt": "2025-01-20T10:00:00Z"
  },
  "message": "Service created successfully"
}
```

---

### 3. **PUT /api/engineering-services/:id**
Update an existing engineering service (assign engineer, update status, etc.)

**Request Body:**
```json
{
  "engineerInCharge": {
    "_id": "eng789",
    "name": "Bob Johnson",
    "phone": "+254734567890"
  },
  "scheduledDate": "2025-02-05T10:00:00Z",
  "status": "assigned",
  "notes": "Engineer assigned for maintenance"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "service789",
    "engineerInCharge": {
      "_id": "eng789",
      "name": "Bob Johnson",
      "phone": "+254734567890"
    },
    "status": "assigned",
    "updatedAt": "2025-01-21T11:00:00Z"
  },
  "message": "Service updated successfully"
}
```

---

### 4. **GET /api/engineering-services/by-engineer/:engineerId**
Get all services assigned to a specific engineer

**Query Parameters:**
- `page`, `limit`, `startDate`, `endDate`, `serviceType`, `status` (same as GET /api/engineering-services)

**Response:** Same structure as GET /api/engineering-services

---

### 5. **GET /api/users**
Fetch all users (for engineer selection) - EXISTING ENDPOINT

**Query Parameters:**
- `role` (optional) - Filter by role (e.g., "engineer")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@accord.com",
      "phone": "+254712345678",
      "mobile": "+254712345678",
      "role": "engineer",
      "employeeId": "ENG001"
    }
  ]
}
```

---

### 6. **DELETE /api/engineering-services/:id** (Optional)
Delete a service/duty

**Response:**
```json
{
  "success": true,
  "message": "Service deleted successfully"
}
```

---

## Database Schema

### EngineeringService Model

```javascript
{
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  facility: {
    name: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: false
    }
  },
  serviceType: {
    type: String,
    enum: ['installation', 'maintenance', 'service', 'other'],
    required: true
  },
  engineerInCharge: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    phone: String
  },
  machineDetails: {
    type: String,
    required: false
  },
  conditionBefore: {
    type: String,
    required: false
  },
  conditionAfter: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    required: false
  },
  scheduledDate: {
    type: Date,
    required: false
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  otherPersonnel: [{
    type: String
  }],
  nextServiceDate: {
    type: Date,
    required: false
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

---

## Authentication & Authorization

### Required Permissions:
- **Admin/Manager**: Full access (create, read, update, delete all services)
- **Engineer**: Read services assigned to them, update status/condition
- **Staff**: Create service requests only

### Headers:
```
Authorization: Bearer <access_token>
```

---

## Frontend Features Implemented

### 1. **Create Duty Modal**
- Select duty type: Installation, Maintenance, Service, Other
- Assign to any user (engineer/staff)
- Facility name and location
- Scheduled date & time
- Machine details
- Description/notes

### 2. **Assign Services Modal**
- Bulk assign multiple selected services
- Select engineer from searchable list
- Set scheduled date
- Add assignment notes

### 3. **Engineer Picker**
- Search engineers by name, email, or employee ID
- Display all users with role information
- Select engineer for duty creation or assignment

### 4. **Filters**
- Facility name (text search)
- Service type (dropdown)
- Status (dropdown)
- Date range (from/to dates)
- Engineer filter

### 5. **Services Table**
- Checkbox selection for bulk operations
- Display: Date, Facility, Location, Type, Engineer, Status, Machine
- Color-coded status badges
- Color-coded duty type badges
- Action buttons (View, Edit)
- Pagination

### 6. **Statistics Dashboard**
- Total Services count
- Pending count (yellow)
- Completed count (green)
- Total Engineers count (blue)

---

## Status Values

### Service Status:
- `pending` - Newly created, not yet assigned
- `assigned` - Assigned to engineer
- `in-progress` - Engineer is working on it
- `completed` - Successfully completed
- `cancelled` - Cancelled or no longer needed

### Service Types:
- `installation` - New equipment installation
- `maintenance` - Routine maintenance
- `service` - Repair/service work
- `other` - Other types of duties

---

## Example Workflows

### Create New Duty:
1. Admin clicks "Create Duty" button
2. Selects duty type
3. Searches and selects engineer
4. Enters facility details
5. Sets scheduled date
6. Adds machine details and notes
7. Clicks "Create Duty"
8. POST request to `/api/engineering-services`

### Bulk Assign Services:
1. Admin selects multiple pending services
2. Clicks "Assign Selected"
3. Searches and selects engineer
4. Sets scheduled date
5. Adds notes
6. Clicks "Assign Services"
7. Multiple PUT requests to `/api/engineering-services/:id`

### Filter Services:
1. Admin enters filter criteria
2. Clicks "Search"
3. GET request with query parameters
4. Table updates with filtered results

---

## Migration Notes

### Existing Data:
- Ensure existing services have default `status: 'pending'`
- Populate `serviceType` from existing data or set default
- Ensure `facility` object structure is consistent

### New Fields Added:
- `status` (enum)
- `scheduledDate` (Date)
- `notes` (String)
- `engineerInCharge._id` (ObjectId reference)

---

## Testing Checklist

- [ ] Create new duty with all fields
- [ ] Create duty with minimum required fields
- [ ] Fetch services with pagination
- [ ] Filter by service type
- [ ] Filter by status
- [ ] Filter by date range
- [ ] Filter by engineer
- [ ] Bulk assign multiple services
- [ ] Update service status
- [ ] Select engineer from picker
- [ ] Search engineers by name/email
- [ ] View service details
- [ ] Edit existing service
- [ ] Delete service (optional)
- [ ] Proper authorization checks
- [ ] Error handling for invalid data

---

## UI/UX Improvements

### Design:
- ACCORD blue (#008cf7) primary color
- Gradient headers
- Modern rounded cards
- Hover effects on buttons
- Loading states
- Error messages
- Success notifications

### Responsive:
- Mobile-friendly modals
- Scrollable tables
- Stack cards on mobile
- Touch-friendly buttons

---

## Next Steps

1. **Backend Implementation**:
   - Create/update API endpoints
   - Update database schema
   - Add validation rules
   - Implement authorization

2. **Frontend Integration**:
   - Replace old engineer-reports.tsx with new version
   - Test all CRUD operations
   - Add success/error toasts
   - Implement real-time updates (optional)

3. **Enhancements** (Future):
   - File attachments for services
   - Email notifications to engineers
   - Mobile app for engineers
   - Service history/timeline
   - PDF export of service reports
   - Analytics dashboard
   - Recurring maintenance schedules

---

**Document Version**: 1.0  
**Date**: January 2025  
**Author**: ACCORD Development Team
