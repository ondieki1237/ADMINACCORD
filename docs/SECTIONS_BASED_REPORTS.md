# Sections-Based Report Structure Implementation

## 🎯 Overview
The reports system now supports a **sections-based** data structure that allows for flexible, dynamic report content. This replaces the previous fixed-field approach with a more scalable array-based system.

---

## 📊 Data Structure

### New Report Interface

```typescript
interface Report {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
  };
  weekStart: string;        // ISO date
  weekEnd: string;          // ISO date
  weekRange?: string;       // Display format: "06/10/2025 - 12/10/2025"
  status: "pending" | "approved" | "rejected";
  adminNotes?: string | null;
  createdAt: string;
  
  // NEW: Sections-based structure
  sections?: Array<{
    id: string;           // Unique section identifier
    title: string;        // Display title
    content: string;      // Section content (supports multi-line text)
  }>;
  
  // Legacy structure (backward compatibility)
  weeklySummary?: string;
  visits?: Array<...>;
  quotations?: Array<...>;
  // ... other legacy fields
}
```

---

## 📝 Section Types

### Predefined Section IDs

| Section ID | Title | Icon | Color Theme |
|------------|-------|------|-------------|
| `summary` | Weekly Summary | 📋 | Gray |
| `visits` | Customer Visits | 👥 | Blue |
| `quotations` | Quotations Generated | 💰 | Green |
| `leads` | New Leads | 🎯 | Yellow |
| `challenges` | Challenges Faced | ⚠️ | Red |
| `nextWeek` | Next Week's Plan | ⚡ | Purple |

### Custom Sections
You can also add custom sections with any `id`, `title`, and `content`. They will display with default styling (gray theme).

---

## 💡 Example Data

### API Response Example

```json
{
  "_id": "report12345",
  "userId": {
    "_id": "user123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@accord.com",
    "employeeId": "EMP001"
  },
  "weekStart": "2025-10-06T00:00:00.000Z",
  "weekEnd": "2025-10-12T23:59:59.999Z",
  "weekRange": "06/10/2025 - 12/10/2025",
  "status": "pending",
  "createdAt": "2025-10-12T17:30:00.000Z",
  "sections": [
    {
      "id": "summary",
      "title": "Weekly Summary",
      "content": "This week focused on expanding our client base in the Nairobi region. Successfully completed product demonstrations at 3 major hospitals and generated 2 new quotations worth KES 2.5M combined."
    },
    {
      "id": "visits",
      "title": "Customer Visits",
      "content": "1. Nairobi General Hospital - Product demo of X-Ray Model 500\n2. Kenyatta National Hospital - Follow-up meeting on pending order\n3. Mombasa Medical Center - Installation support for ultrasound system\n4. Eldoret Regional Hospital - Maintenance check on existing equipment\n5. Nakuru Clinic - Consultation and quotation discussion"
    },
    {
      "id": "quotations",
      "title": "Quotations Generated",
      "content": "• X-Ray Machine Model 500 for Nairobi General Hospital - KES 1,200,000 (Pending approval)\n• Ultrasound System Premium for Mombasa Medical Center - KES 800,000 (Client reviewing)\n• CT Scanner upgrade for Eldoret Regional - KES 500,000 (Budget constraints)"
    },
    {
      "id": "leads",
      "title": "New Leads",
      "content": "• Kisumu Hospital - Expressed interest in imaging equipment, budget planning for Q2\n• Thika Medical Center - Requested product catalog, potential order in November\n• Machakos Clinic - Expanding facility, looking at complete radiology setup\n• Nyeri Regional Hospital - RFP expected next month for diagnostic equipment"
    },
    {
      "id": "challenges",
      "title": "Challenges Faced",
      "content": "Encountered delays in scheduling meetings with procurement teams at two hospitals due to budget freeze periods. Some clients are waiting for government funding approval before committing to orders. Competition from Chinese brands offering lower prices is increasing."
    },
    {
      "id": "nextWeek",
      "title": "Next Week's Plan",
      "content": "• Follow up on 3 pending quotations with decision-makers\n• Schedule product demonstrations at 2 new hospitals in Western region\n• Attend medical equipment trade show in Nairobi on Wednesday\n• Prepare proposal for Machakos Clinic complete setup\n• Visit existing clients for relationship maintenance"
    }
  ]
}
```

