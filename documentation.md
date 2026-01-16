# Dashboard API Requirements

To fully power the new Executive Dashboard with real-time, scalable data, we require the following new API endpoints. Currently, some metrics are aggregated on the frontend (limited by pagination) or are unavailable (Top Products).

## 1. Top Consumables / Products (Critical)
**Current Status**: Data unavailable. Mock data removed.
**Requirement**: An endpoint to get best-selling products/consumables based on sales or leads.
- **Endpoint**: `GET /api/admin/analytics/top-products`
- **Query Params**: `startDate`, `endDate`, `limit` (default 5)
- **Response**:
```json
{
  "success": true,
  "data": [
    { "id": "123", "name": "Blood Collection Tubes", "unitsSold": 1250, "revenue": 50000, "trend": "+12%" },
    { "id": "456", "name": "Surgical Gloves", "unitsSold": 850, "revenue": 12000, "trend": "+5%" }
  ]
}
```

## 2. Sales Leaderboards (Performance)
**Current Status**: Aggregated on frontend from `/api/visits`. This works for small datasets but will be slow as data grows.
**Requirement**: Server-side aggregation for top performing representatives.
- **Endpoint**: `GET /api/admin/analytics/leaderboard/reps`
- **Query Params**: `startDate`, `endDate`, `metric` (e.g., 'visits', 'revenue', 'leads')
- **Response**:
```json
{
  "success": true,
  "data": [
    { "userId": "u1", "name": "John Doe", "count": 45, "metric": "visits" },
    { "userId": "u2", "name": "Jane Smith", "count": 38, "metric": "visits" }
  ]
}
```

## 3. Top Facilities (Activity)
**Current Status**: Aggregated on frontend from `/api/visits`.
**Requirement**: Server-side aggregation for most visited/active facilities.
- **Endpoint**: `GET /api/admin/analytics/leaderboard/facilities`
- **Response**:
```json
{
  "success": true,
  "data": [
    { "name": "City Hospital", "location": "Nairobi", "visits": 12, "lastVisit": "2024-01-15T00:00:00Z" }
  ]
}
```

## 4. Revenue & Pipeline Metrics
**Current Status**: "Total Opportunity Value" and "Closed Revenue" are currently approximated or missing.
**Requirement**: Consolidated endpoint for financial KPIs.
- **Endpoint**: `GET /api/admin/analytics/revenue-summary`
- **Response**:
```json
{
  "totalOpportunityValue": 500000,
  "closedRevenueThisMonth": 120000,
  "salesGrowth": 15
}
```
