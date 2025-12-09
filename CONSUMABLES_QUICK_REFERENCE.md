# Consumables Feature - Quick Reference Card

## 🎯 What Is Consumables Management?

A new admin dashboard feature that allows you to manage medical consumables and supplies with full CRUD operations (Create, Read, Update, Delete).

---

## 📍 How to Access

**Desktop**: Sidebar → Quick Actions → 📦 Consumables  
**Mobile**: Bottom Menu → 📦 Consumables  
**URL**: `/dashboard/consumables`

---

## 🔧 Core Operations

### 1️⃣ View Consumables List
- Automatic page load shows all consumables
- 20 items per page with pagination
- Shows: Name, Category, Unit, Price (KES), Status

### 2️⃣ Search by Name
- Type in "Search by Name" box
- Auto-filters as you type
- Example: Type "FT4" to find FT4 consumable

### 3️⃣ Filter by Category
- Click "Category" dropdown
- Select: Thyroid Function, Cardiac Markers, Blood Tests, Imaging, Other
- List updates immediately

### 4️⃣ Create New
- Click **[+ Add Consumable]** button
- Fill: Category*, Name*, Price*, Unit*, Description (optional)
- Click **Save**

### 5️⃣ Edit Existing
- Click **Edit icon** (pencil) in Actions column
- Modify any fields
- Click **Save**

### 6️⃣ Delete/Deactivate
- Click **Delete icon** (trash) in Actions column
- Confirm deletion
- Item marked as Inactive

---

## 📊 Display Meaning

| Symbol | Meaning |
|--------|---------|
| ✅ | Consumable is Active |
| ⚫ | Consumable is Inactive |
| 📦 | Consumables menu item |
| 💰 | Price/cost value |
| 🔳 | Categories count |

---

## 🛠️ Required Fields

| Field | Type | Examples |
|-------|------|----------|
| Category* | Dropdown | Thyroid Function, Cardiac Markers |
| Name* | Text | FT4, TSH, Troponin |
| Price* | Number | 8000, 5500, 12000 |
| Unit* | Dropdown | kit, box, bottle, vial, cartridge |
| Description | Text | Optional - any notes |

---

## 📈 Statistics at a Glance

**Card 1: Total Consumables**  
Shows total count of all consumables in system

**Card 2: Total Categories**  
Shows number of unique categories being used

**Card 3: Total Value (KES)**  
Shows sum of all consumable prices

---

## ⚡ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Tab | Navigate form fields |
| Enter | Submit form in dialog |
| Escape | Close dialog without saving |
| Ctrl+F | Search (browser search) |

---

## ❓ FAQs

**Q: Can I permanently delete a consumable?**  
A: No, deletes are soft (marked inactive). Recoverable by admin.

**Q: Can I export consumables to Excel?**  
A: Not in v1, but it's on the roadmap.

**Q: What if I forget to fill a field?**  
A: Error message appears: "Please fill in all required fields"

**Q: Can non-admins access this?**  
A: No, shows "Access Denied" for non-admin users.

**Q: How many items show per page?**  
A: 20 items per page by default.

**Q: Can I bulk import consumables?**  
A: Not in v1, but planned for future version.

---

## 🔧 Admin Reference

### API Endpoints

```
GET  /api/admin/consumables?page=1&limit=20
GET  /api/admin/consumables/:id
POST /api/admin/consumables
PUT  /api/admin/consumables/:id
DELETE /api/admin/consumables/:id
```

### Data Structure
```json
{
  "_id": "string",
  "category": "string",
  "name": "string",
  "price": "number",
  "unit": "string",
  "description": "string (optional)",
  "isActive": "boolean",
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

## 📱 Mobile Tips

- **Portrait**: Single column list, scroll right for actions
- **Landscape**: Full table visible, better for editing
- **Zoom**: Pinch to zoom if text too small
- **Tap**: Tap any row to highlight

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| List won't load | Click "Refresh" button |
| Can't save | Check all required fields filled |
| "Access Denied" | Login as admin user |
| Delete not working | Try refresh, then delete again |
| Search not working | Clear search box, reload page |

---

## ✨ Pro Tips

1. **Consistent Naming** - Use standard names (FT4 not "free t4")
2. **Clear Categories** - Keep categories organized and meaningful
3. **Accurate Pricing** - Ensure prices are current
4. **Use Descriptions** - Add notes for special consumables
5. **Regular Cleanup** - Delete old/unused consumables periodically
6. **Backup Data** - System has built-in soft delete backup

---

## 📞 Support & Feedback

- 📧 Email: support@accordion.com
- 📝 Document Issues: [Create Issue]
- 💡 Suggest Features: [Feature Request]
- 📖 Read Full Docs: CONSUMABLES_USER_GUIDE.md

---

## 🗂️ Related Documentation

- **Implementation Guide**: CONSUMABLES_IMPLEMENTATION.md
- **User Guide**: CONSUMABLES_USER_GUIDE.md
- **Feature Summary**: CONSUMABLES_FEATURE_SUMMARY.md
- **Changelog**: CONSUMABLES_CHANGELOG.md

---

## 🎓 Learning Path

1. **Start Here**: This Quick Reference
2. **User Guide**: For detailed instructions
3. **Try It**: Create your first consumable
4. **Explore**: Test search, filter, edit, delete
5. **Master**: Use statistics and pagination

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: ✅ Active & Production Ready
