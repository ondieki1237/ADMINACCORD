# Dashboard Visual Design Guide

## Quick Reference for Visual Changes

---

## 🎨 Color Palette Used

### Primary Colors (Brand)
```
Blue Gradient Header:   #008cf7 → #006bb8
Card Backgrounds:       #ffffff (white)
Text Primary:          #111827 (gray-900)
Text Secondary:        #6b7280 (gray-500)
Borders:               #f3f4f6 (gray-100)
```

### Accent Colors (Semantic)
```
Success/Active:        #059669 (green-600)
Warning/Duration:      #f59e0b (orange-600)
Info/Tracking:        #3b82f6 (blue-500)
Performance:          #7c3aed (purple-600)
Completion:           #10b981 (green-500)
```

---

## 📐 Layout Dimensions

### Desktop (>1024px)
```
Container Max Width:   1800px
Header Padding:        8 (32px)
Card Gap:             6 (24px)
Stats Grid:           4 columns
Charts Grid:          3 columns (2:1 ratio)
Bottom Grid:          3 columns (2:1 ratio)
```

### Tablet (640-1024px)
```
Container Padding:     6 (24px)
Card Gap:             4 (16px)
Stats Grid:           2 columns
Charts Grid:          1 column (stacked)
Bottom Grid:          1 column (stacked)
```

### Mobile (<640px)
```
Container Padding:     3 (12px)
Card Gap:             3 (12px)
Stats Grid:           1 column
All Content:          Single column
```

---

## 🎯 Component Anatomy

### Stats Card Structure
```
┌─────────────────────────────────┐
│ [Icon]              [Badge]     │ ← Header (flex justify-between)
│                                 │
│ LABEL (uppercase)               │ ← Small text (xs-sm)
│ 123                             │ ← Large number (3xl-4xl)
│ • Metadata text                 │ ← Extra info (xs)
└─────────────────────────────────┘

Icon Container: w-12 h-12, rounded-xl, gradient background
Badge: Colored background, border, rounded-full
Card: Hover shadow-xl, transition 300ms
```

### Chart Card Structure
```
┌─────────────────────────────────────────────┐
│ ┌──────────────────────────────────────┐   │
│ │ [Icon] Title            [Legend]     │   │ ← Header (gradient bg)
│ │ Description                          │   │
│ └──────────────────────────────────────┘   │
│                                             │
│  [Chart Area - 280-320px height]           │
│                                             │
│                                             │
└─────────────────────────────────────────────┘

Icon Container: w-10 h-10, rounded-xl, gradient, shadow
Header: Border-bottom, subtle gradient background
```

### Activity Item Structure
```
┌────────────────────────────────────────┐
│ [Icon]  Activity Description    [Badge]│
│         Client: Name                   │
│         🕐 Nov 16, 2025 2:30 PM       │
└────────────────────────────────────────┘

Container: rounded-xl, bg-gray-50/50, hover:bg-gray-50
Icon: w-10 h-10, rounded-lg, color-coded
Badge: Small, color-coded by type
```

### Quick Action Button Structure
```
┌────────────────────────────────┐
│ [Icon]  Action Title           │
│         Short description      │
└────────────────────────────────┘

Icon Container: w-9 h-9, rounded-lg, colored bg
Changes color on hover
Two-line layout for clarity
```

---

## 🎨 Icon Container Colors

### Stats Cards
```
Visits:      Blue     bg-gradient-to-br from-blue-100 to-blue-50
Trails:      Purple   bg-gradient-to-br from-purple-100 to-purple-50
Duration:    Orange   bg-gradient-to-br from-orange-100 to-orange-50
Completion:  Green    bg-gradient-to-br from-green-100 to-green-50
```

### Chart Headers
```
Performance: Blue     bg-gradient-to-br from-[#008cf7] to-[#006bb8]
Top Performers: Purple bg-gradient-to-br from-purple-500 to-purple-600
```

