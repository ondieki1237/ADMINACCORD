# Backend Implementation Guide - Role-Based Engineering Services

## Overview
This guide provides complete backend implementation for the engineering services system with **proper separation between Sales and Engineer roles**.

---

## 🎯 Role Architecture

### User Roles:
1. **Admin** - Full access to everything
2. **Manager** - Can create/assign services, view all services
3. **Sales** - Can create service requests, view own submissions
4. **Engineer** - Can view assigned services, update service reports

---

## 📦 Database Schema

### 1. User Model (Update Existing)

```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'sales', 'engineer'],
    default: 'sales',
    required: true
  },
  phone: {
    type: String
  },
  mobile: {
    type: String
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  department: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

---

### 2. Engineering Service Model (New)

```javascript
// models/EngineeringService.js
const mongoose = require('mongoose');

const engineeringServiceSchema = new mongoose.Schema({
  // Service date and scheduling
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  
  // Facility information
  facility: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  // Service type
  serviceType: {
    type: String,
    enum: ['installation', 'maintenance', 'service', 'other'],
    required: true
  },
  
  // Engineer assignment
  engineerInCharge: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String
    }
  },
  
  // Machine and service details
  machineDetails: {
    type: String,
    trim: true
  },
  
  // Service report fields
  conditionBefore: {
    type: String,
    default: '',
    trim: true
  },
  conditionAfter: {
    type: String,
    default: '',
    trim: true
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'assigned'
  },
  
  // Additional information
  notes: {
    type: String,
    default: '',
    trim: true
  },
  otherPersonnel: [{
    type: String,
    trim: true
  }],
  nextServiceDate: {
    type: Date
  },
  
  // Created by (Admin/Manager who assigned the service)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Metadata for syncing with mobile app
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  syncedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
engineeringServiceSchema.index({ 'engineerInCharge._id': 1, status: 1 });
engineeringServiceSchema.index({ scheduledDate: 1 });
engineeringServiceSchema.index({ status: 1 });
engineeringServiceSchema.index({ serviceType: 1 });

module.exports = mongoose.model('EngineeringService', engineeringServiceSchema);
```

---

## 🔒 Middleware - Authentication & Authorization

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Check if user is Admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is Admin or Manager
exports.isAdminOrManager = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin or Manager access required'
    });
  }
  next();
};

// Check if user is Engineer
exports.isEngineer = (req, res, next) => {
  if (req.user.role !== 'engineer') {
    return res.status(403).json({
      success: false,
      message: 'Engineer access required'
    });
  }
  next();
};

// Check if user can access engineering services
exports.canAccessEngineering = (req, res, next) => {
  if (!['admin', 'manager', 'engineer'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  next();
};
```

---

## 🛣️ API Routes Implementation

### Main Routes File

