# Backend Implementation Checklist

## 🎯 Quick Start for Backend Developer

This document provides a step-by-step checklist to implement the engineering services backend with **role-based access control separating Sales and Engineer roles**.

---

## 📚 Read These Documents First

1. **`/docs/BACKEND_IMPLEMENTATION_GUIDE.md`** ⭐ MAIN GUIDE
   - Complete backend code (copy-paste ready)
   - Models, routes, middleware
   - Role-based access implementation
   
2. **`/docs/API_QUICK_REFERENCE.md`**
   - API endpoints reference
   - Request/response examples
   - Testing commands

3. **`/docs/IMPLEMENTATION_SUMMARY.md`**
   - Overview of what's completed
   - What needs to be done
   - Testing guide

---

## ✅ Implementation Steps

### Phase 1: Database Setup (30 mins)

#### 1.1 Update User Model
```bash
File: models/User.js
```
- [ ] Add `role` field with enum: ['admin', 'manager', 'sales', 'engineer']
- [ ] Add `employeeId` field (unique, sparse)
- [ ] Add `isActive` field (boolean, default true)
- [ ] Keep existing fields: firstName, lastName, email, password, phone, mobile, department
- [ ] Test model by creating sample users

#### 1.2 Create EngineeringService Model
```bash
File: models/EngineeringService.js
```
- [ ] Copy complete schema from BACKEND_IMPLEMENTATION_GUIDE.md
- [ ] Add all required fields: date, scheduledDate, facility, serviceType, engineerInCharge, etc.
- [ ] Add indexes for performance
- [ ] Test model with sample document

#### 1.3 Create Test Users
```bash
Run seed script or create manually in MongoDB
```
- [ ] Create Admin user (role: 'admin')
- [ ] Create Manager user (role: 'manager')
- [ ] Create Engineer user (role: 'engineer')
- [ ] Create Sales user (role: 'sales')
- [ ] Verify all users have correct role field

---

### Phase 2: Authentication Middleware (45 mins)

```bash
File: middleware/auth.js
```

- [ ] Implement `authenticate()` middleware
  - [ ] Extract JWT from Authorization header
  - [ ] Verify token with JWT_SECRET
  - [ ] Fetch user from database
  - [ ] Attach user to req.user
  - [ ] Check user.isActive status

- [ ] Implement `isAdmin()` middleware
  - [ ] Check req.user.role === 'admin'
  - [ ] Return 403 if not admin

- [ ] Implement `isAdminOrManager()` middleware
  - [ ] Check role is 'admin' OR 'manager'
  - [ ] Return 403 if neither

- [ ] Implement `isEngineer()` middleware
  - [ ] Check req.user.role === 'engineer'
  - [ ] Return 403 if not engineer

- [ ] Implement `canAccessEngineering()` middleware
  - [ ] Allow: admin, manager, engineer
  - [ ] Deny: sales
  - [ ] Return 403 for sales role

- [ ] Test all middleware with different roles

---

### Phase 3: Engineering Services Routes (2 hours)

```bash
File: routes/engineeringServices.js
```

#### 3.1 GET /api/engineering-services
- [ ] Add authentication middleware
- [ ] Add canAccessEngineering middleware
- [ ] Implement role-based filtering:
  - [ ] Engineers: Filter by engineerInCharge._id === req.user._id
  - [ ] Admin/Manager: Return all services
- [ ] Support query parameters: status, serviceType, facilityName, startDate, endDate, engineerId
- [ ] Implement pagination (page, limit)
- [ ] Populate userId field
- [ ] Return paginated response
- [ ] Test with different roles

#### 3.2 GET /api/engineering-services/engineer/:engineerId
- [ ] Add authentication middleware
- [ ] Add canAccessEngineering middleware
- [ ] Verify engineer can only access own ID
- [ ] Admin/Manager can access any engineer
- [ ] Filter services by engineerInCharge._id
- [ ] Support query filters
- [ ] Implement pagination
- [ ] Test access control

#### 3.3 GET /api/engineering-services/:id
- [ ] Add authentication middleware
- [ ] Add canAccessEngineering middleware
- [ ] Find service by ID
- [ ] Check ownership for engineers
- [ ] Populate userId field
- [ ] Return service or 404
- [ ] Test with different roles

#### 3.4 POST /api/engineering-services
- [ ] Add authentication middleware
- [ ] Add isAdminOrManager middleware (ONLY admin/manager can create)
- [ ] Validate required fields:
  - [ ] scheduledDate
  - [ ] facility.name
  - [ ] facility.location
  - [ ] serviceType
  - [ ] engineerInCharge._id
- [ ] Verify engineer exists in database
- [ ] Verify selected user has role: 'engineer'
- [ ] Create service with status: 'assigned'
- [ ] Set userId to req.user._id (who created it)
- [ ] Return created service
- [ ] Test validation errors
- [ ] Test successful creation

