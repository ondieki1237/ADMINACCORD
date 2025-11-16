# Lead History & Activity Tracking

## Overview
The admin panel now displays a complete history timeline for each lead, showing all status changes, comments, and user actions.

## Frontend Implementation

### UI Features
- **History Button**: Available on each lead card (admin only)
- **View History Button**: In the Track Lead dialog footer
- **Timeline View**: Visual timeline with color-coded activity types
- **Activity Types**:
  - 🟡 Status Changes (with before/after states)
  - 💬 Comments/Notes
  - ✅ Lead Created
  - 👤 Lead Assigned

### Visual Design
- Purple theme for history features (crown/admin context)
- Timeline with connected dots and cards
- Color-coded status badges (green=won, red=lost, blue=contacted, yellow=new)
- Timestamp for each activity
- User attribution for each action

## Expected Backend Data Structure

### Lead Object with History
```json
{
  "_id": "lead123",
  "name": "ABC Hospital",
  "facilityName": "ABC Hospital",
  "contactPerson": {
    "name": "John Doe",
    "email": "john@abc.com",
    "phone": "+254712345678"
  },
  "location": "Nairobi",
  "leadStatus": "contacted",
  "createdAt": "2025-11-01T10:00:00.000Z",
  "updatedAt": "2025-11-15T14:30:00.000Z",
  "notes": "Interested in our premium package",
  "comments": "Follow up scheduled for next week",
  
  // HISTORY ARRAY - This is what the frontend expects
  "history": [
    {
      "action": "created",
      "timestamp": "2025-11-01T10:00:00.000Z",
      "user": {
        "name": "Sales Rep 1",
        "email": "sales1@company.com"
      },
      "userId": "user123",
      "comment": "New lead from website form"
    },
    {
      "action": "status_change",
      "timestamp": "2025-11-03T11:30:00.000Z",
      "oldStatus": "new",
      "newStatus": "contacted",
      "user": {
        "name": "Sales Rep 1",
        "email": "sales1@company.com"
      },
      "userId": "user123",
      "comment": "Called and spoke with contact person",
      "reason": "Initial contact made successfully"
    },
    {
      "action": "comment",
      "timestamp": "2025-11-10T09:15:00.000Z",
      "user": {
        "name": "Sales Rep 1",
        "email": "sales1@company.com"
      },
      "userId": "user123",
      "comment": "Sent pricing proposal via email"
    },
    {
      "action": "assigned",
      "timestamp": "2025-11-12T14:00:00.000Z",
      "user": {
        "name": "Admin User",
        "email": "admin@company.com"
      },
      "userId": "admin123",
      "assignedTo": {
        "name": "Senior Sales Rep",
        "email": "senior@company.com"
      },
      "assignedToId": "user456",
      "comment": "Escalated to senior rep for closing"
    },
    {
      "action": "status_change",
      "timestamp": "2025-11-15T14:30:00.000Z",
      "oldStatus": "contacted",
      "newStatus": "won",
      "user": {
        "name": "Senior Sales Rep",
        "email": "senior@company.com"
      },
      "userId": "user456",
      "comment": "Deal closed! Customer signed contract.",
      "reason": "Agreed to 12-month contract"
    }
  ]
}
```

## History Entry Types

### 1. Status Change
```json
{
  "action": "status_change",
  "timestamp": "2025-11-15T14:30:00.000Z",
  "oldStatus": "contacted",
  "newStatus": "won",
  "user": { "name": "...", "email": "..." },
  "userId": "user123",
  "comment": "Optional comment about why status changed",
  "reason": "Optional detailed reason"
}
```

### 2. Comment/Note
```json
{
  "action": "comment",
  "timestamp": "2025-11-10T09:15:00.000Z",
  "user": { "name": "...", "email": "..." },
  "userId": "user123",
  "comment": "The actual comment text"
}
```

### 3. Lead Created
```json
{
  "action": "created",
  "timestamp": "2025-11-01T10:00:00.000Z",
  "user": { "name": "...", "email": "..." },
  "userId": "user123",
  "comment": "Optional note about lead source"
}
```

### 4. Lead Assigned
```json
{
  "action": "assigned",
  "timestamp": "2025-11-12T14:00:00.000Z",
  "user": { "name": "...", "email": "..." },
  "userId": "admin123",
  "assignedTo": { "name": "...", "email": "..." },
  "assignedToId": "user456",
  "comment": "Optional reason for assignment"
}
```