```javascript
// routes/engineeringServices.js
const express = require('express');
const router = express.Router();
const EngineeringService = require('../models/EngineeringService');
const User = require('../models/User');
const { 
  authenticate, 
  isAdminOrManager, 
  isEngineer,
  canAccessEngineering 
} = require('../middleware/auth');

// ============================================
// GET /api/engineering-services
// Get services based on user role
// ============================================
router.get('/', authenticate, canAccessEngineering, async (req, res) => {
  try {
    const { 
      status, 
      serviceType,
      facilityName,
      startDate, 
      endDate,
      engineerId,
      page = 1, 
      limit = 20 
    } = req.query;

    // Build query based on role
    let query = {};
    
    // Engineers can only see their own services
    if (req.user.role === 'engineer') {
      query['engineerInCharge._id'] = req.user._id;
    }
    
    // Managers and Admins can filter by engineer
    if (engineerId && ['admin', 'manager'].includes(req.user.role)) {
      query['engineerInCharge._id'] = engineerId;
    }
    
    // Apply filters
    if (status) {
      query.status = status;
    }
    
    if (serviceType) {
      query.serviceType = serviceType;
    }

    if (facilityName) {
      query['facility.name'] = { $regex: facilityName, $options: 'i' };
    }
    
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const services = await EngineeringService.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalDocs = await EngineeringService.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit);

    res.json({
      success: true,
      data: {
        docs: services,
        totalDocs,
        totalPages,
        page: parseInt(page),
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

// ============================================
// GET /api/engineering-services/engineer/:engineerId
// Get services for specific engineer
// ============================================
router.get('/engineer/:engineerId', authenticate, canAccessEngineering, async (req, res) => {
  try {
    const { engineerId } = req.params;
    const { 
      status,
      serviceType, 
      startDate, 
      endDate,
      page = 1, 
      limit = 50 
    } = req.query;

    // Engineers can only see their own services
    if (req.user.role === 'engineer' && req.user._id.toString() !== engineerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own services'
      });
    }

    // Build query
    const query = {
      'engineerInCharge._id': engineerId
    };
    
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;
    
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const services = await EngineeringService.find(query)
      .populate('userId', 'firstName lastName')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalDocs = await EngineeringService.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit);

    res.json({
      success: true,
      data: {
        docs: services,
        totalDocs,
        totalPages,
        page: parseInt(page),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching engineer services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engineer services',
      error: error.message
    });
  }
});

// ============================================
// GET /api/engineering-services/:id
// Get single service by ID
// ============================================
router.get('/:id', authenticate, canAccessEngineering, async (req, res) => {
  try {
    const service = await EngineeringService.findById(req.params.id)
      .populate('userId', 'firstName lastName email');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Engineers can only view their own services
    if (req.user.role === 'engineer' && 
        service.engineerInCharge._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own services'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: error.message
    });
  }
});

// ============================================
// POST /api/engineering-services
// Create new service (Admin/Manager only)
// ============================================
router.post('/', authenticate, isAdminOrManager, async (req, res) => {
  try {
    const {
      date,
      scheduledDate,
      facility,
      serviceType,
      engineerInCharge,
      machineDetails,
      notes,
      status
    } = req.body;

    // Validate required fields
    if (!facility?.name || !facility?.location) {
      return res.status(400).json({
        success: false,
        message: 'Facility name and location are required'
      });
    }

    if (!serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Service type is required'
      });
    }

    if (!engineerInCharge?._id) {
      return res.status(400).json({
        success: false,
        message: 'Engineer must be assigned'
      });
    }

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date is required'
      });
    }

    // Verify engineer exists and has correct role
    const engineer = await User.findById(engineerInCharge._id);
    if (!engineer) {
      return res.status(404).json({
        success: false,
        message: 'Engineer not found'
      });
    }

    if (engineer.role !== 'engineer') {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not an engineer'
      });
    }

    // Create service
    const service = new EngineeringService({
      date: date || Date.now(),
      scheduledDate,
      facility,
      serviceType,
      engineerInCharge: {
        _id: engineer._id,
        name: `${engineer.firstName} ${engineer.lastName}`,
        phone: engineer.phone || engineer.mobile
      },
      machineDetails: machineDetails || '',
      notes: notes || '',
      status: status || 'assigned',
      userId: req.user._id,
      conditionBefore: '',
      conditionAfter: ''
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message
    });
  }
});

// ============================================
// PUT /api/engineering-services/:id
// Update service
// Admin/Manager: Can update anything
// Engineer: Can only update their own service reports
// ============================================
router.put('/:id', authenticate, canAccessEngineering, async (req, res) => {
  try {
    const service = await EngineeringService.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check permissions
    const isEngineer = req.user.role === 'engineer';
    const isOwnService = service.engineerInCharge._id.toString() === req.user._id.toString();

    if (isEngineer && !isOwnService) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own services'
      });
    }

    // Engineers can only update specific fields
    if (isEngineer) {
      const allowedFields = ['status', 'conditionBefore', 'conditionAfter', 'notes', 'otherPersonnel', 'nextServiceDate'];
      const updates = Object.keys(req.body);
      const isValidUpdate = updates.every(field => allowedFields.includes(field));

      if (!isValidUpdate) {
        return res.status(403).json({
          success: false,
          message: 'Engineers can only update service reports'
        });
      }
    }

    // Admin/Manager can update all fields
    const updateFields = req.user.role === 'engineer' 
      ? ['status', 'conditionBefore', 'conditionAfter', 'notes', 'otherPersonnel', 'nextServiceDate']
      : Object.keys(req.body);

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        service[field] = req.body[field];
      }
    });

    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
});

// ============================================
// DELETE /api/engineering-services/:id
// Delete service (Admin/Manager only)
// ============================================
router.delete('/:id', authenticate, isAdminOrManager, async (req, res) => {
  try {
    const service = await EngineeringService.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
});

module.exports = router;
```

---

### Users Routes (for engineer selection)

```javascript
// routes/users.js (Add this endpoint to existing routes)
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, isAdminOrManager } = require('../middleware/auth');

// ============================================
// GET /api/users
// Get all users (Admin/Manager only)
// Can filter by role
// ============================================
router.get('/', authenticate, isAdminOrManager, async (req, res) => {
  try {
    const { role, search } = req.query;

    const query = { isActive: true };
    
    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

module.exports = router;
```

---

## 📁 Register Routes in Main App

