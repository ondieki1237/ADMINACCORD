# Reports PDF Generation System

## Overview
Professional PDF generation for ACCORD's Weekly Reports management system with company branding, comprehensive summaries, and individual report details.

## Features

### 1. Summary PDF Report
**Purpose**: Administrative overview of all submitted reports with filtering options

**Includes**:
- ACCORD company logo and branding
- Generation metadata and admin information
- Report statistics dashboard:
  - Total reports count
  - Pending reports count
  - Approved reports count
  - Rejected reports count
- Comprehensive reports table with:
  - Staff name and email
  - Week period
  - Submission date
  - Status (color-coded: Pending/Approved/Rejected)
  - Admin notes
- Professional pagination with page numbers
- Confidential watermark on all pages

### 2. Individual Report PDF
**Purpose**: Detailed documentation for a single staff report entry

**Includes**:
- ACCORD logo and header
- Staff information card (color-coded by status):
  - Green background: Approved
  - Red background: Rejected
  - Orange background: Pending
- Report metadata:
  - Report ID
  - File name
  - File availability status
  - Submission timestamp
- Admin notes section (highlighted)
- Report timeline table
- File access information
- Signature lines for review documentation

## Design System

### Color Scheme
```typescript
Primary Blue:    #1a56db  // Headers, main branding
Secondary Gray:  #6b7280  // Metadata, footer text
Success Green:   #059669  // Approved status
Warning Orange:  #f59e0b  // Pending status
Danger Red:      #dc2626  // Rejected status
Accent Purple:   #7c3aed  // Table headers
Text:            #111827  // Body content
Light Gray:      #f3f4f6  // Backgrounds, alternating rows
```