## Backend Implementation Requirements

### 1. Track History on Every Update

When a lead status changes (PUT `/api/admin/leads/:id`):
```javascript
// Backend code example
const updateLead = async (req, res) => {
  const { leadId } = req.params;
  const { leadStatus, ...updateData } = req.body;
  const currentUser = req.user; // From auth middleware
  
  const lead = await Lead.findById(leadId);
  
  // If status is changing, add history entry
  if (leadStatus && leadStatus !== lead.leadStatus) {
    const historyEntry = {
      action: 'status_change',
      timestamp: new Date(),
      oldStatus: lead.leadStatus,
      newStatus: leadStatus,
      user: {
        name: currentUser.name,
        email: currentUser.email
      },
      userId: currentUser._id,
      comment: updateData.comment || null,
      reason: updateData.reason || null
    };
    
    // Push to history array
    lead.history = lead.history || [];
    lead.history.push(historyEntry);
  }
  
  // Apply updates
  lead.leadStatus = leadStatus;
  Object.assign(lead, updateData);
  
  await lead.save();
  
  res.json({ success: true, data: lead });
};
```

### 2. Add Comment Endpoint

Create an endpoint to add comments without changing status:
```javascript
POST /api/admin/leads/:id/comment

// Request body
{
  "comment": "Customer requested callback tomorrow"
}

// Response - adds history entry with action: "comment"
```

### 3. Track Lead Creation

When creating a new lead:
```javascript
const createLead = async (req, res) => {
  const leadData = req.body;
  const currentUser = req.user;
  
  const newLead = new Lead({
    ...leadData,
    createdBy: currentUser._id,
    history: [
      {
        action: 'created',
        timestamp: new Date(),
        user: {
          name: currentUser.name,
          email: currentUser.email
        },
        userId: currentUser._id,
        comment: leadData.initialComment || 'Lead created'
      }
    ]
  });
  
  await newLead.save();
  res.json({ success: true, data: newLead });
};
```

### 4. Track Assignment

When assigning a lead to another user:
```javascript
PUT /api/admin/leads/:id/assign

// Request body
{
  "assignedToId": "user456",
  "comment": "Escalating to senior rep"
}

// Backend adds history entry with action: "assigned"
```

## Database Schema

### MongoDB Schema Example
```javascript
const leadSchema = new mongoose.Schema({
  name: String,
  facilityName: String,
  contactPerson: {
    name: String,
    email: String,
    phone: String
  },
  location: String,
  leadStatus: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'won', 'lost'],
    default: 'new'
  },
  notes: String,
  comments: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // HISTORY TRACKING
  history: [{
    action: {
      type: String,
      enum: ['created', 'status_change', 'comment', 'assigned', 'updated'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    oldStatus: String,
    newStatus: String,
    user: {
      name: String,
      email: String
    },
    userId: mongoose.Schema.Types.ObjectId,
    assignedTo: {
      name: String,
      email: String
    },
    assignedToId: mongoose.Schema.Types.ObjectId,
    comment: String,
    reason: String
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to update timestamp
leadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});
```

## Testing the Feature

### 1. Check if backend returns history
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://app.codewithseth.co.ke/api/admin/leads?page=1&limit=1
```

Look for the `history` array in the response.

### 2. If no history exists
The frontend will show: "No history available - Activity tracking may not be enabled for this lead yet"

### 3. Update backend to populate history
- Add history array to existing leads (migration script)
- Start tracking all new changes
- Backfill creation entries for existing leads

## UI Screenshots Context

The history dialog shows:
- ✅ Purple header with clock icon
- ✅ Lead summary card with current status
- ✅ Timeline with connected dots
- ✅ Each activity in a card with:
  - Icon (green checkmark, red X, blue alert, purple message)
  - Action type (Status Changed, Comment Added, etc.)
  - Timestamp
  - Status badges (before → after)
  - Comment/reason in gray box
  - User attribution at bottom
- ✅ Empty state if no history

## Next Steps

1. **Backend**: Implement history tracking in all lead update endpoints
2. **Backend**: Add middleware to auto-track changes
3. **Backend**: Create migration script to add history to existing leads
4. **Frontend**: (Already done) Display history in beautiful timeline
5. **Testing**: Verify history populates correctly with real data
