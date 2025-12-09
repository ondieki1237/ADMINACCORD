# Consumables Feature - Quick Start Guide

## Accessing the Feature

### From Sidebar (Desktop)
1. Login to ACCORD dashboard
2. Look for "Consumables" in the **Quick Actions** section (cyan icon)
3. Click to navigate to Consumables page

### From Mobile
1. Use bottom navigation menu
2. Tap "Consumables" (same cyan Package icon)

## Core Operations

### View All Consumables
- Page loads with all consumables displayed in a table
- Shows: Name, Category, Unit, Price (KES), Status, Actions
- Default: 20 items per page

### Search Consumables
1. Locate the search box labeled "Search by Name"
2. Type consumable name (e.g., "FT4", "TSH")
3. List auto-filters as you type

### Filter by Category
1. Open the "Category" dropdown
2. Select from: Thyroid Function, Cardiac Markers, Blood Tests, Imaging, Other
3. List updates to show only selected category
4. Select "All Categories" to clear filter

### Create New Consumable
1. Click **"+ Add Consumable"** button (top right)
2. Fill in required fields:
   - **Category**: Select from dropdown
   - **Name**: Enter consumable name
   - **Price (KES)**: Enter price as number
   - **Unit**: Select unit type
3. Optional: Add **Description** in textarea
4. Click **"Save"** to create

**Valid Units**: kit, box, bottle, vial, cartridge, pack, unit

### Edit Consumable
1. Click **Edit icon** (pencil) in the Actions column
2. Dialog opens with pre-filled data
3. Modify any field as needed
4. Click **"Save"** to apply changes

### Delete Consumable
1. Click **Delete icon** (trash) in the Actions column
2. Browser confirmation appears: "Are you sure you want to delete this consumable?"
3. Click **"OK"** to confirm soft delete
4. Consumable marked as Inactive in system

## Display Information

### Statistics Cards
Located at top of page:
- **Total Consumables**: Count of all consumables in system
- **Categories**: Number of unique categories in use
- **Total Value**: Sum of all consumable prices (KES)

### Table Columns
| Column | Description |
|--------|-------------|
| Name | Consumable name + description (if any) |
| Category | Color-coded badge showing category |
| Unit | Measurement unit (kit, box, etc.) |
| Price | Price in KES currency |
| Status | Green checkmark = Active, Gray = Inactive |
| Actions | Edit or Delete buttons |

### Status Indicators
- ✅ **Active** (green checkmark): Consumable is available
- ⚫ **Inactive** (gray): Consumable has been soft-deleted

## Pagination

### Navigation
- **Previous/Next**: Click arrow buttons to change pages
- **Jump to Page**: Click specific page number
- **Info**: Shows "Page X of Y" and item range

### Example
If 75 total consumables:
- Page 1: Items 1-20
- Page 2: Items 21-40
- Page 3: Items 41-60
- Page 4: Items 61-75

## Error Handling

### Search Error
**Problem**: "Error loading consumables"
**Solution**: Click **"Refresh"** button to retry

### Validation Error
**Problem**: "Please fill in all required fields"
**Solution**: Ensure Category, Name, Price, and Unit all have values

### API Error
**Problem**: Toast notification with error message
**Solution**: Check:
- Are you logged in as admin?
- Is backend API running?
- Check network connection

## Tips & Tricks

### Quick Refresh
- Click **"Refresh"** button to reload list without navigating away
- Useful after external changes or to clear cache

### Keyboard Shortcuts
- Tab: Navigate form fields
- Enter: Save (in dialog)
- Escape: Close dialog

### Best Practices
1. Use clear, consistent naming for consumables
2. Keep descriptions brief but informative
3. Set accurate prices (important for reports)
4. Use appropriate categories for filtering
5. Delete old/obsolete consumables rather than create new ones

### Bulk Operations
Currently not available, but can be added in future versions

## Permissions

### Who Can Access
- ✅ Admin users only
- ❌ Non-admin users: See "Access Denied" message

### What Admins Can Do
- ✅ View all consumables
- ✅ Create new consumables
- ✅ Edit existing consumables
- ✅ Delete consumables (soft delete)
- ✅ Search and filter
- ✅ View statistics

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Access Denied" message | Confirm you're logged in as admin |
| List won't load | Click Refresh or check internet connection |
| Can't save consumable | Check all required fields are filled |
| Delete not working | Confirm browser allows JavaScript confirmations |
| Mobile list too small | Pinch to zoom or rotate device to landscape |

## Related Features

- **Leads Management**: Similar interface for managing sales leads
- **Machines Management**: Similar interface for managing equipment
- **Reports**: May reference consumables in future enhancements
- **Daily Reports**: Can track consumables usage (future feature)

## Data Backup

Consumables are stored in backend database:
- Soft deletes maintain data integrity
- Deleted consumables can be recovered by admin
- Price history tracked via timestamps

## API Reference

If integrating with other systems:

```bash
# List consumables
GET /api/admin/consumables?page=1&limit=20

# Get single consumable
GET /api/admin/consumables/:id

# Create consumable
POST /api/admin/consumables
Body: {
  "category": "Thyroid Function",
  "name": "FT4",
  "price": 8000,
  "unit": "kit",
  "description": "Free T4 test kit"
}

# Update consumable
PUT /api/admin/consumables/:id
Body: { ...fields to update... }

# Delete consumable (soft)
DELETE /api/admin/consumables/:id
```

## Support

For issues or feature requests:
1. Document the problem with steps to reproduce
2. Check backend logs for errors
3. Verify API endpoint is responding
4. Contact development team with details

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Active