#### 3.5 PUT /api/engineering-services/:id
- [ ] Add authentication middleware
- [ ] Add canAccessEngineering middleware
- [ ] Find service by ID
- [ ] Check permissions:
  - [ ] Engineer can only update OWN services
  - [ ] Engineer can only update: status, conditionBefore, conditionAfter, notes, otherPersonnel, nextServiceDate
  - [ ] Admin/Manager can update all fields
- [ ] Validate engineer ownership
- [ ] Validate field restrictions for engineers
- [ ] Update service
- [ ] Return updated service
- [ ] Test role-based field restrictions

#### 3.6 DELETE /api/engineering-services/:id
- [ ] Add authentication middleware
- [ ] Add isAdminOrManager middleware (ONLY admin/manager can delete)
- [ ] Find and delete service
- [ ] Return success message
- [ ] Test access control

---

### Phase 4: Users Routes (30 mins)

```bash
File: routes/users.js (add to existing or create new)
```

#### 4.1 GET /api/users
- [ ] Add authentication middleware
- [ ] Add isAdminOrManager middleware (ONLY admin/manager can list users)
- [ ] Support role filter: ?role=engineer
- [ ] Support search: ?search=name
- [ ] Filter by isActive: true
- [ ] Exclude password field
- [ ] Sort by name
- [ ] Return users array
- [ ] Test role filtering

---

### Phase 5: Integration (30 mins)

```bash
File: app.js or server.js
```

- [ ] Import engineeringServices routes
- [ ] Register: app.use('/api/engineering-services', engineeringServiceRoutes)
- [ ] Ensure users routes are registered
- [ ] Add CORS configuration
- [ ] Add error handling middleware
- [ ] Test all endpoints are accessible

---

### Phase 6: Environment Variables (10 mins)

```bash
File: .env
```

- [ ] Set JWT_SECRET (use strong random string)
- [ ] Set MONGODB_URI
- [ ] Set PORT
- [ ] Set NODE_ENV=production
- [ ] Set REFRESH_TOKEN_SECRET
- [ ] Verify all variables are loaded

---

### Phase 7: Testing (1 hour)

#### 7.1 Test with Postman/Thunder Client

**Admin Tests:**
- [ ] Login as admin → Get token
- [ ] GET /api/users?role=engineer → Should return engineers
- [ ] POST /api/engineering-services → Create service → Success
- [ ] GET /api/engineering-services → Should see all services
- [ ] PUT /api/engineering-services/:id → Update any field → Success
- [ ] DELETE /api/engineering-services/:id → Delete → Success

**Manager Tests:**
- [ ] Login as manager → Get token
- [ ] GET /api/users?role=engineer → Should return engineers
- [ ] POST /api/engineering-services → Create service → Success
- [ ] GET /api/engineering-services → Should see all services
- [ ] PUT /api/engineering-services/:id → Update any field → Success

**Engineer Tests:**
- [ ] Login as engineer → Get token
- [ ] GET /api/engineering-services → Should ONLY see own services
- [ ] GET /api/engineering-services/:id (own) → Should work
- [ ] GET /api/engineering-services/:id (other engineer's) → Should fail 403
- [ ] PUT /api/engineering-services/:id (own) → Update status, conditionBefore → Success
- [ ] PUT /api/engineering-services/:id (own) → Try to update engineerInCharge → Should fail
- [ ] POST /api/engineering-services → Should fail 403
- [ ] DELETE /api/engineering-services/:id → Should fail 403
- [ ] GET /api/users → Should fail 403

**Sales Tests:**
- [ ] Login as sales → Get token
- [ ] GET /api/engineering-services → Should fail 403
- [ ] GET /api/engineering-services/:id → Should fail 403
- [ ] POST /api/engineering-services → Should fail 403
- [ ] GET /api/users → Should fail 403

#### 7.2 Test Error Scenarios
- [ ] Invalid token → 401
- [ ] Expired token → 401
- [ ] Missing required fields → 400
- [ ] Non-existent service ID → 404
- [ ] Wrong role access → 403

---

### Phase 8: Deployment (30 mins)

- [ ] Commit all changes
- [ ] Push to repository
- [ ] Deploy to production server (app.codewithseth.co.ke)
- [ ] Verify MongoDB connection
- [ ] Test production endpoints with cURL
- [ ] Check logs for errors
- [ ] Verify CORS allows frontend domain

---

### Phase 9: Frontend Integration (30 mins)

- [ ] Test frontend login with different roles
- [ ] Test admin creating service from UI
- [ ] Test engineer viewing own services
- [ ] Test engineer updating service report
- [ ] Test sales cannot access engineer reports
- [ ] Verify all API calls work correctly
- [ ] Check browser console for errors

---

## 🧪 Quick Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

# Configuration
API_BASE="https://app.codewithseth.co.ke/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test Admin Login
echo "Testing Admin Login..."
ADMIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@accord.com","password":"admin123"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.data.accessToken')

if [ "$ADMIN_TOKEN" != "null" ]; then
  echo -e "${GREEN}✅ Admin login successful${NC}"
else
  echo -e "${RED}❌ Admin login failed${NC}"
  exit 1
fi

# Test Get Services as Admin
echo "Testing Get Services (Admin)..."
SERVICES=$(curl -s -X GET "$API_BASE/engineering-services" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

SERVICE_COUNT=$(echo $SERVICES | jq -r '.data.docs | length')
echo "Services found: $SERVICE_COUNT"

# Test Engineer Login
echo "Testing Engineer Login..."
ENG_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"engineer@accord.com","password":"engineer123"}')

ENG_TOKEN=$(echo $ENG_RESPONSE | jq -r '.data.accessToken')

if [ "$ENG_TOKEN" != "null" ]; then
  echo -e "${GREEN}✅ Engineer login successful${NC}"
else
  echo -e "${RED}❌ Engineer login failed${NC}"
  exit 1
fi

# Test Get Services as Engineer (should only see own)
echo "Testing Get Services (Engineer)..."
ENG_SERVICES=$(curl -s -X GET "$API_BASE/engineering-services" \
  -H "Authorization: Bearer $ENG_TOKEN")

ENG_SERVICE_COUNT=$(echo $ENG_SERVICES | jq -r '.data.docs | length')
echo "Engineer's services: $ENG_SERVICE_COUNT"

# Test Sales Login
echo "Testing Sales Login..."
SALES_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"sales@accord.com","password":"sales123"}')

