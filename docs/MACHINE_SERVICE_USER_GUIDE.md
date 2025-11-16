# Machine-Service Integration - User Guide

## Quick Start: How to Use the New Features

---

## 📜 Viewing Service History

### Method 1: Quick Access (Recommended)
1. Go to **Machines** page from dashboard
2. Find the machine you want to check
3. Click the **"History"** button on the machine card
4. Service History dialog opens showing all past services

### Method 2: Via Machine Details
1. Go to **Machines** page from dashboard
2. Click **"View Details"** on any machine card
3. In the machine details dialog, click **"View Service History"**
4. Service History dialog opens

### What You'll See
- **Timeline view** of all services (newest first)
- Each service shows:
  - **Service type badge** (color-coded):
    - 🔵 Blue = Installation
    - 🔴 Red = Repair
    - 🟣 Purple = Calibration
    - 🟡 Yellow = Maintenance
  - **Status badge**: scheduled, in-progress, completed, cancelled
  - **Date**: When service was scheduled/performed
  - **Engineer**: Name and phone number
  - **Notes**: Description of work done

### Empty State
If no services exist, you'll see:
- History icon
- Message: "No service history found for this machine"
- Option to create first service

---

## 🛠️ Creating a New Service

### Method 1: From Machine Details
1. Go to **Machines** page
2. Click **"View Details"** on machine card
3. Click **"Create Service"** button (blue gradient button)
4. Fill out service form
5. Click **"Create Service"**

### Method 2: From Service History
1. Open Service History (see above)
2. Click **"Create Service"** button at bottom
3. Fill out service form
4. Click **"Create Service"**

### Form Fields

#### Machine Information (Pre-filled, Read-only)
Displayed in blue panel at top:
- Model (e.g., "XRay 5000")
- Manufacturer (e.g., "Acme Medical")
- Serial Number (e.g., "ABC123")
- Facility (e.g., "Kenyatta National Hospital")

#### Service Details (You fill these)

**Service Type** *required*
- Installation
- Maintenance
- Repair
- Calibration

**Scheduled Date** *required*
- Pick date from calendar picker
- Should be future date for new services

**Engineer Name** *required*
- Full name of engineer to assign
- Example: "John Doe"

**Engineer Phone** *required*
- Phone number with country code
- Example: "+254712345678"

