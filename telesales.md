# Telesales Module Specification

## Overview

The **Telesales Module** is designed to manage healthcare facility clients, track communications, record service requests, and monitor product interest.
It allows administrators to maintain a centralized record of facilities, contact persons, machines installed, and all telesales interactions.

This module integrates data from:

* Client records
* Daily visits
* Machine installations
* Call logs
* Engineer service requests

The system automatically records the **date and time** of every interaction.

---

# 1. Workflow

### Step 1: Accessing the Telesales Page

When the **admin opens the Telesales page**, the system fetches and displays all clients from:

* The **clients database**
* Facilities appearing in **daily visits**
* Facilities where **machines have been installed**

The admin sees a list of facilities with key information.

### Client List Display

Each row shows:

* Facility Name
* Location
* Machine Installed (Yes / No)
* Last Activity

Example:

| Facility              | Location | Machine Installed | Last Activity   |
| --------------------- | -------- | ----------------- | --------------- |
| Aga Khan Hospital     | Nairobi  | Yes               | Installation    |
| Nairobi West Hospital | Nairobi  | No                | Visit Yesterday |
| Mater Hospital        | Nairobi  | Yes               | Service Call    |

---

# 2. Adding a New Client

The admin can click **Add Client** to create a new facility record.

### Required Fields

* Facility Name
* Location
* Contact Person Name
* Contact Role
* Contact Phone Number
* Machine Installed (Yes / No)

Optional:

* Notes

---

# 3. Viewing Client Details

When the admin clicks a facility, a **Client Details Panel** opens displaying:

### Facility Information

* Facility Name
* Location
* Machine Installed
* Contact Person
* Contact Role
* Contact Phone

### Recent Activity Timeline

The system displays recent events such as:

* Installations
* Visits
* Calls
* Service requests

Example timeline:

```
10 Mar - Machine Installation
8 Mar - Service Request
3 Mar - Telesales Call
1 Mar - Sales Visit
```

---

# 4. Recording a Call

When the admin clicks **Call Client**, the system opens a **Call Outcome Form**.

The system automatically records:

* Call Date
* Call Time

### Call Type Options

* Product Inquiry
* Service Inquiry
* Machine Inquiry
* Follow Up

---

# 5. Product Inquiry Workflow

If the call type is **Product Inquiry**, the admin records:

### Fields

Product Interested In
Dropdown list of available products.

Expected Purchase Date
A **date selector** allowing the admin to choose the expected purchase date.

Notes
Text field for additional comments.

After saving, the system records the interaction as a **Sales Lead**.

---

# 6. Service Inquiry Workflow

If the call type is **Service Inquiry**, the system displays a **Service Request Form**.

### Fields

Machine Model
Text input.

Service Accepted

* Accepted
* Declined

Notes
Text field.

### If Service is Accepted

The system automatically creates a **Service Task** for engineers.

The task appears on the **Engineer Dashboard**.

---

# 7. Engineer Task Creation

When service is accepted, a task is created with the following details:

* Facility Name
* Machine Model
* Contact Person
* Contact Phone
* Request Date
* Request Time
* Status: Pending

This task is automatically sent to the **Engineer Reports / Tasks Page**.

---

# 8. Automatic Time Logging

The system automatically records timestamps using the backend.

Example:

```
created_at: 2026-03-12T10:32:00
```

Admins do **not manually enter time or date for calls**.

---

# 9. Data Collections

## Clients

Stores facility information.

```
clients
{
  _id
  facility_name
  location
  contact_person
  role
  phone
  machine_installed
  created_at
}
```

---

## Calls

Stores telesales call records.

```
calls
{
  client_id
  call_type
  outcome
  product_interest
  expected_purchase_date
  service_request
  notes
  created_at
}
```

---

## Installations

Tracks machines installed at facilities.

```
installations
{
  client_id
  machine
  installed_by
  date
}
```

---

## Visits

Records sales or technical visits.

```
visits
{
  client_id
  rep_name
  visit_date
  notes
}
```

---

# 10. UI Components (React)

The telesales page may consist of the following components:

```
TelesalesPage
 ├── ClientList
 ├── ClientCard
 ├── ClientDetailsPanel
 ├── AddClientModal
 ├── CallOutcomeForm
 └── ServiceRequestForm
```

---

# 11. Additional Features

### Search Clients

Admins can search by:

* Facility Name
* Location
* Contact Person

---

### Machine Filter

Filter facilities by:

* All Clients
* Machines Installed
* No Machines Installed

---

### Client Timeline

Each client page displays a full history timeline of interactions including:

* Calls
* Visits
* Installations
* Service requests

---

# 12. System Benefits

The telesales module provides:

* Centralized client management
* Organized call tracking
* Automatic service escalation
* Integration with engineer workflows
* Historical facility interaction records