---

## 🎨 UI Display

### Detail Modal View

When viewing a report, each section is displayed with:
- **Color-coded background** based on section ID
- **Icon** matching the section type
- **Title** as header
- **Content** with preserved line breaks and formatting
- **Auto-scrolling** for long content

### Section Rendering Order

Sections are automatically sorted in the following order (if present):
1. Summary
2. Visits
3. Quotations
4. Leads
5. Challenges
6. Next Week
7. Custom sections (any other IDs)

### Color Scheme

```css
/* Summary */
background: #f3f4f6 (gray-50)
border: #e5e7eb (gray-200)

/* Visits */
background: #dbeafe (blue-50)
border: #93c5fd (blue-200)

/* Quotations */
background: #d1fae5 (green-50)
border: #6ee7b7 (green-200)

/* Leads */
background: #fef3c7 (yellow-50)
border: #fcd34d (yellow-200)

/* Challenges */
background: #fee2e2 (red-50)
border: #fca5a5 (red-200)

/* Next Week */
background: #e9d5ff (purple-50)
border: #d8b4fe (purple-200)
```

---

## 📄 PDF Generation

### Individual Report PDF

When generating a PDF, each section is rendered with:

1. **Section Header**
   - Color-coded background matching UI
   - Icon + Title
   - Bold, larger font

2. **Section Content**
   - Normal text with proper wrapping
   - Preserves line breaks
   - Automatic pagination if content is too long

3. **Professional Formatting**
   - ACCORD branding (logo, colors)
   - Page headers and footers
   - Page numbers
   - Signature lines on final page

### PDF Layout Example

```
┌────────────────────────────────────────┐
│ [ACCORD Logo]              ACCORD      │
│                            Field       │
│                            Activity    │
│                            Management  │
├────────────────────────────────────────┤
│ Weekly Report Details                  │
├────────────────────────────────────────┤
│                                        │
│ [Employee Info Box - Color: Status]    │
│ John Doe                               │
│ Employee ID: EMP001                    │
│ Email: john.doe@accord.com            │
│ Week: 06/10/2025 - 12/10/2025        │
│ Status: PENDING                        │
│                                        │
├────────────────────────────────────────┤
│                                        │
│ [Gray Box] 📋 Weekly Summary          │
│ This week focused on...               │
│                                        │
│ [Blue Box] 👥 Customer Visits         │
│ 1. Nairobi General Hospital...       │
│ 2. Kenyatta National Hospital...     │
│                                        │
│ [Green Box] 💰 Quotations Generated   │
│ • X-Ray Machine Model 500...         │
│ • Ultrasound System...               │
│                                        │
│ [Yellow Box] 🎯 New Leads             │
│ • Kisumu Hospital...                  │
│ • Thika Medical Center...            │
│                                        │
│ [Red Box] ⚠️ Challenges Faced         │
│ Encountered delays...                 │
│                                        │
│ [Purple Box] ⚡ Next Week's Plan      │
│ • Follow up on quotations...         │
│ • Schedule demonstrations...         │
│                                        │
├────────────────────────────────────────┤
│ Page 1 of 2    ACCORD - Confidential  │
└────────────────────────────────────────┘
```

---

## 🔄 Backward Compatibility

The system supports **three scenarios**:

### 1. Sections-Based (New Standard)
```json
{
  "sections": [
    { "id": "summary", "title": "Weekly Summary", "content": "..." },
    { "id": "visits", "title": "Customer Visits", "content": "..." }
  ]
}
```
✅ Displays all sections with color coding
✅ Generates comprehensive PDF

