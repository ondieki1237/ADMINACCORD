# ADMINACCORD Project Analysis Report

## Overview
**ADMINACCORD** is a comprehensive administrative frontend for a field sales and service management application. It provides administrators and executives with real-time insights into field activities, lead management, and equipment services.

## Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, Radix UI, Framer Motion
- **State Management & Data Fetching**: TanStack Query (React Query), Axios
- **Analytics & Visualization**: Chart.js, Recharts, Leaflet (Maps & Heatmaps)
- **Forms**: React Hook Form, Zod
- **PDF Generation**: jsPDF

## Key Components & Features

### 1. Executive Dashboard
- **Overview**: Centralized view of KPIs (Total Visits, New Clients, Active Sales Reps).
- **Trends**: Daily visit trends using Line charts.
- **Leaderboards**: Top-performing sales representatives and most visited facilities.
- **Activity Feed**: Real-time log of the latest field visits.

### 2. Field Operations Management
- **Visit Manager**: Detailed logs of sales visits, including purpose, outcome, equipment discussed, and potential value.
- **Leads Management**: Pipeline tracking for new opportunities, from "New" to "Won/Lost" status.
- **Engineering Services**: Track machine maintenance, service history, and engineer assignments.
- **Telesales (Call Logs)**: Management of inbound/outbound calls with outcome tracking.

### 3. Reporting System
- **PDF Extraction**: Dedicated tools to generate professional reports for:
  - Visit Records
  - Contact Directories
  - Facility Summaries
  - Machine Service History

### 4. Technical Architecture
- **API Layer**: Centralized `ApiService` (`lib/api.ts`) with Bearer Token authentication, automatic token refreshing, and robust error handling.
- **Auth System**: `AuthService` handles session management using `localStorage`.
- **Layout**: Protected `DashboardLayout` ensures only authenticated users can access admin features.

## Conclusion
The project is well-structured, using modern web technologies to deliver a high-performance, mobile-responsive admin interface. It is highly data-driven, relying on a robust API backend to manage complex field operations and sales workflows.