# API Quick Reference - Engineering Services

## Base URL
```
https://app.codewithseth.co.ke/api
```

---

## 🔑 Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <access_token>
```

---

## 📋 Engineering Services Endpoints

### 1. Get All Services (Role-based)
```http
GET /engineering-services?page=1&limit=20
```

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `status` - Filter by status: pending, assigned, in-progress, completed, cancelled
- `serviceType` - Filter by type: installation, maintenance, service, other
- `facilityName` - Search by facility name (partial match)
- `startDate` - Filter from date (ISO format)
- `endDate` - Filter to date (ISO format)
- `engineerId` - Filter by engineer (Admin/Manager only)

**Role Behavior:**
- **Admin/Manager**: Returns all services (can filter by engineer)
- **Engineer**: Returns only their assigned services

**Response:**
```json
{
  "success": true,
  "data": {
    "docs": [...],
    "totalDocs": 45,
    "totalPages": 3,
    "page": 1,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 2. Get Services by Engineer
```http
GET /engineering-services/engineer/:engineerId?page=1&limit=50
```

**Parameters:**
- `engineerId` (path) - Engineer's user ID

**Query Parameters:**
- `page`, `limit`, `status`, `serviceType`, `startDate`, `endDate`

**Role Behavior:**
- **Engineer**: Can only access their own ID
- **Admin/Manager**: Can access any engineer's services

---

### 3. Get Single Service
```http
GET /engineering-services/:id
```

**Role Behavior:**
- **Engineer**: Can only view their own services
- **Admin/Manager**: Can view any service

---

### 4. Create Service (Admin/Manager Only)
```http
POST /engineering-services
Content-Type: application/json
```

**Request Body:**
```json
{
  "scheduledDate": "2025-11-01T08:00:00Z",
  "facility": {
    "name": "City Hospital",
    "location": "Nairobi, Kenya"
  },
  "serviceType": "maintenance",
  "engineerInCharge": {
    "_id": "engineer_user_id",
    "name": "Jane Doe",
    "phone": "+254712345678"
  },
  "machineDetails": "X-Ray Machine Model X500",
  "notes": "Routine maintenance",
  "status": "assigned"
}
```

**Required Fields:**
- `scheduledDate` ✅
- `facility.name` ✅
- `facility.location` ✅
- `serviceType` ✅
- `engineerInCharge._id` ✅

**Response:**
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": { ... }
}
```

---

### 5. Update Service
```http
PUT /engineering-services/:id
Content-Type: application/json
```

**Role-Based Fields:**

**Engineer** can only update:
- `status`
- `conditionBefore`
- `conditionAfter`
- `notes`
- `otherPersonnel`
- `nextServiceDate`

**Admin/Manager** can update:
- All fields including assignment, scheduling, etc.

**Request Body (Engineer):**
```json
{
  "status": "in-progress",
  "conditionBefore": "Machine not functioning",
  "notes": "Started diagnostics"
}
```

**Request Body (Complete Service - Engineer):**
```json
{
  "status": "completed",
  "conditionBefore": "Machine not functioning properly",
  "conditionAfter": "Fully operational. Replaced sensor.",
  "nextServiceDate": "2026-01-01T08:00:00Z"
}
```

**Request Body (Admin/Manager - Reassign):**
```json
{
  "engineerInCharge": {
    "_id": "new_engineer_id",
    "name": "Bob Smith",
    "phone": "+254723456789"
  },
  "scheduledDate": "2025-11-05T10:00:00Z",
  "status": "assigned",
  "notes": "Reassigned to different engineer"
}
```

---

### 6. Delete Service (Admin/Manager Only)
```http
DELETE /engineering-services/:id
```

---

## 👥 Users Endpoints

### Get All Users (Admin/Manager Only)
```http
GET /users?role=engineer
```

**Query Parameters:**
- `role` - Filter by role: admin, manager, engineer, sales
- `search` - Search by name, email, or employeeId

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user123",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@accord.com",
      "phone": "+254712345678",
      "role": "engineer",
      "employeeId": "ENG001"
    }
  ]
}
```

---

## 📊 Service Status Flow

```
pending → assigned → in-progress → completed
                              ↓
                         cancelled
```

### Status Definitions:
- **pending**: Created but not yet assigned
- **assigned**: Assigned to engineer, not started
- **in-progress**: Engineer is working on it
- **completed**: Service completed successfully
- **cancelled**: Service cancelled

---

## 🎨 Service Types

- **installation**: New equipment installation
- **maintenance**: Routine maintenance work
- **service**: Repair/service work
- **other**: Other types of duties

---

## 🔒 Permission Matrix

| Endpoint | Admin | Manager | Engineer | Sales |
|----------|-------|---------|----------|-------|
| `GET /engineering-services` | All | All | Own only | ❌ |
| `GET /engineering-services/:id` | ✅ | ✅ | Own only | ❌ |
| `GET /engineering-services/engineer/:id` | ✅ | ✅ | Own ID only | ❌ |
| `POST /engineering-services` | ✅ | ✅ | ❌ | ❌ |
| `PUT /engineering-services/:id` | ✅ | ✅ | Reports only | ❌ |
| `DELETE /engineering-services/:id` | ✅ | ✅ | ❌ | ❌ |
| `GET /users` | ✅ | ✅ | ❌ | ❌ |

---

## 🧪 Testing with cURL

### Login
```bash
curl -X POST https://app.codewithseth.co.ke/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@accord.com",
    "password": "admin123"
  }'
```

### Get Services (Engineer)
```bash
curl -X GET "https://app.codewithseth.co.ke/api/engineering-services?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Service (Admin)
```bash
curl -X POST https://app.codewithseth.co.ke/api/engineering-services \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledDate": "2025-11-01T08:00:00Z",
    "facility": {
      "name": "City Hospital",
      "location": "Nairobi"
    },
    "serviceType": "maintenance",
    "engineerInCharge": {
      "_id": "ENGINEER_ID",
      "name": "Jane Doe",
      "phone": "+254712345678"
    },
    "machineDetails": "X-Ray Machine",
    "notes": "Routine check"
  }'
```

### Update Service (Engineer)
```bash
curl -X PUT https://app.codewithseth.co.ke/api/engineering-services/SERVICE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "conditionBefore": "Not working",
    "conditionAfter": "Fixed and operational"
  }'
```

---

## 🐛 Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No authentication token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You can only view your own services"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Service not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Failed to fetch services",
  "error": "Detailed error message"
}
```

---

## 📱 Frontend Integration

### Using apiService
```typescript
import { apiService } from '@/lib/api';

// Get services (role-based)
const services = await apiService.getEngineeringServices(1, 20, {
  status: 'assigned',
  serviceType: 'maintenance'
});

// Create service (Admin/Manager)
const newService = await apiService.createEngineeringService({
  scheduledDate: '2025-11-01T08:00:00Z',
  facility: {
    name: 'City Hospital',
    location: 'Nairobi'
  },
  serviceType: 'maintenance',
  engineerInCharge: {
    _id: engineerId,
    name: 'Jane Doe',
    phone: '+254712345678'
  },
  machineDetails: 'X-Ray Machine',
  notes: 'Routine maintenance'
});

// Update service (Engineer)
await apiService.updateEngineeringService(serviceId, {
  status: 'completed',
  conditionBefore: 'Not working',
  conditionAfter: 'Fixed'
});

// Get users (for engineer selection)
const users = await apiService.getUsers({ role: 'engineer' });
```

---

**Last Updated**: October 29, 2025  
**Version**: 2.0
