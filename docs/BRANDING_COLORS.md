# ACCORD Branding Colors Guide

## Official Brand Colors

### Primary Blue
- **Hex**: `#008cf7`
- **RGB**: rgb(0, 140, 247)
- **Usage**: Primary brand color, headers, buttons, accents, charts
- **Tailwind**: `bg-[#008cf7]`, `text-[#008cf7]`, `border-[#008cf7]`

### Dark Blue (Hover States)
- **Hex**: `#006bb8`
- **RGB**: rgb(0, 107, 184)
- **Usage**: Hover states, gradients with primary blue
- **Tailwind**: `bg-[#006bb8]`, `hover:bg-[#006bb8]`

### Black
- **Hex**: `#000000`
- **RGB**: rgb(0, 0, 0)
- **Usage**: Text, buttons (PDF downloads), emphasis
- **Tailwind**: `bg-black`, `text-black`

### Red
- **Hex**: `#dc2626`
- **RGB**: rgb(220, 38, 38)
- **Usage**: Errors, rejected status, warnings, danger actions
- **Tailwind**: `bg-red-600`, `text-red-600`

### White
- **Hex**: `#ffffff`
- **RGB**: rgb(255, 255, 255)
- **Usage**: Backgrounds, text on dark backgrounds
- **Tailwind**: `bg-white`, `text-white`

## Supporting Colors

### Green (Success)
- **Hex**: `#059669`
- **RGB**: rgb(5, 150, 105)
- **Usage**: Success states, approved status, positive metrics
- **Tailwind**: `bg-green-600`, `text-green-600`

### Yellow/Orange (Warning)
- **Hex**: `#f59e0b`
- **RGB**: rgb(245, 158, 11)
- **Usage**: Pending status, warnings, attention needed
- **Tailwind**: `bg-yellow-500`, `text-yellow-600`

### Gray (Secondary)
- **Hex**: `#6b7280`
- **RGB**: rgb(107, 114, 128)
- **Usage**: Secondary text, metadata, borders
- **Tailwind**: `bg-gray-500`, `text-gray-500`

### Light Gray (Backgrounds)
- **Hex**: `#f3f4f6`
- **RGB**: rgb(243, 244, 246)
- **Usage**: Subtle backgrounds, alternating rows, hover states
- **Tailwind**: `bg-gray-100`

## Usage Examples

### Buttons
```tsx
// Primary Action Button
<button className="bg-[#008cf7] text-white hover:bg-[#006bb8]">
  Click Me
</button>

// Black Button (PDF Downloads)
<button className="bg-black text-white hover:bg-gray-800">
  Download PDF
</button>

// Danger Button
<button className="bg-red-600 text-white hover:bg-red-700">
  Delete
</button>
```

### Gradients
```tsx
// Header Gradient
<div className="bg-gradient-to-r from-[#008cf7] to-[#006bb8]">
  Header Content
</div>

// Light Accent Gradient
<div className="bg-gradient-to-r from-[#008cf7]/10 to-[#006bb8]/10">
  Subtle Background
</div>
```

### Status Badges
```tsx
// Approved
<span className="bg-green-100 text-green-700 border-green-300">
  Approved
</span>

// Pending
<span className="bg-yellow-100 text-yellow-700 border-yellow-300">
  Pending
</span>

// Rejected
<span className="bg-red-100 text-red-700 border-red-300">
  Rejected
</span>
```

### Form Inputs
```tsx
<input 
  className="focus:border-[#008cf7] focus:ring-2 focus:ring-[#008cf7]/20"
  type="text"
/>
```

### Icons
```tsx
// Primary Icon
<Calendar className="h-5 w-5 text-[#008cf7]" />

// Success Icon
<Check className="h-5 w-5 text-green-600" />

// Error Icon
<X className="h-5 w-5 text-red-600" />
```

### Hover States
```tsx
// Button Hover
<button className="hover:bg-[#008cf7]/10 hover:border-[#008cf7]">
  Hover Me
</button>

// Card Hover
<div className="hover:shadow-lg transition-shadow">
  Card Content
</div>
```

## PDF Generation Colors

### PDF Headers
```typescript
const COLORS = {
  primary: '#008cf7',     // ACCORD Blue
  secondary: '#6b7280',   // Gray metadata
  success: '#059669',     // Green for approved
  danger: '#dc2626',      // Red for rejected
  warning: '#f59e0b',     // Orange for pending
  text: '#000000',        // Black text
  lightGray: '#f3f4f6',   // Table backgrounds
  border: '#e5e7eb',      // Borders
  white: '#ffffff'        // White backgrounds
};
```

### Table Headers in PDFs
- Background: `#008cf7` (ACCORD Blue)
- Text: `#ffffff` (White)
- Font: Bold, 9-10pt

### Status Colors in PDFs
- **Approved**: Green `#059669`
- **Pending**: Orange `#f59e0b`
- **Rejected**: Red `#dc2626`

## Component-Specific Guidelines

### Dashboard Overview
- Hero section: ACCORD blue gradient background
- Metric cards: ACCORD blue text for values
- Charts: ACCORD blue for primary data lines
- Hover states: 10% opacity ACCORD blue background

### Weekly Planners
- Header icon: ACCORD blue gradient
- Action buttons: Black for PDF downloads
- Week selector: ACCORD blue accents
- Refresh button: ACCORD blue background

### Reports Page
- Header icon: ACCORD blue gradient
- Statistics cards: 
  - Total: ACCORD blue
  - Pending: Yellow
  - Approved: Green
  - Rejected: Red
- Table header: ACCORD blue gradient
- PDF buttons: Black with white text

### Navigation
- Active links: ACCORD blue
- Hover states: ACCORD blue with 10% opacity
- Planners button: Black (special emphasis)

## Accessibility Notes

### Contrast Ratios
- ACCORD Blue (#008cf7) on white: ✅ 4.53:1 (AA compliant)
- Black (#000000) on white: ✅ 21:1 (AAA compliant)
- White (#ffffff) on ACCORD Blue: ✅ 4.53:1 (AA compliant)

### Color Blindness
- Use icons alongside colors for status indicators
- Ensure sufficient contrast for all text
- Don't rely solely on color to convey information

## Migration Checklist

✅ Updated `/lib/plannerPdfGenerator.ts`
✅ Updated `/lib/reportsPdfGenerator.ts`
✅ Updated `/components/dashboard/planners.tsx`
✅ Updated `/components/dashboard/reports.tsx`
✅ Updated `/components/dashboard/dashboard-overview.tsx`

## Future Considerations

1. **Theme Variables**: Consider moving to CSS variables for easier theme switching
2. **Dark Mode**: Plan dark mode variants if needed
3. **Accessibility**: Continue testing with screen readers and color blindness simulators
4. **Brand Evolution**: Document any future brand color updates in this file

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Maintained by**: ACCORD Development Team