### Quick Actions
```
Heatmap:    Blue     bg-blue-100 → hover:bg-[#008cf7]
Leads:      Purple   bg-purple-100 → hover:bg-purple-600
Machines:   Orange   bg-orange-100 → hover:bg-orange-600
Users:      Green    bg-green-100 → hover:bg-green-600
Analytics:  Indigo   bg-indigo-100 → hover:bg-indigo-600
Reports:    Yellow   bg-yellow-100 → hover:bg-yellow-600
Planners:   Black    bg-white/20 (on black button)
```

---

## 📏 Spacing Scale

### Padding (Tailwind Classes)
```
Mobile:   p-3, p-4    (12px, 16px)
Tablet:   p-4, p-5    (16px, 20px)
Desktop:  p-5, p-6, p-8 (20px, 24px, 32px)
```

### Gaps (Between Elements)
```
Cards:      gap-3 sm:gap-4 sm:gap-6    (12/16/24px)
Buttons:    gap-2 gap-3                (8/12px)
Icons:      gap-3 gap-4                (12/16px)
```

### Margins
```
Section Separation:  space-y-4 sm:space-y-6  (16/24px)
Button Group:        space-y-1.5 space-y-2   (6/8px)
```

---

## 🎭 Animation Timings

### Hover Effects
```
Cards:          transition-all duration-300
Buttons:        transition-all duration-200
Icons:          transition-transform duration-300
Colors:         transition-colors duration-200
```

### Keyframe Animations
```
Fade In:        0.2s ease-out
Slide In:       0.2s ease-out
Pulse (dots):   1.5s infinite
Progress Bar:   0.5s ease-out
```

### Transform Effects
```
Card Hover:     translateY(-2px)
Icon Hover:     scale(1.1)
Button Active:  translateY(0)
```

---

## 🎯 Interactive States

### Cards
```
Default:    shadow-sm
Hover:      shadow-xl + translateY(-2px)
Active:     shadow-lg
```

### Buttons
```
Default:    bg-transparent
Hover:      bg-color/10 (ACCORD blue tint)
Active:     bg-color/20
Focus:      outline ring
```

### Icons (in buttons)
```
Default:    Colored background
Hover:      Solid colored background + white icon
Transition: 200ms smooth
```

---

## 📱 Responsive Behavior

### Header
```
Desktop:    Full navigation inline
Tablet:     Wrapped quick actions
Mobile:     Quick actions below, horizontal scroll nav
```

### Stats Cards
```
Desktop:    4 columns (grid-cols-4)
Tablet:     2 columns (grid-cols-2)
Mobile:     1 column  (grid-cols-1)
```

### Charts
```
Desktop:    Side by side (2:1 ratio)
Tablet:     Side by side (equal)
Mobile:     Stacked (full width each)
```

### Bottom Section
```
Desktop:    Activity (66%) + Sidebar (33%)
Tablet:     Activity (66%) + Sidebar (33%)
Mobile:     Stacked (100% each)
```

---

## 🔤 Typography Scale

### Headings
```
Page Title (Header):     text-2xl sm:text-3xl font-bold
Card Titles:            text-lg font-bold
Subsections:            text-base font-semibold
```

### Body Text
```
Primary Text:           text-sm font-medium
Secondary Text:         text-xs text-gray-500
Metadata:              text-xs text-gray-400
```

### Numbers/Metrics
```
Large Stats:           text-3xl sm:text-4xl font-bold
Medium Values:         text-base font-bold
Small Values:          text-sm font-semibold
```

### Labels
```
Uppercase Labels:      text-xs sm:text-sm uppercase tracking-wide
Badge Text:           text-xs font-semibold
Button Text:          text-sm font-medium
```

---

## 🎨 Shadow Hierarchy

### Elevation Levels
```
Level 0 (Flat):        shadow-none
Level 1 (Default):     shadow-sm
Level 2 (Hover):       shadow-lg
Level 3 (Elevated):    shadow-xl
Level 4 (Modal):       shadow-2xl

Special (Icons):       Gradient shadows via Tailwind
```

---

## 📊 Chart Styling

