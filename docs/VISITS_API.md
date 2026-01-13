# Visits API — Admin

This document describes the admin Visits endpoints used by the dashboard.

---

**GET /api/admin/visits/user/:userId**

- Description: Paginated visits for a specific user.
- Path params:
  - `userId` (ObjectId) — user to filter by
- Query params:
  - `page` (default 1)
  - `limit` (default 25)
  - `startDate` (ISO or YYYY-MM-DD)i
  - `endDate` (ISO or YYYY-MM-DD)
  - `clientName`
  - `contactName`
  - `outcome`
  - `tag`
  - `sort` (e.g. `-date`)
- Populates: `userId` (basic user fields), `followUpVisits`, `followUpActions.assignedTo`
- Response:
  ```json
  {
    "success": true,
    "data": [ /* Visit */ ],
    "meta": { "totalDocs": 123, "limit": 25, "page": 1, "totalPages": 5 }
  }
  ```

---

**GET /api/admin/visits/summary**

- Description: Aggregated per-user visit counts and last visit date.
- Query params: `limit` (default 50)
- Response:
  ```json
  {
    "success": true,
    "data": [
      {
        "userId": "643...",
        "visitsCount": 42,
        "lastVisit": "2026-01-10T09:00:00.000Z",
        "user": { "_id": "643...", "firstName": "Seth", "lastName": "Dev", "email": "seth@example.com", "role": "sales" }
      }
    ]
  }
  ```

---

**GET /api/admin/visits/:id**

- Description: Get full visit document by ID (admin).
- Path params: `id` (visit _id)
- Populates: `userId` (firstName, lastName, email, role)
- Response:
  ```json
  { "success": true, "data": {
    "_id": "...",
    "userId": { "_id": "...", "firstName": "Seth", "lastName": "Dev", "email": "seth@example.com", "role": "sales" },
    "visitId": "VIS-2026-0001",
    "date": "2026-01-10",
    "startTime": "09:00",
    "endTime": "10:00",
    "duration": 60,
    "client": { "name": "Acme Co", "type": "hospital", "level": "county", "location": "Nairobi" },
    "contacts": [],
    "productsOfInterest": [],
    "existingEquipment": [],
    "requestedEquipment": [],
    "visitPurpose": "Demo",
    "visitOutcome": "successful",
    "competitorActivity": "None",
    "marketInsights": "Notes...",
    "notes": "Visit notes...",
    "customData": {},
    "nextVisitDate": null,
    "attachments": [],
    "photos": [],
    "tags": ["priority"],
    "isFollowUpRequired": false,
    "followUpActions": [],
    "followUpVisits": [],
    "syncedAt": null,
    "createdAt": "2026-01-10T11:00:00.000Z",
    "updatedAt": "2026-01-10T11:00:00.000Z"
  } }
  ```

---

**GET /api/admin/visits/daily/activities**

- Description: Paginated visits for a specific date (defaults to today), across the sales team or filtered by region/user. Returns a `summary` object and `visitsByOutcome`.
- Query params:
  - `date` (ISO or YYYY-MM-DD) — defaults to today
  - `page` (default 1)
  - `limit` (default 50)
  - `region`
  - `userId`
  - `outcome`
- Populates: `userId` (firstName, lastName, email, employeeId, region, role), `followUpVisits`, `followUpActions.assignedTo`
- Response:
  ```json
  {
    "success": true,
    "data": [ /* Visit */ ],
    "summary": { "totalVisits": 12, "date": "2026-01-13", "visitsByOutcome": { "successful": 8, "followup_required": 3, "unsuccessful": 1 } },
    "meta": { "totalDocs": 12, "limit": 50, "page": 1, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
  }
  ```

---

Notes & usage

- Date formats accepted: full ISO (`2026-01-13T00:00:00.000Z`) or `YYYY-MM-DD`.
- `sort` can be used with field names, prefix with `-` for descending (e.g. `-date`).
- Filtering by `region` or `userId` helps build dashboards per territory/rep.
- Ensure server-side populates are documented above — `userId` includes selected user fields for efficiency.

Example cURL (paginated user visits):

```bash
curl -G "https://your.api.host/api/admin/visits/user/643..." \
  --data-urlencode "page=1" \
  --data-urlencode "limit=25" \
  -H "Authorization: Bearer <TOKEN>"
```

If you want, I can also:
- Add TypeScript types for `Visit` in `lib/types` or `types/`.
- Add a small client helper `lib/api/visits.ts` wrapping these endpoints.
- Link this file into the project docs index.
