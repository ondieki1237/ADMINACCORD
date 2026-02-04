# 📊 Data Store - Excel Report Generation System

## Overview

The **Data Store** is a comprehensive data export and report generation module for the ACCORD Admin Panel. It enables administrators to generate customized Excel spreadsheets with filtered data from various system entities.

---

## 🎯 Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Multi-Entity Export** | Export data from Visits, Leads, Machines, Engineering Services, Users, Follow-ups, Quotations |
| **Employee Filtering** | Filter data by specific employees or all employees |
| **Date Range Selection** | Custom date range picker with presets (Today, This Week, This Month, This Quarter, This Year, Custom) |
| **Column Selection** | Choose which columns to include in the export |
| **Data Sorting** | Sort by any column, ascending or descending |
| **Multiple Sheet Export** | Generate workbooks with multiple sheets for different data types |
| **Template Saving** | Save frequently used export configurations as templates |
| **Scheduled Exports** | Schedule recurring exports (requires backend cron) |

### Supported Data Types

1. **Visits Data**
   - Client information
   - Visit outcomes
   - Contact details
   - Equipment discussed
   - Follow-up actions
   - Potential values

2. **Leads Data**
   - Lead source
   - Status history
   - Assigned sales rep
   - Contact information
   - Conversion metrics

3. **Machines Data**
   - Serial numbers
   - Installation details
   - Service history
   - Warranty status
   - Facility information

4. **Engineering Services**
   - Service type
   - Engineer assignments
   - Completion status
   - Machine details
   - Service dates

5. **Users/Employees**
   - Employee details
   - Role assignments
   - Region/Territory
   - Performance metrics

6. **Follow-ups**
   - Linked visits
   - Status
   - Due dates
   - Outcomes

7. **Quotations**
   - Product details
   - Client information
   - Status
   - Response data

---

## 🖥️ User Interface

### Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Data Store                                            [← Back to Dashboard] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    ACCORD DATA STORE                                    │ │
│  │              Generate Custom Excel Reports                              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │  📁 DATA TYPE                │  │  📅 DATE RANGE                       │ │
│  │  ┌─────────────────────────┐ │  │  ┌─────────────────────────────────┐ │ │
│  │  │ ☑ Visits               │ │  │  │ Start: [2025-01-01] 📅          │ │ │
│  │  │ ☑ Leads                │ │  │  │ End:   [2025-01-31] 📅          │ │ │
│  │  │ ☐ Machines             │ │  │  └─────────────────────────────────┘ │ │
│  │  │ ☐ Engineering Services │ │  │                                      │ │
│  │  │ ☐ Users                │ │  │  Quick Select:                       │ │
│  │  │ ☐ Follow-ups           │ │  │  [Today] [This Week] [This Month]   │ │
│  │  │ ☐ Quotations           │ │  │  [This Quarter] [This Year] [All]   │ │
│  │  └─────────────────────────┘ │  │                                      │ │
│  └──────────────────────────────┘  └──────────────────────────────────────┘ │
│                                                                               │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │  👤 EMPLOYEES                │  │  📊 COLUMNS TO INCLUDE               │ │
│  │  ┌─────────────────────────┐ │  │  ┌─────────────────────────────────┐ │ │
│  │  │ [All Employees ▼]      │ │  │  │ ☑ Date                          │ │ │
│  │  │                         │ │  │  │ ☑ Employee Name                 │ │ │
│  │  │ ☑ John Doe             │ │  │  │ ☑ Client Name                   │ │ │
│  │  │ ☑ Jane Smith           │ │  │  │ ☑ Location                      │ │ │
│  │  │ ☑ Mike Johnson         │ │  │  │ ☑ Status                        │ │ │
│  │  │ ☐ Sarah Wilson         │ │  │  │ ☐ Contact Phone                 │ │ │
│  │  └─────────────────────────┘ │  │  │ ☐ Contact Email                 │ │ │
│  │                              │  │  │ ☑ Value                         │ │ │
│  │  Filter by Region:           │  │  │ ☐ Notes                         │ │ │
│  │  [All Regions ▼]            │  │  └─────────────────────────────────┘ │ │
│  └──────────────────────────────┘  └──────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  ⚙️ SORTING & OPTIONS                                                   │ │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │ │
│  │  │ Sort By:          │  │ Order:            │  │ Options:          │   │ │
│  │  │ [Date ▼]          │  │ ○ Ascending       │  │ ☑ Include Headers │   │ │
│  │  │                   │  │ ● Descending      │  │ ☑ Auto-fit Cols   │   │ │
│  │  └───────────────────┘  └───────────────────┘  │ ☑ Add Summary Row │   │ │
│  │                                                 │ ☐ Separate Sheets │   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  📋 PREVIEW (First 10 rows)                                             │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │ Date       │ Employee    │ Client           │ Location │ Status  │  │ │
│  │  │ 2025-01-15 │ John Doe    │ Nairobi Hospital │ Nairobi  │ Completed│ │ │
│  │  │ 2025-01-14 │ Jane Smith  │ Mombasa Medical  │ Mombasa  │ Pending │  │ │
│  │  │ ...        │ ...         │ ...              │ ...      │ ...     │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                          │ │
│  │  Total Records: 1,245  │  Selected: 856  │  Estimated Size: 2.3 MB      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  [💾 Save Template]  [📂 Load Template]     [📥 Generate Excel Report] │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Requirements