### Line Chart (Performance Trends)
```
Line Color 1:      #008cf7 (ACCORD Blue)
Line Color 2:      #f97316 (Orange)
Background Fill:   20% opacity
Point Size:        4px default, 6px hover
Grid Lines:        rgba(0,0,0,0.04)
```

### Bar Chart (Top Performers)
```
Bar Color:         #008cf7/50 (50% opacity)
Bar Hover:         Darker shade
Grid:             Same as line chart
X-axis Labels:    45° rotation on mobile
```

### Tooltip Styling
```
Background:        rgba(0,0,0,0.85)
Border Radius:     10px
Padding:          14px
Text Color:       White
Title Font:       13px bold
Body Font:        12px regular
```

---

## 🎯 Badge Styles

### Stat Card Badges
```
Active:     bg-green-50 text-green-600 border-green-200
Tracking:   bg-blue-50 text-blue-600 border-blue-200
Average:    bg-gray-100 text-gray-600 border-gray-200
Percentage: bg-green-50 text-green-600 border-green-200
```

### Activity Type Badges
```
Visit:      bg-blue-50 text-[#008cf7] border-[#008cf7]/30
Trail:      bg-purple-50 text-purple-600 border-purple-600/30
Default:    bg-gray-100 text-gray-600 border-gray-300
```

---

## 🔍 Accessibility Features

### Focus States
```
All Interactive Elements:
- outline ring-2 ring-[#008cf7]/50
- Clear visual indicator
- Keyboard navigable
```

### Color Contrast
```
Text on White:     #111827 (21:1 ratio)
Text on Blue:      #ffffff (4.5:1 ratio)
Icons on BG:       Minimum 3:1 contrast
```

### Touch Targets
```
Minimum Size:      44×44px
Button Height:     min-h-11 (44px)
Icon Containers:   w-10 h-10 minimum
Spacing:          Adequate gaps between
```

---

## 💡 Pro Tips

### Card Design
- Always include hover effect for interactivity
- Use gradient icons for visual interest
- Keep badges small but readable
- Maintain consistent padding

### Color Usage
- Stick to semantic colors (green=success, red=error)
- Use ACCORD blue for primary actions
- Use subtle backgrounds (50 shade) for containers
- Darker shades (600) for icons

### Spacing
- Use consistent gaps across similar elements
- Mobile: smaller gaps (gap-3)
- Desktop: larger gaps (gap-6)
- Card content: p-4 to p-6 range

### Animation
- Keep it subtle (200-300ms)
- Only animate transforms and opacity
- Use ease-out for natural feel
- Avoid animating colors directly

---

## 📋 Quick Copy-Paste Patterns

### Standard Card Header
```tsx
<CardHeader className="border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-transparent pb-5">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008cf7] to-[#006bb8] flex items-center justify-center shadow-lg">
      <IconComponent className="h-5 w-5 text-white" />
    </div>
    <div>
      <CardTitle className="text-lg font-bold text-gray-900">Title</CardTitle>
      <CardDescription className="text-xs text-gray-500 mt-0.5">Description</CardDescription>
    </div>
  </div>
</CardHeader>
```

### Stat Card Icon Container
```tsx
<div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-[#008cf7]" />
</div>
```

### Quick Action Button
```tsx
<Button
  variant="ghost"
  className="w-full justify-start text-gray-700 hover:bg-[#008cf7]/10 hover:text-[#008cf7] group transition-all duration-200"
  onClick={handleClick}
>
  <div className="w-9 h-9 rounded-lg bg-blue-100 group-hover:bg-[#008cf7] flex items-center justify-center mr-3 transition-colors">
    <IconComponent className="h-4 w-4 text-[#008cf7] group-hover:text-white transition-colors" />
  </div>
  <div className="flex-1 text-left">
    <div className="text-sm font-medium">Action Title</div>
    <div className="text-xs text-gray-500">Description</div>
  </div>
</Button>
```

---

**Last Updated**: November 16, 2025  
**Version**: 2.0  
**For**: ACCORD Dashboard Design System