### 2. Legacy Metadata (Old Format)
```json
{
  "weeklySummary": "...",
  "visits": [...],
  "quotations": [...]
}
```
✅ Falls back to old display logic
✅ Still generates professional PDF

### 3. No Metadata (File Only)
```json
{
  "fileUrl": "https://cloudinary.com/...",
  "sections": []
}
```
✅ Shows "No detailed report content" message
✅ Provides file download link

---

## ✨ Benefits of Sections Structure

### 1. **Flexibility**
- Add/remove sections dynamically
- No fixed schema constraints
- Easy to extend with new section types

### 2. **Simplicity**
- Single array structure
- Consistent data format
- Easy to validate and process

### 3. **Scalability**
- Support any number of sections
- Custom sections for special reports
- Easy to migrate existing data

### 4. **Performance**
- Efficient database queries
- Fast rendering
- Optimized PDF generation

### 5. **Maintainability**
- Single display logic for all sections
- Easy to update styling
- Consistent user experience

---

## 🔧 Implementation Details

### Frontend Component
**File**: `/components/dashboard/reports.tsx`

**Key Changes**:
- Added `sections` and `weekRange` fields to Report interface
- New section-based rendering logic in detail modal
- Color-coding based on section ID
- Fallback to legacy structure
- Use `weekRange` if available, otherwise format dates

### PDF Generator
**File**: `/lib/reportsPdfGenerator.ts`

**Key Changes**:
- Added `sections` and `weekRange` fields to Report interface
- New section-based PDF rendering
- Color backgrounds for each section type
- Automatic section sorting
- Intelligent pagination
- Use `weekRange` for display

---

## 📊 Section Content Guidelines

### Best Practices

1. **Summary Section**
   - Keep concise (2-3 paragraphs max)
   - Highlight key achievements
   - Mention overall goals/focus

2. **Visits Section**
   - Use numbered or bullet list
   - Format: "Hospital Name - Purpose/Outcome"
   - Include 3-5 most significant visits

3. **Quotations Section**
   - Format: "Equipment - Client - Amount - Status"
   - Use KES currency format
   - Group by status if many quotations

4. **Leads Section**
   - List potential clients
   - Include interest area
   - Note timeline/next steps

5. **Challenges Section**
   - Be specific but professional
   - Focus on systemic issues, not blame
   - Suggest solutions if possible

6. **Next Week Section**
   - Use bullet points or numbered list
   - Be specific and actionable
   - Include dates/deadlines if known

---

## 🚀 Migration Path

### Phase 1: Dual Support (Current)
✅ Both `sections` and legacy fields supported
✅ Automatic fallback logic
✅ No breaking changes

### Phase 2: Encourage Sections
- Update mobile app to use sections structure
- Provide section templates
- Show benefits (better formatting, faster loading)

### Phase 3: Sections as Standard
- Make sections required for new reports
- Migrate old reports to sections format
- Deprecate legacy fields

---

## 📋 Testing Checklist

- [x] Reports with sections display correctly
- [x] Color coding works for all section types
- [x] PDF includes all sections with proper styling
- [x] Legacy reports still work (fallback)
- [x] Empty sections are skipped
- [x] Week range displays correctly
- [x] Multi-line content preserves formatting
- [x] Pagination works properly in PDFs
- [x] Custom sections display with default styling
- [x] No TypeScript errors

---

## 🎉 Summary

The **sections-based structure** provides:
- ✅ Flexible, dynamic report content
- ✅ Beautiful color-coded display
- ✅ Professional PDF generation
- ✅ Backward compatibility
- ✅ Easy to extend and maintain
- ✅ Better user experience

**Result**: A scalable, maintainable reporting system that can grow with business needs while maintaining professional presentation and data integrity.