### Existing APIs Used

These endpoints already exist in the backend:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /visits` | GET | Fetch visits with pagination |
| `GET /admin/visits` | GET | Fetch all visits (admin) |
| `GET /leads` | GET | Fetch leads |
| `GET /admin/leads` | GET | Fetch all leads (admin) |
| `GET /admin/machines` | GET | Fetch machines |
| `GET /engineering-services` | GET | Fetch engineering services |
| `GET /users` | GET | Fetch all users |
| `GET /follow-ups` | GET | Fetch follow-ups |
| `GET /quotations` | GET | Fetch quotations |

### 🆕 NEW APIs Required (Backend Implementation Needed)

#### 1. Data Export Endpoint

```
POST /api/admin/data-store/export
```

**Purpose**: Generate comprehensive data export with filters

**Request Body**:
```json
{
  "dataTypes": ["visits", "leads", "machines"],
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  },
  "employees": ["userId1", "userId2"] | "all",
  "regions": ["Nairobi", "Mombasa"] | "all",
  "columns": {
    "visits": ["date", "client.name", "client.location", "visitOutcome", "totalPotentialValue"],
    "leads": ["name", "company", "status", "value", "createdAt"],
    "machines": ["serialNumber", "model", "facility.name", "status"]
  },
  "sorting": {
    "field": "date",
    "order": "desc"
  },
  "options": {
    "includeHeaders": true,
    "includeSummary": true,
    "separateSheets": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "visits": [...],
    "leads": [...],
    "machines": [...],
    "summary": {
      "totalRecords": 1245,
      "byDataType": {
        "visits": 500,
        "leads": 400,
        "machines": 345
      },
      "dateRange": {
        "start": "2025-01-01",
        "end": "2025-01-31"
      }
    }
  }
}
```

---

#### 2. Export Templates CRUD

```
GET    /api/admin/data-store/templates
POST   /api/admin/data-store/templates
PUT    /api/admin/data-store/templates/:id
DELETE /api/admin/data-store/templates/:id
```

**Template Schema**:
```json
{
  "_id": "ObjectId",
  "name": "Monthly Sales Report",
  "description": "All visits and leads for the month",
  "userId": "ObjectId",
  "config": {
    "dataTypes": ["visits", "leads"],
    "columns": {...},
    "sorting": {...},
    "options": {...}
  },
  "isShared": false,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

#### 3. Aggregated Statistics Endpoint

```
GET /api/admin/data-store/statistics
```

**Query Parameters**:
- `startDate` - Start of date range
- `endDate` - End of date range
- `employees` - Comma-separated user IDs
- `regions` - Comma-separated regions

**Response**:
```json
{
  "success": true,
  "data": {
    "visits": {
      "total": 500,
      "byOutcome": {
        "Successful": 300,
        "Follow-up Needed": 150,
        "Rejected": 50
      },
      "byRegion": {
        "Nairobi": 200,
        "Mombasa": 150,
        "Kisumu": 150
      },
      "totalValue": 15000000
    },
    "leads": {
      "total": 400,
      "byStatus": {
        "new": 100,
        "contacted": 150,
        "qualified": 100,
        "converted": 50
      },
      "conversionRate": 12.5
    },
    "machines": {
      "total": 345,
      "byStatus": {
        "active": 300,
        "maintenance": 30,
        "inactive": 15
      }
    },
    "engineeringServices": {
      "total": 200,
      "completed": 180,
      "pending": 20
    }
  }
}
```

---

#### 4. Bulk Data Fetch (Optimized for Export)

```
POST /api/admin/data-store/bulk-fetch
```

**Purpose**: Fetch large datasets efficiently with streaming support

**Request Body**:
```json
{
  "dataType": "visits",
  "filters": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "employees": ["userId1"],
    "regions": ["Nairobi"]
  },
  "fields": ["date", "client", "visitOutcome", "totalPotentialValue"],
  "limit": 10000,
  "cursor": "lastDocumentId"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "docs": [...],
    "nextCursor": "lastDocumentId",
    "hasMore": true,
    "totalCount": 5000
  }
}
```

---

## 🔧 Backend Implementation Notes

### MongoDB Model for Export Templates

```javascript
// models/ExportTemplate.js
const mongoose = require('mongoose');

const exportTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  config: {
    dataTypes: [{
      type: String,
      enum: ['visits', 'leads', 'machines', 'engineering-services', 'users', 'follow-ups', 'quotations']
    }],
    columns: {
      type: Map,
      of: [String]
    },
    dateRangePreset: {
      type: String,
      enum: ['today', 'thisWeek', 'thisMonth', 'thisQuarter', 'thisYear', 'custom', 'all']
    },
    sorting: {
      field: String,
      order: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc'
      }
    },
    options: {
      includeHeaders: { type: Boolean, default: true },
      includeSummary: { type: Boolean, default: true },
      separateSheets: { type: Boolean, default: false },
      autoFitColumns: { type: Boolean, default: true }
    }
  },
  isShared: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

exportTemplateSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ExportTemplate', exportTemplateSchema);
```

### Express Routes

```javascript
// routes/dataStore.js
const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

// Bulk data export
router.post('/export', authenticate, requireAdmin, async (req, res) => {
  try {
    const { dataTypes, dateRange, employees, regions, columns, sorting, options } = req.body;
    
    const result = {};
    
    for (const dataType of dataTypes) {
      const query = buildQuery(dataType, { dateRange, employees, regions });
      const projection = buildProjection(columns[dataType]);
      const sort = { [sorting.field]: sorting.order === 'asc' ? 1 : -1 };
      
      result[dataType] = await getModel(dataType)
        .find(query)
        .select(projection)
        .sort(sort)
        .lean();
    }
    
    res.json({
      success: true,
      data: result,
      summary: {
        totalRecords: Object.values(result).reduce((sum, arr) => sum + arr.length, 0),
        byDataType: Object.fromEntries(
          Object.entries(result).map(([k, v]) => [k, v.length])
        )
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Templates CRUD
router.get('/templates', authenticate, async (req, res) => {
  const templates = await ExportTemplate.find({
    $or: [{ userId: req.user._id }, { isShared: true }]
  }).sort('-updatedAt');
  res.json({ success: true, data: templates });
});

router.post('/templates', authenticate, async (req, res) => {
  const template = await ExportTemplate.create({
    ...req.body,
    userId: req.user._id
  });
  res.json({ success: true, data: template });
});

router.put('/templates/:id', authenticate, async (req, res) => {
  const template = await ExportTemplate.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true }
  );
  res.json({ success: true, data: template });
});

router.delete('/templates/:id', authenticate, async (req, res) => {
  await ExportTemplate.deleteOne({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true });
});

// Statistics
router.get('/statistics', authenticate, requireAdmin, async (req, res) => {
  const { startDate, endDate, employees, regions } = req.query;
  
  // Aggregate statistics from all collections
  const stats = await aggregateStatistics({ startDate, endDate, employees, regions });
  
  res.json({ success: true, data: stats });
});

module.exports = router;
```

---

## 📦 Frontend Dependencies

### Required Package

```bash
pnpm add xlsx
# or
npm install xlsx
```

The `xlsx` (SheetJS) library handles Excel file generation client-side.

---

## 🎨 Branding Guidelines

### Colors Used

| Element | Color | Hex |
|---------|-------|-----|
| Primary buttons | ACCORD Blue | `#008cf7` |
| Headers/Titles | ACCORD Blue | `#008cf7` |
| Success states | Green | `#10b981` |
| Warning states | Amber | `#f59e0b` |
| Error states | Red | `#dc2626` |
| Card backgrounds | White | `#ffffff` |
| Page background | Light gray | `#f8fafc` |
| Text primary | Slate 800 | `#1e293b` |
| Text secondary | Slate 500 | `#64748b` |

### Excel Styling

- Header row: Blue background (#008cf7), white text, bold
- Alternating row colors for readability
- ACCORD logo in top-left corner (optional)
- Report metadata in footer (generated date, user, filters applied)

---

## 🔄 Data Flow

```
┌─────────────────┐
│  User Selects   │
│  Data Types     │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Apply Filters  │
│  (Date, Users,  │
│   Regions)      │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Select Columns │
│  & Sorting      │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Preview Data   │
│  (First 10 rows)│
└────────┬────────┘
         ↓
┌─────────────────┐     ┌─────────────────┐
│  Fetch Full     │────→│  Generate XLSX  │
│  Dataset        │     │  Client-side    │
└─────────────────┘     └────────┬────────┘
                                 ↓
                        ┌─────────────────┐
                        │  Download File  │
                        │  "ACCORD_Report_│
                        │   2025-01-31.   │
                        │   xlsx"         │
                        └─────────────────┘
```

---

## 📋 Column Definitions by Data Type

### Visits Columns
| Column Key | Display Name | Type |
|------------|--------------|------|
| `date` | Visit Date | Date |
| `user.firstName` | Employee First Name | String |
| `user.lastName` | Employee Last Name | String |
| `user.email` | Employee Email | String |
| `client.name` | Client Name | String |
| `client.type` | Client Type | String |
| `client.location` | Location | String |
| `client.county` | County | String |
| `visitPurpose` | Purpose | String |
| `visitOutcome` | Outcome | String |
| `contacts` | Contacts (JSON) | Array |
| `equipment` | Equipment Discussed | Array |
| `totalPotentialValue` | Potential Value (KES) | Number |
| `discussionNotes` | Notes | String |
| `createdAt` | Created At | DateTime |

### Leads Columns
| Column Key | Display Name | Type |
|------------|--------------|------|
| `name` | Lead Name | String |
| `company` | Company | String |
| `email` | Email | String |
| `phone` | Phone | String |
| `source` | Lead Source | String |
| `status` | Status | String |
| `value` | Estimated Value | Number |
| `assignedTo.name` | Assigned To | String |
| `notes` | Notes | String |
| `createdAt` | Created At | DateTime |
| `updatedAt` | Last Updated | DateTime |

### Machines Columns
| Column Key | Display Name | Type |
|------------|--------------|------|
| `serialNumber` | Serial Number | String |
| `model` | Model | String |
| `manufacturer` | Manufacturer | String |
| `facility.name` | Facility Name | String |
| `facility.location` | Facility Location | String |
| `status` | Status | String |
| `installedDate` | Installed Date | Date |
| `warrantyExpiry` | Warranty Expiry | Date |
| `lastServicedAt` | Last Serviced | Date |
| `nextServiceDue` | Next Service Due | Date |

### Engineering Services Columns
| Column Key | Display Name | Type |
|------------|--------------|------|
| `date` | Service Date | Date |
| `facility.name` | Facility | String |
| `facility.location` | Location | String |
| `serviceType` | Service Type | String |
| `engineerInCharge.name` | Engineer | String |
| `machineDetails` | Machine Details | String |
| `status` | Status | String |
| `conditionBefore` | Condition Before | String |
| `conditionAfter` | Condition After | String |
| `notes` | Notes | String |

### Users Columns
| Column Key | Display Name | Type |
|------------|--------------|------|
| `employeeId` | Employee ID | String |
| `firstName` | First Name | String |
| `lastName` | Last Name | String |
| `email` | Email | String |
| `role` | Role | String |
| `department` | Department | String |
| `region` | Region | String |
| `territory` | Territory | String |
| `createdAt` | Joined Date | DateTime |

---

## 🚀 Usage Examples

### Example 1: Monthly Sales Report

1. Select Data Types: ✅ Visits, ✅ Leads
2. Date Range: This Month
3. Employees: All
4. Columns:
   - Visits: Date, Employee Name, Client Name, Location, Outcome, Value
   - Leads: Name, Company, Status, Value
5. Sort By: Date (Descending)
6. Options: ✅ Include Headers, ✅ Add Summary Row
7. Click "Generate Excel Report"

### Example 2: Engineer Performance Report

1. Select Data Types: ✅ Engineering Services
2. Date Range: This Quarter
3. Employees: Select specific engineers
4. Columns: Date, Facility, Service Type, Status, Condition Before, Condition After
5. Sort By: Engineer Name (Ascending)
6. Generate Report

### Example 3: Machine Inventory Export

1. Select Data Types: ✅ Machines
2. Date Range: All Time
3. Columns: Serial Number, Model, Manufacturer, Facility, Status, Warranty Expiry
4. Sort By: Facility Name (Ascending)
5. Generate Report

---

## 🔐 Permissions

| Action | Required Role |
|--------|---------------|
| Access Data Store | Admin, Manager |
| Export Any Data | Admin |
| Export Own Data | Manager, Sales |
| Save Templates | Admin, Manager |
| Delete Templates | Template Owner, Admin |
| Share Templates | Admin |

---

## 📱 Mobile Considerations

- Responsive design for tablet use
- Simplified column selection on mobile
- Export triggers download or share sheet
- Preview limited to 5 rows on mobile

---

## 🔮 Future Enhancements

1. **Scheduled Exports**: Automatic weekly/monthly exports via email
2. **Export History**: Track all exports with audit log
3. **Advanced Aggregations**: Pivot tables and grouping
4. **Chart Embedding**: Include charts in Excel exports
5. **PDF Export**: Alternative to Excel format
6. **Google Sheets Integration**: Direct export to Google Sheets
7. **Data Visualization**: Preview charts before export

---

## 📁 File Naming Convention

Generated files follow this pattern:

```
ACCORD_{DataType}_{DateRange}_{Timestamp}.xlsx

Examples:
- ACCORD_Visits_Jan2025_20250131_143022.xlsx
- ACCORD_AllData_Q1-2025_20250401_090000.xlsx
- ACCORD_Machines_AllTime_20250215_161530.xlsx
```

---

## ✅ Implementation Checklist

### Frontend
- [x] Create Data Store component
- [x] Add to sidebar navigation
- [x] Implement data type selection
- [x] Implement date range picker
- [x] Implement employee filter
- [x] Implement column selection
- [x] Implement sorting options
- [x] Implement data preview
- [x] Implement Excel generation (xlsx library)
- [x] Add loading states
- [x] Add error handling
- [x] Apply ACCORD branding

### Backend (Required)
- [ ] POST /api/admin/data-store/export
- [ ] GET /api/admin/data-store/templates
- [ ] POST /api/admin/data-store/templates
- [ ] PUT /api/admin/data-store/templates/:id
- [ ] DELETE /api/admin/data-store/templates/:id
- [ ] GET /api/admin/data-store/statistics
- [ ] POST /api/admin/data-store/bulk-fetch

### Testing
- [ ] Test with large datasets (10,000+ records)
- [ ] Test column selection combinations
- [ ] Test date range edge cases
- [ ] Test Excel file integrity
- [ ] Test on mobile devices

---

*Last Updated: February 2026*
*Version: 1.0.0*