SALES_TOKEN=$(echo $SALES_RESPONSE | jq -r '.data.accessToken')

if [ "$SALES_TOKEN" != "null" ]; then
  echo -e "${GREEN}✅ Sales login successful${NC}"
else
  echo -e "${RED}❌ Sales login failed${NC}"
  exit 1
fi

# Test Get Services as Sales (should fail)
echo "Testing Get Services (Sales - should fail)..."
SALES_SERVICES=$(curl -s -X GET "$API_BASE/engineering-services" \
  -H "Authorization: Bearer $SALES_TOKEN")

SALES_SUCCESS=$(echo $SALES_SERVICES | jq -r '.success')

if [ "$SALES_SUCCESS" == "false" ]; then
  echo -e "${GREEN}✅ Sales access correctly denied${NC}"
else
  echo -e "${RED}❌ Sales should not access engineering services${NC}"
fi

echo ""
echo "Testing complete!"
```

Run with:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 📊 Progress Tracking

Copy this to track your progress:

```
## Backend Implementation Progress

### Database (0/3)
- [ ] User model updated
- [ ] EngineeringService model created
- [ ] Test users created

### Middleware (0/5)
- [ ] authenticate()
- [ ] isAdmin()
- [ ] isAdminOrManager()
- [ ] isEngineer()
- [ ] canAccessEngineering()

### Routes (0/7)
- [ ] GET /api/engineering-services
- [ ] GET /api/engineering-services/engineer/:id
- [ ] GET /api/engineering-services/:id
- [ ] POST /api/engineering-services
- [ ] PUT /api/engineering-services/:id
- [ ] DELETE /api/engineering-services/:id
- [ ] GET /api/users

### Integration (0/3)
- [ ] Routes registered
- [ ] Environment variables set
- [ ] Error handling added

### Testing (0/4)
- [ ] Admin tests passed
- [ ] Manager tests passed
- [ ] Engineer tests passed
- [ ] Sales tests passed

### Deployment (0/3)
- [ ] Deployed to production
- [ ] Frontend tested
- [ ] All tests passed
```

---

## 🎯 Success Criteria

Your implementation is complete when:

✅ Admin can create services and see all services  
✅ Manager can create services and see all services  
✅ Engineer can ONLY see their own services  
✅ Engineer can update their service reports  
✅ Sales CANNOT access engineering services at all  
✅ All test scripts pass  
✅ Frontend integration works correctly  

---

## 📞 Resources

- **Main Guide**: `/docs/BACKEND_IMPLEMENTATION_GUIDE.md`
- **API Reference**: `/docs/API_QUICK_REFERENCE.md`
- **Summary**: `/docs/IMPLEMENTATION_SUMMARY.md`
- **Original Requirements**: `/docs/ENGINEER_REPORTS_BACKEND_REQUIREMENTS.md`

---

## ⏱️ Time Estimate

- **Database Setup**: 30 minutes
- **Middleware**: 45 minutes
- **Routes**: 2 hours
- **Users Endpoint**: 30 minutes
- **Integration**: 30 minutes
- **Testing**: 1 hour
- **Deployment**: 30 minutes
- **Frontend Testing**: 30 minutes

**Total**: ~6 hours

---

**Good luck with the implementation! 🚀**

**Questions?** Refer to the detailed guides in `/docs/` folder.