```javascript
// app.js or server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const engineeringServiceRoutes = require('./routes/engineeringServices');
const visitRoutes = require('./routes/visits');
const trailRoutes = require('./routes/trails');
const dashboardRoutes = require('./routes/dashboard');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/engineering-services', engineeringServiceRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/trails', trailRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
```

---

## 🧪 Testing the Implementation

### 1. Create Test Users

```javascript
// Create via MongoDB or seed script
const users = [
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@accord.com",
    password: "admin123", // Will be hashed
    role: "admin",
    phone: "+254700000001",
    employeeId: "ADM001"
  },
  {
    firstName: "John",
    lastName: "Manager",
    email: "manager@accord.com",
    password: "manager123",
    role: "manager",
    phone: "+254700000002",
    employeeId: "MGR001"
  },
  {
    firstName: "Jane",
    lastName: "Engineer",
    email: "engineer@accord.com",
    password: "engineer123",
    role: "engineer",
    phone: "+254700000003",
    employeeId: "ENG001"
  },
  {
    firstName: "Bob",
    lastName: "Sales",
    email: "sales@accord.com",
    password: "sales123",
    role: "sales",
    phone: "+254700000004",
    employeeId: "SAL001"
  }
];
```

### 2. API Testing Examples

#### Login and Get Token
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@accord.com",
  "password": "admin123"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "_id": "...",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@accord.com",
      "role": "admin"
    }
  }
}
```

#### Create Service (Admin/Manager)
```bash
POST /api/engineering-services
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "scheduledDate": "2025-11-01T08:00:00Z",
  "facility": {
    "name": "City Hospital",
    "location": "Nairobi, Kenya"
  },
  "serviceType": "maintenance",
  "engineerInCharge": {
    "_id": "<engineer_user_id>",
    "name": "Jane Engineer",
    "phone": "+254700000003"
  },
  "machineDetails": "X-Ray Machine - Model X500\nSerial: 12345",
  "notes": "Routine maintenance required"
}
```

#### Get Engineer's Services (Engineer)
```bash
GET /api/engineering-services
Authorization: Bearer <engineer_token>

Response: Only returns services assigned to that engineer
```

#### Update Service Report (Engineer)
```bash
PUT /api/engineering-services/<service_id>
Authorization: Bearer <engineer_token>
Content-Type: application/json

{
  "status": "in-progress",
  "conditionBefore": "Machine not functioning properly",
  "notes": "Started diagnostic tests"
}
```

#### Complete Service (Engineer)
```bash
PUT /api/engineering-services/<service_id>
Authorization: Bearer <engineer_token>
Content-Type: application/json

{
  "status": "completed",
  "conditionAfter": "Machine fully operational. Replaced faulty sensor.",
  "nextServiceDate": "2026-01-01T08:00:00Z"
}
```

---

## 🔐 Role-Based Access Summary

| Action | Admin | Manager | Engineer | Sales |
|--------|-------|---------|----------|-------|
| View all services | ✅ | ✅ | ❌ (own only) | ❌ |
| View own services | ✅ | ✅ | ✅ | ❌ |
| Create service | ✅ | ✅ | ❌ | ❌ |
| Assign engineer | ✅ | ✅ | ❌ | ❌ |
| Update any service | ✅ | ✅ | ❌ | ❌ |
| Update own service report | ✅ | ✅ | ✅ | ❌ |
| Delete service | ✅ | ✅ | ❌ | ❌ |
| Get users list | ✅ | ✅ | ❌ | ❌ |

---

## 🚀 Deployment Checklist

- [ ] Update User model with role field
- [ ] Create EngineeringService model
- [ ] Implement auth middleware
- [ ] Create engineering-services routes
- [ ] Update users routes for filtering
- [ ] Register routes in main app
- [ ] Test with different role users
- [ ] Add environment variables (JWT_SECRET, MONGODB_URI)
- [ ] Deploy to production server
- [ ] Update frontend API base URL if needed
- [ ] Test end-to-end with frontend

---

## 📝 Environment Variables

```env
# .env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/accord_db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRATION=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRATION=30d
```

---

## ✅ Success Criteria

1. **Admin can**:
   - Create services and assign to any engineer
   - View all services
   - Update/delete any service

2. **Manager can**:
   - Create services and assign to any engineer
   - View all services
   - Update any service

3. **Engineer can**:
   - View only their assigned services
   - Update service reports (conditionBefore, conditionAfter, status)
   - Cannot see other engineers' services

4. **Sales cannot**:
   - Access engineering services at all
   - Only see their own visits/trails

---

**Implementation Time Estimate**: 4-6 hours for full backend setup with testing

**Author**: ACCORD Development Team  
**Date**: October 2025  
**Version**: 2.0