**Status** (optional, defaults to "scheduled")
- Scheduled (default for new services)
- In Progress (if starting immediately)
- Completed (if already done)
- Cancelled (if service won't happen)

**Notes** (optional)
- Description of work to be done
- Special instructions
- Issues to address
- Example: "Check calibration and replace filters"

### Validation
The **"Create Service"** button is disabled until you fill:
- ✅ Service Type
- ✅ Scheduled Date
- ✅ Engineer Name
- ✅ Engineer Phone

### After Submission
1. Success toast notification appears: "Service created successfully"
2. Dialog closes automatically
3. Form resets for next service
4. Service history refreshes (if open)
5. Machine list updates
6. **Engineer receives notification** (backend handles this)

---

## 🎯 Common Workflows

### Scenario 1: Routine Maintenance
```
Problem: Machine needs regular maintenance check
Steps:
1. Go to Machines page
2. Find the machine (e.g., "XRay 5000 at KNH")
3. Click "View Details"
4. Click "Create Service"
5. Select "Maintenance" as service type
6. Pick next week's date
7. Enter engineer: "Jane Smith" / "+254723456789"
8. Notes: "Routine quarterly maintenance - check calibration, clean filters, test all functions"
9. Click "Create Service"
Result: Service scheduled, engineer notified
```

### Scenario 2: Emergency Repair
```
Problem: Machine broke down, needs immediate repair
Steps:
1. Go to Machines page
2. Find broken machine
3. Click "Create Service" from card (or details)
4. Select "Repair" as service type
5. Pick today's date
6. Enter on-call engineer details
7. Status: "In Progress"
8. Notes: "URGENT - Display screen not working, check power supply and connections"
9. Click "Create Service"
Result: Engineer receives urgent notification
```

### Scenario 3: Review Service History Before New Service
```
Problem: Need to see past issues before scheduling maintenance
Steps:
1. Go to Machines page
2. Click "History" button on machine card
3. Review past services:
   - Last maintenance: 3 months ago
   - Previous repair: Fixed sensor issue
   - Installation: 2 years ago
4. Click "Create Service" at bottom of dialog
5. Fill form with context from history
6. Notes: "Regular maintenance - also check sensor (repaired 6 months ago)"
7. Click "Create Service"
Result: Informed service planning
```

### Scenario 4: Multiple Services for Same Machine
```
Problem: Need to schedule calibration and maintenance
Steps:
1. Create first service (Calibration) - submit
2. Wait for success notification
3. Click "Create Service" again (dialog reopens)
4. Create second service (Maintenance) with different date
5. Submit second service
Result: Two services scheduled for same machine
```

---

## 💡 Tips & Best Practices

### Service Types - When to Use Each
- **Installation**: Initial setup, relocation, new deployment
- **Maintenance**: Routine checks, preventive care, scheduled upkeep
- **Repair**: Fixing broken components, troubleshooting issues
- **Calibration**: Accuracy testing, adjustments, compliance checks

### Writing Good Notes
✅ **Good Examples**:
- "Quarterly maintenance - check all sensors, calibrate display, replace air filters, verify emergency shutdown"
- "Emergency repair - error code E47 on display, likely faulty power board, bring replacement parts"
- "Annual calibration required for regulatory compliance - prepare certification paperwork"

❌ **Avoid**:
- "Fix it" (too vague)
- "Check machine" (not specific)
- Empty notes for complex services

### Phone Number Format
- ✅ Include country code: "+254712345678"
- ✅ No spaces works: "+254712345678"
- ✅ With spaces works: "+254 712 345 678"
- ❌ Without country code: "0712345678" (may cause issues)

### Scheduling Best Practices
- Schedule maintenance during facility off-hours
- Leave buffer time between services
- Check engineer availability before assigning
- Use "In Progress" only for services actively being performed

---

## 🔍 Finding Information

### Check Last Service Date
1. Go to Machines list
2. Each machine card shows "Last Serviced" date
3. Or open machine details to see full service dates section

### Find Machines Needing Service
1. Look for machines with "Next Service Due" dates in the past
2. Status badges will show "maintenance" for overdue machines
3. Stats cards show count of machines needing service

### View Engineer's Service History
*Note: Currently shows services per machine. Engineer-specific view in engineering services page*
1. Go to Engineering Services page (separate section)
2. Filter by engineer name
3. See all services assigned to that engineer

---

## 🚨 Troubleshooting

### "Failed to create service" Error
**Possible causes**:
1. Missing required fields (check red text)
2. Invalid phone number format
3. Network connection issue
4. Backend server error

**Solutions**:
1. Verify all required fields filled (*, red borders)
2. Check phone has country code (+254...)
3. Check internet connection
4. Try again in a few moments
5. Contact admin if error persists

### Service History Not Loading
**Symptoms**: Spinning wheel forever
**Solutions**:
1. Refresh the page
2. Close and reopen the dialog
3. Check internet connection
4. Clear browser cache
5. Try different machine

### Dialog Won't Close
**Symptoms**: Clicking Close/X doesn't work
**Solutions**:
1. Click "Cancel" or "Close" button again
2. Press ESC key on keyboard
3. Click outside dialog (dark area)
4. Refresh page as last resort

---

## 📱 Mobile Responsive

All features work on mobile devices:
- Service history scrolls vertically
- Form fields stack on small screens
- Buttons expand to full width
- Touch-friendly button sizes

---

## ⚡ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ESC | Close any open dialog |
| TAB | Navigate between form fields |
| ENTER | Submit form (when in input field) |
| SPACE | Toggle dropdown (when focused) |

---

## 🔐 Permissions

### Who Can Use These Features?
- ✅ **Admins**: Full access - view all, create services
- ❌ **Regular users**: No access to admin panel
- ❌ **Engineers**: Access via mobile app (different interface)

### What Admins Can Do
- View service history for any machine
- Create services for any machine
- Assign any engineer
- Edit machine details
- Delete machines (removes service history too)

---

## 📊 Data Sync

### Real-time Updates
- Service created → Appears in history immediately
- Machine updated → Last service date updates
- Engineer notified → Instant (via backend)

### What Syncs Automatically
- Service history list
- Machine last serviced date
- Machine next service due date
- Service counts in stats cards

---

## 🎓 Training Checklist

Practice these tasks to master the feature:

- [ ] View service history for a machine
- [ ] Create a maintenance service
- [ ] Create a repair service  
- [ ] Use quick History button on machine card
- [ ] Fill all form fields correctly
- [ ] Write detailed service notes
- [ ] Verify success notification appears
- [ ] Check service appears in history
- [ ] Create multiple services for one machine
- [ ] Navigate between dialogs (Details → History → Create)

---

## 📞 Support

Need help? Check:
1. **Documentation**: `MACHINE_SERVICE_INTEGRATION.md` (technical details)
2. **Backend API**: `API_QUICK_REFERENCE.md` (endpoint info)
3. **General Help**: `MACHINES_ADMIN_PANEL.md` (machine features)

---

## Summary

**Key Points**:
- 🎯 Two ways to access: Quick History button or via Details
- 🛠️ Pre-filled machine data saves time
- ✅ Required fields: Service type, date, engineer name/phone
- 📝 Good notes help engineers prepare
- 🔔 Engineers get notified automatically
- ♻️ Everything updates in real-time

**Remember**:
- Always add meaningful notes
- Use correct phone format (+country code)
- Schedule during appropriate times
- Review history before creating services
- Verify engineer availability first

Happy service scheduling! 🎉