### Status Color Coding
- **Approved**: Green (#059669)
- **Pending**: Orange (#f59e0b)
- **Rejected**: Red (#dc2626)

## Updated UI Features

### Modern Dashboard Layout
1. **Statistics Cards**:
   - Total Reports (blue gradient)
   - Pending (yellow/orange gradient)
   - Approved (green gradient)
   - Rejected (red gradient)
   - Icons for visual identification

2. **Filters Bar**:
   - Search by name/email (live filtering)
   - Status filter dropdown (All/Pending/Approved/Rejected)
   - Summary PDF download button (black, professional)
   - Refresh button

3. **Professional Table**:
   - Blue gradient header
   - Hover effects on rows
   - Status badges with icons
   - Action buttons per row:
     - Download individual PDF (black button)
     - View original file (outline button)
     - Review button (for pending reports)

4. **Review Modal**:
   - Modal popup for pending reports
   - Status selector (Approved/Rejected)
   - Admin notes textarea
   - Update/Cancel buttons

## PDF Generation Functions

### Generate Summary PDF

```typescript
import { generateReportsSummaryPDF } from '@/lib/reportsPdfGenerator';

const handleDownloadSummary = async () => {
  const reports = [...]; // Array of report objects
  const adminName = 'John Doe';
  const filterStatus = 'all'; // or 'pending', 'approved', 'rejected'
  
  await generateReportsSummaryPDF(reports, adminName, filterStatus);
};
```

**Output**: `ACCORD_Reports_Summary_2024-01-12.pdf` or `ACCORD_Reports_Summary_pending_2024-01-12.pdf`

### Generate Individual PDF

```typescript
import { generateIndividualReportPDF } from '@/lib/reportsPdfGenerator';

const handleDownloadIndividual = async (report) => {
  const adminName = 'John Doe';
  
  await generateIndividualReportPDF(report, adminName);
};
```

**Output**: `ACCORD_Report_John_Doe_2024-01-08.pdf`

## UI Components

### Statistics Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {/* Total Reports - Blue */}
  {/* Pending - Yellow/Orange */}
  {/* Approved - Green */}
  {/* Rejected - Red */}
</div>
```

### Filter Controls
```tsx
<div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4">
  {/* Search Input */}
  <input type="text" placeholder="Search by name or email..." />
  
  {/* Status Filter */}
  <select value={statusFilter}>
    <option value="all">All Status</option>
    <option value="pending">Pending</option>
    <option value="approved">Approved</option>
    <option value="rejected">Rejected</option>
  </select>
  
  {/* PDF Button */}
  <Button className="bg-black text-white">
    <Download /> Summary PDF
  </Button>
</div>
```

### Reports Table
```tsx
<table className="w-full">
  <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
    {/* Header cells */}
  </thead>
  <tbody>
    {filteredReports.map(report => (
      <tr className="hover:bg-gray-50">
        {/* Status badge with icon and color */}
        <span className={statusBadgeClass}>
          <Icon /> {report.status.toUpperCase()}
        </span>
        
        {/* Action buttons */}
        <Button className="bg-black">
          <Download /> {/* Individual PDF */}
        </Button>
      </tr>
    ))}
  </tbody>
</table>
```

## PDF Content Structure

### Summary Report Layout
1. **Header Section**
   - Logo (top-left)
   - Company name and tagline (top-right)
   - Title: "Weekly Reports Summary"
   - Primary divider line

2. **Metadata Box**
   - Generation timestamp
   - Admin name
   - Status filter applied
   - Total reports count

3. **Statistics Panel** (Light gray background)
   - Pending count
   - Approved count
   - Rejected count

4. **Reports Table**
   - Grid layout with borders
   - Alternating row colors
   - Status column color-coded
   - Columns: #, Staff Name, Email, Week, Status, Admin Notes, Submitted

5. **Footer** (All pages)
   - Page numbers (center)
   - "ACCORD - Confidential" (left)
   - Generation date (right)

### Individual Report Layout
1. **Header Section**
   - Logo and company info
   - Title: "Weekly Report Details"

2. **Staff Info Card** (Status-colored background)
   - Staff name (large, bold)
   - Employee ID (if available)
   - Email address
   - Week period (right-aligned)
   - Current status (right-aligned, large)
   - Submission date (right-aligned)

3. **Generation Metadata**
   - Timestamp and admin name

4. **Report Information Box** (Light gray)
   - Report ID
   - File name
   - File availability
   - Submission date/time
   - Current status

5. **Admin Notes** (Yellow highlight if present)
   - Multi-line text display

6. **Report Timeline Table**
   - Purple header
   - Events: Submission, Current Status
   - Timestamps for each event

7. **File Access Box**
   - File URL (if available)
   - Access instructions

8. **Signature Section** (Last page)
   - "Reviewed by" line
   - "Date" line

## Integration with Existing System

### API Endpoints Used
- `GET /api/reports` - Fetch all reports
- `PUT /api/reports/:id/status` - Update report status
- `GET /api/reports/:id/download` - Download original file

### State Management
```typescript
const [reports, setReports] = useState<Report[]>([]);
const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
const [searchTerm, setSearchTerm] = useState('');
const [generatingPdf, setGeneratingPdf] = useState(false);
```

### Filtering Logic
```typescript
const filteredReports = reports.filter(report => {
  const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
  const matchesSearch = searchTerm === '' || 
    report.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.userId.email.toLowerCase().includes(searchTerm.toLowerCase());
  return matchesStatus && matchesSearch;
});
```

## Responsive Design

### Desktop (> 1024px)
- 4-column statistics grid
- Full table with all columns visible
- Side-by-side action buttons

### Tablet (768px - 1024px)
- 2-column statistics grid
- Horizontal scroll for table
- Stacked action buttons

### Mobile (< 768px)
- 1-column statistics grid (stacked)
- Card-based layout for reports
- Full-width buttons

## Button Styling

### PDF Download Buttons
```css
/* Summary PDF Button */
bg-black text-white hover:bg-gray-800

/* Individual PDF Button */
bg-black text-white hover:bg-gray-800 (icon only on mobile)

/* Review Button */
bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-300
```

### Status Badges
```css
/* Approved */
bg-green-100 text-green-700 border-green-300

/* Pending */
bg-yellow-100 text-yellow-700 border-yellow-300

/* Rejected */
bg-red-100 text-red-700 border-red-300
```

## Error Handling

### PDF Generation Errors
```typescript
try {
  await generateReportsSummaryPDF(...);
} catch (err) {
  console.error('PDF generation error:', err);
  alert('Failed to generate PDF');
}
```

### Empty States
- No reports: "No reports have been submitted yet"
- No filtered results: "Try adjusting your filters"
- Search no results: Display message with search term

## Performance Optimization

### PDF Generation Time
- **Summary PDF**: ~1-3 seconds for 20-50 reports
- **Individual PDF**: ~0.5-1 second per report

### Filtering
- Real-time search with debouncing (optional)
- Client-side filtering for instant results
- No API calls needed for filter changes

## Testing Checklist

- [ ] Summary PDF generates with all reports
- [ ] Summary PDF respects status filter
- [ ] Individual PDF generates correctly
- [ ] Status badges display correct colors
- [ ] Search filters by name and email
- [ ] Status filter works (all/pending/approved/rejected)
- [ ] Statistics cards show correct counts
- [ ] Review modal opens and closes
- [ ] Status update works for pending reports
- [ ] Original file download works
- [ ] Table responsive on mobile
- [ ] PDF buttons disabled during generation
- [ ] Loading states display correctly
- [ ] Error messages display properly

## Future Enhancements

1. **Batch Operations**
   - Approve/reject multiple reports at once
   - Bulk PDF download

2. **Email Integration**
   - Send PDF to staff member
   - Email admin on new submission

3. **Advanced Filters**
   - Date range picker
   - Department/region filter
   - Custom date ranges

4. **Analytics**
   - Approval rate trends
   - Average review time
   - Most active submitters

5. **Attachments**
   - Preview PDF in browser
   - Download all attachments as ZIP

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintained by**: ACCORD Development Team
